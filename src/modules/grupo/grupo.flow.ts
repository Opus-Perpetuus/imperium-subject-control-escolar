import { define_routes, new_id, now_iso, type DomainRow, type KirletCtx } from "@opus-perpetuus/imperium-core-kit";
import {
  LIMITE_FILAS,
  alumnos_del_grupo,
  campo_busqueda,
  ciclo_para_fecha,
  falla,
  fecha_cliente,
  grupo_activo,
  nombres_de_lista,
  periodo_para_fecha,
  solo_fecha,
  texto,
  usuario,
} from "../../lib/escolar.ts";
import { sembrar_tipos_incidencia } from "../../seed.ts";

const por_nombre = (a: { name?: unknown }, b: { name?: unknown }) =>
  texto(a.name).localeCompare(texto(b.name), "es");

async function asignaciones_de(ctx: KirletCtx, grupo_ids: string[]): Promise<DomainRow[]> {
  if (!grupo_ids.length) return [];
  return ctx.data.findMany("asignaciones_docente", {
    where: { grupo_id: { in: grupo_ids }, is_active: true },
    limit: LIMITE_FILAS,
  });
}

/** Mayor número de lista entre los alumnos activos del grupo (0 si no hay). */
function ultimo_numero(alumnos: { numero_lista: number }[]): number {
  return alumnos.reduce((max, a) => Math.max(max, a.numero_lista), 0);
}

/**
 * Contexto de las pantallas de aula (pase de lista, incidencias, reportes):
 * escuela, ciclo (el vigente en la fecha del dispositivo o el que se pida),
 * sus periodos y sus grupos, marcando los que el usuario tiene asignados.
 *
 * Con una sola escuela no se pregunta; con varias, la pantalla la elige y se
 * vuelve a pedir el contexto con `escuela_id`. Nadie queda fuera por no estar
 * asignado: los grupos ajenos se marcan, no se esconden (suplencias, dirección).
 */
