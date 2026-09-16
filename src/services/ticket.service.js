import { Op } from "sequelize";
import { Ticket, User } from "../models/index.js";
import { AppError } from "../utils/AppError.js";

// Lista blanca de campos editables.
// userId y attachmentPath se controlan desde el servidor y no se aceptan
// libremente desde req.body para evitar sobreescrituras no autorizadas.
const editableFields = [
  "title",
  "description",
  "status",
  "priority",
  "estimatedHours",
  "urgent",
  "progress",
  "dueDate",
];

/**
 * Conserva únicamente propiedades permitidas.
 * Object.entries() transforma un objeto en pares [clave, valor]; filter()
 * elimina claves no autorizadas y Object.fromEntries() reconstruye el objeto.
 */
function pickEditableFields(data) {
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => editableFields.includes(key)),
  );
}

/**
 * Convierte req.query en un objeto `where` de Sequelize.
 */
function buildWhere(filters) {
  const where = {};

  // Filtro categórico exacto: ?status=open.
  if (filters.status) {
    where.status = filters.status;
  }

  // Los query params llegan como texto; convertimos "true"/"false" a boolean.
  if (filters.urgent === "true" || filters.urgent === "false") {
    where.urgent = filters.urgent === "true";
  }

  // Number() transforma el texto de la URL en número para el filtro ordinal.
  if (filters.priority) {
    where.priority = Number(filters.priority);
  }

  // Op.gte significa "greater than or equal" y Sequelize lo traduce a >=.
  if (filters.minProgress) {
    where.progress = {
      [Op.gte]: Number(filters.minProgress),
    };
  }

  return where;
}

/**
 * READ colección con filtros y eager loading de User.
 */
export async function findAllTickets(filters = {}) {
  return Ticket.findAll({
    where: buildWhere(filters),

    // include realiza eager loading: Sequelize obtiene la relación Ticket→User
    // como parte de la consulta en vez de exigir una consulta posterior manual.
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email"],
      },
    ],

    // order produce ORDER BY id ASC.
    order: [["id", "ASC"]],
  });
}

/**
 * READ individual por PK.
 */
export async function findTicketById(id) {
  // findByPk() busca directamente por la primary key del modelo.
  const ticket = await Ticket.findByPk(id, {
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email"],
      },
    ],
  });

  if (!ticket) {
    throw new AppError(404, "Ticket not found");
  }

  return ticket;
}

/**
 * CREATE. El propietario proviene del JWT validado, no del body del cliente.
 */
export async function createTicket(data, authenticatedUserId) {
  return Ticket.create({
    ...pickEditableFields(data),
    userId: authenticatedUserId,
  });
}

/**
 * UPDATE de campos permitidos.
 */
export async function updateTicket(id, data) {
  const ticket = await Ticket.findByPk(id);

  if (!ticket) {
    throw new AppError(404, "Ticket not found");
  }

  // instance.update() actualiza el objeto y persiste el UPDATE en PostgreSQL.
  return ticket.update(pickEditableFields(data));
}

/**
 * DELETE del ticket completo.
 */
export async function deleteTicket(id) {
  const ticket = await Ticket.findByPk(id);

  if (!ticket) {
    throw new AppError(404, "Ticket not found");
  }

  // destroy() sobre una instancia ejecuta DELETE para esa fila.
  await ticket.destroy();
}
