/**
 * Preguntas de un examen y calificación de las respuestas de un alumno.
 *
 * La opción múltiple se califica sola contra la clave; las abiertas llevan los
 * puntos que asigna el docente. Mientras falte la clave de una pregunta de
 * opción o los puntos de una abierta, la respuesta queda pendiente y cuenta 0.
 * La calificación va en la escala oficial de 5 a 10.
 */

export type TipoPregunta = "opcion" | "abierta";

export type Pregunta = {
  id: string;
  tipo: TipoPregunta;
  enunciado: string;
  opciones: string[];
  /** Letra correcta (`A`, `B`…) en las de opción; `null` si aún no se captura. */
  clave: string | null;
  /** Respuesta esperada de una abierta, como guía para calificar. */
  respuesta_modelo: string;
  puntos: number;
};

export type RespuestaPregunta = {
  pregunta_id: string;
  /** Letra elegida (opción) o texto escrito (abierta). */
  respuesta: string;
  /** Foto de la respuesta escrita a mano (data URL). */
  foto: string | null;
  correcta: boolean | null;
  puntos: number | null;
};

export type Calificacion = {
  respuestas: RespuestaPregunta[];
  puntos: number;
  puntos_max: number;
  porcentaje: number;
  calificacion: number;
  pendientes: number;
  estado: "calificado" | "pendiente";
};

const MAX_OPCIONES = 8;

export function letra(indice: number): string {
  return String.fromCharCode(65 + indice);
}

function texto(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function redondea(n: number, decimales = 1): number {
  const f = 10 ** decimales;
  return Math.round(n * f) / f;
}

function nuevo_id(): string {
  return `p_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

/** Deja las preguntas en su forma canónica; lo que no se entiende se descarta. */
export function normalizar_preguntas(raw: unknown): Pregunta[] {
  const lista = typeof raw === "string" ? safe_json(raw) : raw;
  if (!Array.isArray(lista)) return [];
  const vistos = new Set<string>();
  return lista
    .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
    .map((p) => {
      const tipo: TipoPregunta = p.tipo === "abierta" ? "abierta" : "opcion";
      const opciones =
        tipo === "opcion" && Array.isArray(p.opciones)
          ? p.opciones.slice(0, MAX_OPCIONES).map(texto)
          : [];
      const clave = texto(p.clave).toUpperCase();
      const indice_clave = clave.length === 1 ? clave.charCodeAt(0) - 65 : -1;
      const clave_valida =
        tipo === "opcion" && indice_clave >= 0 && indice_clave < opciones.length ? clave : null;
      const puntos = Number(p.puntos);
      let id = texto(p.id) || nuevo_id();
      if (vistos.has(id)) id = nuevo_id();
      vistos.add(id);
      return {
        id,
        tipo,
        enunciado: texto(p.enunciado),
        opciones,
        clave: clave_valida,
        respuesta_modelo: tipo === "abierta" ? texto(p.respuesta_modelo) : "",
        puntos: Number.isFinite(puntos) && puntos > 0 ? redondea(puntos, 2) : 1,
      };
    });
}

export function puntos_totales(preguntas: Pregunta[]): number {
  return redondea(preguntas.reduce((n, p) => n + p.puntos, 0), 2);
}

/** 5 a 10 con un decimal: debajo del 50 % la boleta registra 5. */
export function escala_5_10(porcentaje: number): number {
  return Math.max(5, redondea(porcentaje / 10, 1));
}

export function calificar(preguntas: Pregunta[], entrada: unknown): Calificacion {
  const lista = Array.isArray(entrada) ? entrada : [];
  const por_pregunta = new Map<string, Record<string, unknown>>();
  for (const r of lista) {
    if (r && typeof r === "object") {
      const item = r as Record<string, unknown>;
      por_pregunta.set(texto(item.pregunta_id), item);
    }
  }
  const respuestas: RespuestaPregunta[] = preguntas.map((p) => {
    const r = por_pregunta.get(p.id) ?? {};
    const foto = texto(r.foto);
    const base = { pregunta_id: p.id, foto: foto.startsWith("data:image/") ? foto : null };
    if (p.tipo === "opcion") {
      const elegida = texto(r.respuesta).toUpperCase().slice(0, 1);
      if (!p.clave) return { ...base, respuesta: elegida, correcta: null, puntos: null };
      const correcta = !!elegida && elegida === p.clave;
      return { ...base, respuesta: elegida, correcta, puntos: correcta ? p.puntos : 0 };
    }
    const dados = r.puntos === null || r.puntos === undefined || r.puntos === "" ? NaN : Number(r.puntos);
    const puntos = Number.isFinite(dados) ? redondea(Math.min(Math.max(dados, 0), p.puntos), 2) : null;
    return {
      ...base,
      respuesta: texto(r.respuesta),
      correcta: puntos === null ? null : puntos >= p.puntos,
      puntos,
    };
  });
  const puntos = redondea(respuestas.reduce((n, r) => n + (r.puntos ?? 0), 0), 2);
  const puntos_max = puntos_totales(preguntas);
  const porcentaje = puntos_max ? redondea((puntos / puntos_max) * 100) : 0;
  const pendientes = respuestas.filter((r) => r.puntos === null).length;
  return {
    respuestas,
    puntos,
    puntos_max,
    porcentaje,
    calificacion: escala_5_10(porcentaje),
    pendientes,
    estado: pendientes ? "pendiente" : "calificado",
  };
}

function safe_json(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
