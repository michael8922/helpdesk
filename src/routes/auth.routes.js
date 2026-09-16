import { Router } from "express";
import { login, register } from "../controllers/auth.controller.js";

const router = Router();

// Registro y login son públicos: ambos ocurren antes de disponer de JWT.
router.post("/register", register);
router.post("/login", login);

export default router;
