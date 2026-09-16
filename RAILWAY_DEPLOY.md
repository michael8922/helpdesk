# HelpDesk — Deployment en Railway

Este documento describe el deploy **del proyecto tal como está implementado**.

La conclusión principal es importante:

```text
HelpDesk ya era compatible con un deploy básico en Railway.
No fue necesario modificar su lógica para ponerlo online.
```

Lo que cambia principalmente es la **configuración del entorno**.

---

## 1. Qué ya estaba preparado en el proyecto

### `package.json`

Existe:

```text
npm start
→ node src/server.js
```

Railway puede ejecutar el proceso normal de la aplicación.

### `src/config/env.js`

Ya lee:

```text
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
JWT_SECRET
PORT
```

desde `process.env`.

Por eso:

```text
LOCAL
.env
↓
process.env
```

y:

```text
RAILWAY
Variables
↓
process.env
```

pueden utilizar el mismo código.

### `src/server.js`

Ya usa:

```javascript
app.listen(appPort, ...)
```

y `appPort` proviene de:

```javascript
process.env.PORT ?? 3000
```

Railway inyecta `PORT`.

Además, al omitir el parámetro `host`, Node escucha en una dirección no
especificada (`::` cuando IPv6 está disponible o `0.0.0.0` en caso contrario).

Por eso **no es obligatorio modificar el archivo para agregar `0.0.0.0`**.

### Health endpoint

El proyecto ya posee:

```text
GET /api/v1/health
```

Puede configurarse como Healthcheck Path en Railway sin agregar código.

---

## 2. Configuración local

```text
DB_HOST=localhost
DB_PORT=5432
DB_NAME=helpdesk
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=<secreto-local>
PORT=3000
```

---

## 3. Configuración Railway

En:

```text
helpdesk
→ Variables
```

usar Reference Variables:

```text
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
JWT_SECRET=<secreto-privado>
```

No copiar:

```text
DB_HOST=localhost
```

porque dentro del servicio HelpDesk `localhost` se refiere al propio entorno
de HelpDesk, no al servicio PostgreSQL.

Railway resuelve las Reference Variables antes de iniciar Node.

---

## 4. `PORT`

No crear:

```text
PORT=3000
```

manualmente en Railway.

Railway inyecta `PORT` y el proyecto ya lo consume mediante:

```javascript
process.env.PORT ?? 3000
```

El fallback `3000` sigue siendo útil localmente.

---

## 5. `0.0.0.0`: aclaración

No es un paso obligatorio de este proyecto.

El código actual:

```javascript
app.listen(appPort, callback)
```

omite el `host`.

Node documenta que, cuando el host se omite, escucha en la dirección no
especificada IPv6 (`::`) si está disponible o en `0.0.0.0` en caso contrario.

Por eso el proyecto puede responder correctamente en Railway sin cambiar
esa línea.

Escribir:

```javascript
app.listen(appPort, "0.0.0.0", callback)
```

sería una forma opcional de hacer explícita esa intención.

No debe presentarse como corrección necesaria.

---

## 6. PostgreSQL

Crear el servicio:

```text
Postgres
```

Railway expone:

```text
PGHOST
PGPORT
PGUSER
PGPASSWORD
PGDATABASE
DATABASE_URL
```

HelpDesk utiliza variables separadas, por eso las referenciamos como `DB_*`.

No es necesario hacer pública la base de datos para que HelpDesk se conecte
desde el mismo Project.

---

## 7. Healthcheck

El endpoint ya existe:

```text
/api/v1/health
```

Si queremos que Railway espere una respuesta exitosa antes de activar un
nuevo deployment:

```text
helpdesk
→ Settings
→ Healthcheck Path
→ /api/v1/health
```

Railway espera una respuesta `2xx`.

Esto es una mejora de deployment recomendable, pero **no es requisito para
que el primer deploy básico exista**.

Railway no usa ese endpoint como monitor continuo después de que el
deployment queda activo.

---

## 8. Uploads

El proyecto actual escribe en:

