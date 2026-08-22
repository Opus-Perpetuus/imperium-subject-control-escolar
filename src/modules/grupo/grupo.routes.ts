import { define_crud, define_module } from "@opus-perpetuus/imperium-core-kit";
import { grupo_pages } from "./grupo.pages.ts";
import { grupo_tables } from "./grupo.tables.ts";

export const grupo_module = define_module({
  resource: "grupo",
  labels: {
    singular: "Grupos",
    plural: "Grupos",
    read: "Ver Grupos",
    write: "Editar Grupos",
  },
  routes: define_crud({
    resource: "grupo",
    table: "grupo",
    soft_delete: true,
    soft_delete_field: "is_active",
    history: true,
    default_sort: "name:asc",
    id_prefix: "grupo",
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
      grado_escolar_id: { type: "string", search: true },
      ciclo_escolar_id: { type: "string", search: true },
      escuela_id: { type: "string", search: true },
      letra: { type: "string", search: true },
    },
    options_map: { value: "id", label: "name" },
  }),
  tables: grupo_tables,
  pages: grupo_pages,
  menu: [],
});
