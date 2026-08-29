import logging
import hashlib
import hmac
import os
from concurrent.futures import ThreadPoolExecutor, TimeoutError as PredictionTimeoutError
from pathlib import Path
from contextlib import asynccontextmanager
from datetime import date
from enum import Enum
from typing import List, Optional, Any

import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator, ConfigDict, AliasChoices
from pydantic.alias_generators import to_camel

from logging_utils import PiiSafeFormatter, exception_type

# --------------------------------------------------------------------------
# Logging
# --------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
for _handler in logging.getLogger().handlers:
    _handler.setFormatter(PiiSafeFormatter("%(asctime)s | %(levelname)s | %(name)s | %(message)s"))
logger = logging.getLogger("financeai.data_science")

# --------------------------------------------------------------------------
# Rutas a los modelos serializados
# --------------------------------------------------------------------------
MODELS_DIR = Path(__file__).parent / "models"
CLASIFICADOR_GASTOS_PATH = MODELS_DIR / "clasificador_gastos.pkl"
PERFIL_FINANCIERO_PATH = MODELS_DIR / "perfil_financiero.pkl"
CODIFICADOR_PERFIL_PATH = MODELS_DIR / "codificador_perfil.pkl"
MODEL_CHECKSUMS_PATH = MODELS_DIR / "SHA256SUMS"
MODEL_FILES = {
    "clasificador_gastos.pkl": CLASIFICADOR_GASTOS_PATH,
    "perfil_financiero.pkl": PERFIL_FINANCIERO_PATH,
    "codificador_perfil.pkl": CODIFICADOR_PERFIL_PATH,
}

# Diccionario en memoria donde viven los modelos ya cargados
modelos: dict = {}

# Limite de transacciones por peticion para mitigar payloads excesivos
MAX_TRANSACCIONES_POR_REQUEST = 200
PREDICTION_TIMEOUT_SECONDS = float(os.getenv("PREDICTION_TIMEOUT_SECONDS", "10"))
MAX_CONCURRENT_PREDICTIONS = int(os.getenv("MAX_CONCURRENT_PREDICTIONS", "4"))
PREDICTION_EXECUTOR = ThreadPoolExecutor(max_workers=MAX_CONCURRENT_PREDICTIONS)


def _ejecutar_prediccion(modelo: Any, features: Any) -> Any:
    """Ejecuta predict() con limite de concurrencia y tiempo.

    El timeout evita que una solicitud quede esperando indefinidamente si el
    modelo se cuelga. El executor tambien impide que una rafaga de
    solicitudes cree un thread por cada inferencia y consuma memoria sin
    limite.
    """
    future = PREDICTION_EXECUTOR.submit(modelo.predict, features)
    try:
        return future.result(timeout=PREDICTION_TIMEOUT_SECONDS)
    except PredictionTimeoutError as e:
        future.cancel()
        raise HTTPException(
            status_code=504,
            detail=f"La prediccion excedio el limite de {PREDICTION_TIMEOUT_SECONDS:g} segundos.",
        ) from e


def cargar_modelo(path: Path):
    """Carga un modelo serializado usando joblib.

    joblib.load() es mas robusto que pickle.load() para objetos de scikit-learn
    (maneja compresion, arreglos grandes de NumPy y memory-mapping). Si el
    archivo fue generado con pickle estandar, joblib.load() tambien lo lee.
    """
    if not path.exists():
        raise FileNotFoundError(path)
    return joblib.load(path)


