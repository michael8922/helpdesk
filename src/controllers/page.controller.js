/**
 * Renderiza la portada mediante Handlebars.
 * res.render(nombreVista, contexto) combina la vista con layout y partials.
 */
export function renderHome(req, res) {
  return res.render("home", {
    title: "HelpDesk",
    appName: "HelpDesk Reinforcement",
    description: "API, Web and CLI over the same Express backend.",
    features: [
      "PostgreSQL + pg",
      "Sequelize associations",
      "REST API",
      "JWT authentication",
      "File upload",
      "Handlebars + Bootstrap",
      "Fetch API",
      "CLI with yargs",
    ],
  });
}

/**
 * Entrega el formulario Web de login.
 * La vista solo construye HTML; login.js realizará la autenticación real
 * consumiendo POST /api/v1/auth/login con fetch().
 */
export function renderLogin(req, res) {
  return res.render("login", {
    title: "Login | HelpDesk",
  });
}

/**
 * Entrega el formulario Web de registro.
 * register.js enviará sus datos a la API en formato JSON.
 */
export function renderRegister(req, res) {
  return res.render("register", {
    title: "Register | HelpDesk",
  });
}

/**
 * Renderiza el shell de la pantalla CRUD.
 * Handlebars entrega estructura y partials; tickets.js completa datos y
 * operaciones dinámicas consumiendo la API REST.
 */
export function renderTickets(req, res) {
  return res.render("tickets", {
    title: "Tickets | HelpDesk",
  });
}

/**
 * Renderiza una pantalla destinada a visualizar las tres asociaciones ORM.
 * account.js consulta posteriormente el resumen relacional del usuario.
 */
export function renderAccount(req, res) {
  return res.render("account", {
    title: "Account & relations | HelpDesk",
  });
}

/**
 * Renderiza una página mínima que ejecuta el logout del navegador.
 * El servidor no puede borrar localStorage directamente; logout.js lo hace
 * en el cliente y luego redirige a /login.
 */
export function renderLogout(req, res) {
  return res.render("logout", {
    title: "Logout | HelpDesk",
  });
}
