import { DataTypes } from "sequelize";
import { sequelize } from "../config/sequelize.js";

// Role representa categorías de responsabilidad dentro del sistema.
export const Role = sequelize.define(
  "Role",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "roles",
    underscored: true,
  },
);
