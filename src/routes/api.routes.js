import { Router } from "express";
import { getHealth } from "../controllers/health.controller.js";
import authRouter from "./auth.routes.js";
import ticketRouter from "./ticket.routes.js";
import userRouter from "./user.routes.js";

// Router() permite dividir la API en archivos sin crear otra aplicación Express.
const router = Router();

// Health permanece público para diagnóstico y pruebas.
//
// DEPLOY:
// app.js monta este router en `/api/v1`, por lo que la URL final es:
//
//   GET /api/v1/health
//
// Railway puede usar exactamente ese path como healthcheck.
// La ruta YA existía: no fue necesario crearla para que el proyecto
// pudiera desplegarse.
router.get("/health", getHealth);

// router.use(prefijo, subrouter) delega grupos completos de endpoints.
router.use("/auth", authRouter);
router.use("/tickets", ticketRouter);
router.use("/users", userRouter);

export default router;
