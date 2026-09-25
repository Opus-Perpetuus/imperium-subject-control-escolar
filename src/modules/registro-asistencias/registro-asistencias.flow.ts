import {
  define_routes,
  new_id,
  now_iso,
  type DomainRow,
  type KirletCtx,
} from "@opus-perpetuus/imperium-core-kit";
import {
  ESTADOS_RENGLON,
  LIMITE_FILAS,
  alumnos_del_grupo,
  campo_busqueda,
  falla,
  fecha_cliente,
  fin_de_dia,
  grupo_activo,
  hora_cliente,
  solo_fecha,
  texto,
  type EstadoRenglon,
} from "../../lib/escolar.ts";

/**
 * Pase de lista secuencial: un registro (`registro_asistencias`) con un
 * renglón por alumno (`lista_asistencia`). Se puede pasar lista las veces que
 * haga falta en el día; cada pase es un registro nuevo.
 *
 * Una falta aquí NO crea una incidencia: las faltas se leen de los renglones
 * `ausente` y las incidencias son otra cosa que el docente registra aparte.
 */

const CERRADA = "cerrada";

async function renglones_de(ctx: KirletCtx, registro_id: string): Promise<DomainRow[]> {
  const rows = await ctx.data.findMany("lista_asistencia", {
    where: { registro_asistencia_id: registro_id },
    limit: LIMITE_FILAS,
  });
  return rows.sort(
    (a, b) =>
      Number(a.numero_lista ?? 0) - Number(b.numero_lista ?? 0) ||
      texto(a.alumno_nombre_snapshot).localeCompare(texto(b.alumno_nombre_snapshot), "es"),
  );
}

function conteo(renglones: DomainRow[]) {
  return {
    total_alumnos: renglones.length,
    presentes: renglones.filter((r) => r.estado === "presente").length,
    ausentes: renglones.filter((r) => r.estado === "ausente").length,
  };
}

async function registro_de(ctx: KirletCtx, id: string): Promise<DomainRow> {
  const registro = await ctx.data.findOne("registro_asistencias", { id });
  if (!registro || registro.is_active === false) falla(404, "El pase de lista no existe");
  return registro;
}

async function con_grupo(ctx: KirletCtx, registro: DomainRow, renglones: DomainRow[]) {
  const grupo = await ctx.data.findOne("grupo", { id: texto(registro.grupo_id) });
  const materia = texto(registro.materia_id)
    ? await ctx.data.findOne("materias", { id: texto(registro.materia_id) })
    : null;
  return {
    registro,
    renglones,
    grupo: grupo ? { id: grupo.id, name: grupo.name } : null,
    materia: materia ? { id: materia.id, name: materia.name } : null,
  };
}

