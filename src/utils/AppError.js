// AppError transporta un status HTTP junto con un mensaje de dominio.
// Los services pueden lanzar este error sin depender directamente de res.json().
export class AppError extends Error {
  /**
   * @param {number} statusCode Código HTTP que debería recibir el cliente.
   * @param {string} message Mensaje seguro y legible para el cliente.
   */
  constructor(statusCode, message) {
    // super() ejecuta el constructor de Error y registra message correctamente.
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}