export const grupo_flow = define_routes({
  "GET /grupo/contexto": async (ctx) => {
    const fecha = fecha_cliente(ctx.query.get("fecha"));
    // El arranque siembra los tipos, pero solo reintenta 30 s: si el esquema
    // llega después, la primera pantalla que los necesita los siembra.
    await sembrar_tipos_incidencia(ctx.data);
    const [escuelas, ciclos, materias, tipos] = await Promise.all([
      ctx.data.findMany("escuelas", { where: { is_active: true }, limit: LIMITE_FILAS }),
      ctx.data.findMany("ciclos_escolares", { where: { is_active: true }, limit: LIMITE_FILAS }),
      ctx.data.findMany("materias", { where: { is_active: true }, limit: LIMITE_FILAS }),
      ctx.data.findMany("tipos_incidencia", { where: { is_active: true }, limit: LIMITE_FILAS }),
    ]);
    const pedida = texto(ctx.query.get("escuela_id"));
    const escuela_id =
      escuelas.find((e) => String(e.id) === pedida)?.id ??
      (escuelas.length === 1 ? escuelas[0]!.id : null);
    const vigente = ciclo_para_fecha(ciclos, fecha);
    const ciclo_pedido = texto(ctx.query.get("ciclo_id"));
    const ciclo = ciclos.find((c) => String(c.id) === ciclo_pedido) ?? vigente;

    let grupos = ciclo
      ? await ctx.data.findMany("grupo", {
          where: { ciclo_escolar_id: String(ciclo.id), is_active: true },
          limit: LIMITE_FILAS,
        })
      : [];
    // Un grupo sin escuela cuenta para cualquiera: así funcionan los datos
    // capturados antes de que hubiera más de una escuela.
    if (escuela_id) {
      grupos = grupos.filter((g) => !texto(g.escuela_id) || texto(g.escuela_id) === String(escuela_id));
    } else if (escuelas.length > 1) {
      grupos = [];
    }
    const grupo_ids = grupos.map((g) => String(g.id));
    const [alumnos, asignaciones, grados, periodos] = await Promise.all([
      grupo_ids.length
        ? ctx.data.findMany("alumnos", {
            where: { grupo_id: { in: grupo_ids }, is_active: true },
            limit: LIMITE_FILAS,
          })
        : [],
      asignaciones_de(ctx, grupo_ids),
      ctx.data.findMany("grados_escolares", { where: { is_active: true }, limit: LIMITE_FILAS }),
      ciclo
        ? ctx.data.findMany("periodos_examen", {
            where: { ciclo_escolar_id: String(ciclo.id), is_active: true },
            limit: LIMITE_FILAS,
          })
        : [],
    ]);
    const por_grupo = new Map<string, number>();
    for (const a of alumnos) {
      const id = texto(a.grupo_id);
      por_grupo.set(id, (por_grupo.get(id) ?? 0) + 1);
    }
    const grado_de = new Map(grados.map((g) => [String(g.id), g]));
    const yo = texto(ctx.identity?.user_id);
    const periodos_ciclo = periodos
      .filter((p) => !escuela_id || !texto(p.escuela_id) || texto(p.escuela_id) === String(escuela_id))
      .sort((a, b) => solo_fecha(a.fecha_inicio).localeCompare(solo_fecha(b.fecha_inicio)));

    return {
      data: {
        fecha,
        escuelas: escuelas
          .map((e) => ({ id: e.id, name: e.name, clave: e.clave ?? null }))
          .sort(por_nombre),
        escuela_id,
        ciclos: ciclos
          .map((c) => ({ id: c.id, name: c.name, fecha_inicio: c.fecha_inicio, fecha_fin: c.fecha_fin }))
          .sort((a, b) => solo_fecha(b.fecha_inicio).localeCompare(solo_fecha(a.fecha_inicio))),
        ciclo: ciclo
          ? {
              id: ciclo.id,
              name: ciclo.name,
              fecha_inicio: ciclo.fecha_inicio,
              fecha_fin: ciclo.fecha_fin,
              vigente: !!vigente && vigente.id === ciclo.id,
            }
          : null,
        periodos: periodos_ciclo.map((p) => ({
          id: p.id,
          name: p.name,
          fecha_inicio: solo_fecha(p.fecha_inicio),
          fecha_fin: solo_fecha(p.fecha_fin),
        })),
        periodo_id: periodo_para_fecha(periodos_ciclo, fecha)?.id ?? null,
        grupos: grupos
          .map((g) => {
            const grado = grado_de.get(texto(g.grado_escolar_id));
            const suyas = asignaciones.filter((a) => texto(a.grupo_id) === String(g.id));
            const mias = suyas.filter((a) => !!yo && texto(a.user_id) === yo);
            return {
              id: g.id,
              name: g.name,
              letra: g.letra ?? null,
              grado: grado ? texto(grado.name) : null,
              grado_orden: grado && Number.isFinite(Number(grado.nivel_orden)) ? Number(grado.nivel_orden) : null,
              escuela_id: g.escuela_id ?? null,
              total_alumnos: por_grupo.get(String(g.id)) ?? 0,
              mio: mias.length > 0,
              // Sin materia = titular del grupo.
              materias_mias: [...new Set(mias.map((a) => texto(a.materia_id)).filter(Boolean))],
              docentes: [...new Set(suyas.map((a) => texto(a.docente) || texto(a.user_id)))].sort(),
            };
          })
          .sort(
            (a, b) =>
              Number(b.mio) - Number(a.mio) ||
              (a.grado_orden ?? Number.POSITIVE_INFINITY) - (b.grado_orden ?? Number.POSITIVE_INFINITY) ||
              por_nombre(a, b),
          ),
        materias: materias.map((m) => ({ id: m.id, name: m.name })).sort(por_nombre),
        tipos_incidencia: tipos
          .map((t) => ({
            id: t.id,
            name: t.name,
            categoria: t.categoria ?? null,
            severidad: t.severidad ?? null,
            orden: t.orden ?? null,
          }))
          .sort((a, b) => Number(a.orden ?? 999) - Number(b.orden ?? 999) || por_nombre(a, b)),
      },
    };
  },

  "GET /grupo/:id/alumnos": async (ctx) => {
    const grupo = await grupo_activo(ctx, ctx.params.id!);
    const data = await alumnos_del_grupo(ctx, String(grupo.id));
    return { data, total_elementos: data.length };
  },

  // #region Docentes del grupo

  /** El usuario se asigna al grupo: titular (sin materia) o de una materia. */
  "POST /grupo/:id/asignarme": async (ctx) => {
    const { user_id, label } = usuario(ctx);
    const grupo = await grupo_activo(ctx, ctx.params.id!);
    const body = await ctx.body<{ materia_id?: string }>();
    const materia_id = texto(body.materia_id) || null;
    if (materia_id) {
      const materia = await ctx.data.findOne("materias", { id: materia_id });
      if (!materia || materia.is_active === false) falla(404, "La materia no existe");
    }
    const actuales = await ctx.data.findMany("asignaciones_docente", {
      where: { grupo_id: String(grupo.id), user_id, is_active: true },
      limit: LIMITE_FILAS,
    });
    const ya = actuales.find((a) => (texto(a.materia_id) || null) === materia_id);
    if (ya) return { data: ya };
    const ts = now_iso();
    const name = `${label} · ${texto(grupo.name)}`;
    const creada = await ctx.data.insert("asignaciones_docente", {
      id: new_id("asig-doc"),
      name,
      is_active: true,
      created_by: ctx.actor,
      search_field: campo_busqueda(name),
      user_id,
      docente: label,
      grupo_id: grupo.id,
      materia_id,
      created_at: ts,
      updated_at: ts,
    });
    return ctx.created(creada);
  },

  /** Deja el grupo (o solo esa materia). Lo capturado en él se queda. */
  "POST /grupo/:id/dejar": async (ctx) => {
    const { user_id } = usuario(ctx);
    const body = await ctx.body<{ materia_id?: string }>();
    const materia_id = texto(body.materia_id) || null;
    const actuales = await ctx.data.findMany("asignaciones_docente", {
      where: { grupo_id: texto(ctx.params.id), user_id, is_active: true },
      limit: LIMITE_FILAS,
    });
    const quitar = actuales.filter((a) => (texto(a.materia_id) || null) === materia_id);
    const ts = now_iso();
    for (const a of quitar) {
      await ctx.data.update("asignaciones_docente", { id: String(a.id) }, { is_active: false, updated_at: ts });
    }
    return { data: { retiradas: quitar.length } };
  },

  // #endregion

  // #region Alumnos del grupo

  /**
   * Alta de varios alumnos de una vez, un nombre por renglón. Siguen la
   * numeración del grupo; un nombre que ya está en el grupo no se repite.
   */
  "POST /grupo/:id/alumnos/lote": async (ctx) => {
    const grupo = await grupo_activo(ctx, ctx.params.id!);
    const body = await ctx.body<{ nombres?: unknown }>();
    const nombres = nombres_de_lista(body.nombres);
    if (!nombres.length) falla(400, "Escribe al menos un nombre");
    const actuales = await alumnos_del_grupo(ctx, String(grupo.id));
    const clave = (n: string) => n.toLocaleLowerCase("es").normalize("NFD").replace(/\p{M}/gu, "");
    const vistos = new Set(actuales.map((a) => clave(a.name)));
    let numero = ultimo_numero(actuales);
    const ts = now_iso();
    const nuevos: DomainRow[] = [];
    const repetidos: string[] = [];
    for (const name of nombres) {
      if (vistos.has(clave(name))) {
        repetidos.push(name);
        continue;
      }
      vistos.add(clave(name));
      numero += 1;
      nuevos.push({
        id: new_id("alumnos"),
        name,
        is_active: true,
        created_by: ctx.actor,
        search_field: campo_busqueda(name),
        grupo_id: grupo.id,
        numero_lista: numero,
        created_at: ts,
        updated_at: ts,
      });
    }
    if (nuevos.length) {
      await ctx.data.batch(nuevos.map((row) => ({ op: "insert", table: "alumnos", row })));
    }
    return ctx.created({
      creados: nuevos.map((a) => ({ id: a.id, name: a.name, numero_lista: a.numero_lista })),
      repetidos,
      alumnos: await alumnos_del_grupo(ctx, String(grupo.id)),
    });
  },

  /** Numera la lista 1…N por orden alfabético del nombre como está escrito. */
  "POST /grupo/:id/alumnos/numerar": async (ctx) => {
    const grupo = await grupo_activo(ctx, ctx.params.id!);
    const actuales = await alumnos_del_grupo(ctx, String(grupo.id));
    const orden = [...actuales].sort(
      (a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }) || a.id.localeCompare(b.id),
    );
    const ts = now_iso();
    await ctx.data.batch(
      orden.map((a, i) => ({
        op: "update",
        table: "alumnos",
        where: { id: a.id },
        patch: { numero_lista: i + 1, updated_at: ts },
      })),
    );
    return { data: await alumnos_del_grupo(ctx, String(grupo.id)) };
  },

  /**
   * Pasa alumnos a otro grupo (el del siguiente ciclo, o un cambio de grupo).
   * Lo capturado antes —pases, incidencias, exámenes— se queda con el grupo
   * viejo. Si el destino ya tiene alumnos, los que llegan siguen su numeración.
   */
  "POST /grupo/:id/alumnos/mover": async (ctx) => {
    const origen = await grupo_activo(ctx, ctx.params.id!);
    const body = await ctx.body<{ destino_grupo_id?: string; alumno_ids?: unknown }>();
    const destino = await grupo_activo(ctx, texto(body.destino_grupo_id));
    if (destino.id === origen.id) falla(400, "Elige un grupo distinto");
    const pedidos = Array.isArray(body.alumno_ids) ? new Set(body.alumno_ids.map(texto).filter(Boolean)) : null;
    const del_origen = await alumnos_del_grupo(ctx, String(origen.id));
    const mover = pedidos ? del_origen.filter((a) => pedidos.has(a.id)) : del_origen;
    if (!mover.length) falla(400, "No hay alumnos que pasar");
    const en_destino = await alumnos_del_grupo(ctx, String(destino.id));
    let numero = ultimo_numero(en_destino);
    const ts = now_iso();
    await ctx.data.batch(
      mover.map((a) => ({
        op: "update",
        table: "alumnos",
        where: { id: a.id },
        patch: {
          grupo_id: destino.id,
          numero_lista: en_destino.length ? ++numero : a.numero_lista,
          updated_at: ts,
        },
      })),
    );
    return { data: { movidos: mover.length, destino: { id: destino.id, name: destino.name } } };
  },

  // #endregion
});
