import { randomUUID } from "node:crypto";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { Ticket } from "../models/index.js";
import { AppError } from "../utils/AppError.js";

/**
 * path.resolve() genera una ruta absoluta hacia uploads/.
 *
 * LOCAL:
 *   normalmente resuelve a <proyecto>/uploads
 *
 * RAILWAY:
 *   con el layout estándar de Railway/Railpack la aplicación vive en `/app`,
 *   por lo que la ruta relativa puede persistirse montando un Volume en
 *   `/app/uploads`.
 *
 * IMPORTANTE:
 * Sin Volume, Railway ofrece filesystem efímero: el upload puede funcionar
 * durante el deployment actual, pero no debemos prometer que sobrevivirá
 * a un redeploy.
 *
 * No necesitamos introducir UPLOAD_DIR solo para hacer el deploy básico.
 */
const uploadDirectory = path.resolve("uploads");

// Lista blanca de extensiones y MIME aceptados.
// Validamos ambos valores porque el nombre y el mimetype vienen del cliente.
const allowedMimeByExtension = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
};

/**
 * Elimina físicamente un archivo si existe.
 * Esta función no modifica la base de datos; solo trabaja con filesystem.
 */
async function removePhysicalFile(relativePath) {
  if (!relativePath) {
    return;
  }

  // basename() extrae solo el nombre final y evita confiar en directorios
  // incluidos dentro del valor guardado.
  const safeName = path.basename(relativePath);
  const absolutePath = path.join(uploadDirectory, safeName);

  try {
    // fs/promises.unlink() elimina un archivo y devuelve una Promise.
    await unlink(absolutePath);
  } catch (error) {
    // ENOENT significa "no existe". Si el archivo ya desapareció,
    // podemos continuar limpiando la referencia de la base de datos.
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

/**
 * Valida, guarda y asocia un archivo con un Ticket.
 * También reemplaza correctamente un attachment anterior.
 */
export async function attachFileToTicket(ticketId, uploadedFile) {
  const ticket = await Ticket.findByPk(ticketId);

  if (!ticket) {
    throw new AppError(404, "Ticket not found");
  }

  if (!uploadedFile) {
    throw new AppError(400, "Attachment is required");
  }

  // express-fileupload puede representar múltiples archivos como array.
  // Este endpoint acepta deliberadamente uno solo.
  if (Array.isArray(uploadedFile)) {
    throw new AppError(400, "Only one attachment is allowed");
  }

  // extname() obtiene la extensión del nombre recibido, incluida el punto.
  const extension = path.extname(uploadedFile.name).toLowerCase();
  const expectedMime = allowedMimeByExtension[extension];

  if (!expectedMime) {
    throw new AppError(400, "File extension is not allowed");
  }

  if (uploadedFile.mimetype !== expectedMime) {
    throw new AppError(400, "File MIME type does not match the allowed type");
  }

  // recursive:true permite crear uploads/ solo si todavía no existe.
  //
  // En Railway esto NO convierte la carpeta en persistente por sí mismo.
  // La persistencia depende de que esa ruta esté respaldada por un Volume
  // u otro almacenamiento persistente.
  await mkdir(uploadDirectory, { recursive: true });

  // randomUUID() viene de node:crypto y sirve para generar un nombre difícil
  // de colisionar. Aquí crypto se usa para identificadores, NO para passwords.
  const fileName = `${randomUUID()}${extension}`;
  const destination = path.join(uploadDirectory, fileName);

  // mv() lo agrega express-fileupload al objeto de archivo.
  // Sin callback devuelve una Promise que podemos esperar con await.
  await uploadedFile.mv(destination);

  const previousAttachment = ticket.attachmentPath;

  // Guardamos una ruta pública relativa porque app.js expone /uploads.
  ticket.attachmentPath = `/uploads/${fileName}`;
  await ticket.save();

  // Si hubo reemplazo, borramos el archivo anterior después de persistir
  // correctamente el nuevo path.
  if (previousAttachment) {
    await removePhysicalFile(previousAttachment);
  }

  return ticket;
}

/**
 * Elimina solo el attachment de un Ticket y mantiene el registro Ticket.
 */
export async function deleteTicketAttachment(ticketId) {
  const ticket = await Ticket.findByPk(ticketId);

  if (!ticket) {
    throw new AppError(404, "Ticket not found");
  }

  if (!ticket.attachmentPath) {
    throw new AppError(404, "Ticket has no attachment");
  }

  await removePhysicalFile(ticket.attachmentPath);

  // Null indica que actualmente el ticket no tiene archivo asociado.
  ticket.attachmentPath = null;
  await ticket.save();

  return ticket;
}
