import type { KirletTableDecl } from "@opus-perpetuus/imperium-core-kit";

const GENERALES = [
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
] satisfies KirletTableDecl["columns"];

export const examenes_tables: KirletTableDecl[] = [
  {
    name: "examenes",
    columns: [
      ...GENERALES,
      { name: "periodo_examen_id", type: "text" },
      { name: "grupo_id", type: "text" },
      { name: "materia_id", type: "text" },
      { name: "fecha", type: "text" },
      { name: "preguntas", type: "json" },
      { name: "total_puntos", type: "real" },
    ],
    indexes: [
      { name: "idx_examenes_name", columns: ["name"] },
      { name: "idx_examenes_active", columns: ["is_active"] },
      { name: "idx_examenes_grupo", columns: ["grupo_id"] },
    ],
  },
  {
    name: "respuestas_examen",
    columns: [
      ...GENERALES,
      { name: "examen_id", type: "text", notNull: true },
      { name: "alumno_id", type: "text", notNull: true },
      { name: "grupo_id", type: "text" },
      { name: "alumno_nombre_snapshot", type: "text" },
      { name: "numero_lista", type: "real" },
      { name: "respuestas", type: "json" },
      { name: "foto_hoja", type: "text" },
      { name: "puntos", type: "real" },
      { name: "puntos_max", type: "real" },
      { name: "porcentaje", type: "real" },
      { name: "calificacion", type: "real" },
      { name: "pendientes", type: "real" },
      { name: "estado", type: "text" },
      { name: "calificado_por", type: "text" },
    ],
    indexes: [
      { name: "idx_respuestas_examen_examen", columns: ["examen_id"] },
      { name: "idx_respuestas_examen_alumno", columns: ["examen_id", "alumno_id"], unique: true },
    ],
  },
];
