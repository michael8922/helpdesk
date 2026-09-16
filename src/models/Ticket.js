import { DataTypes } from "sequelize";
import { sequelize } from "../config/sequelize.js";

// Ticket es la entidad principal del CRUD del reforzamiento.
// Se diseñó para incluir tipos de datos variados y reconocibles.
export const Ticket = sequelize.define(
  "Ticket",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      // Variable textual corta.
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    description: {
      // Texto libre de mayor longitud.
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      // Variable categórica. Usamos STRING + validación para mantener
      // simple el esquema y limitar sus valores desde el modelo.
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "open",
      validate: {
        isIn: [["open", "in_progress", "closed"]],
      },
    },
    priority: {
      // Indicador ordinal: 1 representa baja prioridad y 5 alta prioridad.
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      validate: {
        min: 1,
        max: 5,
      },
    },
    estimatedHours: {
      // Magnitud decimal. DECIMAL evita perder precisión por punto flotante.
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      field: "estimated_hours",
      validate: {
        min: 0,
      },
    },
    urgent: {
      // Indicador binario.
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    progress: {
      // Indicador no binario expresado en porcentaje de 0 a 100.
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    dueDate: {
      // Fecha de vencimiento sin componente de hora.
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "due_date",
    },
    attachmentPath: {
      // Guardamos la ruta del archivo, no el archivo binario en la tabla.
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "attachment_path",
    },
    userId: {
      // FK de la relación 1:N. Cada ticket pertenece a un usuario.
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
    },
  },
  {
    tableName: "tickets",
    underscored: true,
  },
);
