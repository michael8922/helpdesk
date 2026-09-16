import bcrypt from "bcryptjs";
import { User, Profile, Ticket, Role, UserRole } from "../models/index.js";

// Todas las cuentas seed usarán la misma contraseña para simplificar
// la demostración de login. La contraseña nunca se guarda directamente:
// primero se transforma en un hash con bcrypt.
const SEED_PASSWORD = "Password123!";

/**
 * Carga datos reproducibles usando métodos bulkCreate() de Sequelize.
 * bulkCreate(array) ejecuta inserciones en lote y evita crear cada fila
 * manualmente durante el reforzamiento.
 */
export async function seedDatabase() {
  // Generamos un hash reutilizable para las cuentas de demostración.
  // En un sistema real cada usuario elegiría su propia contraseña.
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  // Creamos varios usuarios para que las relaciones y filtros
  // produzcan resultados suficientemente variados.
  const users = await User.bulkCreate(
    [
      { name: "Alice Johnson", email: "alice@example.com", passwordHash, active: true },
      { name: "Bruno Silva", email: "bruno@example.com", passwordHash, active: true },
      { name: "Carla Soto", email: "carla@example.com", passwordHash, active: true },
      { name: "Diego Pérez", email: "diego@example.com", passwordHash, active: true },
      { name: "Elena Torres", email: "elena@example.com", passwordHash, active: true },
      { name: "Felipe Rojas", email: "felipe@example.com", passwordHash, active: false },
    ],
    { returning: true },
  );

  // Relación 1:1: cada usuario recibe un perfil.
  await Profile.bulkCreate([
    { userId: users[0].id, phone: "+56 9 1111 1111", birthDate: "1990-01-10", bio: "Platform administrator." },
    { userId: users[1].id, phone: "+56 9 2222 2222", birthDate: "1992-04-22", bio: "Support agent focused on hardware incidents." },
    { userId: users[2].id, phone: "+56 9 3333 3333", birthDate: "1995-08-14", bio: "Internal customer from the finance team." },
    { userId: users[3].id, phone: "+56 9 4444 4444", birthDate: "1988-11-03", bio: "Support agent focused on software incidents." },
    { userId: users[4].id, phone: "+56 9 5555 5555", birthDate: "1997-06-19", bio: "Internal customer from operations." },
    { userId: users[5].id, phone: "+56 9 6666 6666", birthDate: "1986-02-28", bio: "Auditor account currently disabled." },
  ]);

  // Roles disponibles para demostrar la relación N:M.
  const roles = await Role.bulkCreate(
    [
      { name: "admin" },
      { name: "agent" },
      { name: "customer" },
      { name: "auditor" },
    ],
    { returning: true },
  );

  // Relación N:M: algunos usuarios reciben más de un rol.
  await UserRole.bulkCreate([
    { userId: users[0].id, roleId: roles[0].id, assignedBy: "seed-script" },
    { userId: users[0].id, roleId: roles[1].id, assignedBy: "seed-script" },
    { userId: users[1].id, roleId: roles[1].id, assignedBy: "seed-script" },
    { userId: users[2].id, roleId: roles[2].id, assignedBy: "seed-script" },
    { userId: users[3].id, roleId: roles[1].id, assignedBy: "seed-script" },
    { userId: users[3].id, roleId: roles[2].id, assignedBy: "seed-script" },
    { userId: users[4].id, roleId: roles[2].id, assignedBy: "seed-script" },
    { userId: users[5].id, roleId: roles[3].id, assignedBy: "seed-script" },
    { userId: users[5].id, roleId: roles[2].id, assignedBy: "seed-script" },
  ]);

  // 24 tickets dan suficiente volumen para practicar filtros, relaciones,
  // CRUD y distintos tipos de datos sin convertir la clase en carga manual.
  await Ticket.bulkCreate([
    { userId: users[2].id, title: "Printer not responding", description: "Finance printer is offline.", status: "open", priority: 4, estimatedHours: 1.5, urgent: true, progress: 0, dueDate: "2026-09-06" },
    { userId: users[4].id, title: "VPN access failure", description: "VPN rejects valid credentials.", status: "open", priority: 5, estimatedHours: 2.0, urgent: true, progress: 10, dueDate: "2026-09-05" },
    { userId: users[1].id, title: "Replace keyboard", description: "Several keys are physically damaged.", status: "open", priority: 2, estimatedHours: 0.5, urgent: false, progress: 0, dueDate: "2026-09-12" },
    { userId: users[3].id, title: "Database report timeout", description: "Monthly report exceeds timeout threshold.", status: "open", priority: 4, estimatedHours: 4.0, urgent: false, progress: 20, dueDate: "2026-09-10" },
    { userId: users[2].id, title: "Email signature update", description: "Corporate signature requires new legal text.", status: "open", priority: 1, estimatedHours: 0.5, urgent: false, progress: 0, dueDate: "2026-09-20" },
    { userId: users[4].id, title: "Shared folder permissions", description: "Operations cannot write to shared folder.", status: "open", priority: 3, estimatedHours: 1.0, urgent: false, progress: 15, dueDate: "2026-09-08" },
    { userId: users[0].id, title: "Audit inactive accounts", description: "Review accounts inactive for more than 90 days.", status: "open", priority: 3, estimatedHours: 3.5, urgent: false, progress: 5, dueDate: "2026-09-18" },
    { userId: users[5].id, title: "Export access history", description: "Generate access history for compliance review.", status: "open", priority: 2, estimatedHours: 2.5, urgent: false, progress: 0, dueDate: "2026-09-25" },

    { userId: users[2].id, title: "Laptop battery replacement", description: "Battery health is below 60 percent.", status: "in_progress", priority: 3, estimatedHours: 1.5, urgent: false, progress: 40, dueDate: "2026-09-07" },
    { userId: users[4].id, title: "CRM login loop", description: "Browser redirects repeatedly after login.", status: "in_progress", priority: 5, estimatedHours: 5.0, urgent: true, progress: 60, dueDate: "2026-09-06" },
    { userId: users[1].id, title: "Install analytics client", description: "Install approved analytics desktop client.", status: "in_progress", priority: 2, estimatedHours: 1.0, urgent: false, progress: 50, dueDate: "2026-09-11" },
    { userId: users[3].id, title: "API integration error", description: "External service returns malformed payload.", status: "in_progress", priority: 4, estimatedHours: 6.5, urgent: true, progress: 75, dueDate: "2026-09-09" },
    { userId: users[0].id, title: "Update support dashboard", description: "Add incident aging indicator.", status: "in_progress", priority: 3, estimatedHours: 8.0, urgent: false, progress: 30, dueDate: "2026-09-15" },
    { userId: users[2].id, title: "Finance scanner calibration", description: "Scanned documents appear skewed.", status: "in_progress", priority: 2, estimatedHours: 1.5, urgent: false, progress: 80, dueDate: "2026-09-04" },
    { userId: users[4].id, title: "Warehouse Wi-Fi instability", description: "Intermittent connection near loading area.", status: "in_progress", priority: 4, estimatedHours: 4.5, urgent: true, progress: 45, dueDate: "2026-09-08" },
    { userId: users[5].id, title: "Review privileged roles", description: "Compare privileged access with policy.", status: "in_progress", priority: 3, estimatedHours: 3.0, urgent: false, progress: 65, dueDate: "2026-09-13" },

    { userId: users[1].id, title: "Mouse replacement", description: "Wireless mouse stopped pairing.", status: "closed", priority: 1, estimatedHours: 0.5, urgent: false, progress: 100, dueDate: "2026-08-28" },
    { userId: users[3].id, title: "Patch development server", description: "Apply approved security patches.", status: "closed", priority: 4, estimatedHours: 3.0, urgent: true, progress: 100, dueDate: "2026-08-30" },
    { userId: users[2].id, title: "Reset finance portal password", description: "User lost access after password expiry.", status: "closed", priority: 3, estimatedHours: 0.5, urgent: false, progress: 100, dueDate: "2026-09-01" },
    { userId: users[4].id, title: "Configure meeting room display", description: "Display required firmware and HDMI setup.", status: "closed", priority: 2, estimatedHours: 1.0, urgent: false, progress: 100, dueDate: "2026-08-25" },
    { userId: users[0].id, title: "Archive resolved incidents", description: "Move old incident exports to archive storage.", status: "closed", priority: 1, estimatedHours: 2.0, urgent: false, progress: 100, dueDate: "2026-08-20" },
    { userId: users[1].id, title: "Update antivirus definitions", description: "Force definition update on support workstations.", status: "closed", priority: 3, estimatedHours: 1.0, urgent: false, progress: 100, dueDate: "2026-08-31" },
    { userId: users[3].id, title: "Restore deleted spreadsheet", description: "Recover file from nightly backup.", status: "closed", priority: 4, estimatedHours: 2.5, urgent: true, progress: 100, dueDate: "2026-09-02" },
    { userId: users[2].id, title: "Browser certificate warning", description: "Internal site certificate chain was outdated.", status: "closed", priority: 3, estimatedHours: 1.5, urgent: false, progress: 100, dueDate: "2026-09-03" },
  ]);

  console.log("Seed completed.");
  console.log(`Demo password for seeded users: ${SEED_PASSWORD}`);
}
