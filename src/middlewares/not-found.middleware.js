/**
 * Fallback para URLs que no coincidieron con ninguna route anterior.
 * Se registra después de las rutas API y Web.
 */
export function notFound(req, res) {
  return res.status(404).json({
    status: "error",
    message: "Route not found",
  });
}
