"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LockKeyhole,
  UserRound,
  UserPlus,
  AlertCircle,
  Bot,
  Heart,
  Sparkles,
  LogIn,
} from "lucide-react";
import { API_BASE_URL } from "@/config/api";
import Link from "next/link";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";

interface Miembro {
  nombre: string;
  rol: string;
  linkedin?: string;
  github?: string;
}

const miembrosEquipo: Miembro[] = [
  {
    nombre: "Sonia Moran",
    rol: "Data Scientist",
    linkedin: "https://www.linkedin.com/in/sonia-moran-286717422/",
    github: "https://github.com/Zonya8",
  },
  {
    nombre: "Gabriel Gil",
    rol: "Backend Developer",
    linkedin: "https://www.linkedin.com/in/gabriel-gil-337a20250/",
    github: "https://github.com/gilgabriel422-netizen",
  },
  {
    nombre: "Armando Tapia ",
    rol: "Data Scientist",
    linkedin: "https://www.linkedin.com/in/atapia9/",
    github: "https://github.com/atapia9",
  },
  {
    nombre: "Ian Osnaya",
    rol: "Backend Developer",
    linkedin: "https://www.linkedin.com/in/ian-osnaya-0a7b71375/",
    github: "https://github.com/IanOsnaya",
  },
  {
    nombre: "Jesús García",
    rol: "Data Scientist",
    linkedin: "https://www.linkedin.com/in/jesusjgarciam/",
    github: "https://github.com/Electrocyte96",
  },
  {
    nombre: "Marco Arias",
    rol: "Full Stack Developer",
    linkedin:
      "https://www.linkedin.com/in/marco-antonio-arias-mullisaca-b688611ba/",
    github: "https://github.com/marcomull",
  },
  {
    nombre: "Brayan Camargo ",
    rol: "Project Manager",
    linkedin:
      "https://www.linkedin.com/in/brayan-camargo-ram%C3%ADrez/",
    github: "https://github.com/Brayan-Camargo",
  },
];

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isLogin ? "/auth/login" : "/auth/register";

    try {
      const response = await fetch(
        `${API_BASE_URL.replace("/api", "")}${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Usuario o contraseña incorrectos");
        }
        if (response.status === 409) {
          throw new Error("Ese usuario ya existe. Intenta iniciar sesión.");
        }
        throw new Error(
          "El servidor no está disponible en este momento. Intenta de nuevo en unos minutos."
        );
      }

      const data = await response.json();

      if (data.token) {
        localStorage.setItem("finance_token", data.token);
        localStorage.setItem("finance_username", username);

        if (data.role) {
          localStorage.setItem("finance_role", data.role);
        }

        router.push("/analisis");
      } else {
        throw new Error("No se recibió token de acceso");
      }
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--brand-bg)] text-[var(--brand-text)] font-sans flex flex-col justify-between overflow-hidden selection:bg-[var(--brand-accent)]/30">
      <GlobalHeader />

      {/* CONTENIDO CENTRAL */}
      <div className="flex-1 flex flex-col lg:flex-row-reverse justify-center items-center gap-12 lg:gap-20 p-6 overflow-y-auto max-w-7xl mx-auto w-full">

        {/* Lado Derecho: Formulario de Login */}
        <div className="w-full max-w-md flex flex-col items-center lg:items-start">

          {/* Brand Header */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="group bg-[var(--brand-accent)] p-2 rounded-xl shadow-md flex items-center justify-center text-white dark:text-[#0B2545] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
              <Bot
                size={28}
                className="transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold leading-none">
                Finance IA
              </h1>

              <p className="text-[var(--brand-muted)] text-xs mt-1">
                {isLogin
                  ? "Ingresa a tu cuenta"
                  : "Crea una cuenta nueva"}
              </p>
            </div>
          </div>

          {/* Login Card */}
          <div className="w-full bg-[var(--brand-card)] rounded-2xl p-6 shadow-2xl border border-[var(--brand-border)]">

            <div className="flex items-center gap-2 mb-6">
              {isLogin ? (
                <LogIn
                  size={16}
                  strokeWidth={2.5}
                  className="text-[var(--brand-accent)]"
                />
              ) : (
                <UserPlus
                  size={16}
                  strokeWidth={2.5}
                  className="text-[var(--brand-accent)]"
                />
              )}

              <h3 className="text-[var(--brand-muted)] font-bold tracking-widest text-[11px] uppercase">
                {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
              </h3>
            </div>

            {/* MENSAJE DE ERROR */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-[var(--brand-text)]">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5 transition-transform duration-200 hover:scale-110" />

                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* FORMULARIO */}
            <form
              onSubmit={handleAuth}
              className="bg-[var(--brand-bg)] border border-[var(--brand-border)] rounded-xl p-5 space-y-4"
            >

              {/* USUARIO */}
              <div>
                <label className="block text-xs font-semibold text-[var(--brand-muted)] mb-1.5">
                  Usuario
                </label>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--brand-accent)]">
                    <UserRound
                      size={16}
                      className="transition-transform duration-200 group-focus-within:scale-110"
                    />
                  </div>

                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--brand-bg)] border border-[var(--brand-border)] hover:border-[var(--brand-accent)]/50 rounded-lg text-sm font-semibold text-[var(--brand-text)] focus:outline-none focus:border-[var(--brand-accent)] focus:ring-2 focus:ring-[var(--brand-accent)]/20 transition-all duration-300"
                    placeholder="Nombre de usuario"
                    required
                  />
                </div>
              </div>

              {/* CONTRASEÑA */}
              <div>
                <label className="block text-xs font-semibold text-[var(--brand-muted)] mb-1.5">
                  Contraseña
                </label>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--brand-accent)]">
                    <LockKeyhole
                      size={16}
                      className="transition-transform duration-200 group-focus-within:scale-110"
                    />
                  </div>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--brand-bg)] border border-[var(--brand-border)] hover:border-[var(--brand-accent)]/50 rounded-lg text-sm font-semibold text-[var(--brand-text)] focus:outline-none focus:border-[var(--brand-accent)] focus:ring-2 focus:ring-[var(--brand-accent)]/20 transition-all duration-300"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* BOTÓN DE LOGIN */}
              <button
                type="submit"
                disabled={loading}
                className="group w-full mt-4 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white dark:text-[#0B2545] font-bold py-2.5 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-md hover:shadow-lg hover:shadow-[var(--brand-accent)]/30 flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? (
                      <LogIn
                        size={17}
                        strokeWidth={2.5}
                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                      />
                    ) : (
                      <UserPlus
                        size={17}
                        strokeWidth={2.5}
                        className="transition-transform duration-200 group-hover:scale-110"
                      />
                    )}

                    {isLogin
                      ? "Ingresar al sistema"
                      : "Registrarse"}
                  </>
                )}
              </button>
            </form>

            {/* CAMBIAR ENTRE LOGIN Y REGISTRO */}
            <div className="mt-6 text-center">
              <p className="text-xs text-[var(--brand-muted)]">
                {isLogin
                  ? "¿No tienes cuenta? "
                  : "¿Ya tienes una cuenta? "}

                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-[var(--brand-accent)] hover:underline font-bold transition-colors bg-transparent border-none cursor-pointer"
                >
                  {isLogin ? "Regístrate aquí" : "Inicia sesión"}
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Lado Izquierdo: Créditos al Equipo */}
        <div className="w-full max-w-lg lg:max-w-xl">

          {/* TITULO */}
          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center lg:justify-start gap-2 mb-2 text-[var(--brand-text)]">
              <Sparkles
                className="text-[var(--brand-accent)] transition-transform duration-300 hover:scale-110 hover:rotate-6"
                size={24}
              />

              Equipo Babel
            </h2>

            <p className="text-[var(--brand-muted)] text-sm md:text-base leading-relaxed">
              Plataforma desarrollada con{" "}
              <Heart
                size={14}
                className="inline text-red-400 mx-1 mb-0.5 transition-transform duration-200 hover:scale-125"
              />{" "}
              para la Hackathon. Conoce a los desarrolladores detrás de este
              proyecto.
            </p>
          </div>

          {/* TARJETAS DE EQUIPO */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {miembrosEquipo.map((miembro, idx) => (
              <div
                key={idx}
                className="bg-[var(--brand-card)] p-3 rounded-xl border border-[var(--brand-border)] flex flex-col justify-between shadow-lg hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)] hover:border-[var(--brand-accent)] transition-all duration-300 group transform hover:-translate-y-1 hover:scale-[1.01]"
              >

                {/* INFORMACIÓN DEL MIEMBRO */}
                <div>
                  <span
                    className="font-bold text-xs md:text-sm truncate text-[var(--brand-text)] group-hover:text-[var(--brand-accent)] transition-colors block"
                    title={miembro.nombre}
                  >
                    {miembro.nombre}
                  </span>

                  <span className="text-[9px] md:text-[10px] text-[var(--brand-muted)] font-bold uppercase tracking-wider truncate block mt-0.5">
                    {miembro.rol}
                  </span>
                </div>

                {/* ICONOS */}
                <div className="flex items-center gap-2.5 mt-3">

                  {/* LINKEDIN */}
                  {miembro.linkedin && (
                    <a
                      href={miembro.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--brand-accent)] hover:text-[var(--brand-text)] hover:bg-[var(--brand-accent)]/10 transition-all duration-200 hover:scale-110 active:scale-95"
                      title="LinkedIn"
                      aria-label={`LinkedIn de ${miembro.nombre}`}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    </a>
                  )}

                  {/* GITHUB */}
                  {miembro.github && (
                    <a
                      href={miembro.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--brand-accent)] hover:text-[var(--brand-text)] hover:bg-[var(--brand-accent)]/10 transition-all duration-200 hover:scale-110 active:scale-95"
                      title="GitHub"
                      aria-label={`GitHub de ${miembro.nombre}`}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.28-.01-1.04-.01-2.04-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23.96-.27 1.98-.4 3-.4s2.04.14 3 .4c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.82 1.1.82 2.22 0 1.61-.01 2.9-.01 3.29 0 .32.22.69.83.58A12.01 12.01 0 0 0 24 12C24 5.37 18.63 0 12 0Z"
                        />
                      </svg>
                    </a>
                  )}

                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <GlobalFooter />
    </div>
  );
}