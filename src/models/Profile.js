import { DataTypes } from "sequelize";
import { sequelize } from "../config/sequelize.js";

// Profile separa información personal adicional de los datos
// esenciales de autenticación almacenados en User.
export const Profile = sequelize.define(
  "Profile",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    birthDate: {
      // DATEONLY representa una fecha sin hora.
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "birth_date",
    },
    bio: {
      // TEXT permite almacenar una cadena de longitud mayor que STRING.
      type: DataTypes.TEXT,
      allowNull: true,
    },
    userId: {
      // La unicidad de userId permite implementar la relación 1:1:
      // un usuario puede tener como máximo un perfil.
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: "user_id",
    },
  },
  {
    tableName: "profiles",
    underscored: true,
  },
);
