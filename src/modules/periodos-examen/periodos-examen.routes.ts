import { define_crud, define_module, define_routes, new_id, now_iso } from "@opus-perpetuus/imperium-core-kit";
import { LIMITE_FILAS, campo_busqueda, dividir_rango, falla, solo_fecha, texto } from "../../lib/escolar.ts";
import { periodos_examen_pages } from "./periodos-examen.pages.ts";
import { periodos_examen_tables } from "./periodos-examen.tables.ts";

const fecha = (value: unknown) => solo_fecha(value) || null;

/** Máximo de periodos al dividir un ciclo (semanas de un año, de sobra). */
const MAX_PERIODOS = 52;

/**
 * Divide el ciclo en `cantidad` periodos seguidos de duración casi igual
 * ("Bimestre 1…5", "Trimestre 1…3", "Parcial 1…3"); luego se ajustan a mano.
 * Si el ciclo ya tiene periodos no se duplica: se editan en el catálogo.
 */
const periodos_flow = define_routes({
  "POST /periodos-examen/generar": async (ctx) => {
    const body = await ctx.body<{ ciclo_escolar_id?: string; cantidad?: number; nombre?: string; escuela_id?: string }>();
    const ciclo = await ctx.data.findOne("ciclos_escolares", { id: texto(body.ciclo_escolar_id) });
    if (!ciclo || ciclo.is_active === false) falla(404, "Elige un ciclo escolar");
    const inicio = solo_fecha(ciclo.fecha_inicio);
    const fin = solo_fecha(ciclo.fecha_fin);
    if (!inicio || !fin) falla(400, "El ciclo necesita fecha de inicio y de fin");
    const cantidad = Math.trunc(Number(body.cantidad));
    if (!Number.isFinite(cantidad) || cantidad < 1 || cantidad > MAX_PERIODOS) {
      falla(400, `Elige de 1 a ${MAX_PERIODOS} periodos`);
    }
    const nombre = texto(body.nombre) || "Periodo";
    const escuela_id = texto(body.escuela_id) || null;
    const existentes = await ctx.data.count("periodos_examen", {
      ciclo_escolar_id: String(ciclo.id),
      is_active: true,
    });
    if (existentes) falla(409, "Este ciclo ya tiene periodos; edítalos en Periodos del ciclo");
    const tramos = dividir_rango(inicio, fin, cantidad);
    if (!tramos.length) falla(400, "El ciclo es más corto que el número de periodos");
    const ts = now_iso();
    const rows = tramos.map((t, i) => {
      const name = `${nombre} ${i + 1}`;
      return {
        id: new_id("periodo-ex"),
        name,
        is_active: true,
        created_by: ctx.actor,
        search_field: campo_busqueda(name, ciclo.name),
        ciclo_escolar_id: ciclo.id,
        escuela_id,
        fecha_inicio: t.inicio,
        fecha_fin: t.fin,
        created_at: ts,
        updated_at: ts,
      };
    });
    await ctx.data.batch(rows.map((row) => ({ op: "insert", table: "periodos_examen", row })));
    const data = await ctx.data.findMany("periodos_examen", {
      where: { ciclo_escolar_id: String(ciclo.id), is_active: true },
      limit: LIMITE_FILAS,
    });
    return ctx.created(data.sort((a, b) => solo_fecha(a.fecha_inicio).localeCompare(solo_fecha(b.fecha_inicio))));
  },
});

/**
 * Periodos en que se divide un ciclo escolar (bimestres, trimestres,
 * semestres, parciales…). Agrupan exámenes y acotan reportes; la tabla
 * conserva su nombre histórico.
 */
export const periodos_examen_module = define_module({
  resource: "periodos-examen",
  labels: {
    singular: "Periodo del ciclo",
    plural: "Periodos del ciclo",
    read: "Ver Periodos del ciclo",
    write: "Editar Periodos del ciclo",
  },
  routes: [...periodos_flow, ...define_crud({
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
  })],
  tables: periodos_examen_tables,
  pages: periodos_examen_pages,
  menu: [],
});

function valida_rango(row: Record<string, unknown>): void {
  const inicio = solo_fecha(row.fecha_inicio);
  const fin = solo_fecha(row.fecha_fin);
  if (inicio && fin && inicio > fin) falla(400, "La fecha de inicio es posterior a la de fin");
}
