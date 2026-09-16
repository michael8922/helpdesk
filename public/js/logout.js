import { clearSession } from "./api.js";

// Con JWT stateless no existe una sesión de servidor que destruir.
// Logout Web significa eliminar el JWT y los datos auxiliares del navegador.
clearSession();

// replace() evita que Back vuelva a una pantalla de logout intermedia.
window.location.replace("/login");
