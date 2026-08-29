package com.alura.finance_ai.controller;

import com.alura.finance_ai.dto.FinanceReportRequest;
import com.alura.finance_ai.service.PdfReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Endpoint para comunicarse con el Frontend y devolver archivos
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReportController {

    private final PdfReportService pdfReportService;

    @PostMapping("/finance/download")
    public ResponseEntity<byte[]> downloadFinanceReport(@RequestBody FinanceReportRequest request) {
        
        byte[] pdfBytes = pdfReportService.generateFinanceReport(request);

        HttpHeaders headers = new HttpHeaders();
        // Le indica al navegador que el contenido es un archivo descargable PDF
        headers.setContentDispositionFormData("attachment", "reporte_financiero.pdf");
        headers.setContentType(MediaType.APPLICATION_PDF);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }
}
