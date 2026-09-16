import { Sequelize } from "sequelize";
import { databaseConfig } from "./env.js";

// Sequelize acepta las credenciales como argumentos separados:
// database, username y password.
// Las opciones host/port completan la ubicación del servidor PostgreSQL.
export const sequelize = new Sequelize(
  databaseConfig.database,
  databaseConfig.user,
  databaseConfig.password,
  {
    host: databaseConfig.host,
    port: databaseConfig.port,

    // El dialecto le indica a Sequelize qué variante de SQL debe generar.
    dialect: "postgres",

    // Ocultamos el SQL generado para mantener la consola limpia.
    // Para depurar se puede cambiar temporalmente a console.log.
    logging: false,
  },
);
