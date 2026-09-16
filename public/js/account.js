import { apiFetch, getCurrentUser, getToken } from "./api.js";

const message = document.querySelector("#account-message");
const rolesContainer = document.querySelector("#account-roles");
const ticketBody = document.querySelector("#account-ticket-body");

/**
 * Muestra un error o mensaje informativo mediante Bootstrap Alert.
 */
function showMessage(text, type = "danger") {
  message.textContent = text;
  message.className = `alert alert-${type}`;
}

/**
 * Escribe valores simples del User y su Profile en elementos del DOM.
 */
function renderUserAndProfile(user) {
  document.querySelector("#account-user-id").textContent = user.id;
  document.querySelector("#account-name").textContent = user.name;
  document.querySelector("#account-email").textContent = user.email;
  document.querySelector("#account-active").textContent = String(user.active);

  // Optional chaining evita un error si profile fuera null.
  document.querySelector("#account-phone").textContent = user.profile?.phone ?? "-";
  document.querySelector("#account-birth-date").textContent = user.profile?.birthDate ?? "-";
  document.querySelector("#account-bio").textContent = user.profile?.bio ?? "-";
}

/**
 * Renderiza la relación N:M User ↔ Role.
 * Cada objeto role puede incluir datos de la entidad intermedia UserRole.
 */
function renderRoles(roles) {
  rolesContainer.replaceChildren();

  for (const role of roles) {
    const badge = document.createElement("span");
    badge.className = "badge rounded-pill text-bg-warning";
    badge.textContent = role.name;
    rolesContainer.appendChild(badge);
  }

  if (roles.length === 0) {
    rolesContainer.textContent = "No roles assigned.";
  }
}

/**
 * Renderiza la colección 1:N User → Ticket en una tabla Bootstrap.
 */
function renderTickets(tickets) {
  ticketBody.replaceChildren();

  for (const ticket of tickets) {
    const row = document.createElement("tr");

    for (const value of [
      ticket.id,
      ticket.title,
      ticket.status,
      ticket.priority,
      `${ticket.progress}%`,
    ]) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    }

    ticketBody.appendChild(row);
  }
}

/**
 * Obtiene desde la API el resumen relacional del usuario autenticado.
 */
async function loadAccountSummary() {
  const currentUser = getCurrentUser();

  if (!getToken() || !currentUser) {
    // La vista necesita tanto JWT como el id del usuario guardado al hacer login.
    window.location.href = "/login";
    return;
  }

  try {
    const result = await apiFetch(`/api/v1/users/${currentUser.id}/summary`);
    const user = result.data;

    renderUserAndProfile(user);
    renderRoles(user.roles ?? []);
    renderTickets(user.tickets ?? []);
  } catch (error) {
    showMessage(error.message);
  }
}

await loadAccountSummary();
