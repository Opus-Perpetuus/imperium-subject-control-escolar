import type { DomainRow, KirletCtx } from "@opus-perpetuus/imperium-core-kit";
import { KirletHttpError } from "@opus-perpetuus/imperium-core-kit";

/**
 * Reglas compartidas por las pantallas de pase de lista, incidencias,
 * enlaces y exámenes.
 *
 * El contenedor de la app corre en UTC: "hoy" lo decide el dispositivo del
 * docente, que manda su fecha local (`AAAA-MM-DD`). Sin eso, un pase de lista
 * a las 19:00 de México quedaba con la fecha del día siguiente.
 */

/** Tope explícito: el data plane devuelve 200 filas si no se le pide otro. */
export const LIMITE_FILAS = 5000;

export const ESTADOS_RENGLON = ["pendiente", "presente", "ausente"] as const;
export type EstadoRenglon = (typeof ESTADOS_RENGLON)[number];

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^\d{2}:\d{2}$/;

export function texto(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

/** Primeros 10 caracteres de una fecha ISO o `AAAA-MM-DD`; vacío si no lo es. */
export function solo_fecha(value: unknown): string {
  const raw = texto(value).slice(0, 10);
  return FECHA.test(raw) ? raw : "";
}

/** Fecha local del cliente; si no llega o no es válida, la de hoy en UTC. */
export function fecha_cliente(value: unknown): string {
  return solo_fecha(value) || new Date().toISOString().slice(0, 10);
}

export function hora_cliente(value: unknown): string {
  const raw = texto(value).slice(0, 5);
  return HORA.test(raw) ? raw : new Date().toISOString().slice(11, 16);
}

/** Límite superior inclusivo para comparar contra fechas ISO guardadas como texto. */
export function fin_de_dia(fecha: string): string {
  return `${fecha}T23:59:59.999Z`;
}

export function falla(status: number, message: string): never {
  throw new KirletHttpError(status, "validation_error", message);
}

/**
 * Ciclo vigente en `fecha`: el que la contiene entre inicio y fin. Si hay
 * varios (ciclos que se enciman), gana el marcado como actual y luego el que
 * empezó después. Sin ninguno vigente, el marcado como actual.
 */
export function ciclo_para_fecha(ciclos: DomainRow[], fecha: string): DomainRow | null {
  const activos = ciclos.filter((c) => c.is_active !== false);
  const vigentes = activos.filter((c) => {
    const inicio = solo_fecha(c.fecha_inicio);
    const fin = solo_fecha(c.fecha_fin);
    return !!inicio && !!fin && inicio <= fecha && fecha <= fin;
  });
  const orden = (a: DomainRow, b: DomainRow) => {
    const actual = Number(b.ciclo_actual === true) - Number(a.ciclo_actual === true);
    if (actual) return actual;
    return solo_fecha(b.fecha_inicio).localeCompare(solo_fecha(a.fecha_inicio));
  };
  if (vigentes.length) return [...vigentes].sort(orden)[0]!;
  return activos.find((c) => c.ciclo_actual === true) ?? null;
}

export type AlumnoEnLista = {
  id: string;
  name: string;
  numero_lista: number;
};

/**
 * Orden de lista: número de lista (los que no tienen van al final) y luego
 * nombre. El número que se muestra nunca queda vacío: quien no tiene uno toma
 * su posición.
 */
export function ordenar_alumnos(rows: DomainRow[]): AlumnoEnLista[] {
  const numero = (r: DomainRow) => {
    const n = Number(r.numero_lista);
    return Number.isFinite(n) && n > 0 ? n : Number.POSITIVE_INFINITY;
  };
  return rows
    .filter((r) => r.is_active !== false)
    .sort((a, b) => {
      const diff = numero(a) - numero(b);
      if (diff) return diff;
      return texto(a.name).localeCompare(texto(b.name), "es");
    })
    .map((r, i) => {
      const n = numero(r);
      return {
        id: String(r.id),
        name: texto(r.name),
        numero_lista: Number.isFinite(n) ? n : i + 1,
      };
    });
}

export async function alumnos_del_grupo(ctx: KirletCtx, grupo_id: string): Promise<AlumnoEnLista[]> {
  const rows = await ctx.data.findMany("alumnos", {
    where: { grupo_id, is_active: true },
    limit: LIMITE_FILAS,
  });
  return ordenar_alumnos(rows);
}

export async function grupo_activo(ctx: KirletCtx, grupo_id: string): Promise<DomainRow> {
  if (!grupo_id) falla(400, "Elige un grupo");
  const grupo = await ctx.data.findOne("grupo", { id: grupo_id });
  if (!grupo || grupo.is_active === false) falla(404, "El grupo no existe o está inactivo");
  return grupo;
}

/** Texto en minúsculas para la búsqueda del listado del lanzador. */
export function campo_busqueda(...partes: unknown[]): string {
  return partes.map(texto).filter(Boolean).join(" ").toLowerCase();
}

/** Mapa id → nombre de una tabla, para no resolver referencias una por una. */
export async function nombres_por_id(
  ctx: KirletCtx,
  table: string,
  ids: Iterable<unknown>,
): Promise<Map<string, string>> {
  const unicos = [...new Set([...ids].map(texto).filter(Boolean))];
  if (!unicos.length) return new Map();
  const rows = await ctx.data.findMany(table, {
    where: { id: { in: unicos } },
    limit: LIMITE_FILAS,
  });
  return new Map(rows.map((r) => [String(r.id), texto(r.name)]));
}
