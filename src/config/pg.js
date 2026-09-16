import pg from "pg";
import { databaseConfig } from "./env.js";

// El paquete pg exporta varias piezas; extraemos específicamente Pool.
const { Pool } = pg;

// Pool administra y reutiliza conexiones PostgreSQL.
// Usamos las mismas credenciales separadas que Sequelize para que ambas
// capas se conecten a exactamente la misma base de datos.
export const pool = new Pool({
  host: databaseConfig.host,
  port: databaseConfig.port,
  database: databaseConfig.database,
  user: databaseConfig.user,
  password: databaseConfig.password,
});
