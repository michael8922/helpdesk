import {
  createTicket,
  deleteTicket,
  findAllTickets,
  findTicketById,
  updateTicket,
} from "../services/ticket.service.js";

/** READ colección: GET /tickets */
export async function listTickets(req, res, next) {
  try {
    // req.query contiene filtros de la URL, por ejemplo ?status=open.
    const tickets = await findAllTickets(req.query);

    return res.status(200).json({
      status: "success",
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
}

/** READ individual: GET /tickets/:id */
export async function getTicket(req, res, next) {
  try {
    // req.params.id corresponde al segmento dinámico :id de la ruta.
    const ticket = await findTicketById(req.params.id);

    return res.status(200).json({
      status: "success",
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
}

/** CREATE: POST /tickets */
export async function postTicket(req, res, next) {
  try {
    // express-jwt valida el token antes del controller y deja su payload
    // decodificado dentro de req.auth.
    const authenticatedUserId = req.auth.sub;

    const ticket = await createTicket(req.body, authenticatedUserId);

    return res.status(201).json({
      status: "success",
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
}

/** UPDATE: PUT /tickets/:id */
export async function putTicket(req, res, next) {
  try {
    const ticket = await updateTicket(req.params.id, req.body);

    return res.status(200).json({
      status: "success",
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
}

/** DELETE: DELETE /tickets/:id */
export async function removeTicket(req, res, next) {
  try {
    await deleteTicket(req.params.id);

    // 204 No Content representa éxito sin cuerpo de respuesta.
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}
