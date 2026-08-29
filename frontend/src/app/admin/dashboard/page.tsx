"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Shield,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { API_BASE_URL } from "@/config/api";
import {
  GlobalHeader,
  DemoProfile,
} from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";

interface User {
  id: number;
  username: string;
  role: string;
}

interface Miembro {
  nombre: string;
  linkedin?: string;
  github?: string;
}

const miembrosEquipo: Miembro[] = [
  {
    nombre: "Sonia Moran",
    linkedin: "https://www.linkedin.com/in/sonia-moran-286717422/",
    github: "https://github.com/Zonya8",
  },
  {
    nombre: "Brayan Camargo",
    linkedin: "https://www.linkedin.com/in/brayan-camargo-ram%C3%ADrez/",
    github: "https://github.com/Brayan-Camargo",
  },
  {
    nombre: "Gabriel Gil",
    linkedin: "https://www.linkedin.com/in/gabriel-gil-337a20250/",
    github: "https://github.com/gilgabriel422-netizen",
  },
  {
    nombre: "Armando Tapia",
    linkedin: "https://www.linkedin.com/in/atapia9/",
    github: "https://github.com/atapia9",
  },
  {
    nombre: "Jesús García",
    linkedin: "https://www.linkedin.com/in/jesusjgarciam/",
    github: "https://github.com/Electrocyte96",
  },
  {
    nombre: "Ian Osnaya",
    linkedin: "https://www.linkedin.com/in/ian-osnaya-0a7b71375/",
    github: "https://github.com/IanOsnaya",
  },
  {
    nombre: "Marco Arias",
    linkedin: "https://www.linkedin.com/in/marco-antonio-arias-mullisaca-b688611ba/",
    github: "https://github.com/marcomull",
  },
];

