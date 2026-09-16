import { apiFetch, getToken } from "./api.js";

// Referencias a elementos de la vista. querySelector() recibe selectores CSS.
const tableBody = document.querySelector("#ticket-table-body");
const ticketForm = document.querySelector("#ticket-form");
const filterForm = document.querySelector("#filter-form");
const attachmentInput = document.querySelector("#attachment-input");
const message = document.querySelector("#page-message");
const cancelEditButton = document.querySelector("#cancel-edit");
const clearFiltersButton = document.querySelector("#clear-filters");
const formTitle = document.querySelector("#form-title");
const detailModalElement = document.querySelector("#ticket-detail-modal");

/**
 * Muestra feedback usando un Alert de Bootstrap.
 * `type` corresponde a variantes como success, danger o warning.
 */
function showMessage(text, type = "success") {
  message.textContent = text;
  message.className = `alert alert-${type}`;
}

/**
 * Oculta el Alert reutilizando la clase utility d-none de Bootstrap.
 */
function hideMessage() {
  message.className = "alert d-none";
}

/**
 * Devuelve el formulario a modo CREATE.
 * Cuando existe ticket-id, el mismo formulario funciona en modo UPDATE.
 */
function resetTicketForm() {
  ticketForm.reset();
  document.querySelector("#ticket-id").value = "";
  document.querySelector("#priority").value = "3";
  document.querySelector("#progress").value = "0";
  document.querySelector("#status").value = "open";
  formTitle.textContent = "Create ticket";
  cancelEditButton.classList.add("d-none");
}

/**
 * Convierte los controles de filtros en query params para GET /tickets.
 * URLSearchParams se encarga de codificar correctamente la URL.
 */
function buildFilters() {
  const params = new URLSearchParams();
  const status = document.querySelector("#filter-status").value;
  const urgent = document.querySelector("#filter-urgent").value;
  const priority = document.querySelector("#filter-priority").value;
  const minProgress = document.querySelector("#filter-min-progress").value;

  if (status) params.set("status", status);
  if (urgent) params.set("urgent", urgent);
  if (priority) params.set("priority", priority);
  if (minProgress) params.set("minProgress", minProgress);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Factory pequeña para no repetir la creación de botones de acción.
 * Recibe el texto, las clases Bootstrap y el callback que atenderá click.
 */
function createActionButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

/**
 * Completa una celda del modal de detalle evitando insertar HTML recibido.
 * textContent es preferible a innerHTML cuando mostramos datos de usuario.
 */
function setDetailText(selector, value) {
  document.querySelector(selector).textContent = value ?? "-";
}

/**
 * Renderiza la colección de tickets dentro de <tbody>.
 * Esta función transforma JSON recibido por Fetch API en nodos DOM.
 */
function renderTickets(tickets) {
  // replaceChildren() elimina todas las filas anteriores de una vez.
  tableBody.replaceChildren();

  for (const ticket of tickets) {
    const row = document.createElement("tr");

    // Optional chaining (?.) y nullish coalescing (??) permiten manejar
    // relaciones o valores opcionales sin lanzar errores.
    const values = [
      ticket.id,
      ticket.title,
      ticket.status,
      ticket.priority,
      `${ticket.progress}%`,
      ticket.user?.name ?? "-",
    ];

    for (const value of values) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    }

    const actionCell = document.createElement("td");
    actionCell.className = "ticket-actions";

    const group = document.createElement("div");
    group.className = "d-flex flex-wrap gap-1";

    // READ individual: muestra GET /tickets/:id en un Modal Bootstrap.
    group.appendChild(
      createActionButton("View", "btn btn-sm btn-outline-info", () => {
        viewTicket(ticket.id);
      }),
    );

    // UPDATE: primero obtenemos el ticket individual y rellenamos el form.
    group.appendChild(
      createActionButton("Edit", "btn btn-sm btn-outline-primary", () => {
        loadTicketIntoForm(ticket.id);
      }),
    );

    // DELETE del recurso Ticket.
    group.appendChild(
      createActionButton("Delete", "btn btn-sm btn-outline-danger", () => {
        deleteTicket(ticket.id);
      }),
    );

    // Upload: dataset guarda temporalmente qué ticket recibirá el archivo.
    group.appendChild(
      createActionButton("Attach", "btn btn-sm btn-outline-secondary", () => {
        attachmentInput.dataset.ticketId = ticket.id;
        attachmentInput.click();
      }),
    );

    if (ticket.attachmentPath) {
      // Link directo al archivo servido por express.static('/uploads').
      const link = document.createElement("a");
      link.href = ticket.attachmentPath;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.className = "btn btn-sm btn-outline-success";
      link.textContent = "File";
      group.appendChild(link);

      // DELETE específico del archivo, sin eliminar el ticket.
      group.appendChild(
        createActionButton("Remove file", "btn btn-sm btn-outline-warning", () => {
          deleteAttachment(ticket.id);
        }),
      );
    }

    actionCell.appendChild(group);
    row.appendChild(actionCell);
    tableBody.appendChild(row);
  }
}

