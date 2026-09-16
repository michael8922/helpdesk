import { readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// path.resolve() convierte el nombre relativo en una ruta absoluta basada
// en el directorio desde el que se ejecuta el proyecto.
const tokenFile = path.resolve(".helpdesk-token");

/**
 * Persiste el JWT para reutilizarlo en comandos posteriores.
 * El archivo figura en .gitignore y no debe versionarse.
 */
export async function saveToken(token) {
  await writeFile(tokenFile, token, "utf8");
}

/**
 * Recupera el JWT guardado.
 * Si el archivo aún no existe (ENOENT), devolvemos null en vez de fallar.
 */
export async function readToken() {
  try {
    return (await readFile(tokenFile, "utf8")).trim();
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

/**
 * Elimina el token local durante logout.
 * En JWT stateless no existe una sesión del servidor que debamos destruir.
 */
export async function deleteToken() {
  try {
    await unlink(tokenFile);
  } catch (error) {
    // Logout también debe ser seguro si el archivo ya había sido eliminado.
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}
