# Bloqueo de Entrenamiento de Modelos (Tareas 20-26)

**Proyecto:** FinanceAI — G9-LATAM-Team 38
**Fase afectada:** 2A — Inteligencia Artificial (Entrenamiento y Modelos)
**Fecha de análisis:** 27 de julio de 2026

---

## Resumen

Las Tareas 20 a 26 del checklist (ampliación de dataset, creación de `Notebook_Entrenamiento.ipynb`, TF-IDF, entrenamiento de Modelo 1 y Modelo 2, evaluación de métricas y exportación a `.pkl`) **no pueden completarse con el dataset actual** porque este carece de las columnas requeridas para el entrenamiento.

## Estado actual de los artefactos

| Artefacto | Estado real | Lo que debería ser |
|-----------|-------------|-------------------|
| `data_science/data/processed/financeai_dataset_hibrido.csv` | 500 filas × 17 columnas, **agregado por usuario** | Dataset a **nivel transacción** con `descripcion_transaccion` y `categoria_gasto` por fila |
| `data_science/models/clasificador_gastos.pkl` | 61 bytes — `{'placeholder': True}` (diccionario, no modelo sklearn) | Pipeline de sklearn con vectorizador + clasificador |
| `data_science/models/perfil_financiero.pkl` | 59 bytes — `{'placeholder': True}` (diccionario, no modelo sklearn) | Modelo de clasificación de sklearn entrenado |
| `data_science/Notebook_Entrenamiento.ipynb` | **No existe** | Notebook con train_test_split, fit, métricas y exportación |

## Columnas del CSV actual vs. columnas requeridas

### CSV actual (17 columnas)

```
usuario_id, ingreso_mensual, nivel_endeudamiento, frecuencia_ahorro, score_crediticio,
Alimentación, Ocio, Otros, Salud, Transporte, Vivienda, Educación, Servicios,
gasto_total, ratio_gasto_ingreso, perfil_financiero, recomendaciones
```

### Columnas requeridas por las Tareas 10, 22, 23

Según la Tarea 10, cada fila debe tener: `ingreso_mensual`, `nivel_endeudamiento`,
`frecuencia_ahorro`, `descripcion_transaccion`, `valor_transaccion`, `categoria_gasto`
y `perfil_usuario`.

**El CSV actual no contiene `descripcion_transaccion`, `valor_transaccion` ni `categoria_gasto`.**
Los gastos están pre-agregados en columnas por categoría (Alimentación, Ocio, etc.),
lo que hace imposible:

- **Tarea 22** (TF-IDF/CountVectorizer sobre `descripcion_transaccion`): no hay texto de transacción.
- **Tarea 23** (Modelo 1 — clasificador de gastos): no hay variable objetivo ni entrada textual.
- **Tarea 24** (Modelo 2 — perfil financiero): las variables numéricas sí existen, pero
  la columna `perfil_financiero` está generada por reglas (`calcular_perfil_financiero()`),
  no es una etiqueta independiente que valide un modelo supervisado.

## Origen del problema

Los notebooks `build_dataset_financeai.ipynb` y `Notebook_EDA.ipynb` sí manipulan columnas
`descripcion`, `categoria` y `valor` a nivel de transacción en una capa intermedia (Capa 1:
transacciones reales de Kaggle). Sin embargo, al construir el dataset híbrido final, esa
información se **agrega y se pierde** al nivel de usuario, produciendo el CSV actual.

El EDA reportado como completado (Tarea 11) verificó nulos y tipos de dato, pero no detectó
esta omisión estructural porque el criterio de aceptación de la Tarea 11 solo exigía
"verificar que no haya valores nulos ni datos corruptos", no validar la presencia de columnas
requeridas por las tareas posteriores.

## Acción requerida para desbloquear las Tareas 20-26

1. **Reestructurar el dataset** para que cada fila represente una transacción individual
   (no un usuario agregado), conservando `descripcion_transaccion`, `valor_transaccion`,
   `categoria_gasto` y los campos de perfil del usuario.

2. **Ampliar a 500–1000 registros de transacciones** (Tarea 20) con representación de las
   7 categorías obligatorias: Alimentación, Transporte, Salud, Vivienda, Educación, Ocio y Servicios.

3. **Crear `Notebook_Entrenamiento.ipynb`** (Tarea 21) con:
   - Preprocesamiento de texto: TF-IDF o CountVectorizer sobre `descripcion_transaccion` (Tarea 22).
   - Entrenamiento del Modelo 1: clasificador de gastos con LogisticRegression o RandomForest (Tarea 23).
   - Entrenamiento del Modelo 2: perfil financiero con variables numéricas (Tarea 24).
   - Métricas: Accuracy y F1-Score (Tarea 25).
   - Exportación con `joblib.dump()` a `clasificador_gastos.pkl` y `perfil_financiero.pkl` (Tarea 26).

4. **Reemplazar los `.pkl` placeholder** actuales por los modelos reales generados.

## Relación con el microservicio FastAPI

El `main.py` actual ya está preparado para consumir modelos reales vía `joblib.load()`.
Mientras los `.pkl` sigan siendo placeholders, el endpoint `/prediccion-interna` responderá
con **HTTP 500** y el mensaje:

> *"El modelo clasificador de gastos no expone metodo predict(). Verifica que sea un modelo
> de scikit-learn valido."*

Una vez entrenados los modelos reales, el microservicio funcionará de extremo a extremo
sin cambios adicionales en el código.