/**
 * READ colección. Aplica los filtros actuales como req.query en la API.
 */
async function loadTickets() {
  try {
    hideMessage();
    const result = await apiFetch(`/api/v1/tickets${buildFilters()}`);
    renderTickets(result.data);
  } catch (error) {
    showMessage(error.message, "danger");
  }
}

/**
 * READ individual destinado a visualización.
 * Bootstrap.Modal.getOrCreateInstance() obtiene o crea la instancia JS
 * vinculada al elemento modal y luego show() la abre.
 */
async function viewTicket(id) {
  try {
    const result = await apiFetch(`/api/v1/tickets/${id}`);
    const ticket = result.data;

    document.querySelector("#ticket-detail-title").textContent = `Ticket #${ticket.id}`;
    setDetailText("#detail-title", ticket.title);
    setDetailText("#detail-description", ticket.description);
    setDetailText("#detail-status", ticket.status);
    setDetailText("#detail-priority", ticket.priority);
    setDetailText("#detail-estimated-hours", ticket.estimatedHours);
    setDetailText("#detail-urgent", String(ticket.urgent));
    setDetailText("#detail-progress", `${ticket.progress}%`);
    setDetailText("#detail-due-date", ticket.dueDate);
    setDetailText("#detail-owner", ticket.user?.email);
    setDetailText("#detail-attachment", ticket.attachmentPath);

    // bootstrap existe como variable global porque main.hbs carga bootstrap.bundle.
    const modal = bootstrap.Modal.getOrCreateInstance(detailModalElement);
    modal.show();
  } catch (error) {
    showMessage(error.message, "danger");
  }
}

/**
 * READ individual destinado a edición.
 * Rellena los controles del formulario con la respuesta de la API.
 */
async function loadTicketIntoForm(id) {
  try {
    const result = await apiFetch(`/api/v1/tickets/${id}`);
    const ticket = result.data;

    document.querySelector("#ticket-id").value = ticket.id;
    document.querySelector("#title").value = ticket.title;
    document.querySelector("#description").value = ticket.description ?? "";
    document.querySelector("#status").value = ticket.status;
    document.querySelector("#priority").value = ticket.priority;
    document.querySelector("#estimated-hours").value = ticket.estimatedHours ?? "";
    document.querySelector("#progress").value = ticket.progress;
    document.querySelector("#due-date").value = ticket.dueDate ?? "";
    document.querySelector("#urgent").checked = ticket.urgent;

    formTitle.textContent = `Edit ticket #${ticket.id}`;
    cancelEditButton.classList.remove("d-none");
  } catch (error) {
    showMessage(error.message, "danger");
  }
}

/**
 * Convierte valores del formulario HTML en el objeto esperado por la API.
 * Los <input> entregan strings, por lo que Number() convierte magnitudes.
 */
