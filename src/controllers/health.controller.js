/**
 * Endpoint de salud para comprobar rápidamente que Express responde.
 * También es el objetivo del smoke test con Mocha.
 *
 * En Railway podemos reutilizarlo como Healthcheck Path:
 *
 *   /api/v1/health
 *
 * Railway considera exitoso el healthcheck cuando obtiene una respuesta 2xx.
 * Esta configuración se hace en Railway; el endpoint ya estaba implementado.
 *
 * El healthcheck de Railway se usa durante el deployment para decidir cuándo
 * la nueva instancia está lista. No reemplaza monitorización continua.
 */
export function getHealth(req, res) {
  return res.status(200).json({
    status: "success",
    data: {
      service: "helpdesk-api",
      healthy: true,
    },
  });
}
