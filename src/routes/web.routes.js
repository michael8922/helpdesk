import { Router } from "express";
import {
  renderAccount,
  renderHome,
  renderLogin,
  renderLogout,
  renderRegister,
  renderTickets,
} from "../controllers/page.controller.js";

// Router() crea un mini-router modular que después montamos desde app.js.
const router = Router();

// Estas rutas entregan HTML renderizado por Handlebars.
// No deben confundirse con /api/v1, que representa la interfaz JSON.
router.get("/", renderHome);
router.get("/login", renderLogin);
router.get("/register", renderRegister);
router.get("/logout", renderLogout);
router.get("/tickets", renderTickets);
router.get("/account", renderAccount);

export default router;
