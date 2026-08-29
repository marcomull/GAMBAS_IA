import { AnalisisRequest, AnalisisResponse, HistorialPage, LoteResponse } from "../types/finance";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function analizarFinanciero(request: AnalisisRequest): Promise<AnalisisResponse> {
    const resp = await fetch(`${API_URL}/analisis-financiero`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.mensaje || `Error ${resp.status} al analizar`);
    }
    return resp.json();
}

export async function procesarLoteCsv(
    file: File,
    params: { usuarioId?: string; ingresoMensual?: number; nivelEndeudamiento?: number; frecuenciaAhorro?: string }
): Promise<LoteResponse> {
    const formData = new FormData();
    formData.append("file", file);
    if (params.usuarioId) formData.append("usuarioId", params.usuarioId);
    if (params.ingresoMensual) formData.append("ingresoMensual", String(params.ingresoMensual));
    if (params.nivelEndeudamiento != null) formData.append("nivelEndeudamiento", String(params.nivelEndeudamiento));
    if (params.frecuenciaAhorro) formData.append("frecuenciaAhorro", params.frecuenciaAhorro);

    const resp = await fetch(`${API_URL}/analisis-financiero/lote`, {
        method: "POST",
        body: formData,
    });
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.mensaje || `Error ${resp.status} al procesar el lote`);
    }
    return resp.json();
}

export async function obtenerHistorial(usuarioId: string, page = 0, size = 20): Promise<HistorialPage> {
    const resp = await fetch(`${API_URL}/historial?usuarioId=${encodeURIComponent(usuarioId)}&page=${page}&size=${size}`);
    if (!resp.ok) {
        throw new Error(`Error ${resp.status} al obtener historial`);
    }
    return resp.json();
}
