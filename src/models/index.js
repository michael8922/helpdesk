import { User } from "./User.js";
import { Profile } from "./Profile.js";
import { Ticket } from "./Ticket.js";
import { Role } from "./Role.js";
import { UserRole } from "./UserRole.js";

// ------------------------------
// RELACIÓN 1:1 — User ↔ Profile
// ------------------------------
// Un usuario puede tener un único perfil.
User.hasOne(Profile, {
  foreignKey: "userId",
  as: "profile",
  onDelete: "CASCADE",
});

// Cada perfil pertenece a un único usuario.
Profile.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// ------------------------------
// RELACIÓN 1:N — User → Ticket
// ------------------------------
// Un usuario puede tener muchos tickets.
User.hasMany(Ticket, {
  foreignKey: "userId",
  as: "tickets",
  onDelete: "CASCADE",
});

// Cada ticket pertenece a un único usuario.
Ticket.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// --------------------------------
// RELACIÓN N:M — User ↔ Role
// --------------------------------
// Un usuario puede tener varios roles y un rol puede pertenecer
// a varios usuarios. UserRole funciona como entidad intermedia.
User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: "userId",
  otherKey: "roleId",
  as: "roles",
});

Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: "roleId",
  otherKey: "userId",
  as: "users",
});

// Estas dos asociaciones adicionales permiten consultar la entidad
// intermedia UserRole directamente cuando sea necesario.
UserRole.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

UserRole.belongsTo(Role, {
  foreignKey: "roleId",
  as: "role",
});

export { User, Profile, Ticket, Role, UserRole };
