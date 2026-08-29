package com.alura.finance_ai.service;

import com.alura.finance_ai.dto.AnalisisRequest;
import com.alura.finance_ai.dto.TransaccionDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.text.Normalizer;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class AnalisisFinancieroService {

    private static final Logger log = LoggerFactory.getLogger(AnalisisFinancieroService.class);

    private static final double UMBRAL_ALERTA_TRANSACCION = 0.10; // 10% del ingreso mensual
    private static final double UMBRAL_ALERTA_CATEGORIA = 0.30;   // 30% del ingreso mensual

    private final RestClient restClient;

    @Autowired
    public AnalisisFinancieroService(
            @Value("${servicio.ia.url:http://localhost:8000}") String servicioIaUrl,
            @Value("${servicio.ia.connect-timeout-ms:2000}") int connectTimeoutMs,
            @Value("${servicio.ia.read-timeout-ms:12000}") int readTimeoutMs) {
        var requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(connectTimeoutMs));
        requestFactory.setReadTimeout(Duration.ofMillis(readTimeoutMs));
        this.restClient = RestClient.builder()
                .baseUrl(servicioIaUrl)
                .requestFactory(requestFactory)
                .build();
    }

    public enum PerfilFinanciero {
        EN_RIESGO,
        EN_OBSERVACION,
        FINANZAS_SANAS,
        DESCONOCIDO; // fallback explícito

        public static PerfilFinanciero fromString(String valor) {
            if (valor == null) {
                return DESCONOCIDO;
            }
            String normalizado = valor.trim().toUpperCase(Locale.ROOT).replace(" ", "_");
            return switch (normalizado) {
                case "EN_RIESGO" -> EN_RIESGO;
                case "EN_OBSERVACION", "EN_OBSERVACIÓN" -> EN_OBSERVACION;
                case "FINANZAS_SANAS", "SALUDABLE", "EXCELENTE", "ESTABLE" -> FINANZAS_SANAS;
                default -> {
                    log.warn("Perfil financiero no reconocido recibido del servicio IA: '{}'", valor);
                    yield DESCONOCIDO;
                }
            };
        }
    }

    public enum CategoriaGasto {
        ALIMENTACION, TRANSPORTE, SALUD, VIVIENDA, EDUCACION, OCIO, SERVICIOS, OTRAS;

        public static CategoriaGasto fromString(String valor) {
            if (valor == null) {
                return OTRAS;
            }
            String normalizado = Normalizer.normalize(valor.trim(), Normalizer.Form.NFD)
                    .replaceAll("\\p{M}", "") // quita acentos: "Educación" -> "EDUCACION"
                    .toUpperCase(Locale.ROOT);
            return switch (normalizado) {
                case "ALIMENTACION" -> ALIMENTACION;
                case "TRANSPORTE" -> TRANSPORTE;
                case "SALUD" -> SALUD;
                case "VIVIENDA" -> VIVIENDA;
                case "EDUCACION" -> EDUCACION;
                case "OCIO" -> OCIO;
                case "SERVICIOS" -> SERVICIOS;
                default -> OTRAS;
            };
        }
    }

    public AnalisisRequest validarYCompletarRequest(AnalisisRequest request) {
        if (request.ingresoMensual() == null || request.ingresoMensual() <= 0) {
            throw new IllegalArgumentException("Debes ingresar un valor válido superior a 0 en el ingreso mensual.");
        }

        double ingreso = request.ingresoMensual();
        double totalGastos = 0.0;

        if (request.transacciones() != null) {
            for (TransaccionDTO t : request.transacciones()) {
                if (t.valor() == null || t.valor() <= 0) {
                    throw new IllegalArgumentException("Debes ingresar un valor válido superior a 0 en cada gasto.");
                }
                totalGastos += t.valor();
            }
        }

        Integer endeudamiento = request.nivelEndeudamiento();
        String ahorro = request.frecuenciaAhorro();

        if (endeudamiento == null || ahorro == null || ahorro.isEmpty()) {
            double end = Math.round((totalGastos / ingreso) * 100.0);
            endeudamiento = (int) end;

            double margenLibre = ingreso - totalGastos;
            double ratioAhorro = margenLibre / ingreso;
            ahorro = determinarFrecuenciaAhorro(ratioAhorro);
        }

        return new AnalisisRequest(
                request.ingresoMensual(),
                endeudamiento,
                ahorro,
                request.transacciones()
        );
    }

    private String determinarFrecuenciaAhorro(double ratioAhorro) {
        double porcentaje = ratioAhorro * 100;
        if (porcentaje >= 20) return "Alta";
        if (porcentaje >= 10) return "Media";
        return "Baja";
    }

    public int calcularPuntaje(AnalisisRequest datos) {
        int puntaje = 0;
        puntaje += calcularPuntosAhorro(datos.frecuenciaAhorro());
        puntaje += calcularPuntosEndeudamiento(datos.nivelEndeudamiento());

        double totalGastosRecientes = 0.0;
        if (datos.transacciones() != null) {
            for (TransaccionDTO t : datos.transacciones()) {
                if (t.valor() != null) totalGastosRecientes += t.valor();
            }
        }

        double ingreso = datos.ingresoMensual() != null && datos.ingresoMensual() > 0 ? datos.ingresoMensual() : 1.0;
        double porcentajeGasto = (totalGastosRecientes / ingreso) * 100;

        puntaje += calcularPuntosGasto(porcentajeGasto);
        return puntaje;
    }

    private int calcularPuntosAhorro(String ahorroStr) {
        if (ahorroStr == null) return 0;
        return switch (ahorroStr.toLowerCase()) {
            case "alta" -> 40;
            case "media" -> 20;
            case "baja" -> 0;
            default -> 0;
        };
    }

    private int calcularPuntosEndeudamiento(Integer nivelEndeudamiento) {
        if (nivelEndeudamiento == null) return 0;
        if (nivelEndeudamiento < 30) return 30;
        if (nivelEndeudamiento <= 50) return 20;
        if (nivelEndeudamiento <= 70) return 10;
        return 0;
    }

    private int calcularPuntosGasto(double porcentajeGasto) {
        if (porcentajeGasto < 30) return 40;
        if (porcentajeGasto <= 60) return 20;
        return 5;
    }

    public String realizarPrediccionInterna(Object payload) {
        try {
            Object pythonPayload = payload;
            if (payload instanceof AnalisisRequest req) {
                int endClamped = Math.min(100, Math.max(0, req.nivelEndeudamiento() != null ? req.nivelEndeudamiento() : 0));
                pythonPayload = new AnalisisRequest(
                        req.ingresoMensual(),
                        endClamped,
                        req.frecuenciaAhorro(),
                        req.transacciones()
                );
            }

            String rawJson = restClient.post()
                    .uri("/prediccion-interna")
                    .body(pythonPayload)
                    .retrieve()
                    .body(String.class);

            if (rawJson != null) {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode root = mapper.readTree(rawJson);
                if (root.has("perfil") && root.get("perfil").has("valor")) {
                    return root.get("perfil").get("valor").asText();
                }
                return rawJson;
            }

            return rawJson;
        } catch (RestClientException | JsonProcessingException e) {
            log.error("Se cayo la conexion con Python en /prediccion-interna: " + e.getMessage());
            if (payload instanceof AnalisisRequest req) {
                int puntaje = calcularPuntaje(req);
                return (puntaje >= 80) ? "FINANZAS_SANAS" : (puntaje >= 50) ? "EN_OBSERVACION" : "EN_RIESGO";
            }
            return PerfilFinanciero.DESCONOCIDO.name();
        }
    }

    public String clasificarTransaccion(TransaccionDTO transaccion) {
        if (transaccion == null || transaccion.descripcion() == null) {
            return "Otras";
        }
        String desc = transaccion.descripcion().trim().toLowerCase();
        if (desc.equals("otro") || desc.equals("otros") || desc.startsWith("otro") || desc.contains("varios") || desc.contains("miscelaneo") || desc.contains("extra") || desc.equals("sin categoria")) {
            return "Otras";
        }

        try {
            String rawJson = restClient.post()
                    .uri("/clasificar-transaccion")
                    .body(transaccion)
                    .retrieve()
                    .body(String.class);

            if (rawJson != null) {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode root = mapper.readTree(rawJson);
                if (root.has("categoria")) {
                    return root.get("categoria").asText();
                }
            }
            return simularClasificacion(transaccion.descripcion());
        } catch (RestClientException | JsonProcessingException e) {
            log.warn("Servicio de IA no disponible, usando clasificación de respaldo por palabras clave", e);
            return simularClasificacion(transaccion.descripcion());
        }
    }

    private String simularClasificacion(String descripcion) {
        if (descripcion == null) {
            return "Otras";
        }
        String descLower = descripcion.toLowerCase(Locale.ROOT);
        if (contieneAlguna(descLower, "supermercado", "super", "comida", "restaurante", "mercado", "carne", "despensa")) {
            return "Alimentación";
        }
        if (contieneAlguna(descLower, "uber", "gasolina", "transporte", "taxi", "metro", "peaje", "auto")) {
            return "Transporte";
        }
        if (contieneAlguna(descLower, "farmacia", "doctor", "hospital", "salud", "seguro medico", "consulta", "medica")) {
            return "Salud";
        }
        if (contieneAlguna(descLower, "renta", "arriendo", "alquiler", "hipoteca", "vivienda", "casa")) {
            return "Vivienda";
        }
        if (contieneAlguna(descLower, "colegiatura", "universidad", "curso", "libro", "escuela", "educacion")) {
            return "Educación";
        }
        if (contieneAlguna(descLower, "cine", "streaming", "juegos", "juego", "bar", "concierto", "ocio", "steam")) {
            return "Ocio";
        }
        if (contieneAlguna(descLower, "luz", "agua", "internet", "telefono", "gas", "electricidad", "servicio")) {
            return "Servicios";
        }
        return "Otras";
    }

    private boolean contieneAlguna(String texto, String... palabrasClave) {
        for (String palabra : palabrasClave) {
            if (texto.contains(palabra)) {
                return true;
            }
        }
        return false;
    }

    public List<String> generarRecomendaciones(AnalisisRequest request, String perfilPython, Map<String, Double> resumenGastos) {
        List<String> recomendaciones = new ArrayList<>();
        PerfilFinanciero perfil = PerfilFinanciero.fromString(perfilPython);

        agregarAlertasPorTransaccion(request, recomendaciones);
        agregarRecomendacionesPorPerfil(perfil, recomendaciones);
        agregarAlertasPorCategoria(request, resumenGastos, perfil, recomendaciones);
        agregarRecomendacionAhorro(request, recomendaciones);

        return recomendaciones;
    }

    private void agregarAlertasPorTransaccion(AnalisisRequest request, List<String> recomendaciones) {
        if (request.transacciones() == null || !tieneIngresoValido(request)) {
            return;
        }
        double umbral = request.ingresoMensual() * UMBRAL_ALERTA_TRANSACCION;
        for (TransaccionDTO transaccion : request.transacciones()) {
            if (transaccion.valor() > umbral) {
                recomendaciones.add("[ALERTA] El gasto en '" + transaccion.descripcion()
                        + "' supera el límite preventivo recomendado por transacción (10% de tu ingreso mensual).");
            }
        }
    }

    private void agregarRecomendacionesPorPerfil(PerfilFinanciero perfil, List<String> recomendaciones) {
        switch (perfil) {
            case EN_RIESGO -> {
                recomendaciones.add("Tu prioridad actual es frenar el endeudamiento: evita usar el crédito para compras no esenciales.");
                recomendaciones.add("Estás operando sin margen de error. Construir un fondo de emergencia, aunque sea pequeño, reduce tu dependencia del crédito ante imprevistos.");
            }
            case EN_OBSERVACION -> {
                recomendaciones.add("Prueba la regla 50/30/20 como guía: 50% necesidades, 30% deseos, 20% ahorro automático.");
                recomendaciones.add("Detectamos oportunidad en tus gastos variables; reducirlos puede darte margen para construir un colchón financiero.");
            }
            case FINANZAS_SANAS -> {
                recomendaciones.add("¡Buen manejo de tus finanzas! Con esta disciplina, podrías explorar instrumentos de inversión de bajo riesgo para que tu dinero no pierda valor frente a la inflación.");
                recomendaciones.add("Considera destinar un porcentaje adicional a metas de mediano plazo, como aportaciones voluntarias a tu retiro.");
                recomendaciones.add("Nota: estas son sugerencias educativas generales, no asesoría financiera personalizada.");
            }
            case DESCONOCIDO -> recomendaciones.add("No pudimos determinar tu perfil financiero en este momento. Intenta nuevamente más tarde.");
        }
    }

    private void agregarAlertasPorCategoria(AnalisisRequest request, Map<String, Double> resumenGastos,
                                             PerfilFinanciero perfil, List<String> recomendaciones) {
        if (resumenGastos == null || !tieneIngresoValido(request)) {
            return;
        }
        double umbral = request.ingresoMensual() * UMBRAL_ALERTA_CATEGORIA;
        resumenGastos.forEach((categoriaTexto, totalGasto) -> {
            if (totalGasto > umbral) {
                CategoriaGasto categoria = CategoriaGasto.fromString(categoriaTexto);
                recomendaciones.add(obtenerConsejoPorCategoria(categoria, perfil));
            }
        });
    }

    private String obtenerConsejoPorCategoria(CategoriaGasto categoria, PerfilFinanciero perfil) {
        return switch (categoria) {
            case ALIMENTACION -> switch (perfil) {
                case EN_RIESGO -> "Tu gasto en alimentación es alto para tu situación actual. Cocinar en casa y planear un menú semanal puede reducirlo de forma notable.";
                case EN_OBSERVACION -> "Revisa cuánto de tu gasto en alimentación es en restaurantes o comida rápida; reducir esa parte suele tener el mayor impacto.";
                case FINANZAS_SANAS -> "Tu gasto en alimentación está por encima del 30%, pero tus finanzas lo soportan. Aun así, comparar precios en el súper puede liberar dinero para tus metas de ahorro.";
                case DESCONOCIDO -> "Tu gasto en alimentación supera el 30% de tu ingreso; vale la pena revisarlo.";
            };
            case TRANSPORTE -> switch (perfil) {
                case EN_RIESGO -> "El transporte se está llevando una parte importante de tu ingreso. Evalúa rutas más económicas o compartir viajes mientras estabilizas tus finanzas.";
                case EN_OBSERVACION -> "Considera alternar entre transporte público y particular según el día; puede reducir este gasto sin afectar tu rutina.";
                case FINANZAS_SANAS -> "Tu gasto en transporte es alto pero manejable. Si usas app de transporte con frecuencia, revisa planes o membresías que ofrezcan tarifas preferenciales.";
                case DESCONOCIDO -> "Tu gasto en transporte supera el 30% de tu ingreso; vale la pena revisarlo.";
            };
            case SALUD -> switch (perfil) {
                case EN_RIESGO -> "Tu gasto en salud es alto. Si es un gasto recurrente (tratamiento, medicamentos), revisa si aplica algún seguro o programa de apoyo para aliviar tu flujo de efectivo.";
                case EN_OBSERVACION -> "Un gasto elevado en salud puede ser puntual; si se repite mes a mes, considera cotizar un seguro médico para evitar sorpresas mayores.";
                case FINANZAS_SANAS -> "Buena noticia: puedes cubrir este gasto en salud sin comprometer tus otras metas. Considera un seguro médico si aún no tienes uno, como protección a futuro.";
                case DESCONOCIDO -> "Tu gasto en salud supera el 30% de tu ingreso; vale la pena revisarlo.";
            };
            case VIVIENDA -> switch (perfil) {
                case EN_RIESGO -> "Tu gasto en vivienda supera niveles saludables para tu situación actual. Si es posible, renegociar renta o buscar una opción más económica aliviaría bastante presión.";
                case EN_OBSERVACION -> "La vivienda suele ser un gasto fijo difícil de reducir rápido; enfócate en compensar ajustando gastos variables en otras categorías.";
                case FINANZAS_SANAS -> "Tu gasto en vivienda es alto pero tus finanzas lo sostienen bien. Si tienes hipoteca, evalúa si conviene hacer pagos adicionales a capital.";
                case DESCONOCIDO -> "Tu gasto en vivienda supera el 30% de tu ingreso; vale la pena revisarlo.";
            };
            case EDUCACION -> switch (perfil) {
                case EN_RIESGO -> "Tu gasto en educación es alto para tu situación actual. Revisa si existen becas, planes de pago o descuentos disponibles para aliviar la carga este mes.";
                case EN_OBSERVACION -> "La educación es una inversión a largo plazo; solo asegúrate de que no esté comprometiendo tu fondo de emergencia.";
                case FINANZAS_SANAS -> "Tu inversión en educación es alta pero sostenible dado tu perfil. Sigue así: es de los gastos con mejor retorno a futuro.";
                case DESCONOCIDO -> "Tu gasto en educación supera el 30% de tu ingreso; vale la pena revisarlo.";
            };
            case OCIO -> switch (perfil) {
                case EN_RIESGO -> "El gasto en ocio está afectando tu estabilidad financiera actual. Pausar suscripciones o salidas no esenciales este mes te dará aire mientras te recuperas.";
                case EN_OBSERVACION -> "Ponle un límite mensual fijo a tu gasto en ocio; disfrutarlo sin culpa es más fácil cuando tiene un tope claro.";
                case FINANZAS_SANAS -> "Tienes margen para disfrutar tu gasto en ocio. Si quieres optimizar, destina una parte de lo que gastas aquí a una meta de ahorro o inversión.";
                case DESCONOCIDO -> "Tu gasto en ocio supera el 30% de tu ingreso; vale la pena revisarlo.";
            };
            case SERVICIOS -> switch (perfil) {
                case EN_RIESGO -> "Revisa tus servicios (luz, agua, internet, telefonía): renegociar planes o eliminar los que no usas puede darte alivio inmediato.";
                case EN_OBSERVACION -> "Compara tus planes de servicios actuales contra otras opciones del mercado; suele haber ahorro sin perder calidad.";
                case FINANZAS_SANAS -> "Tu gasto en servicios es alto pero controlado. Aun así, revisar suscripciones digitales olvidadas nunca está de más.";
                case DESCONOCIDO -> "Tu gasto en servicios supera el 30% de tu ingreso; vale la pena revisarlo.";
            };
            case OTRAS -> "Tienes gastos sin categorizar que superan el 30% de tu ingreso mensual; revisarlos te ayudará a entender mejor a dónde va tu dinero.";
        };
    }

    private void agregarRecomendacionAhorro(AnalisisRequest request, List<String> recomendaciones) {
        String frecuencia = request.frecuenciaAhorro();
        if (frecuencia != null && (frecuencia.equalsIgnoreCase("Baja") || frecuencia.equalsIgnoreCase("Nulo") || frecuencia.equalsIgnoreCase("Nula"))) {
            recomendaciones.add("Aumentar la frecuencia de tu ahorro, aunque sea con montos pequeños, mejora tu perfil financiero a futuro.");
        }
    }

    private boolean tieneIngresoValido(AnalisisRequest request) {
        return request.ingresoMensual() != null && request.ingresoMensual() > 0.0;
    }
}