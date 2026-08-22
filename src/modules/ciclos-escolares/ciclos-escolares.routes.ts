import { define_crud, define_module } from "@opus-perpetuus/imperium-core-kit";
import { ciclos_escolares_pages } from "./ciclos-escolares.pages.ts";
import { ciclos_escolares_tables } from "./ciclos-escolares.tables.ts";

export const ciclos_escolares_module = define_module({
  resource: "ciclos-escolares",
  labels: {
    singular: "Ciclos escolares",
    plural: "Ciclos escolares",
    read: "Ver Ciclos escolares",
    write: "Editar Ciclos escolares",
  },
  routes: define_crud({
    resource: "ciclos-escolares",
    table: "ciclos_escolares",
    soft_delete: true,
    soft_delete_field: "is_active",
    history: true,
    default_sort: "name:asc",
    id_prefix: "ciclos-e",
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
      fecha_inicio: { type: "string", search: true },
      fecha_fin: { type: "string", search: true },
      ciclo_actual: { type: "boolean" },
    },
    options_map: { value: "id", label: "name" },
  }),
  tables: ciclos_escolares_tables,
  pages: ciclos_escolares_pages,
  menu: [],
});