```text
./uploads
```

mediante:

```javascript
path.resolve("uploads")
```

Esto funciona durante la ejecución del servicio.

Sin embargo, los archivos fuera de un Volume pertenecen al filesystem
efímero del deployment y no deben considerarse persistentes.

### Persistencia sin refactor de código

Railway documenta que las aplicaciones se ubican en `/app` y que, si una app
escribe en una ruta relativa como `./data`, el Volume debe montarse incluyendo
`/app`.

Aplicado a HelpDesk:

```text
código
./uploads
```

→ Volume Mount Path:

```text
/app/uploads
```

Así podemos persistir attachments **sin introducir UPLOAD_DIR**.

### `postgres-volume` no sirve para attachments

El Volume de PostgreSQL pertenece al servicio Postgres.

No se debe modificar ni reutilizar.

Si el plan permite otro Volume:

```text
helpdesk
└── Volume
    └── /app/uploads
```

Si el plan no permite otro Volume, los uploads pueden servir para la demo
actual, pero no debemos prometer persistencia entre redeploys.

---

## 9. `UPLOAD_DIR` es opcional, no necesario

Podríamos refactorizar posteriormente:

```text
UPLOAD_DIR=/data/uploads
```

y modificar:

```text
src/config/env.js
src/app.js
src/services/file.service.js
```

para leer esa variable.

Eso puede mejorar portabilidad o hacer explícito el directorio de almacenamiento.

Pero es un **refactor opcional**.

No fue necesario para desplegar el HelpDesk actual y no debe enseñarse como
requisito de Railway.

---

## 10. Inicialización de la BD demo

`npm start` no crea tablas.

El proyecto separa:

```text
arranque
→ npm start
```

de:

```text
setup demo
→ npm run db:setup
```

`db:setup` usa:

```javascript
sequelize.sync({ force: true })
```

Eso elimina y recrea tablas.

No configurarlo como:

```text
Start Command
Pre-Deploy permanente
```

Puede ejecutarse deliberadamente para inicializar/resetear la BD demo.

---

## 11. Dominio público

Después de tener un deployment activo:

```text
helpdesk
→ Settings
→ Networking
→ Public Networking
→ Generate Domain
```

Probar:

```text
https://<dominio>/api/v1/health
```

y después:

```text
https://<dominio>/
```

---

## 12. Orden mínimo de deploy

```text
1. crear Project
2. crear Postgres
3. conectar/crear servicio HelpDesk
4. configurar DB_* con Reference Variables
5. configurar JWT_SECRET
6. desplegar
7. revisar logs
8. generar dominio
9. inicializar BD demo si todavía no tiene tablas
10. probar aplicación
11. opcional: configurar Healthcheck Path
12. opcional: agregar persistencia de uploads
```

---

## 13. Diagnóstico

### `ECONNREFUSED`

Revisar:

```text
DB_HOST
DB_PORT
Postgres online
Reference Variables
```

Caso típico:

```text
DB_HOST=localhost
```

en Railway.

### `relation ... does not exist`

La conexión funciona, pero faltan tablas.

No es el mismo problema que `ECONNREFUSED`.

### 502 / aplicación no disponible

Revisar:

```text
npm start
logs
PORT
proceso caído
dominio
```

No asumir automáticamente que falta `0.0.0.0`.

### Attachment desaparece tras redeploy

Revisar si existe un Volume asociado a HelpDesk.

Con el código actual, una opción directa es:

```text
/app/uploads
```

---

## 14. Fuentes

- Node.js `net.Server.listen()`:
  https://nodejs.org/api/net.html

- Railway Variables:
  https://docs.railway.com/variables

- Railway PostgreSQL:
  https://docs.railway.com/databases/postgresql

- Railway Healthchecks:
  https://docs.railway.com/deployments/healthchecks

- Railway Services / ephemeral storage:
  https://docs.railway.com/services

- Railway Volumes:
  https://docs.railway.com/volumes

- Railway Public Networking:
  https://docs.railway.com/networking/public-networking
