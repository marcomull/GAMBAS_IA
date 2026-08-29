package com.alura.finance_ai.dto;

import lombok.Data;

// Datos financieros para generar el PDF
@Data
public class FinanceReportRequest {
    private Double incomes;
    private Double expenses;
}
