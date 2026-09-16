import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { jwtSecret } from "../config/env.js";
import { sequelize } from "../config/sequelize.js";
import { Profile, User } from "../models/index.js";
import { AppError } from "../utils/AppError.js";

/**
 * Devuelve una versión segura del usuario para respuestas HTTP.
 * Deliberadamente excluye passwordHash para que nunca salga de la capa backend.
 */
function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    active: user.active,
  };
}

/**
 * Registra User + Profile dentro de una misma transacción.
 *
 * bcrypt.hash(password, 10):
 * - transforma la contraseña en un hash lento y resistente a fuerza bruta;
 * - genera un salt automáticamente;
 * - 10 representa el cost factor usado en este ejercicio.
 *
 * No usamos crypto.createHash("sha256") porque los hashes rápidos no son
 * adecuados para almacenamiento de contraseñas. node:crypto sí ofrece KDF
 * apropiadas como scrypt(), pero bcryptjs simplifica este reforzamiento.
 */
export async function registerUser(data) {
  // sequelize.transaction() abre una transacción manual.
  // Debemos confirmar con commit() o revertir con rollback().
  const transaction = await sequelize.transaction();

  try {
    // Nunca almacenamos la contraseña original.
    const passwordHash = await bcrypt.hash(data.password, 10);

    // User.create() ejecuta un INSERT mediante Sequelize.
    // Pasamos { transaction } para incluir esta operación en la transacción.
    const user = await User.create(
      {
        name: data.name,
        email: data.email,
        passwordHash,
        active: true,
      },
      { transaction },
    );

    // Profile.create() es el segundo INSERT que debe confirmarse junto al User.
    await Profile.create(
      {
        userId: user.id,
        phone: data.phone ?? null,
        birthDate: data.birthDate ?? null,
        bio: data.bio ?? null,
      },
      { transaction },
    );

    // COMMIT hace permanentes ambas operaciones.
    await transaction.commit();

    return sanitizeUser(user);
  } catch (error) {
    // ROLLBACK revierte todo lo ejecutado dentro de la transacción.
    await transaction.rollback();
    throw error;
  }
}

/**
 * Verifica credenciales y, si son válidas, genera un JWT firmado.
 */
export async function loginUser(email, password) {
  // findOne({ where }) traduce la condición a un SELECT filtrado.
  const user = await User.findOne({
    where: { email },
  });

  // Mantenemos el mismo mensaje para correo inexistente, usuario inactivo o
  // password incorrecta para no revelar qué cuentas existen.
  if (!user || !user.active) {
    throw new AppError(401, "Invalid credentials");
  }

  // bcrypt.compare() extrae del hash almacenado el salt/costo requerido y
  // comprueba si la contraseña candidata produce un resultado compatible.
  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(401, "Invalid credentials");
  }

  // jwt.sign(payload, secret, options) genera y firma el token.
  // - sub: claim estándar para identificar al sujeto autenticado.
  // - expiresIn: limita la vida útil del token.
  // - HS256: algoritmo simétrico; la misma clave firma y valida.
  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    jwtSecret,
    {
      expiresIn: "1h",
      algorithm: "HS256",
    },
  );

  return {
    token,
    user: sanitizeUser(user),
  };
}
