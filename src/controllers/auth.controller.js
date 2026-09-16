import { loginUser, registerUser } from "../services/auth.service.js";
import { AppError } from "../utils/AppError.js";

/**
 * Controller de POST /auth/register.
 * Valida requisitos HTTP mínimos y delega la lógica al service.
 */
export async function register(req, res, next) {
  try {
    // req.body existe gracias a express.json() configurado en app.js.
    if (!req.body.name || !req.body.email || !req.body.password) {
      throw new AppError(400, "name, email and password are required");
    }

    const user = await registerUser(req.body);

    // 201 Created indica creación exitosa de un recurso.
    return res.status(201).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    // next(error) entrega el problema al middleware central errorHandler.
    next(error);
  }
}

/**
 * Controller de POST /auth/login.
 */
export async function login(req, res, next) {
  try {
    if (!req.body.email || !req.body.password) {
      throw new AppError(400, "email and password are required");
    }

    const result = await loginUser(req.body.email, req.body.password);

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
