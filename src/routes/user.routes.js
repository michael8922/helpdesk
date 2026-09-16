import { Router } from "express";
import { getUserSummary } from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// El resumen contiene información de usuario y por eso exige JWT válido.
router.use(requireAuth);

// Endpoint didáctico para eager loading 1:1, 1:N y N:M.
router.get("/:id/summary", getUserSummary);

export default router;
