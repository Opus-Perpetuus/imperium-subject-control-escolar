import type { KirletTableDecl } from "@opus-perpetuus/imperium-core-kit";

export const registro_asistencias_tables: KirletTableDecl[] = [
  {
    name: "registro_asistencias",
    columns: [
      { name: "id", type: "text", primaryKey: true },
      { name: "name", type: "text", notNull: true },
      { name: "description", type: "text" },
      { name: "is_active", type: "boolean", notNull: true, default: true },
      { name: "state", type: "text" },
      { name: "ref", type: "text", unique: true },
      { name: "search_field", type: "text" },
      { name: "created_by", type: "text" },
      { name: "custom_data", type: "json" },
      { name: "payload", type: "json" },
      { name: "created_at", type: "text", notNull: true },
      { name: "updated_at", type: "text", notNull: true },
      { name: "grupo_id", type: "text" },
      { name: "materia_id", type: "text" },
      { name: "teacher_user_id", type: "text" },
      { name: "fecha_asistencia", type: "text" },
      { name: "estatus", type: "text" },
      { name: "total_alumnos", type: "real" },
    ],
    indexes: [
      { name: "idx_registro_asistencias_name", columns: ["name"] },
      { name: "idx_registro_asistencias_active", columns: ["is_active"] },
    ],
  },
];
