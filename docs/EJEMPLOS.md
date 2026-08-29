# Ejemplos reales de uso

Tres llamadas reales a `POST /api/analisis-financiero`, ejecutadas contra la instancia
desplegada en OCI (`financeai-g9-t38.duckdns.org`), no en local. Capturadas el
2026-08-21 con un usuario de prueba (`qa_o8_auditv2`) creado y removido para este
ensayo. Los tres cubren los tres perfiles financieros que puede devolver el Modelo 2:
`Finanzas sanas`, `En observacion` y `En riesgo`.

Autenticación: todos los endpoints bajo `/api/**` requieren un JWT obtenido en
`POST /auth/login` (ver `docs/postman/` para la colección completa). El header
`Authorization: Bearer <token>` se omite abajo por brevedad.

---

## Ejemplo 1 — Perfil "Finanzas sanas"

**Request**

```json
POST /api/analisis-financiero
{
  "ingreso_mensual": 35000,
  "transacciones": [
    { "descripcion": "Renta departamento", "valor": 7000 },
    { "descripcion": "Super Walmart", "valor": 2500 },
    { "descripcion": "Netflix", "valor": 219 }
  ]
}
```

**Response**

```json
{
  "recomendaciones": [
    "[ALERTA] El gasto en 'Renta departamento' supera el límite preventivo recomendado por transacción",
    "Buen trabajo. Se recomienda destinar un 10% adicional a su ahorro mensual."
  ],
  "nivel_endeudamiento": 28,
  "resumen_gastos": {
    "Vivienda": 7000.0,
    "Alimentacion": 2500.0,
    "Ocio": 219.0
  },
  "puntaje": 110,
  "probabilidad": 0.88,
  "frecuencia_ahorro": "Alta",
  "perfil_financiero": "Finanzas sanas"
}
```

`nivel_endeudamiento` y `frecuencia_ahorro` no se enviaron explícitamente: el backend
los auto-calculó a partir del ingreso y las transacciones (ver
`AnalisisFinancieroService.validarYCompletarRequest`).

---

## Ejemplo 2 — Perfil "En observación"

**Request**

```json
POST /api/analisis-financiero
{
  "ingreso_mensual": 20000,
  "nivel_endeudamiento": 40,
  "frecuencia_ahorro": "Media",
  "transacciones": [
    { "descripcion": "Renta", "valor": 4000 },
    { "descripcion": "Super", "valor": 2000 }
  ]
}
```

**Response**

```json
{
  "recomendaciones": [
    "[ALERTA] El gasto en 'Renta' supera el límite preventivo recomendado por transacción",
    "Atención: Tus obligaciones financieras declaradas están consumiendo la mayor parte de tus ingresos. Recomendamos considerar moderar gastos.",
    "Nota: Has declarado un endeudamiento del 40%, pero según tus ingresos y transacciones recientes, tu verdadero nivel de endeudamiento es del 30%."
  ],
  "nivel_endeudamiento": 40,
  "resumen_gastos": {
    "Vivienda": 4000.0,
    "Ocio": 2000.0
  },
  "puntaje": 60,
  "probabilidad": 0.88,
  "frecuencia_ahorro": "Media",
  "perfil_financiero": "En observacion"
}
```

Nota honesta: el Modelo 1 clasificó "Super" como `Ocio`, no como `Alimentacion`. Es el
comportamiento real del clasificador de gastos entrenado, no un dato ajustado a mano —
se deja así a propósito para que este documento refleje el sistema tal como se comporta hoy.

---

## Ejemplo 3 — Perfil "En riesgo"

**Request**

```json
POST /api/analisis-financiero
{
  "ingreso_mensual": 12000,
  "nivel_endeudamiento": 85,
  "frecuencia_ahorro": "Nula",
  "transacciones": [
    { "descripcion": "Renta cuarto", "valor": 4500 },
    { "descripcion": "Pago tarjeta credito", "valor": 3800 },
    { "descripcion": "Super despensa", "valor": 2200 },
    { "descripcion": "Uber", "valor": 900 }
  ]
}
```

**Response**

```json
{
  "recomendaciones": [
    "[ALERTA] El gasto en 'Renta cuarto' supera el límite preventivo recomendado por transacción",
    "[ALERTA] El gasto en 'Pago tarjeta credito' supera el límite preventivo recomendado por transacción",
    "[ALERTA] El gasto en 'Super despensa' supera el límite preventivo recomendado por transacción",
    "Alerta: Su nivel de endeudamiento supera los límites recomendados. Evite adquirir nuevos créditos.",
    "Nota: Has declarado un endeudamiento del 85%, pero según tus ingresos y transacciones recientes, tu verdadero nivel de endeudamiento es del 95%.",
    "Se recomienda reducir gastos en la categoría de Vivienda",
    "Aumentar la frecuencia de ahorro ayudaría a mejorar tu perfil financiero y tener mejores oportunidades a futuro"
  ],
  "nivel_endeudamiento": 85,
  "resumen_gastos": {
    "Transporte": 900.0,
    "Vivienda": 8300.0,
    "Alimentacion": 2200.0
  },
  "puntaje": 5,
  "probabilidad": 0.88,
  "frecuencia_ahorro": "Nula",
  "perfil_financiero": "En riesgo"
}
```

---

## Nota sobre la versión probada

Estos tres ejemplos se ejecutaron contra lo que estaba realmente corriendo en la VM el
2026-08-21 (`git log -1` en el servidor: commit `0771f7d`, merge del PR #68). Esa versión
**es anterior** a los PR #69, #70 y a los dos PR de esta misma auditoría (#71, #72), que
a esta fecha aún no se habían desplegado. Los tres ejemplos son válidos como prueba de que
el flujo completo (auth → backend → microservicio Python → modelos → recomendaciones)
funciona de punta a punta en el entorno real de OCI, pero deben volver a capturarse después
de desplegar la versión más reciente de `main` si se quiere que este documento refleje el
comportamiento exacto de esa versión.