def verificar_integridad_modelos() -> None:
    """Verifica los modelos contra el manifiesto SHA-256 antes de cargarlos."""
    if not MODEL_CHECKSUMS_PATH.is_file():
        raise FileNotFoundError(
            f"No se encontro el manifiesto de integridad: {MODEL_CHECKSUMS_PATH}"
        )

    checksums: dict[str, str] = {}
    for line_number, raw_line in enumerate(
        MODEL_CHECKSUMS_PATH.read_text(encoding="utf-8").splitlines(), start=1
    ):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        fields = line.split()
        if len(fields) != 2 or len(fields[0]) != 64:
            raise ValueError(
                f"Entrada invalida en {MODEL_CHECKSUMS_PATH}:{line_number}"
            )
        digest, filename = fields
        filename = filename.lstrip("*")
        if filename not in MODEL_FILES or filename in checksums:
            raise ValueError(
                f"Archivo inesperado o duplicado en {MODEL_CHECKSUMS_PATH}:{line_number}"
            )
        checksums[filename] = digest.lower()

    missing_entries = set(MODEL_FILES) - set(checksums)
    if missing_entries:
        raise ValueError(
            f"Faltan checksums para: {', '.join(sorted(missing_entries))}"
        )

    for filename, path in MODEL_FILES.items():
        if not path.is_file():
            raise FileNotFoundError(path)
        digest = hashlib.sha256()
        with path.open("rb") as model_file:
            for chunk in iter(lambda: model_file.read(1024 * 1024), b""):
                digest.update(chunk)
        if not hmac.compare_digest(digest.hexdigest(), checksums[filename]):
            raise ValueError(f"La integridad de {path} no pudo ser verificada")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: cargar modelos una sola vez al arrancar la app
    try:
        verificar_integridad_modelos()
        logger.info("Integridad de los modelos verificada correctamente")
        modelos["clasificador_gastos"] = cargar_modelo(CLASIFICADOR_GASTOS_PATH)
        modelos["perfil_financiero"] = cargar_modelo(PERFIL_FINANCIERO_PATH)
        modelos["codificador_perfil"] = cargar_modelo(CODIFICADOR_PERFIL_PATH)
        logger.info("Modelos cargados correctamente: %s", list(modelos.keys()))
    except FileNotFoundError as e:
        logger.error("No se encontro el archivo de modelo: %s", e.filename)
        raise RuntimeError(f"No se encontro el archivo de modelo: {e.filename}") from e
    except Exception as e:
        logger.error("Error al cargar los modelos (%s)", exception_type(e))
        raise RuntimeError("Error al cargar los modelos") from e

    yield

    # Shutdown: limpiar referencias
    modelos.clear()
    logger.info("Modelos liberados de memoria.")


# --------------------------------------------------------------------------
# Schemas de entrada (Pydantic v2) — JSON en camelCase, atributos en snake_case
# --------------------------------------------------------------------------

class FrecuenciaAhorro(str, Enum):
    ALTA = "Alta"
    MEDIA = "Media"
    BAJA = "Baja"


class BaseSchema(BaseModel):
    """Base comun: acepta JSON en camelCase y expone atributos en snake_case."""
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class Transaccion(BaseSchema):
    id_transaccion: Optional[str] = Field(
        default=None,
        description="ID de la transaccion en el sistema Java (opcional, util para trazabilidad)",
    )
    descripcion: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Texto de la transaccion, entrada del Modelo 1 (clasificador de gastos)",
    )
    monto: float = Field(..., gt=0, validation_alias=AliasChoices("monto", "valor"), description="Monto de la transaccion, debe ser positivo")
    fecha: Optional[date] = Field(default=None, description="Fecha ISO 8601 (YYYY-MM-DD)")

    @field_validator("descripcion")
    @classmethod
    def descripcion_no_vacia(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("descripcion no puede estar vacia")
        return v


class TransaccionesRequest(BaseSchema):
    """Payload de entrada para /prediccion-interna."""
    usuario_id: Optional[str] = None
    transacciones: List[Transaccion] = Field(..., min_length=1, max_length=MAX_TRANSACCIONES_POR_REQUEST)

    # Campos opcionales para el Modelo 2 (perfil financiero)
    ingreso_mensual: Optional[float] = Field(default=None, ge=0)
    nivel_endeudamiento: Optional[float] = Field(
        default=None,
        ge=0,
        le=100,
        description="Nivel de endeudamiento como porcentaje (0-100), entrada cruda del Modelo 2",
    )
    frecuencia_ahorro: Optional[str] = Field(
        default=None,
        description="Frecuencia de ahorro del usuario",
    )

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "usuarioId": "USR-4521",
                "transacciones": [
                    {"idTransaccion": "TX-00123", "descripcion": "Pago renta departamento", "monto": 8500.00, "fecha": "2026-07-15"},
                    {"idTransaccion": "TX-00124", "descripcion": "Uber Eats cena", "monto": 245.50, "fecha": "2026-07-16"},
                ],
                "ingresoMensual": 25000.00,
                "nivelEndeudamiento": 35,
                "frecuenciaAhorro": "Media",
            }
        },
    )


