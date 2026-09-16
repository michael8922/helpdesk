import { Profile, Role, Ticket, User } from "../models/index.js";
import { AppError } from "../utils/AppError.js";

/**
 * Recupera un User junto con las tres relaciones del modelo didáctico:
 * - 1:1 Profile
 * - N:M Roles a través de UserRole
 * - 1:N Tickets
 */
export async function findUserSummary(id) {
  const user = await User.findByPk(id, {
    // attributes limita columnas directas de User en la respuesta.
    attributes: ["id", "name", "email", "active"],
    include: [
      {
        model: Profile,
        as: "profile",
      },
      {
        model: Role,
        as: "roles",
        attributes: ["id", "name"],

        // through controla los atributos expuestos desde UserRole.
        through: {
          attributes: ["assignedAt", "assignedBy"],
        },
      },
      {
        model: Ticket,
        as: "tickets",
        attributes: ["id", "title", "status", "priority", "progress"],
      },
    ],
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
}
