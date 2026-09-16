import { DataTypes } from "sequelize";
import { sequelize } from "../config/sequelize.js";

// User representa la tabla de usuarios del sistema.
// El modelo contiene datos de identidad y autenticación.
export const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      // Guardamos el hash de la contraseña, nunca la contraseña original.
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "password_hash",
    },
    active: {
      // Indicador binario: el usuario está activo o inactivo.
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "users",
    underscored: true,
  },
);
