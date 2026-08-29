export interface Transaccion {
    id: number;
    descripcion: string;
    categoria: string;
    valor: number;
}

export interface AnalisisRequest {
    ingreso_mensual: number;
    nivel_endeudamiento: number;
    frecuencia_ahorro: string;
    transacciones: Transaccion[];
}

export interface AnalisisResponse {
    perfil_financiero: string;
    probabilidad: number;
    resumen_gastos: Record<string, number>;
    recomendaciones: string[];
}

export interface HistorialPage {
    content: AnalisisResponse[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}

export interface LoteResponse {
    mensaje?: string;
    exito?: boolean;
    // Podemos agregar más campos en el futuro si el backend manda más detalles del CSV
}