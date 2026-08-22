import { define_crud, define_module } from "@opus-perpetuus/imperium-core-kit";
import { lista_asistencia_pages } from "./lista-asistencia.pages.ts";
import { lista_asistencia_tables } from "./lista-asistencia.tables.ts";

export const lista_asistencia_module = define_module({
  resource: "lista-asistencia",
  labels: {
    singular: "Listas de asistencia",
    plural: "Listas de asistencia",
    read: "Ver Listas de asistencia",
    write: "Editar Listas de asistencia",
  },
  routes: define_crud({
    resource: "lista-asistencia",
    table: "lista_asistencia",
    soft_delete: true,
    soft_delete_field: "is_active",
    history: true,
    default_sort: "name:asc",
    id_prefix: "lista-as",
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
      registro_asistencia_id: { type: "string", search: true },
      alumno_id: { type: "string", search: true },
      grupo_id: { type: "string", search: true },
      alumno_nombre_snapshot: { type: "string", search: true },
      numero_lista: { type: "number" },
      estado: { type: "string", search: true },
      justificada: { type: "boolean" },
      evidencia: { type: "string", search: true },
      registro_incidencia_id: { type: "string", search: true },
    },
    options_map: { value: "id", label: "name" },
  }),
  tables: lista_asistencia_tables,
  pages: lista_asistencia_pages,
  menu: [],
});
