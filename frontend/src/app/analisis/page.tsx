"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bot, PlusCircle, Trash2, AlertCircle, BadgeCheck,
  X, Sparkles, WalletCards, ChartNoAxesCombined, UsersRound,
  ChevronDown, ChevronUp, FileDown
} from "lucide-react";
import { sanitizeInput, TransaccionSecuritySchema } from "@/lib/security";
import { API_BASE_URL } from "@/config/api";
import { GlobalHeader, DemoProfile } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { useTheme } from "@/components/ThemeProvider";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Transaccion {
  id: string;
  descripcion: string;
  monto: string;
}

interface ResultadoAnalisis {
  confianza: number;
  endeudamiento: number;
  frecuenciaAhorroText: string;
  frecuenciaAhorroNum: number;
  estado: string;
  mensaje: string;
  totalGastos: number;
  recomendaciones: string[];
  desglose: { descripcion: string; monto: number; porcentaje: number }[];
}

interface Miembro {
  nombre: string;
  linkedin?: string;
  github?: string;
}

export default function Home() {
  const { theme } = useTheme();
  const [ingresoMensual, setIngresoMensual] = useState<string>("");

  const [modoIngresoDatos, setModoIngresoDatos] = useState<'auto' | 'manual'>('auto');
  const [mensajeAdvertencia, setMensajeAdvertencia] = useState<string | null>(null);

  const [endeudamientoManual, setEndeudamientoManual] = useState<string>("");
  const [frecuenciaAhorroManual, setFrecuenciaAhorroManual] = useState<string>("Media");

  const [transacciones, setTransacciones] = useState<Transaccion[]>([
    { id: "1", descripcion: "", monto: "" },
  ]);

  // Guarda la transacción nueva que debe recibir el foco después de crearla.
  const [transaccionParaEnfocar, setTransaccionParaEnfocar] = useState<string | null>(null);
  const nuevaTransaccionRef = useRef<HTMLInputElement | null>(null);

  const [resultado, setResultado] = useState<ResultadoAnalisis | null>(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const [mostrarMiembros, setMostrarMiembros] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);

  const [endeudamientoAuto, setEndeudamientoAuto] = useState<string>("0");
  const [frecuenciaAhorroAuto, setFrecuenciaAhorroAuto] = useState<string>("Media");

  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const storedUsername = localStorage.getItem("finance_username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
    const role = localStorage.getItem("finance_role");
    if (role === "ADMIN") {
      setIsAdmin(true);
    }

    // Restaurar el estado previo de Data Storage / LocalStorage
    try {
      const savedState = localStorage.getItem("finance_active_state");
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.ingresoMensual !== undefined) setIngresoMensual(parsed.ingresoMensual);
        if (parsed.transacciones && parsed.transacciones.length > 0) setTransacciones(parsed.transacciones);
        if (parsed.resultado) setResultado(parsed.resultado);
        if (parsed.modoIngresoDatos) setModoIngresoDatos(parsed.modoIngresoDatos);
        if (parsed.endeudamientoManual) setEndeudamientoManual(parsed.endeudamientoManual);
        if (parsed.frecuenciaAhorroManual) setFrecuenciaAhorroManual(parsed.frecuenciaAhorroManual);
      }
    } catch (e) {
      console.warn("Error recuperando estado de Data Storage:", e);
    }
  }, []);

  // Guardar automáticamente cualquier cambio en las entradas o resultado en Data Storage
  useEffect(() => {
    if (ingresoMensual || (transacciones && transacciones.length > 0) || resultado) {
      try {
        localStorage.setItem(
          "finance_active_state",
          JSON.stringify({
            ingresoMensual,
            transacciones,
            resultado,
            modoIngresoDatos,
            endeudamientoManual,
            frecuenciaAhorroManual
          })
        );
      } catch (e) {
        console.warn("Error guardando estado en Data Storage:", e);
      }
    }
  }, [ingresoMensual, transacciones, resultado, modoIngresoDatos, endeudamientoManual, frecuenciaAhorroManual]);

  const handleLogout = () => {
    localStorage.removeItem("finance_token");
    localStorage.removeItem("finance_username");
    localStorage.removeItem("finance_role");
    localStorage.removeItem("finance_active_state");
    setUsername(null);
    window.location.href = "/login";
  };

  const cargarPerfilDemo = (perfil: DemoProfile) => {
    setIngresoMensual(perfil.ingreso_mensual.toString());

    // Los perfiles Demo proporcionan directamente
    // el nivel de endeudamiento y la frecuencia de ahorro.
    setModoIngresoDatos("manual");
    setEndeudamientoManual(perfil.nivel_endeudamiento.toString());
    setFrecuenciaAhorroManual(perfil.frecuencia_ahorro);

    const nuevasTransacciones: Transaccion[] =
      perfil.transacciones.map((transaccion, index) => ({
        id: `demo-${perfil.id}-${index}-${Date.now()}`,
        descripcion: transaccion.descripcion,
        monto: transaccion.monto.toString(),
      }));

    setTransacciones(nuevasTransacciones);

    // Evitar mostrar el resultado del perfil anterior.
    setResultado(null);
    setMensajeAdvertencia(null);
    setCargando(false);
  };

  useEffect(() => {
    if (modoIngresoDatos === 'auto') {
      const ingreso = parseFloat(ingresoMensual);

      // No consultar al backend si el ingreso mensual
      // no es un valor válido superior a 0.
      if (!ingresoMensual.trim() || isNaN(ingreso) || ingreso <= 0) {
        return;
      }

      const transaccionesValidas = transacciones.filter(
        t => parseFloat(t.monto) > 0
      );

      // No consultar al backend hasta tener al menos un gasto válido.
      if (transaccionesValidas.length === 0) {
        return;
      }

      const transaccionesBackend = transaccionesValidas.map(t => ({
        descripcion: t.descripcion || "Gasto",
        valor: parseFloat(t.monto)
      }));

      const timeoutId = setTimeout(() => {
        const token = localStorage.getItem("finance_token");
        const headers: HeadersInit = { 'Content-Type': 'application/json' };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        fetch(`${API_BASE_URL}/pre-calculo`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            ingreso_mensual: ingreso,
            nivel_endeudamiento: null,
            frecuencia_ahorro: null,
            transacciones: transaccionesBackend
          })
        })
          .then(res => {
            if (!res.ok) {
              throw new Error(`Error HTTP: ${res.status}`);
            }

            return res.json();
          })
          .then(data => {
            if (data.nivel_endeudamiento !== undefined) {
              setEndeudamientoAuto(data.nivel_endeudamiento.toString());
              setFrecuenciaAhorroAuto(data.frecuencia_ahorro);
            }
          })
          .catch(err => console.error("Error pre-calculo:", err));
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [modoIngresoDatos, ingresoMensual, transacciones]);



  const agregarTransaccion = () => {
    // No permitimos crear otra fila mientras exista alguna transacción incompleta.
    const todasCompletas = transacciones.every(
      (t) =>
        t.descripcion.trim() !== "" &&
        t.monto.trim() !== "" &&
        !isNaN(parseFloat(t.monto)) &&
        parseFloat(t.monto) > 0
    );

    if (!todasCompletas) {
      setMensajeAdvertencia(
        "Completa la descripción y el monto de las transacciones antes de añadir otra."
      );
      return;
    }

    // La nueva transacción se coloca al principio de la lista.
    const nuevaTransaccion = {
      id: Date.now().toString(),
      descripcion: "",
      monto: "",
    };

    setTransaccionParaEnfocar(nuevaTransaccion.id);
    setTransacciones([nuevaTransaccion, ...transacciones]);
  };

  // Cuando React termina de renderizar la nueva fila, colocamos el cursor
  // automáticamente en su campo de descripción.
  useEffect(() => {
    if (transaccionParaEnfocar) {
      nuevaTransaccionRef.current?.focus();
      setTransaccionParaEnfocar(null);
    }
  }, [transacciones, transaccionParaEnfocar]);

  const manejarEnterTransaccion = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      agregarTransaccion();
    }
  };

  const eliminarTransaccion = (id: string) => {
    setTransacciones(transacciones.filter((t) => t.id !== id));
  };

  const actualizarTransaccion = (
    id: string,
    campo: "descripcion" | "monto",
    valor: string
  ) => {
    const valorLimpio = campo === "descripcion" ? sanitizeInput(valor) : valor;

    setTransacciones(
      transacciones.map((t) => (t.id === id ? { ...t, [campo]: valorLimpio } : t))
    );
  };

  const preventInvalidKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const [idTransaccion] = useState<string>("256406");

  const generarPDF = async () => {
    const pageEls = document.querySelectorAll<HTMLElement>(".pdf-page");
    if (!pageEls || pageEls.length === 0) return;

    setGenerandoPDF(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      for (let i = 0; i < pageEls.length; i++) {
        const pageEl = pageEls[i];
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          windowWidth: 794
        });

        const imgData = canvas.toDataURL("image/png");

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`Analisis_Financiero_${username || 'MarcoArias'}.pdf`);
    } catch (error) {
      console.error("Error al generar PDF:", error);
    } finally {
      setGenerandoPDF(false);
    }
  };

  const ejecutarAnalisis = async (modoForzado?: any) => {
    setResultado(null);
    setMensajeAdvertencia(null);
    setCargando(true);
    
    const ingreso = parseFloat(ingresoMensual) || 0;
    const modoActual = typeof modoForzado === 'string' ? modoForzado : modoIngresoDatos;
    


    // VALIDACIÓN DE GASTOS
    const hayGastoInvalido = transacciones.some(
      t =>
        !t.monto.trim() ||
        isNaN(parseFloat(t.monto)) ||
        parseFloat(t.monto) <= 0
    );

    if (hayGastoInvalido) {
      setMensajeAdvertencia(
        "Debes ingresar un valor válido superior a 0 en cada gasto."
      );
      setCargando(false);
      return;
    }

    const transaccionesValidas = transacciones.filter(
      t => parseFloat(t.monto) > 0
    );

    if (transaccionesValidas.length === 0) {
      setMensajeAdvertencia(
        "Debes ingresar al menos un gasto con un valor válido superior a 0."
      );
      setCargando(false);
      return;
    }

    const totalGastos = transaccionesValidas.reduce(
      (acc, t) => acc + (parseFloat(t.monto) || 0),
      0
    );

    const transaccionesBackend = transaccionesValidas.map(t => ({
      descripcion: t.descripcion || "Gasto",
      valor: parseFloat(t.monto)
    }));


    let nivelEndeudamiento = null;
    let frecuenciaAhorro = null;

    if (modoActual === 'manual') {
      const end = parseFloat(endeudamientoManual);
      if (isNaN(end) || end < 0) {
        setMensajeAdvertencia("El nivel de endeudamiento debe ser un número válido mayor o igual a 0.");
        setCargando(false);
        return;
      }
      nivelEndeudamiento = end;

      const frec = frecuenciaAhorroManual.trim().toLowerCase();
      if (!["muy alta", "alta", "media", "baja", "nula"].includes(frec)) {
        setMensajeAdvertencia("La frecuencia de ahorro debe ser Muy alta, Alta, Media, Baja o Nula.");
        setCargando(false);
        return;
      }
      frecuenciaAhorro = frecuenciaAhorroManual;
    }

    const datosEntrada = {
      ingreso_mensual: ingreso,
      nivel_endeudamiento: nivelEndeudamiento,
      frecuencia_ahorro: frecuenciaAhorro,
      transacciones: transaccionesBackend
    };

    try {
      const token = localStorage.getItem("finance_token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/analisis-financiero`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(datosEntrada)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const msg = errorData?.error || errorData?.message || `Error en el servidor (${response.status})`;
        setMensajeAdvertencia(msg);
        setCargando(false);
        return;
      }

      const data = await response.json();

      if (data.success === false || data.error) {
        setMensajeAdvertencia(data.error || "Datos financieros inválidos.");
        setCargando(false);
        return;
      }

      // Mapeamos los datos para la UI
      // Nota: asumiendo que el backend ahora nos podría devolver el endeudamiento y ahorro que usó
      // Si el backend no los devuelve en la respuesta actual, calculamos para la gráfica visual de manera ilustrativa
      const endResult = data.nivel_endeudamiento ?? nivelEndeudamiento ?? (modoActual === 'auto' ? parseFloat(endeudamientoAuto) : Math.round((totalGastos / ingreso) * 100));
      const freqTextResult = data.frecuencia_ahorro ?? frecuenciaAhorro ?? (modoActual === 'auto' ? frecuenciaAhorroAuto : "Media");

      let ahorroNum = 50;
      const ahorroLower = freqTextResult.toLowerCase();
      if (ahorroLower.includes("alta") || ahorroLower.includes("alto")) ahorroNum = 80;
      if (ahorroLower.includes("baja") || ahorroLower.includes("bajo") || ahorroLower.includes("nula")) ahorroNum = 20;

      let desglose = [];
      if (data.resumen_gastos && typeof data.resumen_gastos === "object" && Object.keys(data.resumen_gastos).length > 0) {
        desglose = Object.entries(data.resumen_gastos).map(([categoria, monto]) => {
          const montoNum = typeof monto === "number" ? monto : parseFloat(monto as any) || 0;
          const porcentaje = totalGastos > 0 ? (montoNum / totalGastos) * 100 : 0;
          return {
            descripcion: categoria,
            monto: montoNum,
            porcentaje
          };
        });
      } else {
        desglose = transaccionesValidas.map(t => {
          const montoNum = parseFloat(t.monto) || 0;
          const porcentaje = totalGastos > 0 ? (montoNum / totalGastos) * 100 : 0;
          return {
            descripcion: t.descripcion || "Sin nombre",
            monto: montoNum,
            porcentaje
          };
        });
      }

      setResultado({
        confianza: Math.round((data.probabilidad || 0.88) * 100),
        endeudamiento: endResult,
        frecuenciaAhorroText: freqTextResult,
        frecuenciaAhorroNum: ahorroNum,
        estado: data.perfil_financiero || "Desconocido",
        mensaje: "Evaluación de riesgo crediticio y viabilidad financiera calculada mediante nuestro motor algorítmico.",
        totalGastos,
        recomendaciones: data.recomendaciones || [],
        desglose
      });

    } catch (error) {
      console.error(error);
      setMensajeAdvertencia(`Oops! Ocurrió un error al intentar conectarse con el Backend en ${API_BASE_URL}`);
    } finally {
      setCargando(false);
    }
  };

  const miembrosEquipo: Miembro[] = [
    { nombre: "Sonia Moran", linkedin: "https://www.linkedin.com/in/sonia-moran-286717422/", github: "https://github.com/Zonya8" },
    { nombre: "Brayan Camargo", linkedin: "https://www.linkedin.com/in/brayan-camargo-ram%C3%ADrez/", github: "https://github.com/Brayan-Camargo" },
    { nombre: "Gabriel Gil", linkedin: "https://www.linkedin.com/in/gabriel-gil-337a20250/", github: "https://github.com/gilgabriel422-netizen" },
    { nombre: "Armando Tapia", linkedin: "https://www.linkedin.com/in/atapia9/", github: "https://github.com/atapia9" },
    { nombre: "Jesús García", linkedin: "https://www.linkedin.com/in/jesusjgarciam/", github: "https://github.com/Electrocyte96" },
    { nombre: "Ian Osnaya", linkedin: "https://www.linkedin.com/in/ian-osnaya-0a7b71375/", github: "https://github.com/IanOsnaya" },
    { nombre: "Marco Arias", linkedin: "https://www.linkedin.com/in/marco-antonio-arias-mullisaca-b688611ba/", github: "https://github.com/marcomull" },
  ];

  const noSpinnersClass = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  // Colores dinámicos para las métricas según su nivel de riesgo.
  // Confianza alta y ahorro alto representan menor riesgo.
  const getConfidenceColor = (value: number) => {
    if (value >= 80) return "#22c55e";
    if (value >= 60) return "#eab308";
    return "#ef4444";
  };

  // Endeudamiento bajo representa menor riesgo.
  const getDebtColor = (value: number) => {
    if (value <= 30) return "#22c55e";
    if (value <= 60) return "#eab308";
    return "#ef4444";
  };

  const getSavingsColor = (frequency: string) => {
    const value = frequency.toLowerCase();

    if (value.includes("muy alta")) return "#22c55e";
    if (value.includes("alta")) return "#84cc16";
    if (value.includes("media")) return "#eab308";
    if (value.includes("baja")) return "#f97316";
    return "#ef4444";
  };

  // Paleta amplia para diferenciar las transacciones en la barra y la leyenda.
  // Tenemos 30 colores y un fallback circular para que nunca falte un color.
  const expenseColors = [
    "#38BDF8", "#F97316", "#22C55E", "#A855F7", "#F43F5E",
    "#EAB308", "#14B8A6", "#6366F1", "#EC4899", "#84CC16",
    "#06B6D4", "#8B5CF6", "#EF4444", "#F59E0B", "#10B981",
    "#3B82F6", "#D946EF", "#65A30D", "#0EA5E9", "#7C3AED",
    "#FB7185", "#CA8A04", "#059669", "#2563EB", "#C026D3",
    "#4D7C0F", "#0284C7", "#9333EA", "#E11D48", "#B45309",
  ];

  const getExpenseColor = (index: number) =>
    expenseColors[index % expenseColors.length];

  return (
    <div className="h-screen w-screen bg-[var(--brand-bg)] text-[var(--brand-text)] font-sans flex flex-col justify-between selection:bg-[var(--brand-accent)]/30 px-4 py-2 relative overflow-hidden transition-colors duration-300">

      <GlobalHeader
        username={username || ""}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        onSelectDemoProfile={cargarPerfilDemo}
      />

      {/* CONTENEDOR CENTRAL */}
      <div className="w-full max-w-7xl mx-auto my-1 flex-1 flex flex-col justify-center min-h-0">

        {/* BANNER SUPERIOR */}
        <div className={`bg-[var(--brand-banner-bg)] border border-[var(--brand-border)] rounded-t-2xl px-5 py-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center relative shadow-lg flex-shrink-0 transition-colors duration-300`}>
          <div className="z-10">
            <div className={`text-[var(--brand-accent)] text-[9px] font-bold tracking-widest uppercase mb-0.5`}>
              ANÁLISIS FINANCIERO
            </div>
            <h2 className={`group text-sm md:text-lg font-bold flex items-center gap-2 text-[var(--brand-banner-text)]`}>
              <Sparkles size={18} className="text-[var(--brand-accent)] fill-[var(--brand-accent)]/20 stroke-[2.5] transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
              Conoce recomendaciones y tu salud financiera
            </h2>
          </div>

          <div className="z-10 mt-1 sm:mt-0 flex items-center gap-2 bg-[#0B2545]/20 border border-[var(--brand-border)] px-3 py-1 rounded-full">
            <Bot
              size={14}
              strokeWidth={2.5}
              className="text-[var(--brand-accent)] animate-pulse"
            />
            <span className={`text-[11px] font-mono text-[var(--brand-banner-text)] font-semibold`}>
              Análisis personalizado para {username || "Gabriel"}
            </span>
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL */}
        <main className={`bg-[var(--brand-card)] rounded-b-2xl p-4 md:p-5 grid grid-cols-1 lg:grid-cols-2 gap-5 shadow-2xl border border-[var(--brand-border)] flex-1 min-h-0 overflow-hidden transition-colors duration-300`}>

          {/* COLUMNA IZQUIERDA (ENTRADA) */}
          <div className="flex flex-col gap-2 min-h-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              <WalletCards
                size={15}
                strokeWidth={2.2}
                className="text-[var(--brand-accent)] flex-shrink-0 transition-transform duration-200 hover:scale-110"
              />
              <h3 className={`text-[var(--brand-muted)] font-bold tracking-widest text-[11px] uppercase`}>Entrada</h3>
            </div>

            <div className={`bg-[var(--brand-bg)] border border-[var(--brand-border)] rounded-xl p-3.5 flex flex-col justify-between gap-3 flex-1 min-h-0 transition-colors duration-300`}>
              <div className="flex-1 min-h-0 flex flex-col gap-3">

                <div className="flex flex-col gap-1.5">
                  
                  {/* FILA SUPERIOR: Ingreso Mensual y Toggle IA */}
                  <div className="flex flex-col sm:flex-row gap-3 items-end">
                    
                    {/* Ingreso Mensual (Ocupa el 60% del espacio) */}
                    <div className="w-full sm:w-3/5">
                      <label className={`block text-xs font-semibold text-[var(--brand-muted)] mb-1`}>
                        Ingreso mensual ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={ingresoMensual}
                        onChange={(e) => setIngresoMensual(e.target.value)}
                        onKeyDown={preventInvalidKeys}
                        placeholder="Ej. 4500"
                        className={`w-full bg-[var(--brand-bg)] border border-[var(--brand-border)] rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--brand-text)] focus:outline-none focus:border-[var(--brand-accent)] ${noSpinnersClass}`}
                      />
                    </div>

                    {/* Interruptor (Ocupa el 40% del espacio) */}
                    <div className="w-full sm:w-2/5 flex items-center justify-between bg-[var(--brand-bg)] border border-[var(--brand-border)] rounded-lg px-2.5 h-[32px] transition-colors duration-300">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Bot size={14} className={`flex-shrink-0 text-[var(--brand-accent)] ${modoIngresoDatos === 'auto' ? 'animate-pulse' : 'opacity-50'}`} />
                        <span className="text-[9.5px] font-bold tracking-wide text-[var(--brand-muted)] whitespace-nowrap truncate">
                          Generado por FINANCEIA
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-2">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={modoIngresoDatos === 'auto'}
                          onChange={(e) => {
                            const nuevoModo = e.target.checked ? 'auto' : 'manual';
                            setModoIngresoDatos(nuevoModo);
                            if (nuevoModo === 'auto') {
                              setEndeudamientoManual("");
                              setFrecuenciaAhorroManual("Media");
                            }
                          }}
                        />
                        <div className="w-7 h-3.5 bg-gray-300/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-[var(--brand-accent)]"></div>
                      </label>
                    </div>
                  </div>

                  {/* FILA INFERIOR: Endeudamiento y Ahorro */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className={modoIngresoDatos === 'auto' ? "opacity-50 pointer-events-none transition-opacity duration-300" : "transition-opacity duration-300"}>
                      <label className={`block text-[11px] font-semibold text-[var(--brand-muted)] mb-1 whitespace-nowrap`}>
                        Nivel de endeudamiento (%)
                      </label>
                      <input
                        type={modoIngresoDatos === 'auto' ? "text" : "number"}
                        min="0"
                        value={modoIngresoDatos === 'auto' ? `${endeudamientoAuto}% (Automático)` : endeudamientoManual}
                        onChange={(e) => setEndeudamientoManual(e.target.value)}
                        onKeyDown={modoIngresoDatos === 'manual' ? preventInvalidKeys : undefined}
                        placeholder="Ej. 25"
                        readOnly={modoIngresoDatos !== 'manual'}
                        className={`w-full bg-[var(--brand-bg)] border border-[var(--brand-border)] rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--brand-text)] focus:outline-none focus:border-[var(--brand-accent)] ${noSpinnersClass}`}
                      />
                    </div>

                    <div className={modoIngresoDatos === 'auto' ? "opacity-50 pointer-events-none transition-opacity duration-300" : "transition-opacity duration-300"}>
                      <label className={`block text-[11px] font-semibold text-[var(--brand-muted)] mb-1 whitespace-nowrap`}>
                        Frecuencia de ahorro
                      </label>
                      {modoIngresoDatos === 'manual' ? (
                        <select
                          value={frecuenciaAhorroManual}
                          onChange={(e) => setFrecuenciaAhorroManual(e.target.value)}
                          className={`w-full bg-[var(--brand-bg)] border border-[var(--brand-border)] rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--brand-text)] focus:outline-none focus:border-[var(--brand-accent)] appearance-none cursor-pointer`}
                        >
                          <option value="Muy alta">Muy alta</option>
                          <option value="Alta">Alta</option>
                          <option value="Media">Media</option>
                          <option value="Baja">Baja</option>
                          <option value="Nula">Muy baja / Nula</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={`${frecuenciaAhorroAuto} (Automático)`}
                          readOnly
                          className={`w-full bg-[var(--brand-bg)] border border-[var(--brand-border)] rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--brand-text)] focus:outline-none focus:border-[var(--brand-accent)] cursor-pointer`}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Transacciones Recientes */}
                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className={`text-xs font-semibold text-[var(--brand-muted)]`}>
                      Transacciones recientes
                    </label>
                    <button
                      onClick={agregarTransaccion}
                      type="button"
                      className="text-[var(--brand-accent)] hover:underline text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <PlusCircle size={13} /> añadir
                    </button>
                  </div>

                  <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-1">
                    {transacciones.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 group">
                        <input
                          ref={
                            item.id === transaccionParaEnfocar
                              ? nuevaTransaccionRef
                              : undefined
                          }
                          type="text"
                          placeholder="Descripción"
                          value={item.descripcion}
                          onChange={(e) =>
                            actualizarTransaccion(item.id, "descripcion", e.target.value)
                          }
                          onKeyDown={manejarEnterTransaccion}
                          className={`flex-grow bg-[var(--brand-bg)] border border-[var(--brand-border)] rounded-lg px-2.5 py-1 text-xs text-[var(--brand-text)] focus:outline-none focus:border-[var(--brand-accent)]`}
                        />
                        <div className="relative w-24 flex-shrink-0">
                          <span className="absolute left-2 top-1 text-xs opacity-50">$</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={item.monto}
                            onChange={(e) =>
                              actualizarTransaccion(item.id, "monto", e.target.value)
                            }
                            onKeyDown={(e) => {
                              preventInvalidKeys(e);
                              manejarEnterTransaccion(e);
                            }}
                            className={`w-full bg-[var(--brand-bg)] border border-[var(--brand-border)] rounded-lg pl-4 pr-1.5 py-1 text-xs text-[var(--brand-text)] focus:outline-none focus:border-[var(--brand-accent)] ${noSpinnersClass}`}
                          />
                        </div>
                        {transacciones.length > 1 && (
                          <button
                            onClick={() => eliminarTransaccion(item.id)}
                            className="opacity-40 hover:opacity-100 p-0.5 transition-opacity"
                          >
                            <Trash2 size={13} className="transition-transform duration-200 group-hover:scale-110" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={ejecutarAnalisis}
                disabled={cargando}
                className="w-full bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-[var(--brand-bg)] hover:text-[#EEF4ED] font-bold py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center text-xs flex-shrink-0"
              >
                {cargando ? "Analizando..." : "Ejecutar análisis"}
              </button>
            </div>
          </div>

          {/* COLUMNA DERECHA (RESULTADO) */}
          <div className={`flex flex-col gap-2 lg:pl-5 lg:border-l border-[var(--brand-border)] min-h-0`}>
            <div className="flex items-center gap-2 flex-shrink-0">
              <ChartNoAxesCombined
                size={15}
                strokeWidth={2.2}
                className="text-[var(--brand-accent)] flex-shrink-0 transition-transform duration-200 hover:scale-110"
              />
              <h3 className={`text-[var(--brand-muted)] font-bold tracking-widest text-[11px] uppercase`}>Resultado</h3>
            </div>

            {cargando ? (
              <div className={`flex-1 border border-dashed border-[var(--brand-border)] rounded-xl flex flex-col items-center justify-center p-6 text-center`}>
                <div className="w-8 h-8 border-4 border-[var(--brand-accent)] border-t-transparent rounded-full animate-spin mb-3"></div>
                <span className={`text-[var(--brand-muted)] text-xs font-medium animate-pulse`}>
                  Analizando datos financieros...
                </span>
              </div>
            ) : !resultado ? (
              <div className={`flex-1 border border-dashed border-[var(--brand-border)] rounded-xl flex flex-col items-center justify-center p-6 text-center`}>
                <AlertCircle size={26} className="opacity-30 mb-2 transition-transform duration-300 hover:scale-110" />
                <span className={`text-[var(--brand-muted)] text-xs font-medium`}>
                  Haz clic en &quot;Ejecutar análisis&quot; para generar los resultados
                </span>
              </div>
            ) : (
              <div className={`bg-[var(--brand-bg)] border border-[var(--brand-border)] rounded-xl p-3 flex flex-col justify-between gap-2.5 flex-1 min-h-0 overflow-hidden transition-colors duration-300`}>

                {/* Diagnóstico superior (ESTÁTICO) */}
                <div className="flex flex-col sm:flex-row items-center gap-4 flex-shrink-0 py-1">
                  {/* Círculos */}
                  <div className="flex items-center justify-center sm:justify-start gap-3 flex-shrink-0">
                    <div
                      className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full border-[2px] md:border-[3px] bg-[var(--brand-card)] shadow-sm"
                      style={{ borderColor: getConfidenceColor(resultado.confianza) }}
                    >
                      <div className="text-center">
                        <span className="text-base md:text-lg font-bold block leading-none text-[var(--brand-text)]">
                          {resultado.confianza}%
                        </span>
                        <span className="text-[9px] md:text-[10px] opacity-70 block mt-1 text-[var(--brand-text)]">Confianza</span>
                      </div>
                    </div>

                    <div
                      className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full border-[2px] md:border-[3px] bg-[var(--brand-card)] shadow-sm"
                      style={{ borderColor: getDebtColor(resultado.endeudamiento) }}
                    >
                      <div className="text-center">
                        <span className="text-base md:text-lg font-bold block leading-none text-[var(--brand-text)]">
                          {resultado.endeudamiento}%
                        </span>
                        <span className="text-[9px] md:text-[10px] opacity-70 block mt-1 text-[var(--brand-text)]">Endeudam.</span>
                      </div>
                    </div>

                    <div
                      className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full border-[2px] md:border-[3px] bg-[var(--brand-card)] shadow-sm"
                      style={{ borderColor: getSavingsColor(resultado.frecuenciaAhorroText) }}
                    >
                      <div className="text-center">
                        <span className="text-xs md:text-sm font-bold block leading-none truncate max-w-[50px] md:max-w-[60px] text-[var(--brand-text)]">
                          {resultado.frecuenciaAhorroText}
                        </span>
                        <span className="text-[9px] md:text-[10px] opacity-70 block mt-1 text-[var(--brand-text)]">Ahorro</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <BadgeCheck size={16} className="text-[var(--brand-accent)] flex-shrink-0 transition-transform duration-200 hover:scale-110" />
                      <span className="text-sm font-bold truncate">Estado: {resultado.estado}</span>
                    </div>
                    <p className="text-[var(--brand-muted)] text-[11px] md:text-xs leading-relaxed line-clamp-3">
                      {resultado.mensaje}
                    </p>
                  </div>
                </div>

                {/* BARRA DE PROGRESO / RESUMEN DE GASTOS (ESTÁTICO) */}
                <div className="space-y-1.5 flex-shrink-0 border-t border-[var(--brand-border)] pt-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-[var(--brand-muted)]">Resumen de gastos</span>
                    <span>${resultado.totalGastos}</span>
                  </div>

                  {/* Barra seccionada */}
                  <div
                    className={`w-full h-3 rounded-full overflow-hidden flex bg-[var(--brand-accent-hover)] shadow-inner`}
                    role="img"
                    aria-label="Barra de distribución de gastos"
                  >
                    {(resultado.desglose ?? []).map((item, idx) => (
                      <div
                        key={`${item.descripcion}-${idx}`}
                        style={{
                          width: `${Math.max(item.porcentaje, 0)}%`,
                          minWidth: item.porcentaje > 0 ? "2px" : "0px",
                          backgroundColor: getExpenseColor(idx),
                        }}
                        className="h-full transition-all duration-500 hover:brightness-125"
                        title={`${item.descripcion}: $${item.monto} (${item.porcentaje.toFixed(1)}%)`}
                      />
                    ))}
                  </div>

                  {/* Leyenda de transacciones debajo de la barra */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
                    {(resultado.desglose ?? []).map((item, idx) => (
                      <div
                        key={`${item.descripcion}-${idx}`}
                        className="flex items-center gap-1 text-[10.5px]"
                        title={`${item.descripcion}: $${item.monto} (${item.porcentaje.toFixed(1)}%)`}
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getExpenseColor(idx) }}
                        ></span>
                        <span className="text-[var(--brand-muted)]">{item.descripcion}:</span>
                        <span className="font-bold">${item.monto}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recomendaciones de IA (ÚNICA SECCIÓN CON SCROLL) */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-1 border-t border-[var(--brand-border)] pt-2 space-y-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]`}>
                    Recomendaciones de IA:
                  </span>
                  <ul className="space-y-2 mt-2">
                    {resultado.recomendaciones.map((rec, index) => (
                      <li
                        key={index}
                        className="text-sm flex items-start gap-2 text-[var(--brand-muted)]"
                      >
                        <span className="text-[var(--brand-accent)] font-bold text-base leading-none mt-0.5">
                          •
                        </span>
                        <span className="leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* BOTÓN DESCARGAR PDF (ESTÁTICO EN EL PIE) */}
                <div className="pt-2 border-t border-[var(--brand-border)] flex justify-end flex-shrink-0">
                  <button
                    onClick={generarPDF}
                    disabled={generandoPDF}
                    className="group flex items-center gap-2 bg-[var(--brand-accent)] text-[var(--brand-bg)] px-3 py-1.5 rounded-lg font-bold text-xs hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    <FileDown size={14} className="transition-transform duration-200 group-hover:translate-y-0.5" />
                    {generandoPDF ? "Generando..." : "Descargar Reporte PDF"}
                  </button>
                </div>

              </div>
            )}
          </div>

        </main>
      </div>

      {/* FOOTER EQUIPO */}
      <GlobalFooter>
        <button
          onClick={() => setMostrarMiembros(!mostrarMiembros)}
          className="group flex items-center gap-1 text-[var(--brand-accent)] hover:underline font-bold transition-colors"
        >
          <UsersRound size={14} className="transition-transform duration-200 group-hover:scale-110" />
          <span>Ver Miembros del Equipo</span>
          {mostrarMiembros ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </GlobalFooter>

      {/* DESPLEGABLE DE MIEMBROS */}
      {mostrarMiembros && (
        <div className={`w-full max-w-7xl mx-auto mb-2 bg-[var(--brand-card)] border border-[var(--brand-border)] rounded-xl p-3 shadow-xl transition-colors duration-300`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {miembrosEquipo.map((miembro, idx) => (
              <div key={idx} className="bg-[var(--brand-card)] p-3 rounded-xl border border-[var(--brand-border)] flex flex-col justify-between shadow-lg hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)] hover:border-[var(--brand-accent)] transition-all duration-300 group transform hover:-translate-y-1">
                <span className="font-bold text-[11px] truncate text-[var(--brand-text)] group-hover:text-[var(--brand-accent)] transition-colors">{miembro.nombre}</span>
                <div className="flex items-center gap-2 mt-2">
                  {miembro.linkedin && (
                    <a href={miembro.linkedin} target="_blank" rel="noopener noreferrer" className="text-[var(--brand-accent)] hover:text-[var(--brand-text)] transition-transform duration-300 hover:scale-110" title="LinkedIn">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    </a>
                  )}
                  {miembro.github && (
                    <a href={miembro.github} target="_blank" rel="noopener noreferrer" className="text-[var(--brand-accent)] hover:text-[var(--brand-text)] transition-transform duration-300 hover:scale-110" title="GitHub">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE ADVERTENCIA (VALIDACION) */}
      {mensajeAdvertencia && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className={`bg-[var(--brand-card)] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative text-center`}>
            <button
              onClick={() => setMensajeAdvertencia(null)}
              className="absolute top-4 right-4 opacity-50 hover:opacity-100 hover:scale-110 transition-all duration-200"
            >
              <X size={16} />
            </button>
            <AlertCircle size={40} className="mx-auto mb-4 text-red-400 transition-transform duration-300 hover:scale-110" />
            <h3 className="text-lg font-bold mb-2">
              Validación Financiera
            </h3>
            <p className={`text-xs text-[var(--brand-muted)] mb-6`}>
              {mensajeAdvertencia}
            </p>
            <button
              onClick={() => setMensajeAdvertencia(null)}
              className="w-full bg-[var(--brand-accent)] text-[var(--brand-bg)] hover:opacity-90 font-bold py-2.5 rounded-lg transition-all shadow-md text-sm"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* HIDDEN PDF TEMPLATES (FLUJO CONTINUO Y PROPORCIONADO) */}
      {resultado && (() => {
        const desglose = resultado.desglose || [];
        const recs = resultado.recomendaciones || [];

        // Helper para renderizar el Header de cada hoja
        const renderPDFHeader = (pageNum?: number, totalPages?: number) => (
          <div className="w-full bg-white pb-3 border-b-4 border-[#1e3a8a] mb-4">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-extrabold text-[#1e3a8a] tracking-tight leading-none mb-1">FINANCE AI</h1>
                <p className="text-[11px] font-semibold text-[#64748b] uppercase tracking-widest">Reporte Analítico Empresarial</p>
              </div>
              <div className="text-right text-[11px] text-[#64748b] font-medium leading-tight">
                <p>Generado el: {new Date().toLocaleDateString('es-ES')}</p>
                <p>Usuario: <span className="font-bold text-[#1e293b]">{username || 'MarcoArias'}</span></p>
                <p>ID Transacción: #{idTransaccion}</p>
                {totalPages && totalPages > 1 && pageNum && (
                  <p className="text-[10px] text-[#2563eb] font-bold mt-0.5">Página {pageNum} de {totalPages}</p>
                )}
              </div>
            </div>
          </div>
        );

        // Helper para renderizar el Footer estático en cada hoja
        const renderPDFFooter = () => (
          <div className="w-full bg-white relative pt-3 pb-6 box-border mt-auto">
            <div className="border-t border-[#e2e8f0] pt-2 flex justify-between items-center text-[11px] text-[#94a3b8] font-medium mb-3">
              <p>Documento hecho con cariño para ayudarte a mejorar tus finanzas.</p>
              <p className="flex items-center gap-1.5 text-[#64748b]">
                <Sparkles size={12} className="text-[#3b82f6]" /> G9 LATAM Team 38
              </p>
            </div>
            <div className="h-4 w-[calc(100%+4rem)] bg-[#1e3a8a] absolute bottom-0 -ml-8"></div>
          </div>
        );

        // Capacidad dinámica de sugerencias en la Página 1 para llenarla al 100% sin dejar huecos
        const recsEnPag1Count = Math.max(1, 6 - Math.max(0, Math.floor((desglose.length - 5) * 0.8)));
        const recsPag1 = recs.slice(0, recsEnPag1Count);
        const recsRestantes = recs.slice(recsEnPag1Count);

        const esUnaSolaPagina = recsRestantes.length === 0;

        // Si sobran sugerencias, se dividen en páginas de hasta 14 por hoja
        const chunkSizePag2 = 14;
        const chunksRestantes: string[][] = [];
        for (let i = 0; i < recsRestantes.length; i += chunkSizePag2) {
          chunksRestantes.push(recsRestantes.slice(i, i + chunkSizePag2));
        }

        const totalPages = esUnaSolaPagina ? 1 : 1 + chunksRestantes.length;

        return (
          <div className="absolute top-[-9999px] left-[-9999px] pointer-events-none space-y-10">
            {/* PÁGINA 1: Resumen, Diagnóstico, Desglose y Primeras Sugerencias (100% LLENA) */}
            <div
              className="pdf-page bg-[#ffffff] text-[#0f172a] font-sans p-8 box-border flex flex-col justify-between overflow-hidden"
              style={{ width: '794px', height: '1123px', maxHeight: '1123px', boxSizing: 'border-box' }}
            >
              <div>
                {renderPDFHeader(1, totalPages)}

                <div className="w-full bg-white space-y-3.5">
                  {/* 1. Resumen Ejecutivo */}
                  <div>
                    <h2 className="text-sm font-bold text-[#1e3a8a] mb-2 border-l-4 border-[#2563eb] pl-2">Resumen Ejecutivo</h2>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-[#f8fafc] p-2.5 rounded-lg border border-[#e2e8f0]">
                        <p className="text-[10px] text-[#64748b] font-bold uppercase mb-0.5">Ingresos Declarados</p>
                        <p className="text-lg font-black text-[#1e293b]">${parseFloat(ingresoMensual || "0").toLocaleString()}</p>
                      </div>
                      <div className="bg-[#f8fafc] p-2.5 rounded-lg border border-[#e2e8f0]">
                        <p className="text-[10px] text-[#64748b] font-bold uppercase mb-0.5">Gastos Identificados</p>
                        <p className="text-lg font-black text-[#1e293b]">${resultado.totalGastos.toLocaleString()}</p>
                      </div>
                      <div className="bg-[#eff6ff] p-2.5 rounded-lg border border-[#bfdbfe]">
                        <p className="text-[10px] text-[#2563eb] font-bold uppercase mb-0.5">Balance / Flujo</p>
                        <p className="text-lg font-black text-[#1e3a8a]">${(parseFloat(ingresoMensual || "0") - resultado.totalGastos).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Diagnóstico Financiero */}
                  <div>
                    <h2 className="text-sm font-bold text-[#1e3a8a] mb-2 border-l-4 border-[#2563eb] pl-2">Diagnóstico Financiero</h2>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="col-span-2 bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0] flex flex-col justify-center">
                        <p className="text-[10px] text-[#64748b] font-bold uppercase mb-0.5">Estado de Salud</p>
                        <p className="text-sm font-bold text-[#1e293b] leading-tight">{resultado.estado}</p>
                        <p className="text-[10.5px] text-[#475569] mt-1 leading-normal">{resultado.mensaje}</p>
                      </div>

                      <div className="text-center bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0] flex flex-col items-center justify-center">
                        <p className="text-[10px] text-[#64748b] font-bold uppercase mb-0.5">Endeudamiento</p>
                        <span className="text-xl font-black text-[#e11d48] leading-tight">{resultado.endeudamiento}%</span>
                      </div>

                      <div className="text-center bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0] flex flex-col items-center justify-center">
                        <p className="text-[10px] text-[#64748b] font-bold uppercase mb-0.5">Capacidad Ahorro</p>
                        <span className="text-lg font-black text-[#059669] leading-tight">{resultado.frecuenciaAhorroText}</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Desglose de Movimientos */}
                  <div>
                    <h2 className="text-sm font-bold text-[#1e3a8a] mb-1.5 border-l-4 border-[#2563eb] pl-2">Desglose de Movimientos</h2>
                    <div className="overflow-hidden rounded-lg border border-[#e2e8f0]">
                      <table className="w-full text-left text-xs text-[#475569]">
                        <thead className="bg-[#f1f5f9] text-[10px] uppercase font-bold text-[#334155]">
                          <tr>
                            <th className="px-3 py-1.5 border-b border-[#e2e8f0]">Concepto</th>
                            <th className="px-3 py-1.5 border-b border-[#e2e8f0] text-right">Monto</th>
                            <th className="px-3 py-1.5 border-b border-[#e2e8f0] text-right">Impacto (%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f1f5f9]">
                          {desglose.map((item, idx) => (
                            <tr key={idx} className="bg-[#ffffff]">
                              <td className="px-3 py-1.5 font-medium text-[#1e293b]">{item.descripcion}</td>
                              <td className="px-3 py-1.5 text-right font-bold">${item.monto.toLocaleString()}</td>
                              <td className="px-3 py-1.5 text-right font-bold text-[#475569] text-xs">
                                {item.porcentaje.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 4. Plan de Acción / Sugerencias IA (Inicia en Página 1 sin dejar huecos) */}
                  <div>
                    <h2 className="text-sm font-bold text-[#1e3a8a] mb-2 border-l-4 border-[#2563eb] pl-2">
                      Plan de Acción / Sugerencias IA {!esUnaSolaPagina ? `(Puntos 1 al ${recsPag1.length})` : ''}
                    </h2>
                    <div className="space-y-2">
                      {recsPag1.map((rec, index) => (
                        <div
                          key={index}
                          className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 flex items-start gap-2.5 shadow-xs"
                        >
                          <span className="text-[#1e3a8a] font-black text-sm shrink-0 min-w-[20px]">
                            {index + 1}.
                          </span>
                          <p className="text-[#1e1b4b] text-xs font-medium leading-relaxed flex-1">
                            {rec}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {renderPDFFooter()}
            </div>

            {/* PÁGINAS 2+: Continuación de Sugerencias IA (Llenas y bien estructuradas) */}
            {chunksRestantes.map((chunk, chunkIdx) => {
              const pageNumber = 2 + chunkIdx;
              const startIndex = recsPag1.length + chunkIdx * chunkSizePag2;

              return (
                <div
                  key={chunkIdx}
                  className="pdf-page bg-[#ffffff] text-[#0f172a] font-sans p-8 box-border flex flex-col justify-between overflow-hidden"
                  style={{ width: '794px', height: '1123px', maxHeight: '1123px', boxSizing: 'border-box' }}
                >
                  <div>
                    {renderPDFHeader(pageNumber, totalPages)}

                    <div className="w-full bg-white space-y-3.5">
                      <h2 className="text-base font-bold text-[#1e3a8a] mb-3 border-l-4 border-[#2563eb] pl-3">
                        Plan de Acción / Sugerencias IA (Continuación)
                      </h2>
                      <div className="space-y-2.5">
                        {chunk.map((rec, index) => (
                          <div
                            key={index}
                            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3.5 py-2.5 flex items-start gap-3 shadow-xs"
                          >
                            <span className="text-[#1e3a8a] font-black text-sm shrink-0 min-w-[24px] mt-0.5">
                              {startIndex + index + 1}.
                            </span>
                            <p className="text-[#1e1b4b] text-xs font-medium leading-relaxed flex-1">
                              {rec}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Tarjeta de Cierre Estratégico en la última hoja para equilibrar el espacio */}
                      {pageNumber === totalPages && (
                        <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-4 mt-6 shadow-xs">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Sparkles size={16} className="text-[#2563eb]" />
                            <h3 className="text-xs font-bold text-[#1e3a8a] uppercase tracking-wider">
                              Recomendación Estratégica Final
                            </h3>
                          </div>
                          <p className="text-xs text-[#1e293b] leading-relaxed">
                            Implementar estas sugerencias de forma progresiva te ayudará a controlar los gastos por categoría, reducir el endeudamiento e incrementar tu capacidad de ahorro mensual de manera sostenible.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {renderPDFFooter()}
                </div>
              );
            })}
          </div>
        );
      })()}

    </div>
  );
}