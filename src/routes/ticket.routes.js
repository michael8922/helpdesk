import { Router } from "express";
import {
  getTicket,
  listTickets,
  postTicket,
  putTicket,
  removeTicket,
} from "../controllers/ticket.controller.js";
import {
  removeTicketAttachment,
  uploadTicketAttachment,
} from "../controllers/file.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// router.use(requireAuth) aplica el middleware a TODAS las rutas declaradas
// después de esta línea. Si JWT falla, el controller ni siquiera se ejecuta.
router.use(requireAuth);

// CRUD REST del recurso Ticket.
router.get("/", listTickets);
router.get("/:id", getTicket);
router.post("/", postTicket);
router.put("/:id", putTicket);
router.delete("/:id", removeTicket);

// Operaciones de archivo subordinadas al ticket identificado por :id.
router.post("/:id/attachment", uploadTicketAttachment);
router.delete("/:id/attachment", removeTicketAttachment);

export default router;
