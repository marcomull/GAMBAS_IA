"use client";

import { useState } from "react";
import { AnalisisRequest, Transaccion } from "../types/finance";

interface FinanceFormProps {
    onSubmit: (data: AnalisisRequest) => void;
    isLoading: boolean;
}

export default function FinanceForm({ onSubmit, isLoading }: FinanceFormProps) {
    const [ingresoMensual, setIngresoMensual] = useState<number | "">("");
    const [nivelEndeudamiento, setNivelEndeudamiento] = useState<number | "">("");
    const [frecuenciaAhorro, setFrecuenciaAhorro] = useState<string>("");
    
    const [transacciones, setTransacciones] = useState<Transaccion[]>([
        { id: Date.now(), descripcion: "", categoria: "", valor: 0 }
    ]);

    const handleAddTransaction = () => {
        setTransacciones([
            ...transacciones, 
            { id: Date.now(), descripcion: "", categoria: "", valor: 0 }
        ]);
    };

    const handleRemoveTransaction = (id: number) => {
        if(transacciones.length > 1) {
            setTransacciones(transacciones.filter(t => t.id !== id));
        }
    };

    const handleTransactionChange = (id: number, field: keyof Transaccion, value: any) => {
        setTransacciones(transacciones.map(t => 
            t.id === id ? { ...t, [field]: value } : t
        ));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (ingresoMensual === "" || nivelEndeudamiento === "" || !frecuenciaAhorro) return;

        onSubmit({
            ingreso_mensual: Number(ingresoMensual),
            nivel_endeudamiento: Number(nivelEndeudamiento),
            frecuencia_ahorro: frecuenciaAhorro,
            transacciones
        });
    };

    return (
        <section id="analysis-section" className="glass-card max-w-4xl mx-auto p-8 rounded-2xl">
            <h2 className="text-2xl font-semibold mb-6 text-[var(--secondary)]">Ingresa tus datos financieros</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm text-slate-300">Ingreso Mensual (USD)</label>
                        <input 
                            type="number" 
                            required 
                            min="0" 
                            step="0.01" 
                            className="w-full bg-slate-900/60 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                            value={ingresoMensual}
                            onChange={(e) => setIngresoMensual(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="Ej: 4500.00"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm text-slate-300">Endeudamiento (Automatico)</label>
                        <input 
                            type="number" 
                            required 
                            min="0" 
                            max="100" 
                            className="w-full bg-slate-900/60 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                            value={nivelEndeudamiento}
                            onChange={(e) => setNivelEndeudamiento(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="Ej: 25"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-slate-300">Frecuencia de Ahorro (Automatico)</label>
                        <select 
                            required 
                            className="w-full bg-slate-900/60 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all appearance-none"
                            value={frecuenciaAhorro}
                            onChange={(e) => setFrecuenciaAhorro(e.target.value)}
                        >
                            <option value="" disabled>Selecciona una opción</option>
                            <option value="ALTA">Alta</option>
                            <option value="MEDIA">Media</option>
                            <option value="BAJA">Baja</option>
                        </select>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-white">Tus Transacciones</h3>
                        <button 
                            type="button" 
                            onClick={handleAddTransaction}
                            className="text-sm px-4 py-2 rounded-lg border border-[var(--primary)] text-[var(--secondary)] hover:bg-[var(--primary)]/10 transition-colors"
                        >
                            + Añadir Gasto
                        </button>
                    </div>

                    <div className="space-y-4">
                        {transacciones.map((tx, index) => (
                            <div key={tx.id} className="flex flex-col md:flex-row gap-4 items-start md:items-center animate-in slide-in-from-top-2 fade-in duration-300">
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Descripción (Ej: Supermercado)" 
                                    className="flex-1 bg-slate-900/60 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[var(--primary)]"
                                    value={tx.descripcion}
                                    onChange={(e) => handleTransactionChange(tx.id, 'descripcion', e.target.value)}
                                />
                                <select 
                                    required
                                    className="w-full md:w-48 bg-slate-900/60 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[var(--primary)] appearance-none"
                                    value={tx.categoria}
                                    onChange={(e) => handleTransactionChange(tx.id, 'categoria', e.target.value)}
                                >
                                    <option value="" disabled>Categoría</option>
                                    <option value="Alimentación">Alimentación</option>
                                    <option value="Transporte">Transporte</option>
                                    <option value="Salud">Salud</option>
                                    <option value="Vivienda">Vivienda</option>
                                    <option value="Ocio">Ocio</option>
                                    <option value="Educación">Educación</option>
                                    <option value="Servicios">Servicios</option>
                                    <option value="Otras">Otras</option>
                                </select>
                                <input 
                                    type="number" 
                                    required
                                    min="0"
                                    step="0.01"
                                    placeholder="Valor ($)" 
                                    className="w-full md:w-32 bg-slate-900/60 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[var(--primary)]"
                                    value={tx.valor || ""}
                                    onChange={(e) => handleTransactionChange(tx.id, 'valor', Number(e.target.value))}
                                />
                                <button 
                                    type="button" 
                                    onClick={() => handleRemoveTransaction(tx.id)}
                                    className="p-3 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors"
                                    title="Eliminar"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-4 mt-6 rounded-lg font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-[var(--background)] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isLoading ? "Analizando con IA..." : "Generar Reporte con IA"}
                </button>
            </form>
        </section>
    );
}