export default function AdminDashboard() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newAdminUser, setNewAdminUser] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [username, setUsername] = useState<string | null>(null);
  const [mostrarMiembros, setMostrarMiembros] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("finance_token");
    const storedUser = localStorage.getItem("finance_username");

    if (!token) {
      router.push("/login");
      return;
    }

    if (storedUser) {
      setUsername(storedUser);
    }

    const fetchUsers = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL.replace("/api", "")}/api/admin/users`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            router.push("/analisis");
            return;
          }

          throw new Error("Error al cargar los usuarios");
        }

        const data = await res.json();
        setUsers(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("finance_token");
    localStorage.removeItem("finance_username");
    sessionStorage.removeItem("finance_demo_profile");
    router.push("/login");
  };

  const handleSelectDemoProfile = (profile: DemoProfile) => {
    sessionStorage.setItem(
      "finance_demo_profile",
      JSON.stringify(profile)
    );

    router.push("/analisis");
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormError(null);
    setFormSuccess(null);
    setIsCreating(true);

    try {
      const token = localStorage.getItem("finance_token");

      const res = await fetch(
        `${API_BASE_URL.replace(
          "/api",
          ""
        )}/api/admin/users/admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            username: newAdminUser,
            password: newAdminPass,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(
          "Error al crear administrador. Quizás el usuario ya existe."
        );
      }

      setFormSuccess(
        `Administrador "${newAdminUser}" creado con éxito.`
      );

      setNewAdminUser("");
      setNewAdminPass("");

      const resUsers = await fetch(
        `${API_BASE_URL.replace(
          "/api",
          ""
        )}/api/admin/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (resUsers.ok) {
        setUsers(await resUsers.json());
      }
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#0B2545] text-[#8DA9C4] flex items-center justify-center">
        Cargando Panel de Administración...
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--brand-bg)] text-[var(--brand-text)] font-sans flex flex-col items-center p-4">
      <GlobalHeader
        username={username || ""}
        onLogout={handleLogout}
        isAdmin={true}
        onSelectDemoProfile={handleSelectDemoProfile}
      />

      <div className="w-full max-w-7xl mx-auto bg-[var(--brand-accent-hover)] border border-[var(--brand-border)] rounded-t-2xl px-5 py-3 flex justify-between items-center relative shadow-lg">
        <div className="z-10">
          <div className="text-slate-900 text-[9px] font-bold tracking-widest uppercase mb-0.5">
            GESTIÓN GLOBAL
          </div>

          <h2 className="text-sm md:text-lg font-bold flex items-center gap-2 text-slate-900">
            <Shield
              size={18}
              className="text-slate-900 fill-slate-900/20 stroke-[2.5]"
            />

            Usuarios y Administradores del Sistema
          </h2>
        </div>
      </div>

      <main className="w-full max-w-7xl mx-auto flex-1 min-h-0 bg-[var(--brand-card)] rounded-b-2xl p-4 md:p-5 grid grid-cols-1 lg:grid-cols-3 gap-5 shadow-2xl border border-[var(--brand-border)] border-t-0 overflow-hidden">
        <div className="lg:col-span-2 flex flex-col gap-2 min-h-0 h-full">
          <div className="flex items-center gap-2 flex-shrink-0 mb-1">
            <div className="flex items-center justify-center w-3 h-3 border-2 border-[var(--brand-accent)] rounded-[2px]">
              <div className="w-0.5 h-0.5 bg-[var(--brand-accent)]" />
            </div>

            <h3 className="text-[var(--brand-muted)] font-bold tracking-widest text-[11px] uppercase">
              Base de Datos de Usuarios
            </h3>
          </div>

          <div className="bg-[var(--brand-bg)] border border-[var(--brand-border)] rounded-xl p-3.5 flex-1 overflow-hidden flex flex-col">
            {error ? (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            ) : (
              <div className="overflow-auto flex-1 pr-1 relative">
                <table className="w-full text-left border-collapse relative">
                  <thead className="sticky top-0 bg-[var(--brand-bg)] z-10">
                    <tr className="border-b border-[var(--brand-border)] text-[11px] font-bold text-[var(--brand-muted)] uppercase tracking-wider">
                      <th className="py-2.5 px-3">
                        ID
                      </th>

                      <th className="py-2.5 px-3">
                        Usuario
                      </th>

                      <th className="py-2.5 px-3 text-center">
                        Rol
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-[var(--brand-border)] hover:bg-[var(--brand-card)]/30 transition-colors"
                      >
                        <td className="py-3 px-3 text-xs text-[var(--brand-accent)] font-mono">
                          #{user.id}
                        </td>

                        <td className="py-3 px-3 text-sm font-semibold">
                          {user.username}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                              user.role === "ADMIN"
                                ? "bg-[var(--brand-accent-hover)] text-[var(--brand-accent)] border border-[var(--brand-accent)]/30"
                                : "bg-[var(--brand-bg)] text-[var(--brand-muted)] border border-[var(--brand-border)]"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:pl-5 lg:border-l border-[var(--brand-border)] overflow-y-auto pr-1">
          <div className="flex items-center gap-2 flex-shrink-0 mb-1">
            <div className="flex items-center justify-center w-3 h-3 border-2 border-[var(--brand-accent)] rounded-[2px]">
              <div className="w-0.5 h-0.5 bg-[var(--brand-accent)]" />
            </div>

            <h3 className="text-[var(--brand-muted)] font-bold tracking-widest text-[11px] uppercase">
              Añadir Administrador
            </h3>
          </div>

          <div className="bg-[var(--brand-bg)] border border-[var(--brand-border)] rounded-xl p-4 flex flex-col gap-4">
            <p className="text-[11px] text-[var(--brand-muted)] leading-snug">
              Utiliza este formulario exclusivo para conceder acceso total de{" "}
              <strong className="text-[var(--brand-accent)]">
                Administrador
              </strong>{" "}
              a nuevos miembros del equipo.
            </p>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />

                <p className="text-red-400 text-xs leading-snug">
                  {formError}
                </p>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-[var(--brand-accent)]/10 border border-[var(--brand-accent)]/30 rounded-lg flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--brand-accent)] flex-shrink-0 mt-0.5" />

                <p className="text-[var(--brand-accent)] text-xs leading-snug">
                  {formSuccess}
                </p>
              </div>
            )}

            <form
              onSubmit={handleCreateAdmin}
              className="space-y-3"
            >
              <div>
                <label className="block text-[11px] font-semibold text-[var(--brand-muted)] mb-1">
                  Usuario
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[var(--brand-accent)]">
                    <UserPlus size={14} />
                  </div>

                  <input
                    type="text"
                    value={newAdminUser}
                    onChange={(e) =>
                      setNewAdminUser(e.target.value)
                    }
                    className="w-full pl-8 pr-3 py-2 bg-[var(--brand-card)] border border-[var(--brand-border)] rounded-lg text-xs font-semibold text-[var(--brand-text)] focus:outline-none focus:border-[var(--brand-accent)] transition-colors"
                    placeholder="Nombre del admin"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--brand-muted)] mb-1">
                  Contraseña
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[var(--brand-accent)]">
                    <Lock size={14} />
                  </div>

                  <input
                    type="password"
                    value={newAdminPass}
                    onChange={(e) =>
                      setNewAdminPass(e.target.value)
                    }
                    className="w-full pl-8 pr-3 py-2 bg-[var(--brand-card)] border border-[var(--brand-border)] rounded-lg text-xs font-semibold text-[var(--brand-text)] focus:outline-none focus:border-[var(--brand-accent)] transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full mt-2 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white dark:text-[#0B2545] font-bold py-2 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 text-xs disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isCreating
                  ? "Creando..."
                  : "Crear Administrador"}
              </button>
            </form>
          </div>
        </div>
      </main>

      <GlobalFooter>
        <button
          onClick={() =>
            setMostrarMiembros(!mostrarMiembros)
          }
          className="flex items-center gap-1 text-[var(--brand-accent)] hover:underline font-bold transition-colors"
        >
          <Users size={14} />

          <span>
            Ver Miembros del Equipo
          </span>

          {mostrarMiembros ? (
            <ChevronUp size={13} />
          ) : (
            <ChevronDown size={13} />
          )}
        </button>
      </GlobalFooter>

      {mostrarMiembros && (
        <div className="w-full max-w-7xl mx-auto mb-2 bg-[var(--brand-card)] border border-[var(--brand-border)] rounded-xl p-3 shadow-xl transition-colors duration-300">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {miembrosEquipo.map((miembro, idx) => (
              <div
                key={idx}
                className="bg-[var(--brand-bg)] p-2 rounded-lg border border-[var(--brand-border)] flex flex-col justify-between hover:border-[var(--brand-accent)] transition-colors group"
              >
                <span className="font-bold text-[10px] md:text-[11px] truncate text-[var(--brand-text)] group-hover:text-[var(--brand-accent)] transition-colors">
                  {miembro.nombre}
                </span>

                <div className="flex items-center gap-2 mt-2">
                  {miembro.linkedin && (
                    <a
                      href={miembro.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--brand-accent)] hover:opacity-80 transition-opacity"
                      title="LinkedIn"
                    >
                      <svg
                        className="w-3.5 h-3.5 fill-current"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    </a>
                  )}

                  {miembro.github && (
                    <a
                      href={miembro.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--brand-accent)] hover:opacity-80 transition-opacity"
                      title="GitHub"
                    >
                      <svg
                        className="w-3.5 h-3.5 fill-current"
                        viewBox="0 0 24 24"
                      >
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
    </div>
  );
}