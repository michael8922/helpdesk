import { expressjwt } from "express-jwt";
import { jwtSecret } from "../config/env.js";

// expressjwt() construye un middleware de Express.
// El middleware busca por defecto el token en:
// Authorization: Bearer <token>
//
// Si la firma es válida y el token no expiró, express-jwt deja el payload
// decodificado en req.auth para los middlewares/controllers siguientes.
export const requireAuth = expressjwt({
  // Debe ser la misma clave usada por jsonwebtoken.sign().
  secret: jwtSecret,

  // Declarar algoritmos explícitamente evita aceptar algoritmos inesperados.
  algorithms: ["HS256"],
});
