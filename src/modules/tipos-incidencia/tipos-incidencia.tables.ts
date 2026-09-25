import type { KirletTableDecl } from "@opus-perpetuus/imperium-core-kit";

export const tipos_incidencia_tables: KirletTableDecl[] = [
  {
    name: "tipos_incidencia",
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
      { name: "categoria", type: "text" },
      { name: "severidad", type: "text" },
      { name: "orden", type: "real" },
    ],
    indexes: [
      { name: "idx_tipos_incidencia_name", columns: ["name"] },
      { name: "idx_tipos_incidencia_active", columns: ["is_active"] },
    ],
  },
];
