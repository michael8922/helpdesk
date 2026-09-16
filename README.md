# HelpDesk Reinforcement

Proyecto didáctico Full Stack JavaScript para integrar Node, Express, PostgreSQL, `pg`, Sequelize, REST, JWT, uploads, Handlebars, Bootstrap, Fetch API, CLI con yargs y una prueba mínima con Mocha.


## Regla de estructura

Los scripts de `package.json` asumen que el código del servidor vive dentro de `src/`.

```text
helpdesk_reinforcement/
├── package.json
├── .env.example
├── public/
├── views/
├── test/
└── src/
    ├── app.js
    ├── server.js
    ├── cli.js
    ├── config/
    ├── controllers/
    ├── database/
    ├── middlewares/
    ├── models/
    ├── routes/
    ├── services/
    └── utils/
```

Por ejemplo:

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js"
  }
}
```

significa que el archivo debe estar en **`src/server.js`**. No debe crearse como `server.js` en la raíz.

Salvo que se indique lo contrario, ejecuta los comandos desde la raíz del proyecto, donde está `package.json`.

## Requisitos

- Node.js 20 o superior. El proyecto fija `express-handlebars` 7.x para mantener compatibilidad con Node 20.
- PostgreSQL.
- Una base de datos vacía llamada `helpdesk`.

## Preparación

### 1. Crear la base de datos PostgreSQL

`sequelize.sync()` crea las **tablas**, pero no crea la base de datos PostgreSQL. Primero debe existir una base vacía llamada `helpdesk`:

```sql
CREATE DATABASE helpdesk;
```

### 2. Crear y configurar `.env`

El proyecto **no usa una URI `DATABASE_URL`**. Las credenciales se mantienen por separado para que sea visible qué representa cada valor:

```bash
# Linux / macOS
cp .env.example .env
```

Después edita `.env` según tu PostgreSQL local:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=helpdesk
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=change-this-development-secret
PORT=3000
```

Significado de las variables:

| Variable | Qué representa | Ejemplo local |
|---|---|---|
| `DB_HOST` | servidor donde corre PostgreSQL | `localhost` |
| `DB_PORT` | puerto de PostgreSQL | `5432` |
| `DB_NAME` | base de datos de la aplicación | `helpdesk` |
| `DB_USER` | usuario/rol PostgreSQL | `postgres` |
| `DB_PASSWORD` | contraseña de ese usuario | `postgres` |
| `JWT_SECRET` | clave privada usada para firmar/verificar JWT | una cadena larga |
| `PORT` | puerto HTTP de Express | `3000` |

> `DB_PASSWORD=postgres` es solo un ejemplo. Debes escribir la contraseña real configurada en tu instalación de PostgreSQL.

`.env` está ignorado por Git. El repositorio solo incluye `.env.example`, que sirve como plantilla sin credenciales reales.

### 3. Instalar y preparar el proyecto

```bash
# Instala dependencias runtime y de desarrollo.
npm install

# Crea/recrea las tablas con sequelize.sync({ force: true }) y carga seeds.
npm run db:setup

# Levanta Express en modo desarrollo.
npm run dev
```

> `db:setup` borra y recrea las tablas porque utiliza `force: true`. Se usa deliberadamente como mecanismo didáctico de reset; el servidor normal no ejecuta `sync()` al iniciar.

## Cuenta demo

- Email: `alice@example.com`
- Password: `Password123!`

## Cobertura funcional

| Capacidad | API | Web | CLI |
|---|---|---|---|
| Registro | `POST /api/v1/auth/register` | `/register` | `register` |
| Login JWT | `POST /api/v1/auth/login` | `/login` | `login` |
| Logout local | no requiere endpoint API | `/logout` + navbar | `logout` |
| Listar tickets | `GET /api/v1/tickets` | tabla Tickets | `tickets:list` |
| Filtrar | query params | formulario Filters | opciones de `tickets:list` |
| Ver ticket | `GET /api/v1/tickets/:id` | botón View + modal | `tickets:get` |
| Crear | `POST /api/v1/tickets` | formulario Save | `tickets:create` |
| Actualizar | `PUT /api/v1/tickets/:id` | botón Edit + formulario | `tickets:update` |
| Eliminar | `DELETE /api/v1/tickets/:id` | botón Delete | `tickets:delete` |
| Subir/reemplazar archivo | `POST /api/v1/tickets/:id/attachment` | botón Attach | `tickets:upload` |
| Eliminar archivo | `DELETE /api/v1/tickets/:id/attachment` | botón Remove file | `tickets:attachment:delete` |
| Relaciones 1:1, 1:N, N:M | `GET /api/v1/users/:id/summary` | `/account` | `users:summary` |

## Web

Rutas de vistas Handlebars:

- Home: `http://localhost:3000/`
- Register: `http://localhost:3000/register`
- Login: `http://localhost:3000/login`
- Tickets: `http://localhost:3000/tickets`
- Account & relations: `http://localhost:3000/account`
- Logout Web: `http://localhost:3000/logout`

La capa Web usa Handlebars para el HTML inicial, Bootstrap para presentación/componentes y JavaScript con Fetch API para consumir la misma API REST que utiliza el CLI.

### Navbar y estado de autenticación

La autenticación Web se guarda en `localStorage`. Esto implica una diferencia importante entre **SSR** y **estado del navegador**:

```text
Express + Handlebars
→ puede renderizar HTML
→ no puede leer el localStorage del navegador

navbar.js
→ corre en el navegador
→ puede leer JWT + usuario desde localStorage
→ decide qué enlaces mostrar
```

Por eso `views/partials/navbar.hbs` contiene enlaces marcados con:

```html
data-auth-state="guest"
data-auth-state="authenticated"
```

