import { DataTypes } from "sequelize";
import { sequelize } from "../config/sequelize.js";

// UserRole es la entidad intermedia de la relación N:M.
// Además de las dos claves foráneas, almacena información propia
// de la relación, lo que demuestra que una tabla puente puede tener atributos.
export const UserRole = sequelize.define(
  "UserRole",
  {
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "assigned_at",
    },
    assignedBy: {
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: "system",
      field: "assigned_by",
    },
  },
  {
    tableName: "user_roles",
    underscored: true,
  },
);
