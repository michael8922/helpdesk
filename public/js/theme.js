/**
 * Clave usada para recordar la preferencia visual del usuario.
 * localStorage persiste el valor incluso después de cerrar el navegador.
 */
const THEME_STORAGE_KEY = "helpdesk-theme";

/**
 * Devuelve el tema inicial.
 * 1) Si el usuario ya eligió light/dark, respetamos localStorage.
 * 2) Si no existe preferencia guardada, consultamos el esquema del sistema operativo.
 */
function getInitialTheme() {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

/**
 * Aplica el color mode nativo de Bootstrap 5.3.
 * Bootstrap observa data-bs-theme y ajusta automáticamente sus variables CSS.
 */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
}

/**
 * Sincroniza texto, icono y estado accesible del botón con el tema activo.
 * La etiqueta describe la acción disponible, no el estado actual.
 */
function updateToggleButton(theme) {
  const button = document.querySelector("#theme-toggle");
  const icon = document.querySelector("#theme-toggle-icon");
  const label = document.querySelector("#theme-toggle-label");

  if (!button || !icon || !label) {
    return;
  }

  const isDark = theme === "dark";

  button.setAttribute("aria-pressed", String(isDark));
  icon.textContent = isDark ? "☀" : "☾";
  label.textContent = isDark ? "Light mode" : "Dark mode";
}

// Aplicamos el tema antes de renderizar el contenido principal de la página.
applyTheme(getInitialTheme());

/**
 * Cuando el DOM está disponible conectamos el botón de la navbar.
 * Cada click alterna light/dark y guarda la selección en localStorage.
 */
window.addEventListener("DOMContentLoaded", () => {
  const button = document.querySelector("#theme-toggle");
  let currentTheme = document.documentElement.getAttribute("data-bs-theme") ?? "light";

  updateToggleButton(currentTheme);

  if (!button) {
    return;
  }

  button.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";

    localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    applyTheme(currentTheme);
    updateToggleButton(currentTheme);
  });
});
