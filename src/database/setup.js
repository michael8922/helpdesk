import { sequelize } from "../config/sequelize.js";
import "../models/index.js";
import { seedDatabase } from "./seed.js";

try {
  // authenticate() ejecuta una comprobación de conexión sin crear tablas.
  await sequelize.authenticate();
  console.log("PostgreSQL connection verified.");

  // sync() compara los modelos cargados con la BD y crea el esquema necesario.
  //
  // DEPLOY:
  // force:true elimina tablas existentes antes de recrearlas. Por eso este
  // script NO debe ponerse como Start Command ni como Pre-Deploy permanente.
  //
  // En una BD demo puede ejecutarse deliberadamente una vez para inicializar
  // o resetear los datos. En un sistema con datos reales usaríamos migrations.
  await sequelize.sync({ force: true });
  console.log("Database schema synchronized.");

  // El seed se ejecuta después de sync() porque necesita tablas existentes.
  await seedDatabase();
} catch (error) {
  console.error("Database setup failed:", error);
  process.exitCode = 1;
} finally {
  // close() libera conexiones abiertas por Sequelize al terminar el script.
  await sequelize.close();
}
