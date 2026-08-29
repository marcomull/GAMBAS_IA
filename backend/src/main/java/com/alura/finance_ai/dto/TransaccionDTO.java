package com.alura.finance_ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record TransaccionDTO(
        @JsonProperty("descripcion")
        @NotBlank String descripcion,

        @JsonProperty("valor")
        @Positive Double valor
) {
}