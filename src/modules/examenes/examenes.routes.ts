import {
  define_crud,
  define_module,
  define_routes,
  new_id,
  now_iso,
  type DomainRow,
  type KirletCtx,
} from "@opus-perpetuus/imperium-core-kit";
import {
  calificar,
  letra,
  normalizar_preguntas,
  puntos_totales,
  type Pregunta,
} from "../../lib/calificacion.ts";
import {
  LIMITE_FILAS,
  alumnos_del_grupo,
  campo_busqueda,
  falla,
  solo_fecha,
  texto,
} from "../../lib/escolar.ts";
import { examenes_tables } from "./examenes.tables.ts";

/** Una foto de celular ya comprimida pesa ~300 KB; esto deja margen sin llegar al tope del núcleo. */
const MAX_FOTO = 4_000_000;

function foto_valida(value: unknown, que: string): string | null {
  const foto = texto(value);
  if (!foto) return null;
  if (!foto.startsWith("data:image/")) falla(400, `${que}: solo se aceptan imágenes`);
  if (foto.length > MAX_FOTO) falla(413, `${que}: la imagen es demasiado grande`);
  return foto;
}

async function examen_de(ctx: KirletCtx, id: string): Promise<DomainRow & { preguntas: Pregunta[] }> {
  const examen = await ctx.data.findOne("examenes", { id });
  if (!examen || examen.is_active === false) falla(404, "El examen no existe");
  return { ...examen, preguntas: normalizar_preguntas(examen.preguntas) };
}

/** Respuesta sin fotos, para listas: las fotos se piden una por una. */
function ligera(r: DomainRow): DomainRow {
  const respuestas = Array.isArray(r.respuestas) ? (r.respuestas as Record<string, unknown>[]) : [];
  const { foto_hoja, ...resto } = r;
  return {
    ...resto,
    tiene_foto_hoja: !!foto_hoja,
    respuestas: respuestas.map(({ foto, ...x }) => ({ ...x, tiene_foto: !!foto })),
  };
}

async function respuestas_de(ctx: KirletCtx, examen_id: string): Promise<DomainRow[]> {
  return ctx.data.findMany("respuestas_examen", {
    where: { examen_id, is_active: true },
    limit: LIMITE_FILAS,
  });
}

/** Con la clave nueva, todas las respuestas ya capturadas se vuelven a calificar. */
async function recalificar(ctx: KirletCtx, examen_id: string, preguntas: Pregunta[]): Promise<void> {
  const rows = await respuestas_de(ctx, examen_id);
  if (!rows.length) return;
  const ts = now_iso();
  await ctx.data.batch(
    rows.map((r) => {
      const c = calificar(preguntas, r.respuestas);
      return {
        op: "update",
        table: "respuestas_examen",
        where: { id: String(r.id) },
        patch: { ...c, updated_at: ts },
      };
    }),
  );
}

