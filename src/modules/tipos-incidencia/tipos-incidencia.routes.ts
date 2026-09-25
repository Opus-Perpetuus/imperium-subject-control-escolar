import { define_crud, define_module } from "@opus-perpetuus/imperium-core-kit";
import { tipos_incidencia_pages } from "./tipos-incidencia.pages.ts";
import { tipos_incidencia_tables } from "./tipos-incidencia.tables.ts";

export const CATEGORIAS_INCIDENCIA = ["negativa", "positiva", "neutral"] as const;
export const SEVERIDADES_INCIDENCIA = ["leve", "grave", "muy_grave"] as const;

function uno_de(opciones: readonly string[], etiqueta: string) {
  return (value: unknown) =>
    value == null || value === "" || opciones.includes(String(value))
      ? null
      : `${etiqueta} debe ser ${opciones.join(", ")}`;
}

export const tipos_incidencia_module = define_module({
  resource: "tipos-incidencia",
  labels: {
    singular: "Tipo de incidencia",
    plural: "Tipos de incidencia",
    read: "Ver Tipos de incidencia",
    write: "Editar Tipos de incidencia",
  },
  routes: define_crud({
    resource: "tipos-incidencia",
    table: "tipos_incidencia",
    soft_delete: true,
    soft_delete_field: "is_active",
    history: true,
    default_sort: "orden:asc",
    id_prefix: "tipo-inc",
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
      categoria: {
        type: "string",
        search: true,
        validate: uno_de(CATEGORIAS_INCIDENCIA, "La categoría"),
      },
      severidad: {
        type: "string",
        search: true,
        validate: uno_de(SEVERIDADES_INCIDENCIA, "La severidad"),
      },
      orden: { type: "number" },
    },
    options_map: { value: "id", label: "name" },
  }),
  tables: tipos_incidencia_tables,
  pages: tipos_incidencia_pages,
  menu: [],
});
