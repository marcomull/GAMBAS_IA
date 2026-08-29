package com.alura.finance_ai.service;

import com.alura.finance_ai.dto.FinanceReportRequest;
import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.awt.Color;

// Lógica de negocio para dibujar y construir el PDF de finanzas
@Service
public class PdfReportService {

    public byte[] generateFinanceReport(FinanceReportRequest request) {
        Document document = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Título principal
            Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD);
            fontTitle.setSize(20);
            Paragraph title = new Paragraph("Reporte Financiero Personal", fontTitle);
            title.setAlignment(Paragraph.ALIGN_CENTER);
            document.add(title);
            
            document.add(new Paragraph(" ")); // Salto de línea

            // Datos financieros
            Font fontNormal = FontFactory.getFont(FontFactory.HELVETICA);
            fontNormal.setSize(14);

            document.add(new Paragraph("Ingresos Totales: $" + request.getIncomes(), fontNormal));
            document.add(new Paragraph("Gastos Totales: $" + request.getExpenses(), fontNormal));
            
            document.add(new Paragraph(" "));

            // Resultado en colores
            double result = request.getIncomes() - request.getExpenses();
            Font fontResult = FontFactory.getFont(FontFactory.HELVETICA_BOLD);
            fontResult.setSize(16);
            if (result >= 0) {
                fontResult.setColor(Color.GREEN);
                document.add(new Paragraph("Balance Positivo: $" + result, fontResult));
            } else {
                fontResult.setColor(Color.RED);
                document.add(new Paragraph("Balance Negativo: $" + result, fontResult));
            }

            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return out.toByteArray();
    }
}
