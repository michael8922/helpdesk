import { apiFetch, setSession } from "./api.js";

// Referencias a elementos del DOM que reutilizaremos durante el login.
const form = document.querySelector("#login-form");
const message = document.querySelector("#login-message");

/**
 * Muestra feedback usando el componente Alert de Bootstrap.
 * Cambiamos las clases CSS para escoger alert-success o alert-danger.
 */
function showMessage(text, type) {
  message.textContent = text;
  message.className = `alert alert-${type} mt-3`;
}

// submit se dispara al presionar el botón o Enter dentro del formulario.
form.addEventListener("submit", async (event) => {
  // Evitamos el submit HTML tradicional porque queremos consumir JSON
  // desde la API utilizando Fetch API.
  event.preventDefault();

  const email = document.querySelector("#email").value.trim();
  const password = document.querySelector("#password").value;

  try {
    const result = await apiFetch("/api/v1/auth/login", {
      // El login es público: todavía no poseemos JWT.
      auth: false,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // fetch() no serializa objetos automáticamente.
      body: JSON.stringify({ email, password }),
    });

    // La API devuelve tanto el JWT como información mínima del usuario.
    // Guardamos ambos para que otras páginas puedan reutilizarlos.
    setSession(result.data.token, result.data.user);

    showMessage("Login successful. Redirecting...", "success");

    // Si navbar.js nos envió a login desde una página protegida, `next`
    // conserva ese destino. Validamos que sea una ruta local para evitar
    // convertir este parámetro en un open redirect hacia otro dominio.
    const next = new URLSearchParams(window.location.search).get("next");
    const safeDestination =
      next && next.startsWith("/") && !next.startsWith("//")
        ? next
        : "/tickets";

    window.location.replace(safeDestination);
  } catch (error) {
    showMessage(error.message, "danger");
  }
});
