import { AnalisisResponse } from "../types/finance";

interface ResultsDashboardProps {
    data: AnalisisResponse;
    onReset: () => void;
}

export default function ResultsDashboard({ data, onReset }: ResultsDashboardProps) {
    
    // Calcular el máximo para las barras
    const maxVal = Math.max(...Object.values(data.resumen_gastos), 0);

    const isHealthy = data.perfil_financiero.toLowerCase().includes("saludable");
    const isRisk = data.perfil_financiero.toLowerCase().includes("riesgo");
    
    const profileColor = isHealthy ? "text-emerald-400" : isRisk ? "text-rose-500" : "text-amber-400";
    const profileBg = isHealthy ? "bg-emerald-500/10 border-emerald-500/20" : isRisk ? "bg-rose-500/10 border-rose-500/20" : "bg-amber-500/10 border-amber-500/20";

    return (
        <section className="glass-card max-w-5xl mx-auto p-8 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-semibold mb-8 text-[var(--secondary)]">Tu Perfil Financiero</h2>
            
            <div className={`flex items-center gap-6 p-6 rounded-xl border mb-10 ${profileBg}`}>
                <span className="text-5xl">📊</span>
                <div>
                    <h3 className="text-xl text-slate-200">
                        Clasificación: <span className={`font-bold text-2xl ml-2 ${profileColor}`}>{data.perfil_financiero}</span>
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        Precisión del modelo: <span className="font-medium text-white">{(data.probabilidad * 100).toFixed(1)}%</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Resumen de Gastos */}
                <div>
                    <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                        <span>💰</span> Resumen de Gastos
                    </h3>
                    <div className="space-y-5">
                        {Object.entries(data.resumen_gastos).map(([cat, val]) => {
                            const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                            return (
                                <div key={cat}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-300">{cat}</span>
                                        <span className="font-medium text-white">${val.toFixed(2)}</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-[var(--secondary)] to-[var(--primary)] rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recomendaciones */}
                <div>
                    <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                        <span>💡</span> Finance-Babel
                    </h3>
                    <ul className="space-y-4">
                        {data.recomendaciones.map((rec, idx) => {
                            const isAlert = rec.toLowerCase().includes('alerta') || rec.toLowerCase().includes('riesgo');
                            const isDanger = rec.toLowerCase().includes('supera') || rec.toLowerCase().includes('reducir');
                            
                            let borderClass = "border-[var(--secondary)]";
                            if(isAlert) borderClass = "border-amber-500";
                            if(isDanger) borderClass = "border-rose-500";

                            return (
                                <li key={idx} className={`p-4 bg-white/5 border-l-4 ${borderClass} rounded-r-lg text-sm text-slate-200 shadow-sm`}>
                                    {rec}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>

            <div className="mt-12 text-center border-t border-white/10 pt-8">
                <button 
                    onClick={onReset}
                    className="px-6 py-2 rounded-lg border border-[var(--primary)] text-[var(--secondary)] hover:bg-[var(--primary)]/10 transition-colors"
                >
                    Hacer nuevo análisis
                </button>
            </div>
        </section>
    );
}