# --------------------------------------------------------------------------
# Schemas de respuesta (Pydantic v2)
# --------------------------------------------------------------------------

class TransaccionClasificada(BaseSchema):
    id_transaccion: Optional[str] = None
    categoria: str


class FeaturesPerfil(BaseSchema):
    ingreso_mensual: Optional[float] = None
    nivel_endeudamiento: Optional[float] = None
    frecuencia_ahorro: Optional[str] = None
    total_gastos: float
    promedio_gasto: float
    numero_transacciones: int


class PerfilResponse(BaseSchema):
    valor: str
    features_usadas: FeaturesPerfil


class PrediccionResponse(BaseSchema):
    transacciones: List[TransaccionClasificada]
    perfil: PerfilResponse


# --------------------------------------------------------------------------
# App
# --------------------------------------------------------------------------

app = FastAPI(title="FinanceAI - Data Science Microservice", lifespan=lifespan)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "modelos_cargados": list(modelos.keys()),
    }


def _tiene_predict(modelo: Any) -> bool:
    return callable(getattr(modelo, "predict", None))


def clasificar_transacciones(transacciones: List[Transaccion]) -> List[TransaccionClasificada]:
    """Aplica el Modelo 1 sobre la lista de descripciones."""
    modelo_gastos = modelos.get("clasificador_gastos")
    if modelo_gastos is None:
        raise HTTPException(
            status_code=503,
            detail="El modelo clasificador de gastos no esta cargado en memoria.",
        )
    if not _tiene_predict(modelo_gastos):
        raise HTTPException(
            status_code=500,
            detail="El modelo clasificador de gastos no expone metodo predict(). Verifica que sea un modelo de scikit-learn valido.",
        )

    descripciones = [tx.descripcion for tx in transacciones]
    try:
        predicciones = _ejecutar_prediccion(modelo_gastos, descripciones)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Fallo al ejecutar predict() del clasificador de gastos (%s)",
            exception_type(e),
        )
        raise HTTPException(
            status_code=500,
            detail="Error al clasificar transacciones.",
        ) from e

    resultados = []
    for tx, categoria in zip(transacciones, predicciones):
        resultados.append(TransaccionClasificada(
            id_transaccion=tx.id_transaccion,
            categoria=str(categoria),
        ))
    return resultados


