package com.alura.finance_ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.List;

public record AnalisisRequest(
        @JsonProperty("ingreso_mensual")
        @NotNull @Min(0) Double ingresoMensual,

        @JsonProperty("nivel_endeudamiento")
        Integer nivelEndeudamiento, // La intencion es que si no proporcionan el dato se calcule de manera automatica

        @JsonProperty("frecuencia_ahorro")
        @Pattern(regexp = "^(Nula|Muy baja|Baja|Media|Alta|Muy alta)$",
                message = "La frecuencia de ahorro debe ser estrictamente una de las siguientes: 'Nula', 'Muy baja', 'Baja', " +
                "'Media', 'Alta', 'Muy alta'")
        String frecuenciaAhorro,    

        @NotEmpty @Valid List<TransaccionDTO> transacciones
) {
}