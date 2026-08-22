import { define_crud, define_module } from "@opus-perpetuus/imperium-core-kit";
import { grados_escolares_pages } from "./grados-escolares.pages.ts";
import { grados_escolares_tables } from "./grados-escolares.tables.ts";

export const grados_escolares_module = define_module({
  resource: "grados-escolares",
  labels: {
    singular: "Grados escolares",
    plural: "Grados escolares",
    read: "Ver Grados escolares",
    write: "Editar Grados escolares",
  },
  routes: define_crud({
    resource: "grados-escolares",
    table: "grados_escolares",
    soft_delete: true,
    soft_delete_field: "is_active",
    history: true,
    default_sort: "name:asc",
    id_prefix: "grados-e",
    fields: {
      name: { type: "string", required: true, search: true },
      description: { type: "string", search: true },
      is_active: { type: "boolean" },
      state: { type: "string" },
      ref: { type: "string", search: true },
      search_field: { type: "string", search: true },
      created_by: { type: "string" },
      custom_data: { type: "json" },
      payload: { type: "json" },
      clave: { type: "string", search: true },
      nivel_orden: { type: "number" },
    },
    options_map: { value: "id", label: "name" },
  }),
  tables: grados_escolares_tables,
  pages: grados_escolares_pages,
  menu: [],
});
