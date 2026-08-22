import { define_crud, define_module } from "@opus-perpetuus/imperium-core-kit";
import { horarios_pages } from "./horarios.pages.ts";
import { horarios_tables } from "./horarios.tables.ts";

export const horarios_module = define_module({
  resource: "horarios",
  labels: {
    singular: "Horarios",
    plural: "Horarios",
    read: "Ver Horarios",
    write: "Editar Horarios",
  },
  routes: define_crud({
    resource: "horarios",
    table: "horarios",
    soft_delete: true,
    soft_delete_field: "is_active",
    history: true,
    default_sort: "name:asc",
    id_prefix: "horarios",
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
    },
    options_map: { value: "id", label: "name" },
  }),
  tables: horarios_tables,
  pages: horarios_pages,
  menu: [],
});
