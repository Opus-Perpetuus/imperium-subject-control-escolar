import { define_crud, define_module } from "@opus-perpetuus/imperium-core-kit";
import { registro_asistencias_pages } from "./registro-asistencias.pages.ts";
import { registro_asistencias_tables } from "./registro-asistencias.tables.ts";

export const registro_asistencias_module = define_module({
  resource: "registro-asistencias",
  labels: {
    singular: "Registro de asistencias",
    plural: "Registro de asistencias",
    read: "Ver Registro de asistencias",
    write: "Editar Registro de asistencias",
  },
  routes: define_crud({
    resource: "registro-asistencias",
    table: "registro_asistencias",
    soft_delete: true,
    soft_delete_field: "is_active",
    history: true,
    default_sort: "name:asc",
    id_prefix: "registro",
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
      grupo_id: { type: "string", search: true },
      materia_id: { type: "string", search: true },
      teacher_user_id: { type: "string", search: true },
      fecha_asistencia: { type: "string", search: true },
      estatus: { type: "string", search: true },
      total_alumnos: { type: "number" },
    },
    options_map: { value: "id", label: "name" },
  }),
  tables: registro_asistencias_tables,
  pages: registro_asistencias_pages,
  menu: [],
});