y `public/js/navbar.js` utiliza la utility Bootstrap `d-none` para alternarlos. El resultado es:

- **sin login:** Home, Register y Login;
- **con login:** Home, Tickets, Account, nombre del usuario y Logout;
- `/login` y `/register` redirigen a `/tickets` si ya existe JWT;
- `/tickets` y `/account` redirigen a `/login` si no existe JWT;
- el enlace activo recibe la clase Bootstrap `active`.

Estos redirects son una mejora de **UX**, no un mecanismo de seguridad. La API sigue validando el JWT mediante `express-jwt`; un usuario no obtiene acceso a datos protegidos por ocultar o mostrar enlaces.

### Ruta Web de logout

El navbar utiliza:

```text
GET /logout
```

Esta es una **ruta de vista**, no un endpoint REST de autenticación. `logout.hbs` carga `logout.js`, que ejecuta `clearSession()` y elimina del navegador:

```text
helpdesk_token
helpdesk_user
```

Después redirige a `/login`. Como JWT es stateless, el backend no mantiene una sesión que deba destruir. El CLI aplica el mismo principio eliminando `.helpdesk-token`.

### Presentación y modo nocturno

La interfaz usa principalmente clases de Bootstrap: `container-xl`, grilla responsive, `card`, `shadow-sm`, `rounded-*`, `form-floating`, `form-control`, `form-select`, `input-group`, `table-responsive`, badges, alerts y buttons. `styles.css` queda reservado para ajustes mínimos que no justifican construir CSS propio.

La navbar usa `sticky-top`, por lo que permanece visible al hacer scroll. El botón **Dark mode / Light mode** cambia el color mode nativo de Bootstrap 5.3 mediante el atributo `data-bs-theme` del elemento `<html>`.

`public/js/theme.js`:

- lee la preferencia guardada en `localStorage`;
- si aún no existe, respeta `prefers-color-scheme` del sistema operativo;
- alterna `light` / `dark` desde la navbar;
- vuelve a guardar la elección para las siguientes páginas.

No se mantienen dos hojas CSS distintas: Bootstrap adapta fondos, bordes, controles y texto a partir de `data-bs-theme`.

## API

Endpoints:

```text
GET    /api/v1/health
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/tickets
GET    /api/v1/tickets/:id
POST   /api/v1/tickets
PUT    /api/v1/tickets/:id
DELETE /api/v1/tickets/:id
POST   /api/v1/tickets/:id/attachment
DELETE /api/v1/tickets/:id/attachment
GET    /api/v1/users/:id/summary
```

Las rutas de tickets, archivos y usuarios requieren:

```text
Authorization: Bearer <JWT>
```

## CLI: cómo ejecutarlo

La sintaxis base es:

```bash
npm run cli -- <comando> [opciones]
```

El `--` es importante: separa los argumentos de `npm run` de los argumentos que deben llegar a `src/cli.js` y ser interpretados por yargs.

### Ayuda de yargs

```bash
# Lista todos los comandos disponibles.
npm run cli -- --help

# Muestra las opciones específicas de un comando.
npm run cli -- tickets:create --help
```

### Registro y autenticación

```bash
# Crea User + Profile mediante la API pública.
npm run cli -- register \
  --name "CLI Student" \
  --email cli.student@example.com \
  --password 'Password123!' \
  --phone '+56 9 7777 7777' \
  --birthDate 1994-05-10 \
  --bio "Created from the CLI"

# Obtiene JWT y lo guarda en .helpdesk-token.
npm run cli -- login \
  --email alice@example.com \
  --password 'Password123!'

# Elimina el JWT local.
npm run cli -- logout
```

### CRUD de tickets

```bash
# READ colección.
npm run cli -- tickets:list

# READ colección con filtros.
npm run cli -- tickets:list --status open --urgent --priority 5 --minProgress 10

# Para filtrar urgent=false, yargs permite la negación booleana.
npm run cli -- tickets:list --no-urgent

# READ individual.
npm run cli -- tickets:get --id 1

# CREATE.
npm run cli -- tickets:create \
  --title "Created from CLI" \
  --description "Testing the CLI client" \
  --priority 4 \
  --estimatedHours 2.5 \
  --urgent \
  --progress 10 \
  --dueDate 2026-09-30

# UPDATE: solo se modifican las opciones informadas.
npm run cli -- tickets:update \
  --id 1 \
  --status in_progress \
  --progress 50

# DELETE.
npm run cli -- tickets:delete --id 25
```

### Archivos desde CLI

```bash
# Sube o reemplaza el attachment.
npm run cli -- tickets:upload \
  --id 1 \
  --file ./evidence.png

# Elimina solo el attachment; el ticket permanece.
npm run cli -- tickets:attachment:delete --id 1
```

### Relaciones desde CLI

```bash
# Muestra Profile (1:1), Roles (N:M) y Tickets (1:N).
npm run cli -- users:summary --id 1
```

## SQL directo con pg

```bash
# Ejecuta la consulta parametrizada con status=open.
npm run db:query-demo -- open

# Misma consulta con otro parámetro.
npm run db:query-demo -- closed
```

## Test

```bash
npm test
```

El smoke test levanta Express en un puerto libre, consume `GET /api/v1/health` con `fetch()` y comprueba el status HTTP y el JSON usando `node:assert/strict`.


## Deployment en Railway

La documentación específica de deployment está en:

```text
RAILWAY_DEPLOY.md
```

El proyecto básico ya utiliza `process.env`, `PORT` configurable y un endpoint
`/api/v1/health`, por lo que el deploy inicial puede realizarse sin reescribir
la lógica de la aplicación. El documento separa claramente configuración
obligatoria de mejoras opcionales.
