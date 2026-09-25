import {
  define_module,
  define_routes,
  new_id,
  now_iso,
  type DomainRow,
  type KirletCtx,
} from "@opus-perpetuus/imperium-core-kit";
import {
  LIMITE_FILAS,
  campo_busqueda,
  falla,
  fecha_cliente,
  grupo_activo,
  solo_fecha,
  texto,
} from "../../lib/escolar.ts";
import { enlaces_compartidos_pages, RUTA_PUBLICA } from "./enlaces-compartidos.pages.ts";
import { enlaces_compartidos_tables } from "./enlaces-compartidos.tables.ts";

/** Vigencia por defecto: lo que tarda en leerse un aviso y atenderse. */
const DIAS_VIGENCIA = 30;
const DIAS_MAXIMOS = 365;

/** 24 bytes aleatorios (192 bits) en base64url: no se adivina ni se enumera. */
export function nuevo_token(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Buffer.from(bytes).toString("base64url");
}

function expira_en(dias: unknown): string {
  const n = Math.min(Math.max(Math.round(Number(dias) || DIAS_VIGENCIA), 1), DIAS_MAXIMOS);
  return new Date(Date.now() + n * 86_400_000).toISOString();
}

function salida(enlace: DomainRow) {
  return { ...enlace, ruta: `${RUTA_PUBLICA}?t=${enlace.token}` };
}

async function crear(ctx: KirletCtx, row: DomainRow): Promise<Response> {
  const ts = now_iso();
  const created = await ctx.data.insert("enlaces_compartidos", {
    id: new_id("enlace"),
    is_active: true,
    created_by: ctx.actor,
    search_field: campo_busqueda(row.name),
    token: nuevo_token(),
    vistas: 0,
    created_at: ts,
    updated_at: ts,
    ...row,
  });
  return ctx.created(salida(created));
}

export const enlaces_compartidos_module = define_module({
  resource: "enlaces-compartidos",
  labels: {
    singular: "Enlace compartido",
    plural: "Enlaces compartidos",
    read: "Ver Enlaces compartidos",
    write: "Crear y retirar Enlaces compartidos",
  },
  routes: define_routes({
    /**
     * Enlace de una incidencia para la familia. Si ya hay uno vigente se
     * devuelve ese: compartir dos veces no debe dejar dos enlaces sueltos.
     */
    "POST /enlaces-compartidos/incidencia/:id": async (ctx) => {
      const body = await ctx.body<{ dias?: number }>();
      const incidencia = await ctx.data.findOne("registro_incidencias", { id: ctx.params.id! });
      if (!incidencia || incidencia.is_active === false) falla(404, "La incidencia no existe");
      const ahora = now_iso();
      const vigentes = await ctx.data.findMany("enlaces_compartidos", {
        where: { incidencia_id: String(incidencia.id), tipo: "incidencia", is_active: true },
        limit: LIMITE_FILAS,
      });
      const vigente = vigentes.find((e) => !e.expira_at || texto(e.expira_at) > ahora);
      if (vigente) return { data: salida(vigente) };
      const alumno = await ctx.data.findOne("alumnos", { id: texto(incidencia.alumno_id) });
      return crear(ctx, {
        name: `${texto(incidencia.tipo) || "Incidencia"} · ${texto(alumno?.name)}`,
        tipo: "incidencia",
        incidencia_id: incidencia.id,
        alumno_ids: [texto(incidencia.alumno_id)],
        grupo_id: incidencia.grupo_id ?? null,
        expira_at: expira_en(body.dias),
      });
    },

    /** Reporte de incidencias y faltas de uno o más alumnos de un grupo. */
    "POST /enlaces-compartidos/reporte": async (ctx) => {
      const body = await ctx.body<{
        grupo_id?: string;
        alumno_ids?: string[];
        desde?: string;
        hasta?: string;
        incluir_incidencias?: boolean;
        incluir_faltas?: boolean;
        titulo?: string;
        dias?: number;
      }>();
      const grupo = await grupo_activo(ctx, texto(body.grupo_id));
      const pedidos = [...new Set((body.alumno_ids ?? []).map(texto).filter(Boolean))];
      if (!pedidos.length) falla(400, "Elige al menos un alumno");
      const alumnos = await ctx.data.findMany("alumnos", {
        where: { id: { in: pedidos }, grupo_id: String(grupo.id) },
        limit: LIMITE_FILAS,
      });
      if (alumnos.length !== pedidos.length) falla(400, "Hay alumnos que no son de este grupo");
      const incluir_incidencias = body.incluir_incidencias !== false;
      const incluir_faltas = body.incluir_faltas !== false;
      if (!incluir_incidencias && !incluir_faltas) falla(400, "Incluye incidencias, faltas o ambas");
      const desde = solo_fecha(body.desde);
      const hasta = solo_fecha(body.hasta) || fecha_cliente(null);
      if (desde && desde > hasta) falla(400, "La fecha inicial es posterior a la final");
      const titulo =
        texto(body.titulo) ||
        (alumnos.length === 1
          ? `Reporte de ${texto(alumnos[0]!.name)}`
          : `Reporte de ${texto(grupo.name)} (${alumnos.length} alumnos)`);
      return crear(ctx, {
        name: titulo,
        tipo: "reporte",
        alumno_ids: pedidos,
        grupo_id: grupo.id,
        desde: desde || null,
        hasta,
        incluir_incidencias,
        incluir_faltas,
        expira_at: expira_en(body.dias),
      });
    },

    "GET /enlaces-compartidos": async (ctx) => {
      const grupo_id = texto(ctx.query.get("grupo_id"));
      const rows = await ctx.data.findMany("enlaces_compartidos", {
        where: grupo_id ? { grupo_id } : {},
        limit: LIMITE_FILAS,
      });
      const data = rows
        .sort((a, b) => texto(b.created_at).localeCompare(texto(a.created_at)))
        .map(salida);
      return { data, total_elementos: data.length };
    },

    "POST /enlaces-compartidos/:id/retirar": async (ctx) => {
      const enlace = await ctx.data.findOne("enlaces_compartidos", { id: ctx.params.id! });
      if (!enlace) falla(404, "El enlace no existe");
      const updated = await ctx.data.update(
        "enlaces_compartidos",
        { id: String(enlace.id) },
        { is_active: false, updated_at: now_iso() },
      );
      return { data: salida(updated ?? enlace) };
    },
  }),
  tables: enlaces_compartidos_tables,
  pages: enlaces_compartidos_pages,
  menu: [],
});
