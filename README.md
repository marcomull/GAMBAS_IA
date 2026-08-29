# 🤖 Finance IA - Equipo #38 Babel

[![NoCountry](https://img.shields.io/badge/NoCountry-Hackathon-1E3A8A?style=for-the-badge)](#) [![Alura Latam](https://img.shields.io/badge/Alura_Latam-0052CC?style=for-the-badge)](#) [![MVP](https://img.shields.io/badge/MVP-Snapshot_0.0.1-F59E0B?style=for-the-badge)](#)

> *"Conocer tus finanzas puede ser la diferencia entre tu nueva compra o tu nueva deuda."*

---

## 🌐 Demo en Vivo

¡Te invitamos a probar Finance IA! El proyecto se encuentra desplegado y funcionando en el siguiente enlace:
👉 **[Enlace al proyecto](https://bit.ly/FinanceAI38)**
---

## 🚀 Sobre el Proyecto

**Finance IA** es una solución Fintech desarrollada con la intención de apoyar y hacer conciencia sobre el control financiero mediante el uso de Inteligencia Artificial.

A través de un ecosistema robusto de microservicios, la plataforma evalúa ingresos, niveles de endeudamiento y hábitos de ahorro para emitir un diagnóstico preciso. El sistema proporciona recomendaciones personalizadas en tiempo real, permitiendo a los usuarios tomar decisiones informadas, evitar riesgos crediticios y optimizar su economía personal con estrategias basadas en datos.

---

## ✨ Funcionalidades Destacadas

* 📊 **Análisis de Perfil Financiero:** Evaluación automatizada del estado del usuario (*Saludable, En observación, En riesgo*) impulsada por modelos de Machine Learning entrenados con datos reales.
* 🏷️ **Clasificación Inteligente de Gastos:** Categorización automática de transacciones (Alimentación, Transporte, Salud, Vivienda, Educación, Ocio y Servicios) mediante modelos entrenados y algoritmos.
* 💡 **Motor de Recomendaciones (Finance-Babel):** Alertas preventivas automáticas por sobreendeudamiento y estrategias personalizadas para la optimización de la frecuencia de ahorro.
* 📑 **Reportes Ejecutivos:** Generación y exportación dinámica de informes en formato PDF con desgloses detallados y planes de acción claros.
* 🔐 **Seguridad y Control:** Panel de administración y sistema de acceso seguro respaldado por validaciones estrictas y protección de rutas.
* 🌓 **Experiencia de Usuario (UX/UI):** Dashboard interactivo 100% responsive, desarrollado con soporte para Modo Claro/Oscuro.

---

## 🛠️ Stack Tecnológico

| Área | Tecnologías Principales |
| :--- | :--- |
| **Frontend (UI/UX)** | Next.js (App Router), TypeScript, Tailwind CSS, jsPDF, html2canvas, Vercel |
| **Backend (API REST)**| Java 21, Spring Boot 4.1.0, MySQL 8.0.40, JWT, Swagger / OpenAPI |
| **Data Science (IA)** | Python 3.11, FastAPI, Scikit-Learn (`clasificador_gastos.pkl`, `perfil_financiero.pkl`), Pandas, NumPy |
| **Infraestructura** | Oracle Cloud Infrastructure (OCI), Docker, Docker Compose |

### 🏗️ Arquitectura y Despliegue en la Nube

El proyecto está fundamentado en una arquitectura de microservicios orientada a la escalabilidad, el alto rendimiento y las mejores prácticas de código limpio:

* **Integración Local Segura:** La API principal (Java) y el microservicio predictivo (Python) se comunican de forma interna y eficiente.
* **Contenedorización:** Utilizamos **Docker** como solución de contenedorización para empaquetar los entornos, aislar las dependencias y asegurar la consistencia del despliegue entre el equipo.
* **Cloud Hosting:** La infraestructura se aloja en una instancia Compute de **Oracle Cloud Infrastructure (OCI)**, aprovechando OCI Object Storage para el resguardo del dataset y los modelos de IA entrenados (`.pkl`).

📄 **Documentación Técnica Adicional:**
* Diagrama e interacción de infraestructura: **[arquitectura.md](./arquitectura.md)**
* Especificación de reglas de negocio, modelos de ML y fallback: **[reglas_de_negocio.md](./reglas_de_negocio.md)**

---

## 📚 Datos de Entrenamiento de los Modelos

Para mayor transparencia sobre nuestro proceso de Data Science, dejamos a disposición la información y el detalle de cómo se entrenaron los modelos de Machine Learning utilizados en el proyecto:

👉 **[Datos de entrenamiento - Google Drive](#)** *(Reemplazar con el link real de Drive)*

---

## 👥 Equipo Babel (G9 LATAM Team 38)

El talento, la disciplina y la ingeniería detrás del código:

| Rol | Integrante | Enlaces Profesionales |
| :--- | :--- | :--- |
| **Project Manager** | Brayan Camargo | [LinkedIn](https://www.linkedin.com/in/brayan-camargo-ram%C3%ADrez/) • [GitHub](https://github.com/Brayan-Camargo) |
| **Full Stack Developer** | Marco Arias | [LinkedIn](https://www.linkedin.com/in/marco-antonio-arias-mullisaca-b688611ba/) • [GitHub](https://github.com/marcomull) |
| **Backend Developer** | Gabriel Gil | [LinkedIn](https://www.linkedin.com/in/gabriel-gil-337a20250/) • [GitHub](https://github.com/gilgabriel422-netizen) |
| **Backend Developer** | Ian Osnaya | [LinkedIn](https://www.linkedin.com/in/ian-osnaya-0a7b71375/) • [GitHub](https://github.com/IanOsnaya) |
| **Data Scientist** | Sonia Moran | [LinkedIn](https://www.linkedin.com/in/sonia-moran-286717422/) • [GitHub](https://github.com/Zonya8) |
| **Data Scientist** | Armando Tapia | [LinkedIn](https://www.linkedin.com/in/atapia9/) • [GitHub](https://github.com/atapia9) |
| **Data Scientist** | Jesús García | [LinkedIn](https://www.linkedin.com/in/jesusjgarciam/) • [GitHub](https://github.com/Electrocyte96) |

---

## 💻 Instalación y Uso Local

¿Quieres ejecutar Finance IA en tu propia máquina? Gracias a nuestra arquitectura con Docker, el proceso es muy sencillo.

**Prerrequisitos:**
* Tener instalado [Git](https://git-scm.com/) y [Docker Desktop](https://www.docker.com/products/docker-desktop/).

**Pasos de ejecución:**

1. Clona este repositorio en tu computadora:
   ```bash
   git clone https://github.com/No-Country-simulation/G9-LATAM-Team-38.git
   ```

2. Navega al directorio del proyecto:
   ```bash
   cd G9-LATAM-Team-38
   ```

3. Levanta todos los microservicios (Frontend, Backend, IA y Base de Datos) con un solo comando:
   ```bash
   docker-compose up -d
   ```

4. Abre tu navegador y accede a la interfaz gráfica en:
   ```
   http://localhost:3000
   ```

---

## 🚧 Mejoras a Futuro

Como todo MVP, Finance IA tiene un camino de crecimiento por delante. Estas son algunas de las mejoras que contemplamos a corto y mediano plazo:

* 📅 **Trazabilidad de transacciones:** Incorporar el detalle de fecha de ingreso en las transacciones a lo largo de todo el ecosistema (Frontend, Backend, Base de Datos) y reflejarlo también en los reportes PDF generados.
* 🔒 **Fortalecimiento de seguridad:** Mejorar el algoritmo de hashing de contraseñas para reforzar la protección de las credenciales de los usuarios.
* 🧠 **Evolución de los modelos:** Ampliar el conocimiento y la capacidad predictiva de los modelos de Machine Learning con mayor volumen y diversidad de datos.

---

## 🔗 Referencias del Proyecto

* 📋 **Tablero de Gestión:** [Trello Oficial - Team 38](https://trello.com/b/3mjaUnQb/finance-ia-team-38)
* 🌐 **Iniciativas:** [NoCountry Tech](https://nocountry.tech/) • [Alura Latam](https://www.aluracursos.com/)
---

## ⚖️ Licencia y Aviso Legal

Este software se proporciona sin garantías de ningún tipo, expresas o implícitas. Los autores no asumen responsabilidad por posibles errores, pérdida de datos o problemas derivados de su uso. Este proyecto es una prueba de concepto y no cuenta con soporte técnico ni mantenimiento activo.

---

*Hecho con dedicación y cariño por el Equipo Babel.*
