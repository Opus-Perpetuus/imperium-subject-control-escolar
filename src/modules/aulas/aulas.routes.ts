import { define_crud, define_module } from "@opus-perpetuus/imperium-core-kit";
import { aulas_pages } from "./aulas.pages.ts";
import { aulas_tables } from "./aulas.tables.ts";

export const aulas_module = define_module({
  resource: "aulas",
  labels: {
    singular: "Aulas",
    plural: "Aulas",
    read: "Ver Aulas",
    write: "Editar Aulas",
  },
  routes: define_crud({
    resource: "aulas",
    table: "aulas",
    soft_delete: true,
    soft_delete_field: "is_active",
    history: true,
    default_sort: "name:asc",
    id_prefix: "aulas",
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
      escuela_id: { type: "string", search: true },
      capacidad: { type: "number" },
    },
    options_map: { value: "id", label: "name" },
  }),
  tables: aulas_tables,
  pages: aulas_pages,
  menu: [],
});
