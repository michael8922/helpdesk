import "dotenv/config";

/**
 * Obtiene una variable de entorno obligatoria.
 *
 * IMPORTANTE PARA DEPLOY:
 * -----------------------
 * Este archivo ya era portable antes de desplegar.
 *
 * LOCAL:
 *   dotenv carga los valores desde `.env`.
 *
 * RAILWAY:
 *   Railway entrega los valores directamente a `process.env`.
 *
 * Por eso NO necesitamos crear un `env.railway.js` ni cambiar la lógica
 * según NODE_ENV. Cambian los valores externos, no este código.
 *
 * Centralizar esta validación evita que pg o Sequelize reciban `undefined`
 * y produzcan errores poco claros cuando falta configuración.
 */
function requireEnv(name) {
  if (process.env[name] === undefined) {
    throw new Error(
      `Missing environment variable ${name}. ` +
        "Copy .env.example to .env and configure your local credentials.",
    );
  }

  return process.env[name];
}

// Credenciales PostgreSQL separadas.
// A diferencia de una URI, aquí cada dato de conexión queda explícito.
//
// LOCAL:
//   DB_HOST=localhost
//
// RAILWAY:
//   DB_HOST puede ser una Reference Variable como:
//   ${{Postgres.PGHOST}}
//
// Railway resuelve esa sintaxis antes de iniciar Node.
// Este archivo solo recibe el resultado mediante process.env.DB_HOST.
export const databaseConfig = {
  host: requireEnv("DB_HOST"),
  port: Number(requireEnv("DB_PORT")),
  database: requireEnv("DB_NAME"),
  user: requireEnv("DB_USER"),
  password: requireEnv("DB_PASSWORD"),
};

// Validamos que DB_PORT realmente pueda interpretarse como número.
if (!Number.isInteger(databaseConfig.port) || databaseConfig.port <= 0) {
  throw new Error("DB_PORT must be a positive integer.");
}

// JWT_SECRET también es obligatorio para que login y express-jwt
// utilicen exactamente la misma clave.
export const jwtSecret = requireEnv("JWT_SECRET");

if (!jwtSecret) {
  throw new Error("JWT_SECRET must not be empty.");
}

// PORT no es una credencial. Si no se configura usamos 3000.
//
// Este código YA es compatible con Railway:
// Railway inyecta una variable PORT en el servicio y appPort la utiliza.
// Por eso no necesitamos hardcodear otro puerto ni modificar server.js
// solamente por desplegar.
export const appPort = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(appPort) || appPort <= 0) {
  throw new Error("PORT must be a positive integer.");
}
