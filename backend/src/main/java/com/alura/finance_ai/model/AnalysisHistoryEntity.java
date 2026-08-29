package com.alura.finance_ai.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "analysis_history")
public class AnalysisHistoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relación con el usuario que realizó el análisis
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    // Datos de entrada
    @Column(nullable = false)
    private Double ingresoMensual;

    @Column(nullable = false)
    private Integer nivelEndeudamiento;

    @Column(nullable = false)
    private String frecuenciaAhorro;

    // Resultados
    @Column(nullable = false)
    private String perfilFinanciero;

    @Column(nullable = false)
    private Integer puntaje;

    // Guardaremos las recomendaciones exactas devueltas por la IA en formato de texto plano/JSON
    @Column(columnDefinition = "TEXT")
    private String recomendaciones;

    @Column(nullable = false)
    private LocalDateTime fechaAnalisis;

    // Las transacciones asociadas a este análisis (cascade para que se guarden juntas)
    @OneToMany(mappedBy = "analysis", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TransactionEntity> transacciones = new ArrayList<>();

    // Helper method para mantener la sincronización bidireccional
    public void addTransaccion(TransactionEntity transaccion) {
        transacciones.add(transaccion);
        transaccion.setAnalysis(this);
    }
}
