import { getCurrentUser, getToken } from "./api.js";

// Rutas que no tiene sentido visitar si el usuario ya inició sesión.
const GUEST_ONLY_PATHS = new Set(["/login", "/register"]);

// Estas páginas necesitan una sesión Web para poder consumir su API protegida.
// IMPORTANTE: este redirect mejora la UX; la seguridad real vive en express-jwt.
const PROTECTED_PATHS = new Set(["/tickets", "/account"]);

/**
 * Normaliza una ruta para evitar diferencias entre `/tickets` y `/tickets/`.
 */
function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

/**
 * Consideramos autenticado al navegador cuando conserva un JWT.
 * El usuario guardado es información auxiliar para mostrar nombre/email,
 * pero la autorización definitiva la vuelve a comprobar la API.
 */
function hasWebSession() {
  return Boolean(getToken());
}

/**
 * Muestra u oculta cualquier elemento marcado con data-auth-state.
 * Usamos d-none de Bootstrap en lugar de escribir CSS propio.
 */
function renderAuthVisibility(authenticated) {
  for (const element of document.querySelectorAll('[data-auth-state="guest"]')) {
    element.classList.toggle("d-none", authenticated);
  }

  for (const element of document.querySelectorAll('[data-auth-state="authenticated"]')) {
    element.classList.toggle("d-none", !authenticated);
  }
}

/**
 * Completa la identidad visible del navbar con los datos guardados al hacer login.
 * Si el objeto local no existe, mostramos un texto neutro en vez de fallar.
 */
function renderCurrentUser() {
  const user = getCurrentUser();
  const label = user?.name ?? user?.email ?? "user";

  for (const element of document.querySelectorAll("[data-current-user-name]")) {
    element.textContent = label;
  }
}

/**
 * Resalta el enlace correspondiente a la ruta actual usando la clase active
 * prevista por Bootstrap para navbar links.
 */
function renderActiveLink() {
  const currentPath = normalizePath(window.location.pathname);

  for (const link of document.querySelectorAll("[data-nav-link]")) {
    const linkPath = normalizePath(new URL(link.href, window.location.origin).pathname);
    const active = linkPath === currentPath;

    link.classList.toggle("active", active);

    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  }
}

/**
 * Aplica redirects de experiencia de usuario según la sesión local.
 *
 * - Sin JWT: /tickets y /account vuelven a /login.
 * - Con JWT: /login y /register vuelven a /tickets.
 *
 * El parámetro `next` permite volver a la página originalmente solicitada
 * después de iniciar sesión.
 */
function applyRouteGuard(authenticated) {
  const currentPath = normalizePath(window.location.pathname);

  if (!authenticated && PROTECTED_PATHS.has(currentPath)) {
    const next = `${currentPath}${window.location.search}`;
    window.location.replace(`/login?next=${encodeURIComponent(next)}`);
    return false;
  }

  if (authenticated && GUEST_ONLY_PATHS.has(currentPath)) {
    window.location.replace("/tickets");
    return false;
  }

  return true;
}

/**
 * Sincroniza todo el estado visual del navbar con localStorage.
 */
function refreshNavbar() {
  const authenticated = hasWebSession();

  if (!applyRouteGuard(authenticated)) {
    return;
  }

  renderAuthVisibility(authenticated);
  renderCurrentUser();
  renderActiveLink();
}

// Los módulos se cargan con defer implícito, por lo que al ejecutarse el DOM
// ya suele estar parseado. DOMContentLoaded mantiene el comportamiento explícito.
window.addEventListener("DOMContentLoaded", refreshNavbar);

// setSession() y clearSession() disparan este evento para actualizar la misma
// pestaña sin obligar a duplicar lógica en cada vista.
window.addEventListener("helpdesk:session-changed", refreshNavbar);

// `storage` permite reflejar login/logout hechos desde otra pestaña del navegador.
window.addEventListener("storage", refreshNavbar);
