import { define_crud, define_module } from "@opus-perpetuus/imperium-core-kit";
import { materias_pages } from "./materias.pages.ts";
import { materias_tables } from "./materias.tables.ts";

export const materias_module = define_module({
  resource: "materias",
  labels: {
    singular: "Materias",
    plural: "Materias",
    read: "Ver Materias",
    write: "Editar Materias",
  },
  routes: define_crud({
    resource: "materias",
    table: "materias",
    soft_delete: true,
    soft_delete_field: "is_active",
    history: true,
    default_sort: "name:asc",
    id_prefix: "materias",
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
    },
    options_map: { value: "id", label: "name" },
  }),
  tables: materias_tables,
  pages: materias_pages,
  menu: [],
});
