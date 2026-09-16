import app from "./app.js";
import { appPort } from "./config/env.js";
import { sequelize } from "./config/sequelize.js";
import "./models/index.js";

try {
  // authenticate() comprueba que las credenciales sean válidas y que
  // PostgreSQL esté accesible. No crea ni modifica tablas.
  await sequelize.authenticate();

  /**
   * DEPLOY EN RAILWAY
   * -----------------
   *
   * No pasamos un `host` a app.listen().
   *
   * En Node.js, cuando el host se omite, el servidor escucha en la dirección
   * no especificada IPv6 (`::`) cuando está disponible o en `0.0.0.0`
   * en caso contrario. Por eso este código puede funcionar correctamente
   * dentro de Railway SIN agregar explícitamente `"0.0.0.0"`.
   *
   * Escribir `"0.0.0.0"` sería una forma opcional de dejar explícita la
   * intención de escuchar fuera de loopback; NO es un requisito para este
   * proyecto y no debemos enseñarlo como una modificación obligatoria.
   *
   * Lo que sí sería restrictivo sería fijar explícitamente:
   *
   *   "localhost"
   *   "127.0.0.1"
   *
   * El texto del console.log usa localhost porque fue escrito pensando en
   * ejecución local. Ese texto NO configura la interfaz de red.
   */
  app.listen(appPort, () => {
    console.log(`HelpDesk running on http://localhost:${appPort}`);
  });
} catch (error) {
  // Un fallo aquí suele indicar credenciales incorrectas, PostgreSQL apagado
  // o una base DB_NAME que todavía no existe.
  console.error("Could not start server:", error);
  process.exit(1);
}
