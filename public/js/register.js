import { apiFetch } from "./api.js";

const form = document.querySelector("#register-form");
const message = document.querySelector("#register-message");

/**
 * Muestra feedback visual mediante clases de Alert de Bootstrap.
 */
function showMessage(text, type) {
  message.textContent = text;
  message.className = `alert alert-${type} mt-3`;
}

/**
 * Lee el formulario y construye exactamente el objeto que espera
 * POST /api/v1/auth/register.
 */
function readRegisterForm() {
  const birthDate = document.querySelector("#birth-date").value;

  return {
    name: document.querySelector("#name").value.trim(),
    email: document.querySelector("#email").value.trim(),
    password: document.querySelector("#password").value,
    phone: document.querySelector("#phone").value.trim() || null,
    birthDate: birthDate || null,
    bio: document.querySelector("#bio").value.trim() || null,
  };
}

form.addEventListener("submit", async (event) => {
  // Interceptamos el submit para enviar JSON con fetch().
  event.preventDefault();

  try {
    await apiFetch("/api/v1/auth/register", {
      // El registro es público porque el usuario aún no tiene token.
      auth: false,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(readRegisterForm()),
    });

    showMessage("Account created. Redirecting to login...", "success");
    form.reset();

    // El registro no inicia sesión automáticamente en este ejercicio.
    // La pequeña espera permite alcanzar a leer el mensaje de éxito.
    window.setTimeout(() => {
      window.location.href = "/login";
    }, 900);
  } catch (error) {
    showMessage(error.message, "danger");
  }
});