export const registro_asistencias_flow = define_routes({
  "POST /registro-asistencias/pase": async (ctx) => {
    const body = await ctx.body<{
      grupo_id?: string;
      materia_id?: string;
      fecha?: string;
      hora?: string;
    }>();
    const grupo = await grupo_activo(ctx, texto(body.grupo_id));
    const alumnos = await alumnos_del_grupo(ctx, String(grupo.id));
    if (!alumnos.length) falla(400, "El grupo no tiene alumnos activos");

    const fecha = fecha_cliente(body.fecha);
    const hora = hora_cliente(body.hora);
    const del_dia = await ctx.data.count("registro_asistencias", {
      grupo_id: String(grupo.id),
      fecha_asistencia: { gte: fecha, lte: fin_de_dia(fecha) },
    });
    const name = `Pase de lista ${del_dia + 1} · ${texto(grupo.name)} · ${fecha}`;
    const ts = now_iso();
    const registro: DomainRow = {
      id: new_id("registro"),
      name,
      description: "",
      is_active: true,
      created_by: ctx.actor,
      search_field: campo_busqueda(name),
      grupo_id: grupo.id,
      materia_id: texto(body.materia_id) || null,
      teacher_user_id: ctx.actor,
      escuela_id: texto(grupo.escuela_id) || null,
      ciclo_escolar_id: texto(grupo.ciclo_escolar_id) || null,
      fecha_asistencia: fecha,
      hora_inicio: hora,
      estatus: "abierta",
      total_alumnos: alumnos.length,
      presentes: 0,
      ausentes: 0,
      created_at: ts,
      updated_at: ts,
    };
    const renglones: DomainRow[] = alumnos.map((alumno) => ({
      id: new_id("lista-as"),
      name: alumno.name,
      is_active: true,
      created_by: ctx.actor,
      search_field: campo_busqueda(alumno.name),
      registro_asistencia_id: registro.id,
      alumno_id: alumno.id,
      grupo_id: grupo.id,
      alumno_nombre_snapshot: alumno.name,
      numero_lista: alumno.numero_lista,
      estado: "pendiente",
      justificada: false,
      fecha,
      created_at: ts,
      updated_at: ts,
    }));
    await ctx.data.batch([
      { op: "insert", table: "registro_asistencias", row: registro },
      ...renglones.map((row) => ({ op: "insert", table: "lista_asistencia", row })),
    ]);
    return ctx.created(await con_grupo(ctx, registro, renglones));
  },

  "GET /registro-asistencias/pase/:id": async (ctx) => {
    const registro = await registro_de(ctx, ctx.params.id!);
    return { data: await con_grupo(ctx, registro, await renglones_de(ctx, String(registro.id))) };
  },

  "POST /registro-asistencias/pase/:id/marcar": async (ctx) => {
    const body = await ctx.body<{ renglon_id?: string; estado?: string }>();
    const registro = await registro_de(ctx, ctx.params.id!);
    if (registro.estatus === CERRADA) falla(409, "Este pase de lista ya está cerrado");
    const estado = texto(body.estado) as EstadoRenglon;
    if (!ESTADOS_RENGLON.includes(estado)) falla(400, "Estado de asistencia no válido");
    const renglon = await ctx.data.findOne("lista_asistencia", { id: texto(body.renglon_id) });
    if (!renglon || renglon.registro_asistencia_id !== registro.id) {
      falla(404, "El alumno no está en este pase de lista");
    }
    const ts = now_iso();
    const actualizado = await ctx.data.update(
      "lista_asistencia",
      { id: String(renglon.id) },
      {
        estado,
        justificada: estado === "ausente" ? Boolean(renglon.justificada) : false,
        marcado_at: estado === "pendiente" ? null : ts,
        marcado_por: estado === "pendiente" ? null : ctx.actor,
        updated_at: ts,
      },
    );
    const totales = conteo(await renglones_de(ctx, String(registro.id)));
    const cabecera = await ctx.data.update(
      "registro_asistencias",
      { id: String(registro.id) },
      { ...totales, updated_at: ts },
    );
    return { data: { renglon: actualizado, registro: cabecera } };
  },

  "POST /registro-asistencias/pase/:id/cerrar": async (ctx) => {
    const body = await ctx.body<{ hora?: string }>();
    const registro = await registro_de(ctx, ctx.params.id!);
    const renglones = await renglones_de(ctx, String(registro.id));
    const cabecera = await ctx.data.update(
      "registro_asistencias",
      { id: String(registro.id) },
      {
        ...conteo(renglones),
        estatus: CERRADA,
        hora_fin: registro.estatus === CERRADA ? registro.hora_fin : hora_cliente(body.hora),
        updated_at: now_iso(),
      },
    );
    return { data: await con_grupo(ctx, cabecera ?? registro, renglones) };
  },

  "GET /registro-asistencias/pases": async (ctx) => {
    const grupo_id = texto(ctx.query.get("grupo_id"));
    if (!grupo_id) falla(400, "Elige un grupo");
    const fecha = solo_fecha(ctx.query.get("fecha")) || fecha_cliente(null);
    const rows = await ctx.data.findMany("registro_asistencias", {
      where: {
        grupo_id,
        is_active: true,
        fecha_asistencia: { gte: fecha, lte: fin_de_dia(fecha) },
      },
      limit: LIMITE_FILAS,
    });
    const data = rows.sort((a, b) => texto(b.created_at).localeCompare(texto(a.created_at)));
    return { data, total_elementos: data.length };
  },
});
