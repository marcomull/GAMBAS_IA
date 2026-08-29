"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Sun,
  Moon,
  LogOut,
  Shield,
  Zap,
  ChevronDown,
  AlertTriangle,
  Eye,
  CircleCheck,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface DemoProfile {
  id: string;
  nombre: string;
  titulo: string;
  historia: string;
  ingreso_mensual: number;
  nivel_endeudamiento: number;
  frecuencia_ahorro: string;
  transacciones: {
    descripcion: string;
    monto: number;
  }[];
}

import perfilEnRiesgo from "@/data/perfiles-demo/perfil-en-riesgo.json";
import perfilEnObservacion from "@/data/perfiles-demo/perfil-en-observacion.json";
import perfilFinanzasSanas from "@/data/perfiles-demo/perfil-finanzas-sanas.json";

interface GlobalHeaderProps {
  username?: string | null;
  onLogout?: () => void;
  isAdmin?: boolean;
  onSelectDemoProfile?: (profile: DemoProfile) => void;
}

const perfilesDemo: DemoProfile[] = [
  perfilEnRiesgo,
  perfilEnObservacion,
  perfilFinanzasSanas,
];

export function GlobalHeader({
  username,
  onLogout,
  isAdmin,
  onSelectDemoProfile,
}: GlobalHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const [mostrarPerfiles, setMostrarPerfiles] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const esUsuarioDemo =
    username?.trim().toLowerCase() === "alurademo";

  useEffect(() => {
    const manejarClickFuera = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setMostrarPerfiles(false);
      }
    };

    document.addEventListener("mousedown", manejarClickFuera);

    return () => {
      document.removeEventListener("mousedown", manejarClickFuera);
    };
  }, []);

  const seleccionarPerfil = (perfil: DemoProfile) => {
    setMostrarPerfiles(false);

    if (onSelectDemoProfile) {
      onSelectDemoProfile(perfil);
    }
  };

  return (
    <header className="flex justify-between items-center px-4 md:px-6 py-3 max-w-7xl mx-auto w-full flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="bg-[var(--brand-accent)] p-2 rounded-xl shadow-md flex items-center justify-center text-[var(--brand-bg)] shrink-0">
          <Bot size={26} strokeWidth={2.5} />
        </div>

        <div className="flex flex-col justify-center">
          <h1 className="text-xl font-extrabold tracking-tight leading-none text-[var(--brand-text)]">
            Finance{" "}
            <span className="text-[var(--brand-accent)]">
              IA
            </span>
          </h1>

          <p className="text-[var(--brand-muted)] text-[10px] md:text-xs font-medium hidden sm:block mt-1">
            Conocer tus finanzas puede ser la diferencia entre tu nueva compra o tu nueva deuda.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-4">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 bg-[var(--brand-accent)] text-[var(--brand-bg)] text-xs font-bold px-3 py-1.5 rounded-full shadow-sm hover:bg-[var(--brand-accent-hover)] transition-colors"
        >
          {theme === "dark" ? (
            <Sun size={14} />
          ) : (
            <Moon size={14} />
          )}

          <span className="hidden sm:inline">
            {theme === "dark" ? "Claro" : "Oscuro"}
          </span>
        </button>

        {username ? (
          <div className="flex items-center gap-2">
            {esUsuarioDemo && (
              <div
                ref={dropdownRef}
                className="relative"
              >
                <button
                  type="button"
                  onClick={() =>
                    setMostrarPerfiles((prev) => !prev)
                  }
                  className="flex items-center gap-1.5 bg-[var(--brand-card)] border border-[var(--brand-accent)] text-[var(--brand-text)] hover:bg-[var(--brand-accent)]/10 text-[11px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
                  title="Cargar perfil Demo"
                  aria-expanded={mostrarPerfiles}
                  aria-haspopup="menu"
                >
                  <Zap
                    size={13}
                    className="text-[var(--brand-accent)]"
                  />

                  <span className="hidden sm:inline">
                    Perfiles Demo
                  </span>

                  <ChevronDown
                    size={13}
                    className={`transition-transform ${
                      mostrarPerfiles ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {mostrarPerfiles && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--brand-card)] border border-[var(--brand-border)] rounded-xl shadow-2xl z-[100] overflow-hidden">
                    <div className="px-4 py-3 border-b border-[var(--brand-border)]">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">
                        Perfiles de demostración
                      </p>

                      <p className="text-[10px] text-[var(--brand-muted)] mt-1">
                        Selecciona un perfil para cargar sus datos automáticamente.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        seleccionarPerfil(perfilesDemo[0])
                      }
                      className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-red-500/10 transition-colors border-b border-[var(--brand-border)]"
                      role="menuitem"
                    >
                      <AlertTriangle
                        size={19}
                        className="text-red-500 mt-0.5 shrink-0"
                      />

                      <div>
                        <p className="text-xs font-bold text-[var(--brand-text)]">
                          Carlos
                        </p>

                        <p className="text-[10px] text-[var(--brand-muted)] mt-1">
                          Ingreso: $10,000
                        </p>

                        <p className="text-[10px] text-[var(--brand-muted)]">
                          Endeudamiento: 75%
                        </p>

                        <p className="text-[10px] text-[var(--brand-muted)]">
                          Ahorro: Bajo
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        seleccionarPerfil(perfilesDemo[1])
                      }
                      className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-yellow-500/10 transition-colors border-b border-[var(--brand-border)]"
                      role="menuitem"
                    >
                      <Eye
                        size={19}
                        className="text-yellow-500 mt-0.5 shrink-0"
                      />

                      <div>
                        <p className="text-xs font-bold text-[var(--brand-text)]">
                          Laura
                        </p>

                        <p className="text-[10px] text-[var(--brand-muted)] mt-1">
                          Ingreso: $20,000
                        </p>

                        <p className="text-[10px] text-[var(--brand-muted)]">
                          Endeudamiento: 35%
                        </p>

                        <p className="text-[10px] text-[var(--brand-muted)]">
                          Ahorro: Medio
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        seleccionarPerfil(perfilesDemo[2])
                      }
                      className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-green-500/10 transition-colors"
                      role="menuitem"
                    >
                      <CircleCheck
                        size={19}
                        className="text-green-500 mt-0.5 shrink-0"
                      />

                      <div>
                        <p className="text-xs font-bold text-[var(--brand-text)]">
                          Roberto
                        </p>

                        <p className="text-[10px] text-[var(--brand-muted)] mt-1">
                          Ingreso: $30,000
                        </p>

                        <p className="text-[10px] text-[var(--brand-muted)]">
                          Endeudamiento: 20%
                        </p>

                        <p className="text-[10px] text-[var(--brand-muted)]">
                          Ahorro: Alto
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {isAdmin && pathname !== "/admin/dashboard" && (
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-1.5 bg-[var(--brand-card)] border border-[var(--brand-accent)] text-[var(--brand-text)] hover:bg-[var(--brand-accent)]/10 text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap transition-colors"
                title="Panel de Administración"
              >
                <Shield
                  size={13}
                  className="text-[var(--brand-accent)]"
                />

                <span className="hidden sm:inline">
                  Admin
                </span>
              </Link>
            )}

            {isAdmin && pathname === "/admin/dashboard" && (
              <Link
                href="/analisis"
                className="flex items-center gap-1.5 bg-[var(--brand-card)] border border-[var(--brand-accent)] text-[var(--brand-text)] hover:bg-[var(--brand-accent)]/10 text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap transition-colors"
                title="Volver a Análisis"
              >
                <Zap
                  size={13}
                  className="text-[var(--brand-accent)]"
                />

                <span className="hidden sm:inline">
                  Análisis
                </span>
              </Link>
            )}

            <span className="text-[var(--brand-text)] text-[11px] font-bold hidden sm:inline px-2">
              Hola, {username}
            </span>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={14} />

              <span className="hidden sm:inline">
                Salir
              </span>
            </button>
          </div>
        ) : (
          <div className="bg-[var(--brand-accent)] text-[var(--brand-bg)] text-xs font-bold px-3 py-1.5 rounded-full shadow-sm hidden sm:block">
            #38 Babel
          </div>
        )}
      </div>
    </header>
  );
}