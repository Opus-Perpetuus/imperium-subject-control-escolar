import type { KirletTableDecl } from "@opus-perpetuus/imperium-core-kit";

export const alumnos_tables: KirletTableDecl[] = [
  {
    name: "alumnos",
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
      { name: "user_id", type: "text" },
      { name: "grupo_id", type: "text" },
      { name: "numero_lista", type: "real" },
      { name: "email_contacto", type: "text" },
      { name: "telefono_contacto", type: "text" },
    ],
    indexes: [
      { name: "idx_alumnos_name", columns: ["name"] },
      { name: "idx_alumnos_active", columns: ["is_active"] },
    ],
  },
];
