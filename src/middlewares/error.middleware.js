import { UniqueConstraintError, ValidationError } from "sequelize";
import { AppError } from "../utils/AppError.js";

/**
 * Middleware central de errores de Express.
 * Una función con cuatro parámetros (error, req, res, next) es reconocida
 * por Express como error middleware y debe registrarse al final de app.js.
 */
export function errorHandler(error, req, res, next) {
  // express-jwt genera UnauthorizedError cuando falta el token, expiró
  // o no puede validarse con la clave/algoritmo configurados.
  if (error.name === "UnauthorizedError") {
    return res.status(401).json({
      status: "error",
      message: "Invalid or missing token",
    });
  }

  // Sequelize lanza UniqueConstraintError al violar UNIQUE, como email repetido.
  if (error instanceof UniqueConstraintError) {
    return res.status(409).json({
      status: "error",
      message: "A unique value already exists",
    });
  }

  // ValidationError agrupa validaciones declaradas en los modelos.
  if (error instanceof ValidationError) {
    return res.status(400).json({
      status: "error",
      message: error.errors.map((item) => item.message).join("; "),
    });
  }

  // AppError representa errores esperables de nuestra lógica de aplicación.
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: "error",
      message: error.message,
    });
  }

  // Los errores inesperados sí se registran para diagnóstico del servidor.
  console.error(error);

  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
}
