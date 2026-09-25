import type { KirletTableDecl } from "@opus-perpetuus/imperium-core-kit";

export const enlaces_compartidos_tables: KirletTableDecl[] = [
  {
    name: "enlaces_compartidos",
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
      { name: "token", type: "text", notNull: true, unique: true },
      { name: "tipo", type: "text", notNull: true },
      { name: "incidencia_id", type: "text" },
      { name: "alumno_ids", type: "json" },
      { name: "grupo_id", type: "text" },
      { name: "desde", type: "text" },
      { name: "hasta", type: "text" },
      { name: "incluir_incidencias", type: "boolean" },
      { name: "incluir_faltas", type: "boolean" },
      { name: "expira_at", type: "text" },
      { name: "vistas", type: "real" },
      { name: "ultima_vista_at", type: "text" },
    ],
    indexes: [
      { name: "idx_enlaces_compartidos_incidencia", columns: ["incidencia_id"] },
      { name: "idx_enlaces_compartidos_active", columns: ["is_active"] },
    ],
  },
];
