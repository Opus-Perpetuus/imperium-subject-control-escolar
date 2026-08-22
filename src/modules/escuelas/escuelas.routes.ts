import { define_crud, define_module } from "@opus-perpetuus/imperium-core-kit";
import { escuelas_pages } from "./escuelas.pages.ts";
import { escuelas_tables } from "./escuelas.tables.ts";

export const escuelas_module = define_module({
  resource: "escuelas",
  labels: {
    singular: "Escuelas",
    plural: "Escuelas",
    read: "Ver Escuelas",
    write: "Editar Escuelas",
  },
  routes: define_crud({
    resource: "escuelas",
    table: "escuelas",
    soft_delete: true,
    soft_delete_field: "is_active",
    history: true,
    default_sort: "name:asc",
    id_prefix: "escuelas",
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
      direccion: { type: "string", search: true },
      telefono: { type: "string", search: true },
    },
    options_map: { value: "id", label: "name" },
  }),
  tables: escuelas_tables,
  pages: escuelas_pages,
  menu: [],
});
