package com.alura.finance_ai.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AnalysisHistoryDTO {
    private Long id;
    private Double ingresoMensual;
    private Integer nivelEndeudamiento;
    private String frecuenciaAhorro;
    private String perfilFinanciero;
    private Integer puntaje;
    private String recomendaciones;
    private LocalDateTime fechaAnalisis;
    private List<TransaccionDTO> transacciones;
}
