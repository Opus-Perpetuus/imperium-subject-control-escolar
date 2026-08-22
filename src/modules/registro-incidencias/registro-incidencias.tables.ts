import type { KirletTableDecl } from "@opus-perpetuus/imperium-core-kit";

export const registro_incidencias_tables: KirletTableDecl[] = [
  {
    name: "registro_incidencias",
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
      { name: "alumno_id", type: "text" },
      { name: "grupo_id", type: "text" },
      { name: "registro_asistencia_id", type: "text" },
      { name: "lista_asistencia_id", type: "text" },
      { name: "materia_id", type: "text" },
      { name: "grado_escolar_id", type: "text" },
      { name: "escuela_id", type: "text" },
      { name: "tipo", type: "text" },
      { name: "justificada", type: "boolean" },
      { name: "evidencia", type: "text" },
      { name: "fecha_asistencia", type: "text" },
    ],
    indexes: [
      { name: "idx_registro_incidencias_name", columns: ["name"] },
      { name: "idx_registro_incidencias_active", columns: ["is_active"] },
    ],
  },
];