def calcular_perfil(payload: TransaccionesRequest) -> PerfilResponse:
    """Aplica el Modelo 2 sobre las variables numericas agregadas."""
    modelo_perfil = modelos.get("perfil_financiero")
    if modelo_perfil is None:
        raise HTTPException(
            status_code=503,
            detail="El modelo de perfil financiero no esta cargado en memoria.",
        )
    if not _tiene_predict(modelo_perfil):
        raise HTTPException(
            status_code=500,
            detail="El modelo de perfil financiero no expone metodo predict(). Verifica que sea un modelo de scikit-learn valido.",
        )

    total_gastos = sum(tx.monto for tx in payload.transacciones)
    num_tx = len(payload.transacciones)
    promedio_gasto = total_gastos / num_tx if num_tx else 0.0

    ingreso = payload.ingreso_mensual if payload.ingreso_mensual is not None else 0.0
    nivel_endeudamiento = payload.nivel_endeudamiento if payload.nivel_endeudamiento is not None else 0.0

    # Modelo 2 fue entrenado unicamente con ingreso_mensual y nivel_endeudamiento
    # (ver notebooks/Notebook_Entrenamiento.ipynb, seccion "Modelo 2"); total_gastos,
    # promedio_gasto y numero_transacciones se reportan en la respuesta pero no
    # forman parte de las features del modelo.
    features = [[ingreso, nivel_endeudamiento]]
    try:
        prediccion = _ejecutar_prediccion(modelo_perfil, features)[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Fallo al ejecutar predict() del perfil financiero (%s)",
            exception_type(e),
        )
        raise HTTPException(
            status_code=500,
            detail="Error al calcular el perfil financiero.",
        ) from e

    codificador_perfil = modelos["codificador_perfil"]
    etiqueta_perfil = codificador_perfil.inverse_transform([prediccion])[0]

    return PerfilResponse(
        valor=str(etiqueta_perfil),
        features_usadas=FeaturesPerfil(
            ingreso_mensual=payload.ingreso_mensual,
            nivel_endeudamiento=payload.nivel_endeudamiento,
            frecuencia_ahorro=payload.frecuencia_ahorro if payload.frecuencia_ahorro else None,
            total_gastos=total_gastos,
            promedio_gasto=promedio_gasto,
            numero_transacciones=num_tx,
        ),
    )


@app.post("/prediccion-interna", response_model=PrediccionResponse)
def prediccion_interna(payload: TransaccionesRequest):
    """Endpoint principal: clasifica transacciones y calcula el perfil financiero.

    Recibe listas de transacciones (camelCase en JSON) enviadas desde el backend
    Java, ejecuta .predict() de ambos modelos cargados en memoria y devuelve las
    categorias y el perfil calculado.
    """
    logger.info(
        "Peticion /prediccion-interna usuario_id=%s transacciones=%d",
        payload.usuario_id, len(payload.transacciones),
    )

    transacciones_clasificadas = clasificar_transacciones(payload.transacciones)
    perfil = calcular_perfil(payload)

    return PrediccionResponse(
        transacciones=transacciones_clasificadas,
        perfil=perfil,
    )


@app.post("/predict-internal", response_model=PrediccionResponse)
def predict_internal(payload: TransaccionesRequest):
    """Endpoint legacy (alias de /prediccion-interna).

    Se mantiene por compatibilidad con la arquitectura del checklist oficial,
    que nombra este endpoint como /predict-internal.
    """
    return prediccion_interna(payload)


class TransaccionSimpleRequest(BaseSchema):
    descripcion: str
    monto: float = Field(..., gt=0, validation_alias=AliasChoices("monto", "valor"))


@app.post("/clasificar-transaccion")
def clasificar_transaccion_endpoint(payload: TransaccionSimpleRequest):
    """Endpoint para clasificar una transaccion individual."""
    desc_lower = payload.descripcion.strip().lower()
    if desc_lower in ["otro", "otros", "varios", "extra", "gastos varios", "sin categoria"] or desc_lower.startswith("otro"):
        return {"categoria": "Otros"}

    modelo_gastos = modelos.get("clasificador_gastos")
    if modelo_gastos is None:
        raise HTTPException(
            status_code=503,
            detail="El modelo clasificador de gastos no esta cargado en memoria.",
        )
    if not _tiene_predict(modelo_gastos):
        raise HTTPException(
            status_code=500,
            detail="El modelo clasificador de gastos no expone metodo predict().",
        )
    try:
        prediccion = _ejecutar_prediccion(modelo_gastos, [payload.descripcion])[0]
        return {"categoria": str(prediccion)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Fallo al clasificar transaccion individual (%s)", exception_type(e))
        raise HTTPException(
            status_code=500,
            detail="Error al clasificar transaccion.",
        )

