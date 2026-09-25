import { define_routes } from "@opus-perpetuus/imperium-core-kit";
import {
  LIMITE_FILAS,
  alumnos_del_grupo,
  ciclo_para_fecha,
  fecha_cliente,
  grupo_activo,
  nombres_por_id,
  texto,
} from "../../lib/escolar.ts";
import { sembrar_tipos_incidencia } from "../../seed.ts";

/**
 * Contexto de las pantallas de aula (pase de lista, incidencias, reportes):
 * escuela, ciclo vigente en la fecha del dispositivo y los grupos de ese ciclo.
 *
 * Con una sola escuela no se pregunta; con varias, la pantalla la elige y se
 * vuelve a pedir el contexto con `escuela_id`.
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
    const ciclo = ciclo_para_fecha(ciclos, fecha);

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
    const alumnos = grupos.length
      ? await ctx.data.findMany("alumnos", {
          where: { grupo_id: { in: grupos.map((g) => String(g.id)) }, is_active: true },
          limit: LIMITE_FILAS,
        })
      : [];
    const por_grupo = new Map<string, number>();
    for (const a of alumnos) {
      const id = texto(a.grupo_id);
      por_grupo.set(id, (por_grupo.get(id) ?? 0) + 1);
    }
    const grados = await nombres_por_id(ctx, "grados_escolares", grupos.map((g) => g.grado_escolar_id));

    return {
      data: {
        fecha,
        escuelas: escuelas
          .map((e) => ({ id: e.id, name: e.name, clave: e.clave ?? null }))
          .sort((a, b) => texto(a.name).localeCompare(texto(b.name), "es")),
        escuela_id,
        ciclo: ciclo
          ? {
              id: ciclo.id,
              name: ciclo.name,
              fecha_inicio: ciclo.fecha_inicio,
              fecha_fin: ciclo.fecha_fin,
            }
          : null,
        grupos: grupos
          .map((g) => ({
            id: g.id,
            name: g.name,
            letra: g.letra ?? null,
            grado: grados.get(texto(g.grado_escolar_id)) ?? null,
            escuela_id: g.escuela_id ?? null,
            total_alumnos: por_grupo.get(String(g.id)) ?? 0,
          }))
          .sort((a, b) => texto(a.name).localeCompare(texto(b.name), "es")),
        materias: materias
          .map((m) => ({ id: m.id, name: m.name }))
          .sort((a, b) => texto(a.name).localeCompare(texto(b.name), "es")),
        tipos_incidencia: tipos
          .map((t) => ({
            id: t.id,
            name: t.name,
            categoria: t.categoria ?? null,
            severidad: t.severidad ?? null,
            orden: t.orden ?? null,
          }))
          .sort(
            (a, b) =>
              Number(a.orden ?? 999) - Number(b.orden ?? 999) ||
              texto(a.name).localeCompare(texto(b.name), "es"),
          ),
      },
    };
  },

  "GET /grupo/:id/alumnos": async (ctx) => {
    const grupo = await grupo_activo(ctx, ctx.params.id!);
    const data = await alumnos_del_grupo(ctx, String(grupo.id));
    return { data, total_elementos: data.length };
  },
});
