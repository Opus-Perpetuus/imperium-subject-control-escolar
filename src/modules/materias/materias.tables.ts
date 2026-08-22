import type { KirletTableDecl } from "@opus-perpetuus/imperium-core-kit";

export const materias_tables: KirletTableDecl[] = [
  {
    name: "materias",
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
      { name: "clave", type: "text" },
    ],
    indexes: [
      { name: "idx_materias_name", columns: ["name"] },
      { name: "idx_materias_active", columns: ["is_active"] },
    ],
  },
];
