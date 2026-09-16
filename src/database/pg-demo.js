import { pool } from "../config/pg.js";

// process.argv contiene los argumentos de línea de comandos.
// npm run db:query-demo -- closed deja "closed" en la posición 2.
const status = process.argv[2] ?? "open";

try {
  // pool.query(sql, values) ejecuta SQL directo con pg.
  // $1 es un placeholder y [status] contiene el valor separado del SQL.
  // Esto evita concatenar input y reduce el riesgo de SQL Injection.
  const result = await pool.query(
    `
      SELECT id, title, status, priority, urgent, progress
      FROM tickets
      WHERE status = $1
      ORDER BY priority DESC, id ASC
    `,
    [status],
  );

  // result.rows es el array de filas retornadas por PostgreSQL.
  console.table(result.rows);
} catch (error) {
  console.error("Direct pg query failed:", error.message);
  process.exitCode = 1;
} finally {
  // Este archivo es un script de una sola ejecución; cerramos el pool al final.
  await pool.end();
}
