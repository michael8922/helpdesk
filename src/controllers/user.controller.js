import { findUserSummary } from "../services/user.service.js";

/**
 * GET /users/:id/summary.
 * Este endpoint existe para visualizar las tres asociaciones Sequelize juntas.
 */
export async function getUserSummary(req, res, next) {
  try {
    const user = await findUserSummary(req.params.id);

    return res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    next(error);
  }
}
