import type { KirletTableDecl } from "@opus-perpetuus/imperium-core-kit";

export const lista_asistencia_tables: KirletTableDecl[] = [
  {
    name: "lista_asistencia",
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
      { name: "registro_asistencia_id", type: "text" },
      { name: "alumno_id", type: "text" },
      { name: "grupo_id", type: "text" },
      { name: "alumno_nombre_snapshot", type: "text" },
      { name: "numero_lista", type: "real" },
      { name: "estado", type: "text" },
      { name: "justificada", type: "boolean" },
      { name: "evidencia", type: "text" },
      { name: "registro_incidencia_id", type: "text" },
    ],
    indexes: [
      { name: "idx_lista_asistencia_name", columns: ["name"] },
      { name: "idx_lista_asistencia_active", columns: ["is_active"] },
    ],
  },
];
