import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { apiRequest } from "./cli/api-client.js";
import { deleteToken, saveToken } from "./cli/token-store.js";

// MIME mínimo soportado por el ejercicio.
// Se usa para construir el Blob correcto antes de enviarlo con FormData.
const mimeByExtension = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
};

/**
 * Centraliza la salida de errores del CLI.
 * process.exitCode=1 informa al sistema operativo que el comando falló,
 * pero permite que Node termine ordenadamente el ciclo actual.
 */
function printError(error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}

/**
 * Construye un objeto solo con opciones yargs realmente informadas.
 * Es útil en UPDATE para no reemplazar campos que el usuario no quiso tocar.
 */
function pickDefinedOptions(argv, keys) {
  const payload = {};

  for (const key of keys) {
    if (argv[key] !== undefined) {
      payload[key] = argv[key];
    }
  }

  return payload;
}

/**
 * Registra todos los comandos del CLI y pide a yargs que interprete argv.
 *
 * yargs(hideBin(process.argv)):
 * - process.argv contiene node, script y argumentos.
 * - hideBin() elimina los dos primeros y deja solo lo escrito por el usuario.
 *
 * .command(): define nombre, descripción, opciones y handler.
 * .option(): declara flags como --email o --id.
 * .demandCommand(1): exige al menos un comando.
 * .strict(): rechaza opciones/comandos desconocidos.
 * .help(): habilita --help.
 * .parseAsync(): ejecuta handlers async y espera sus Promises.
 */
