FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package.json package-lock.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# URL pública del backend, inyectada en tiempo de build (Next.js horneca las
# variables NEXT_PUBLIC_* en el bundle del navegador durante "next build";
# no se puede cambiar después en tiempo de ejecución del contenedor)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Construir el proyecto de Next.js
RUN npm run build

# Exponer el puerto
EXPOSE 3000

# Iniciar la aplicación
CMD ["npm", "start"]
