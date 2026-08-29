package com.alura.finance_ai.controller;

import com.alura.finance_ai.dto.AnalisisRequest;
import com.alura.finance_ai.dto.AnalysisHistoryDTO;
import com.alura.finance_ai.dto.TransaccionDTO;
import com.alura.finance_ai.model.AnalysisHistoryEntity;
import com.alura.finance_ai.model.TransactionEntity;
import com.alura.finance_ai.model.UserEntity;
import com.alura.finance_ai.repository.AnalysisHistoryRepository;
import com.alura.finance_ai.repository.UserRepository;
import com.alura.finance_ai.service.AnalisisFinancieroService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // Permite que el frontend se conecte sin errores de CORS
@Tag(name = "Finanzas", description = "Endpoints para el análisis y clasificación financiera")
public class AnalisisFinancieroController {

    private final AnalisisFinancieroService analisisService;
    private final AnalysisHistoryRepository analysisHistoryRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public AnalisisFinancieroController(AnalisisFinancieroService analisisService, 
                                        AnalysisHistoryRepository analysisHistoryRepository,
                                        UserRepository userRepository,
                                        ObjectMapper objectMapper) {
        this.analisisService = analisisService;
        this.analysisHistoryRepository = analysisHistoryRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Operation(summary = "Analizar comportamiento financiero", description = "Recibe datos de ingresos y transacciones para generar perfil, resumen de gastos y recomendaciones.")
    @PostMapping(value = {"/analisis-financiero", "/api/v1/analisis"})
    public ResponseEntity<?> procesarAnalisis(@Valid @RequestBody AnalisisRequest request) {

        request = analisisService.validarYCompletarRequest(request);

        String perfilFinanciero = analisisService.realizarPrediccionInterna(request);
        
        int puntaje = analisisService.calcularPuntaje(request);

        Map<String, Double> resumenGastos = calcularResumenGastos(request);

        List<String> recomendaciones = analisisService.generarRecomendaciones(request, perfilFinanciero, resumenGastos);

        Map<String, Object> response = new HashMap<>();
        response.put("perfil_financiero", perfilFinanciero);
        response.put("puntaje", puntaje);
        response.put("probabilidad", 0.88);
        response.put("resumen_gastos", resumenGastos);
        response.put("recomendaciones", recomendaciones);
        response.put("nivel_endeudamiento", request.nivelEndeudamiento());
        response.put("frecuencia_ahorro", request.frecuenciaAhorro());

        // Guardar el historial si el usuario está autenticado
        guardarHistorialSiAutenticado(request, perfilFinanciero, puntaje, recomendaciones);

        return ResponseEntity.ok(response);
    }
    
    private void guardarHistorialSiAutenticado(AnalisisRequest request, String perfilFinanciero, int puntaje, List<String> recomendaciones) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            String username = auth.getName();
            userRepository.findByUsername(username).ifPresent(user -> {
                try {
                    AnalysisHistoryEntity history = AnalysisHistoryEntity.builder()
                            .user(user)
                            .ingresoMensual(request.ingresoMensual())
                            .nivelEndeudamiento(request.nivelEndeudamiento())
                            .frecuenciaAhorro(request.frecuenciaAhorro())
                            .perfilFinanciero(perfilFinanciero)
                            .puntaje(puntaje)
                            .recomendaciones(objectMapper.writeValueAsString(recomendaciones))
                            .fechaAnalisis(LocalDateTime.now())
                            .build();

                    if (request.transacciones() != null) {
                        for (TransaccionDTO t : request.transacciones()) {
                            TransactionEntity trans = TransactionEntity.builder()
                                    .descripcion(t.descripcion())
                                    .valor(t.valor())
                                    .categoria(analisisService.clasificarTransaccion(t))
                                    .build();
                            history.addTransaccion(trans);
                        }
                    }
                    
                    analysisHistoryRepository.save(history);
                } catch (Exception e) {
                    System.err.println("Error al guardar historial: " + e.getMessage());
                }
            });
        }
    }

    @Operation(summary = "Obtener historial", description = "Devuelve los análisis pasados del usuario autenticado.")
    @GetMapping("/analisis/historial")
    public ResponseEntity<List<AnalysisHistoryDTO>> obtenerHistorial() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).build();
        }

        String username = auth.getName();
        UserEntity user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        List<AnalysisHistoryEntity> historial = analysisHistoryRepository.findByUserIdOrderByFechaAnalisisDesc(user.getId());
        
        List<AnalysisHistoryDTO> dtoList = historial.stream().map(h -> {
            List<TransaccionDTO> transDTOs = h.getTransacciones().stream()
                    .map(t -> new TransaccionDTO(t.getDescripcion(), t.getValor())) // No guardamos categoria en el DTO, o la ignoramos
                    .collect(Collectors.toList());
                    
            return AnalysisHistoryDTO.builder()
                    .id(h.getId())
                    .ingresoMensual(h.getIngresoMensual())
                    .nivelEndeudamiento(h.getNivelEndeudamiento())
                    .frecuenciaAhorro(h.getFrecuenciaAhorro())
                    .perfilFinanciero(h.getPerfilFinanciero())
                    .puntaje(h.getPuntaje())
                    .recomendaciones(h.getRecomendaciones())
                    .fechaAnalisis(h.getFechaAnalisis())
                    .transacciones(transDTOs)
                    .build();
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtoList);
    }

    @Operation(summary = "Clasificar transacción", description = "Clasifica automáticamente una transacción individual en una categoría.")
    @PostMapping("/clasificar-transaccion")
    public ResponseEntity<Map<String, Object>> clasificarTransaccion(@Valid @RequestBody TransaccionDTO transaccion) {

        String categoria = analisisService.clasificarTransaccion(transaccion);

        Map<String, Object> response = new HashMap<>();
        response.put("descripcion", transaccion.descripcion());
        response.put("monto", transaccion.valor());
        response.put("categoria_asignada", categoria);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Pre-calcular Endeudamiento y Ahorro", description = "Devuelve los valores autocalculados sin guardar ni realizar todo el análisis pesado.")
    @PostMapping("/pre-calculo")
    public ResponseEntity<Map<String, Object>> preCalculo(@Valid @RequestBody AnalisisRequest request) {
        AnalisisRequest completedRequest = analisisService.validarYCompletarRequest(request);
        Map<String, Object> response = new HashMap<>();
        response.put("nivel_endeudamiento", completedRequest.nivelEndeudamiento());
        response.put("frecuencia_ahorro", completedRequest.frecuenciaAhorro());
        return ResponseEntity.ok(response);
    }

    private Map<String, Double> calcularResumenGastos(AnalisisRequest request) {
        Map<String, Double> resumen = new HashMap<>();

        if (request.transacciones() != null) {
            for (TransaccionDTO t : request.transacciones()) {
                String categoria = analisisService.clasificarTransaccion(t);
                resumen.put(categoria, resumen.getOrDefault(categoria, 0.0) + t.valor());
            }
        }

        return resumen;
    }

    @ExceptionHandler(IllegalArgumentException.class)
public ResponseEntity<Map<String, String>> manejarErrorValidacion(
        IllegalArgumentException e) {

    Map<String, String> response = new HashMap<>();
    response.put("error", e.getMessage());

    return ResponseEntity.badRequest().body(response);
}
}