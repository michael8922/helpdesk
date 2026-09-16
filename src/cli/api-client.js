import "dotenv/config";
import { readToken } from "./token-store.js";

// El CLI es un cliente HTTP real: no importa modelos ni conecta a PostgreSQL.
// API_URL permite apuntarlo a otro servidor sin cambiar el código.
const baseUrl = process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;

/**
 * Cliente HTTP reutilizable del CLI.
 *
 * @param {string} path Ruta de la API, por ejemplo /api/v1/tickets.
 * @param {object} options Opciones de fetch() más la bandera propia `auth`.
 * @returns {Promise<object|null>} JSON deserializado o null en respuestas 204.
 */
export async function apiRequest(path, options = {}) {
  // auth=true significa que agregaremos Authorization: Bearer <token>.
  const {
    auth = true,
    headers: customHeaders = {},
    ...fetchOptions
  } = options;

  const headers = new Headers(customHeaders);

  if (auth) {
    const token = await readToken();

    if (!token) {
      throw new Error("No CLI token found. Run the login command first.");
    }

    headers.set("Authorization", `Bearer ${token}`);
  }

  // Node moderno expone fetch(), Headers, Blob y FormData globalmente.
  const response = await fetch(`${baseUrl}${path}`, {
    ...fetchOptions,
    headers,
  });

  // DELETE /tickets/:id responde 204, por lo que no intentamos leer JSON.
  const data = response.status === 204 ? null : await response.json();

  // Igual que en el navegador, fetch() no lanza error por un HTTP 400/500.
  // response.ok concentra los status 200-299.
  if (!response.ok) {
    throw new Error(data?.message ?? `HTTP ${response.status}`);
  }

  return data;
}
