import type { KirletTableDecl } from "@opus-perpetuus/imperium-core-kit";

export const grados_escolares_tables: KirletTableDecl[] = [
  {
    name: "grados_escolares",
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
      { name: "nivel_orden", type: "real" },
    ],
    indexes: [
      { name: "idx_grados_escolares_name", columns: ["name"] },
      { name: "idx_grados_escolares_active", columns: ["is_active"] },
    ],
  },
];
