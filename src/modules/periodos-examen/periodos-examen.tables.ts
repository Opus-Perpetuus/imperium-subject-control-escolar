import type { KirletTableDecl } from "@opus-perpetuus/imperium-core-kit";

export const periodos_examen_tables: KirletTableDecl[] = [
  {
    name: "periodos_examen",
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
      { name: "ciclo_escolar_id", type: "text" },
      { name: "escuela_id", type: "text" },
      { name: "fecha_inicio", type: "text" },
      { name: "fecha_fin", type: "text" },
    ],
    indexes: [
      { name: "idx_periodos_examen_name", columns: ["name"] },
      { name: "idx_periodos_examen_active", columns: ["is_active"] },
    ],
  },
];
