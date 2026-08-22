import { define_crud, define_module } from "@opus-perpetuus/imperium-core-kit";
import { alumnos_pages } from "./alumnos.pages.ts";
import { alumnos_tables } from "./alumnos.tables.ts";

export const alumnos_module = define_module({
  resource: "alumnos",
  labels: {
    singular: "Alumnos",
    plural: "Alumnos",
    read: "Ver Alumnos",
    write: "Editar Alumnos",
  },
  routes: define_crud({
    resource: "alumnos",
    table: "alumnos",
    soft_delete: true,
    soft_delete_field: "is_active",
    history: true,
    default_sort: "name:asc",
    id_prefix: "alumnos",
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
      user_id: { type: "string", search: true },
      grupo_id: { type: "string", search: true },
      numero_lista: { type: "number" },
      email_contacto: { type: "string", search: true },
      telefono_contacto: { type: "string", search: true },
    },
    options_map: { value: "id", label: "name" },
  }),
  tables: alumnos_tables,
  pages: alumnos_pages,
  menu: [],
});