function readTicketForm() {
  const estimatedHours = document.querySelector("#estimated-hours").value;
  const dueDate = document.querySelector("#due-date").value;

  return {
    title: document.querySelector("#title").value.trim(),
    description: document.querySelector("#description").value.trim(),
    status: document.querySelector("#status").value,
    priority: Number(document.querySelector("#priority").value),
    estimatedHours: estimatedHours === "" ? null : Number(estimatedHours),
    urgent: document.querySelector("#urgent").checked,
    progress: Number(document.querySelector("#progress").value),
    dueDate: dueDate || null,
  };
}

/**
 * CREATE o UPDATE según exista un id oculto en el formulario.
 * POST crea recursos; PUT modifica el ticket indicado por la URL.
 */
async function saveTicket(event) {
  event.preventDefault();

  const id = document.querySelector("#ticket-id").value;
  const payload = readTicketForm();
  const url = id ? `/api/v1/tickets/${id}` : "/api/v1/tickets";
  const method = id ? "PUT" : "POST";

  try {
    await apiFetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    showMessage(id ? "Ticket updated." : "Ticket created.");
    resetTicketForm();
    await loadTickets();
  } catch (error) {
    showMessage(error.message, "danger");
  }
}

/**
 * DELETE del ticket completo. confirm() agrega una verificación sencilla
 * antes de ejecutar una acción destructiva.
 */
async function deleteTicket(id) {
  const confirmed = window.confirm(`Delete ticket #${id}?`);

  if (!confirmed) {
    return;
  }

  try {
    await apiFetch(`/api/v1/tickets/${id}`, {
      method: "DELETE",
    });

    showMessage("Ticket deleted.");
    await loadTickets();
  } catch (error) {
    showMessage(error.message, "danger");
  }
}

/**
 * POST multipart/form-data para asociar o reemplazar el attachment.
 * FormData representa un formulario capaz de transportar archivos binarios.
 */
async function uploadAttachment() {
  const file = attachmentInput.files[0];
  const ticketId = attachmentInput.dataset.ticketId;

  if (!file || !ticketId) {
    return;
  }

  const formData = new FormData();

  // El nombre attachment debe coincidir con req.files.attachment en Express.
  formData.append("attachment", file);

  try {
    await apiFetch(`/api/v1/tickets/${ticketId}/attachment`, {
      method: "POST",

      // No agregamos Content-Type: FormData debe generar el boundary.
      body: formData,
    });

    showMessage("Attachment uploaded.");
    attachmentInput.value = "";
    delete attachmentInput.dataset.ticketId;
    await loadTickets();
  } catch (error) {
    showMessage(error.message, "danger");
  }
}

/**
 * DELETE del archivo asociado manteniendo intacto el registro Ticket.
 */
async function deleteAttachment(ticketId) {
  const confirmed = window.confirm(`Remove attachment from ticket #${ticketId}?`);

  if (!confirmed) {
    return;
  }

  try {
    await apiFetch(`/api/v1/tickets/${ticketId}/attachment`, {
      method: "DELETE",
    });

    showMessage("Attachment removed.");
    await loadTickets();
  } catch (error) {
    showMessage(error.message, "danger");
  }
}

// La pantalla funcional requiere autenticación.
if (!getToken()) {
  window.location.href = "/login";
} else {
  await loadTickets();
}

// Eventos principales de la interfaz Web.
ticketForm.addEventListener("submit", saveTicket);

filterForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await loadTickets();
});

// reset ocurre después de que el navegador limpia los campos; setTimeout(0)
// deja que ese reset visual termine antes de reconstruir la URL de filtros.
clearFiltersButton.addEventListener("click", () => {
  window.setTimeout(loadTickets, 0);
});

attachmentInput.addEventListener("change", uploadAttachment);
cancelEditButton.addEventListener("click", resetTicketForm);