async function run() {
  await yargs(hideBin(process.argv))
    .scriptName("helpdesk")

    // ---------------------------------------------------------------------
    // AUTH — REGISTER
    // ---------------------------------------------------------------------
    .command(
      "register",
      "Create a User + Profile through the public REST API",
      (builder) =>
        builder
          .option("name", {
            type: "string",
            demandOption: true,
            describe: "User display name",
          })
          .option("email", {
            type: "string",
            demandOption: true,
            describe: "User email",
          })
          .option("password", {
            type: "string",
            demandOption: true,
            describe: "Plain password sent only to the register endpoint",
          })
          .option("phone", {
            type: "string",
            describe: "Optional profile phone",
          })
          .option("birthDate", {
            type: "string",
            describe: "Optional YYYY-MM-DD birth date",
          })
          .option("bio", {
            type: "string",
            describe: "Optional profile description",
          }),
      async (argv) => {
        try {
          const result = await apiRequest("/api/v1/auth/register", {
            // Registro es público: todavía no existe token.
            auth: false,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: argv.name,
              email: argv.email,
              password: argv.password,
              phone: argv.phone ?? null,
              birthDate: argv.birthDate ?? null,
              bio: argv.bio ?? null,
            }),
          });

          console.log(`User #${result.data.id} created: ${result.data.email}`);
          console.log("Run the login command to obtain a JWT.");
        } catch (error) {
          printError(error);
        }
      },
    )

    // ---------------------------------------------------------------------
    // AUTH — LOGIN / LOGOUT
    // ---------------------------------------------------------------------
    .command(
      "login",
      "Authenticate and store a JWT locally",
      (builder) =>
        builder
          .option("email", {
            type: "string",
            demandOption: true,
            describe: "User email",
          })
          .option("password", {
            type: "string",
            demandOption: true,
            describe: "User password",
          }),
      async (argv) => {
        try {
          const result = await apiRequest("/api/v1/auth/login", {
            auth: false,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: argv.email,
              password: argv.password,
            }),
          });

          // Guardamos únicamente el JWT. Los próximos comandos lo leen
          // automáticamente desde .helpdesk-token.
          await saveToken(result.data.token);
          console.log(`Logged in as ${result.data.user.email}`);
        } catch (error) {
          printError(error);
        }
      },
    )
    .command(
      "logout",
      "Delete the locally stored JWT",
      () => {},
      async () => {
        try {
          await deleteToken();
          console.log("CLI token removed.");
        } catch (error) {
          printError(error);
        }
      },
    )

    // ---------------------------------------------------------------------
    // READ COLLECTION + FILTERS
    // ---------------------------------------------------------------------
    .command(
      "tickets:list",
      "List tickets using optional API query filters",
      (builder) =>
        builder
          .option("status", {
            choices: ["open", "in_progress", "closed"],
            describe: "Filter by status",
          })
          .option("urgent", {
            type: "boolean",
            describe: "Filter by urgent flag; use --urgent or --no-urgent",
          })
          .option("priority", {
            type: "number",
            describe: "Filter by priority 1-5",
          })
          .option("minProgress", {
            type: "number",
            describe: "Minimum progress percentage 0-100",
          }),
      async (argv) => {
        try {
          // URLSearchParams evita construir query strings manualmente.
          const params = new URLSearchParams();

          if (argv.status) params.set("status", argv.status);
          if (argv.urgent !== undefined) params.set("urgent", String(argv.urgent));
          if (argv.priority !== undefined) params.set("priority", String(argv.priority));
          if (argv.minProgress !== undefined) params.set("minProgress", String(argv.minProgress));

          const suffix = params.toString() ? `?${params.toString()}` : "";
          const result = await apiRequest(`/api/v1/tickets${suffix}`);

          // console.table() es apropiado para colecciones tabulares en terminal.
          console.table(
            result.data.map((ticket) => ({
              id: ticket.id,
              title: ticket.title,
              status: ticket.status,
              priority: ticket.priority,
              urgent: ticket.urgent,
              progress: ticket.progress,
              owner: ticket.user?.email,
            })),
          );
        } catch (error) {
          printError(error);
        }
      },
    )

    // ---------------------------------------------------------------------
    // READ INDIVIDUAL
    // ---------------------------------------------------------------------
    .command(
      "tickets:get",
      "Get one ticket by id",
      (builder) =>
        builder.option("id", {
          type: "number",
          demandOption: true,
          describe: "Ticket id",
        }),
      async (argv) => {
        try {
          const result = await apiRequest(`/api/v1/tickets/${argv.id}`);

          // depth:null permite inspeccionar relaciones u objetos anidados completos.
          console.dir(result.data, { depth: null });
        } catch (error) {
          printError(error);
        }
      },
    )

    // ---------------------------------------------------------------------
    // CREATE
    // ---------------------------------------------------------------------
    .command(
      "tickets:create",
      "Create a ticket owned by the authenticated JWT user",
      (builder) =>
        builder
          .option("title", {
            type: "string",
            demandOption: true,
            describe: "Ticket title",
          })
          .option("description", { type: "string", describe: "Optional description" })
          .option("status", {
            choices: ["open", "in_progress", "closed"],
            default: "open",
          })
          .option("priority", {
            type: "number",
            default: 3,
          })
          .option("estimatedHours", {
            type: "number",
            describe: "Optional decimal estimate",
          })
          .option("urgent", {
            type: "boolean",
            default: false,
          })
          .option("progress", {
            type: "number",
            default: 0,
          })
          .option("dueDate", {
            type: "string",
            describe: "Optional YYYY-MM-DD due date",
          }),
      async (argv) => {
        try {
          const result = await apiRequest("/api/v1/tickets", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: argv.title,
              description: argv.description,
              status: argv.status,
              priority: argv.priority,
              estimatedHours: argv.estimatedHours,
              urgent: argv.urgent,
              progress: argv.progress,
              dueDate: argv.dueDate,
            }),
          });

          console.log(`Ticket #${result.data.id} created.`);
          console.dir(result.data, { depth: null });
        } catch (error) {
          printError(error);
        }
      },
    )

    // ---------------------------------------------------------------------
    // UPDATE
    // ---------------------------------------------------------------------
    .command(
      "tickets:update",
      "Update only the ticket fields supplied as options",
      (builder) =>
        builder
          .option("id", {
            type: "number",
            demandOption: true,
            describe: "Ticket id",
          })
          .option("title", { type: "string" })
          .option("description", { type: "string" })
          .option("status", {
            choices: ["open", "in_progress", "closed"],
          })
          .option("priority", { type: "number" })
          .option("estimatedHours", { type: "number" })
          .option("urgent", { type: "boolean" })
          .option("progress", { type: "number" })
          .option("dueDate", { type: "string" }),
      async (argv) => {
        try {
          const payload = pickDefinedOptions(argv, [
            "title",
            "description",
            "status",
            "priority",
            "estimatedHours",
            "urgent",
            "progress",
            "dueDate",
          ]);

          const result = await apiRequest(`/api/v1/tickets/${argv.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          console.log(`Ticket #${result.data.id} updated.`);
          console.dir(result.data, { depth: null });
        } catch (error) {
          printError(error);
        }
      },
    )

    // ---------------------------------------------------------------------
    // DELETE RESOURCE
    // ---------------------------------------------------------------------
    .command(
      "tickets:delete",
      "Delete one ticket",
      (builder) =>
        builder.option("id", {
          type: "number",
          demandOption: true,
          describe: "Ticket id",
        }),
      async (argv) => {
        try {
          await apiRequest(`/api/v1/tickets/${argv.id}`, {
            method: "DELETE",
          });

          console.log(`Ticket #${argv.id} deleted.`);
        } catch (error) {
          printError(error);
        }
      },
    )

    // ---------------------------------------------------------------------
    // FILE UPLOAD
    // ---------------------------------------------------------------------
    .command(
      "tickets:upload",
      "Upload or replace an attachment",
      (builder) =>
        builder
          .option("id", {
            type: "number",
            demandOption: true,
            describe: "Ticket id",
          })
          .option("file", {
            type: "string",
            demandOption: true,
            describe: "Local file path",
          }),
      async (argv) => {
        try {
          const extension = extname(argv.file).toLowerCase();
          const mimeType = mimeByExtension[extension];

          if (!mimeType) {
            throw new Error("Unsupported file extension");
          }

          // readFile() devuelve un Buffer con los bytes del archivo.
          const buffer = await readFile(argv.file);

          // Blob agrega tipo MIME a los bytes para que FormData pueda
          // representarlos como un archivo HTTP.
          const blob = new Blob([buffer], {
            type: mimeType,
          });

          const formData = new FormData();

          // attachment debe coincidir con req.files.attachment en Express.
          // basename() evita enviar toda la ruta local como nombre del archivo.
          formData.append("attachment", blob, basename(argv.file));

          const result = await apiRequest(`/api/v1/tickets/${argv.id}/attachment`, {
            method: "POST",

            // No configuramos Content-Type manualmente: FormData crea
            // multipart/form-data junto con el boundary requerido.
            body: formData,
          });

          console.log(`Attachment uploaded to ticket #${result.data.id}.`);
          console.log(result.data.attachmentPath);
        } catch (error) {
          printError(error);
        }
      },
    )

    // ---------------------------------------------------------------------
    // DELETE ATTACHMENT
    // ---------------------------------------------------------------------
    .command(
      "tickets:attachment:delete",
      "Delete the attachment but keep the ticket",
      (builder) =>
        builder.option("id", {
          type: "number",
          demandOption: true,
          describe: "Ticket id",
        }),
      async (argv) => {
        try {
          const result = await apiRequest(`/api/v1/tickets/${argv.id}/attachment`, {
            method: "DELETE",
          });

          console.log(`Attachment removed from ticket #${result.data.id}.`);
        } catch (error) {
          printError(error);
        }
      },
    )

    // ---------------------------------------------------------------------
    // ASSOCIATIONS 1:1 + 1:N + N:M
    // ---------------------------------------------------------------------
    .command(
      "users:summary",
      "Show one user with Profile, Roles and Tickets",
      (builder) =>
        builder.option("id", {
          type: "number",
          demandOption: true,
          describe: "User id",
        }),
      async (argv) => {
        try {
          const result = await apiRequest(`/api/v1/users/${argv.id}/summary`);
          console.dir(result.data, { depth: null });
        } catch (error) {
          printError(error);
        }
      },
    )

    .demandCommand(1)
    .strict()
    .help()
    .parseAsync();
}

// Top-level await está disponible porque package.json usa "type": "module".
await run();