const flujo = define_routes({
  "GET /examenes/:id/captura": async (ctx) => {
    const examen = await examen_de(ctx, ctx.params.id!);
    const alumnos = texto(examen.grupo_id) ? await alumnos_del_grupo(ctx, texto(examen.grupo_id)) : [];
    const por_alumno = new Map((await respuestas_de(ctx, String(examen.id))).map((r) => [texto(r.alumno_id), r]));
    const [grupo, materia] = await Promise.all([
      texto(examen.grupo_id) ? ctx.data.findOne("grupo", { id: texto(examen.grupo_id) }) : null,
      texto(examen.materia_id) ? ctx.data.findOne("materias", { id: texto(examen.materia_id) }) : null,
    ]);
    return {
      data: {
        examen: { ...examen, grupo_nombre: texto(grupo?.name), materia_nombre: texto(materia?.name) },
        alumnos: alumnos.map((a) => {
          const r = por_alumno.get(a.id);
          return { ...a, respuesta: r ? ligera(r) : null };
        }),
      },
    };
  },

  "GET /examenes/:id/respuestas/:alumno_id": async (ctx) => {
    const r = await ctx.data.findOne("respuestas_examen", {
      examen_id: ctx.params.id!,
      alumno_id: ctx.params.alumno_id!,
    });
    return { data: r && r.is_active !== false ? r : null };
  },

  "PUT /examenes/:id/respuestas/:alumno_id": async (ctx) => {
    const body = await ctx.body<{
      respuestas?: unknown[];
      foto_hoja?: string | null;
      description?: string;
    }>();
    const examen = await examen_de(ctx, ctx.params.id!);
    const alumno = await ctx.data.findOne("alumnos", { id: ctx.params.alumno_id! });
    if (!alumno) falla(404, "El alumno no existe");
    if (texto(examen.grupo_id) && texto(alumno.grupo_id) !== texto(examen.grupo_id)) {
      falla(400, "El alumno no pertenece al grupo del examen");
    }
    const entrada = Array.isArray(body.respuestas) ? body.respuestas : [];
    for (const r of entrada) {
      foto_valida((r as Record<string, unknown> | null)?.foto, "Foto de la respuesta");
    }
    const c = calificar(examen.preguntas, entrada);
    const ts = now_iso();
    const existente = await ctx.data.findOne("respuestas_examen", {
      examen_id: String(examen.id),
      alumno_id: String(alumno.id),
    });
    const patch: DomainRow = {
      ...c,
      description: texto(body.description),
      calificado_por: ctx.actor,
      is_active: true,
      updated_at: ts,
    };
    // `foto_hoja` ausente = no se toca; `null` o "" = se quita.
    if (body.foto_hoja !== undefined) patch.foto_hoja = foto_valida(body.foto_hoja, "Foto de la hoja");
    const guardada = existente
      ? await ctx.data.update("respuestas_examen", { id: String(existente.id) }, patch)
      : await ctx.data.insert("respuestas_examen", {
          id: new_id("respuesta"),
          name: `${texto(examen.name)} · ${texto(alumno.name)}`,
          created_by: ctx.actor,
          search_field: campo_busqueda(examen.name, alumno.name),
          examen_id: examen.id,
          alumno_id: alumno.id,
          grupo_id: alumno.grupo_id ?? null,
          alumno_nombre_snapshot: texto(alumno.name),
          numero_lista: Number(alumno.numero_lista) || null,
          foto_hoja: null,
          created_at: ts,
          ...patch,
        });
    return { data: guardada ? ligera(guardada) : null };
  },

  "GET /examenes/:id/resultados": async (ctx) => {
    const examen = await examen_de(ctx, ctx.params.id!);
    const rows = await respuestas_de(ctx, String(examen.id));
    const calificadas = rows.filter((r) => Number.isFinite(Number(r.calificacion)));
    const promedio = calificadas.length
      ? Math.round((calificadas.reduce((n, r) => n + Number(r.calificacion), 0) / calificadas.length) * 10) / 10
      : null;
    const preguntas = examen.preguntas.map((p, i) => {
      const dadas = rows
        .map((r) => (Array.isArray(r.respuestas) ? (r.respuestas as Record<string, unknown>[]) : []))
        .map((lista) => lista.find((x) => x.pregunta_id === p.id))
        .filter((x): x is Record<string, unknown> => !!x);
      const con_puntos = dadas.filter((x) => typeof x.puntos === "number");
      const obtenidos = con_puntos.reduce((n, x) => n + Number(x.puntos), 0);
      const distribucion: Record<string, number> = {};
      if (p.tipo === "opcion") {
        p.opciones.forEach((_, j) => (distribucion[letra(j)] = 0));
        for (const x of dadas) {
          const l = texto(x.respuesta);
          if (l in distribucion) distribucion[l]! += 1;
        }
      }
      return {
        id: p.id,
        numero: i + 1,
        tipo: p.tipo,
        enunciado: p.enunciado,
        clave: p.clave,
        respondidas: dadas.filter((x) => texto(x.respuesta) || x.foto).length,
        porcentaje_logro: con_puntos.length
          ? Math.round((obtenidos / (con_puntos.length * p.puntos)) * 1000) / 10
          : null,
        distribucion,
      };
    });
    return {
      data: {
        examen: { id: examen.id, name: examen.name, total_puntos: examen.total_puntos },
        promedio,
        capturadas: rows.length,
        pendientes: rows.filter((r) => r.estado === "pendiente").length,
        alumnos: rows
          .map(ligera)
          .sort((a, b) => Number(a.numero_lista ?? 999) - Number(b.numero_lista ?? 999)),
        preguntas,
      },
    };
  },
});

function con_totales(row: DomainRow): DomainRow {
  if (!("preguntas" in row)) return row;
  const preguntas = normalizar_preguntas(row.preguntas);
  return { ...row, preguntas, total_puntos: puntos_totales(preguntas) };
}

export const examenes_module = define_module({
  resource: "examenes",
  labels: {
    singular: "Examen",
    plural: "Exámenes",
    read: "Ver Exámenes",
    write: "Editar y calificar Exámenes",
  },
  routes: [
    ...flujo,
    ...define_crud({
      resource: "examenes",
      table: "examenes",
      soft_delete: true,
      soft_delete_field: "is_active",
      history: true,
      default_sort: "fecha:desc",
      id_prefix: "examen",
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
        periodo_examen_id: { type: "string", search: true },
        grupo_id: { type: "string", search: true },
        materia_id: { type: "string", search: true },
        fecha: { type: "string", normalize: (v) => solo_fecha(v) || null },
        preguntas: { type: "json" },
        // Lo recalcula el hook a partir de las preguntas.
        total_puntos: { type: "number" },
      },
      options_map: { value: "id", label: "name" },
      hooks: {
        before_create: (_ctx, row) => con_totales(row),
        before_update: (_ctx, _id, patch) => con_totales(patch),
        after_update: async (ctx, row, before) => {
          if (JSON.stringify(row.preguntas) !== JSON.stringify(before.preguntas)) {
            await recalificar(ctx, String(row.id), normalizar_preguntas(row.preguntas));
          }
        },
      },
    }),
  ],
  tables: examenes_tables,
  menu: [],
});
