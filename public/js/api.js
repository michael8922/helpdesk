// Claves de localStorage usadas por el cliente Web.
// Guardamos el JWT y una copia mínima del usuario autenticado por separado
// para poder reutilizarlos entre páginas y recargas.
const TOKEN_KEY = "helpdesk_token";
const USER_KEY = "helpdesk_user";

/**
 * Recupera el JWT almacenado por el navegador.
 * localStorage persiste datos incluso si la página se recarga.
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Recupera la información mínima del usuario autenticado.
 * JSON.parse() convierte nuevamente el texto almacenado en un objeto JS.
 */
export function getCurrentUser() {
  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    // Si el valor quedó corrupto, lo eliminamos para evitar trabajar
    // con una sesión local inconsistente.
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

/**
 * Guarda de una vez el token y el usuario devueltos por el login.
 * JSON.stringify() transforma el objeto user en texto persistible.
 */
export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  // Avisamos a componentes globales, como navbar.js, que cambió la sesión.
  window.dispatchEvent(new CustomEvent("helpdesk:session-changed"));
}

/**
 * Borra la sesión local del navegador.
 * En un esquema JWT stateless el backend no mantiene una sesión que cerrar:
 * hacer logout consiste en dejar de conservar el token del lado cliente.
 */
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  // La misma navbar puede reaccionar tanto a login como a logout.
  window.dispatchEvent(new CustomEvent("helpdesk:session-changed"));
}

/**
 * Cliente HTTP común de la capa Web.
 *
 * @param {string} path Ruta relativa de la API, por ejemplo /api/v1/tickets.
 * @param {object} options Opciones compatibles con fetch() más `auth`.
 * @returns {Promise<object|null>} JSON deserializado o null si la API responde 204.
 */
export async function apiFetch(path, options = {}) {
  // Extraemos una opción propia llamada auth y dejamos el resto para fetch().
  // Esta sintaxis se llama destructuring con rest operator.
  const {
    auth = true,
    headers: customHeaders = {},
    ...fetchOptions
  } = options;

  // Headers permite manipular encabezados HTTP sin preocuparnos por mayúsculas
  // y minúsculas en sus nombres.
  const headers = new Headers(customHeaders);

  if (auth) {
    const token = getToken();

    if (!token) {
      // Sin token no podemos consumir endpoints protegidos.
      // Redirigimos al login y detenemos la operación actual.
      window.location.href = "/login";
      throw new Error("Authentication token not found");
    }

    // Bearer es el esquema estándar que usaremos para transportar el JWT.
    headers.set("Authorization", `Bearer ${token}`);
  }

  // IMPORTANTE: no establecemos Content-Type automáticamente.
  // - Para JSON, cada llamada lo indicará explícitamente.
  // - Para FormData, el navegador debe generar multipart/form-data y su boundary.
  const response = await fetch(path, {
    ...fetchOptions,
    headers,
  });

  if (response.status === 401 && auth) {
    // Un 401 puede significar token vencido, ausente o inválido.
    // Limpiamos la sesión local para no seguir reutilizando un token inútil.
    clearSession();
    window.location.href = "/login";
    throw new Error("Session expired or token invalid");
  }

  // 204 No Content no trae cuerpo, por lo que response.json() fallaría.
  const data = response.status === 204 ? null : await response.json();

  // fetch() solo rechaza la Promise por errores de red.
  // Un 400/404/500 sigue siendo una respuesta válida y debemos revisar ok.
  if (!response.ok) {
    throw new Error(data?.message ?? `HTTP ${response.status}`);
  }

  return data;
}
