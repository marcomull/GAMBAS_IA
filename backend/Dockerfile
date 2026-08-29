# syntax=docker/dockerfile:1

# ---------- Etapa 1: build ----------
# Compila el proyecto con Maven y JDK 21 (necesitamos JDK completo solo para compilar)
FROM eclipse-temurin:21-jdk AS build

WORKDIR /app

# Copiamos primero los archivos de definición de Maven para aprovechar la cache de capas
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Descargamos dependencias (esta capa solo se invalida si cambia el pom.xml)
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Ahora copiamos el código fuente y compilamos el jar, sin correr los tests
COPY src src
RUN ./mvnw clean package -DskipTests -B

# ---------- Etapa 2: runtime ----------
# Imagen final ligera, solo con el JRE necesario para ejecutar el jar
FROM eclipse-temurin:21-jre AS runtime

WORKDIR /app

# Buenas prácticas: correr como usuario sin privilegios
RUN addgroup --system spring && adduser --system --ingroup spring spring
USER spring:spring

# Copiamos únicamente el jar generado en la etapa de build y asignamos su
# propiedad al usuario de runtime.
COPY --from=build --chown=spring:spring /app/target/*.jar app.jar

# Puerto expuesto por el backend Spring Boot
EXPOSE 8080

# Variables de entorno configurables en tiempo de despliegue (ej. perfil activo)
ENV JAVA_TOOL_OPTIONS=""
ENV SPRING_PROFILES_ACTIVE="prod"

ENTRYPOINT ["java", "-jar", "app.jar"]
