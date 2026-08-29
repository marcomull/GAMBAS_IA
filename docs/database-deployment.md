# Base de datos en producción

La base de datos MySQL de producción corre **fuera de Docker**, nativa en el mismo VM que hospeda los contenedores de la app (decisión original de [PR #68](https://github.com/No-Country-simulation/G9-LATAM-Team-38/pull/68), corregida en [PR #69](https://github.com/No-Country-simulation/G9-LATAM-Team-38/pull/69) para que funcione en Docker Engine de Linux).

## Cómo se conecta

- El backend alcanza a MySQL vía el hostname `host.docker.internal`, resuelto a la IP del host gracias a `extra_hosts: ["host.docker.internal:host-gateway"]` en el servicio `backend` de `docker-compose.yml` (soportado desde Docker Engine 20.10+).
- MySQL escucha en `bind-address = 0.0.0.0` (`/etc/mysql/mysql.conf.d/mysqld.cnf`) — necesario para aceptar conexiones desde la red bridge de Docker, no solo `localhost`.
- **La base NO está expuesta a internet.** El puerto 3306 está bloqueado a nivel de `iptables` para cualquier IP pública; solo se permite desde el rango de redes privadas de Docker (`172.16.0.0/12`). Ver la regla exacta más abajo.
- Usuario dedicado `financeai` con privilegios acotados a la base `hackathon_finance_ai` — no se usa `root`.

## Variables de entorno requeridas

Ver [`.env.example`](../.env.example) en la raíz del repo. En producción, `.env` vive en el servidor (`~/app/.env`), fuera de git (`.gitignore`).

## Firewall — regla persistente

El servidor OCI trae por defecto una cadena `iptables INPUT` con política final `REJECT`. La regla que permite el tráfico de Docker hacia MySQL:

```bash
iptables -I INPUT 9 -p tcp --dport 3306 -s 172.16.0.0/12 -j ACCEPT
```

está persistida en `/etc/iptables/rules.v4` vía `netfilter-persistent` (ya activo en el sistema — `sudo netfilter-persistent save` la guarda, `netfilter-persistent start` la restaura en cada boot). **Si se reinstala el servidor desde cero, hay que volver a aplicar y guardar esta regla explícitamente** — no queda en ningún script de este repo porque es configuración de sistema operativo, no de la app.

Para verificar que sigue activa en cualquier momento:

```bash
sudo iptables -L INPUT -n --line-numbers | grep 3306
```

Debe mostrar una línea `ACCEPT` con `source: 172.16.0.0/12` **antes** de la línea `REJECT` final.

## Restaurar desde un backup

```bash
sudo mysql hackathon_finance_ai < /ruta/al/backup.sql
```

El schema (`users`, `transaction_history`, `analysis_history`) lo genera Hibernate automáticamente al arrancar el backend (`spring.jpa.hibernate.ddl-auto=update`), así que no hace falta crear tablas a mano — solo la base vacía (`CREATE DATABASE IF NOT EXISTS hackathon_finance_ai;`) antes de importar.

## Rotar la contraseña

```bash
sudo mysql -e "ALTER USER 'financeai'@'%' IDENTIFIED BY 'nueva_contraseña'; FLUSH PRIVILEGES;"
# actualizar SPRING_DATASOURCE_PASSWORD en ~/app/.env con el mismo valor
docker compose up -d --force-recreate backend
```

**La contraseña real nunca se documenta en este repo ni en ningún archivo versionado.** Se comparte entre el equipo por un canal fuera de git (acordado: de viva voz).

## Riesgos conocidos, sin resolver

- No hay backup automatizado programado (ni lo había con el contenedor Docker anterior).
- El contenedor Docker `financeai-db` original queda detenido pero no eliminado, como respaldo de corto plazo — se debe retirar (`docker rm` + `docker volume rm`) solo después de confirmar varios días de estabilidad con el MySQL nativo.
- La app y la base comparten la misma VM sin separación — un solo punto de fallo físico.
