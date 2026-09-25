import { define_crud, define_module } from "@opus-perpetuus/imperium-core-kit";
import { falla, solo_fecha } from "../../lib/escolar.ts";
import { periodos_examen_pages } from "./periodos-examen.pages.ts";
import { periodos_examen_tables } from "./periodos-examen.tables.ts";

const fecha = (value: unknown) => solo_fecha(value) || null;

/** Ciclo de exámenes (bimestre, trimestre, parcial) dentro de un ciclo escolar. */
export const periodos_examen_module = define_module({
  resource: "periodos-examen",
  labels: {
    singular: "Periodo de exámenes",
    plural: "Periodos de exámenes",
    read: "Ver Periodos de exámenes",
    write: "Editar Periodos de exámenes",
  },
  routes: define_crud({
    resource: "periodos-examen",
    table: "periodos_examen",
    soft_delete: true,
    soft_delete_field: "is_active",
    history: true,
    default_sort: "fecha_inicio:asc",
    id_prefix: "periodo-ex",
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
      ciclo_escolar_id: { type: "string", search: true },
      escuela_id: { type: "string", search: true },
      fecha_inicio: { type: "string", normalize: fecha },
      fecha_fin: { type: "string", normalize: fecha },
    },
    options_map: { value: "id", label: "name" },
    hooks: {
      before_create: (_ctx, row) => {
        valida_rango(row);
        return row;
      },
      before_update: (_ctx, _id, patch, existing) => {
        valida_rango({ ...existing, ...patch });
        return patch;
      },
    },
  }),
  tables: periodos_examen_tables,
  pages: periodos_examen_pages,
  menu: [],
});

function valida_rango(row: Record<string, unknown>): void {
  const inicio = solo_fecha(row.fecha_inicio);
  const fin = solo_fecha(row.fecha_fin);
  if (inicio && fin && inicio > fin) falla(400, "La fecha de inicio es posterior a la de fin");
}
