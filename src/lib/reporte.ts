import type { DomainRow, KirletDataClient, NoxUiNode } from "@opus-perpetuus/imperium-core-kit";
import { LIMITE_FILAS, solo_fecha, texto } from "./escolar.ts";

/**
 * Lo que ve quien abre un enlace compartido: una incidencia (para la familia)
 * o un reporte de incidencias y faltas de uno o más alumnos (para dirección).
 *
 * Solo se muestran los alumnos del enlace. Nada de otros alumnos, ni datos de
 * contacto: el enlace circula por mensajería y la ley protege la identidad de
 * los menores.
 */

export type IncidenciaReporte = {
  fecha: string;
  hora: string;
  tipo: string;
  categoria: string;
  severidad: string;
  description: string;
};

export type FaltaReporte = { fecha: string; pase: string; justificada: boolean };

export type AlumnoReporte = {
  id: string;
  name: string;
  numero_lista: number | null;
  asistencia: {
    pases: number;
    presentes: number;
    ausentes: number;
    justificadas: number;
    porcentaje: number | null;
  } | null;
  incidencias: IncidenciaReporte[];
  faltas: FaltaReporte[];
};

export type Reporte = {
  tipo: "incidencia" | "reporte";
  titulo: string;
  escuela: string;
  grupo: string;
  desde: string;
  hasta: string;
  generado: string;
  expira: string;
  alumnos: AlumnoReporte[];
};

const SEVERIDAD: Record<string, string> = {
  leve: "Leve",
  grave: "Grave",
  muy_grave: "Muy grave",
};

const CATEGORIA: Record<string, string> = {
  negativa: "Negativa",
  positiva: "Positiva",
  neutral: "Neutral",
};

/** Fecha de una incidencia; las capturadas por el lanzador viejo no traen `fecha`. */
function fecha_incidencia(row: DomainRow): string {
  return solo_fecha(row.fecha) || solo_fecha(row.fecha_asistencia) || solo_fecha(row.created_at);
}

function en_rango(fecha: string, desde: string, hasta: string): boolean {
  if (!fecha) return false;
  if (desde && fecha < desde) return false;
  if (hasta && fecha > hasta) return false;
  return true;
}

function a_incidencia(row: DomainRow): IncidenciaReporte {
  return {
    fecha: fecha_incidencia(row),
    hora: texto(row.hora),
    tipo: texto(row.tipo) || "Incidencia",
    categoria: texto(row.categoria),
    severidad: texto(row.severidad),
    description: texto(row.description),
  };
}

async function por_ids(data: KirletDataClient, table: string, ids: string[]): Promise<DomainRow[]> {
  if (!ids.length) return [];
  return data.findMany(table, { where: { id: { in: ids } }, limit: LIMITE_FILAS });
}

export async function armar_reporte(data: KirletDataClient, enlace: DomainRow): Promise<Reporte> {
  const tipo = enlace.tipo === "incidencia" ? "incidencia" : "reporte";
  const base = {
    tipo,
    titulo: texto(enlace.name),
    desde: solo_fecha(enlace.desde),
    hasta: solo_fecha(enlace.hasta),
    generado: solo_fecha(enlace.created_at),
    expira: solo_fecha(enlace.expira_at),
  } as const;

  if (tipo === "incidencia") {
    const incidencia = await data.findOne("registro_incidencias", { id: texto(enlace.incidencia_id) });
    if (!incidencia || incidencia.is_active === false) {
      return { ...base, escuela: "", grupo: "", alumnos: [] };
    }
    const [alumno, grupo, escuela] = await Promise.all([
      data.findOne("alumnos", { id: texto(incidencia.alumno_id) }),
      data.findOne("grupo", { id: texto(incidencia.grupo_id) }),
      data.findOne("escuelas", { id: texto(incidencia.escuela_id) }),
    ]);
    return {
      ...base,
      escuela: texto(escuela?.name),
      grupo: texto(grupo?.name),
      alumnos: [
        {
          id: texto(incidencia.alumno_id),
          name: texto(alumno?.name),
          numero_lista: null,
          asistencia: null,
          incidencias: [a_incidencia(incidencia)],
          faltas: [],
        },
      ],
    };
  }

  const ids = (Array.isArray(enlace.alumno_ids) ? enlace.alumno_ids : []).map(texto).filter(Boolean);
  const alumnos = await por_ids(data, "alumnos", ids);
  const grupo = texto(enlace.grupo_id) ? await data.findOne("grupo", { id: texto(enlace.grupo_id) }) : null;
  const escuela = texto(grupo?.escuela_id)
    ? await data.findOne("escuelas", { id: texto(grupo?.escuela_id) })
    : null;
  const { desde, hasta } = base;

  const incidencias = enlace.incluir_incidencias === false || !ids.length
    ? []
    : (
        await data.findMany("registro_incidencias", {
          where: { alumno_id: { in: ids }, is_active: true },
          limit: LIMITE_FILAS,
        })
      )
        // Las que el pase de lista viejo creaba por cada falta ya salen como falta.
        .filter((r) => !texto(r.lista_asistencia_id))
        .filter((r) => en_rango(fecha_incidencia(r), desde, hasta));

  const renglones = !ids.length
    ? []
    : await data.findMany("lista_asistencia", {
        where: { alumno_id: { in: ids } },
        limit: LIMITE_FILAS,
      });
  const registros = new Map(
    (await por_ids(data, "registro_asistencias", [
      ...new Set(renglones.map((r) => texto(r.registro_asistencia_id)).filter(Boolean)),
    ])).map((r) => [String(r.id), r]),
  );
  const asistencias = renglones
    .map((r) => {
      const registro = registros.get(texto(r.registro_asistencia_id));
      return {
        row: r,
        registro,
        fecha: solo_fecha(r.fecha) || solo_fecha(registro?.fecha_asistencia),
      };
    })
    .filter((a) => a.registro && a.registro.is_active !== false && a.row.is_active !== false)
    .filter((a) => en_rango(a.fecha, desde, hasta));

  const salida: AlumnoReporte[] = alumnos
    .map((alumno) => {
      const propias = asistencias.filter((a) => texto(a.row.alumno_id) === String(alumno.id));
      const marcadas = propias.filter((a) => a.row.estado === "presente" || a.row.estado === "ausente");
      const presentes = marcadas.filter((a) => a.row.estado === "presente").length;
      const ausentes = marcadas.length - presentes;
      const faltas = propias
        .filter((a) => a.row.estado === "ausente")
        .map((a) => ({
          fecha: a.fecha,
          pase: texto(a.registro?.name),
          justificada: a.row.justificada === true,
        }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha));
      const numero = Number(alumno.numero_lista);
      return {
        id: String(alumno.id),
        name: texto(alumno.name),
        numero_lista: Number.isFinite(numero) && numero > 0 ? numero : null,
        asistencia:
          enlace.incluir_faltas === false
            ? null
            : {
                pases: marcadas.length,
                presentes,
                ausentes,
                justificadas: faltas.filter((f) => f.justificada).length,
                porcentaje: marcadas.length ? Math.round((presentes / marcadas.length) * 1000) / 10 : null,
              },
        incidencias: incidencias
          .filter((r) => texto(r.alumno_id) === String(alumno.id))
          .map(a_incidencia)
          .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora)),
        faltas: enlace.incluir_faltas === false ? [] : faltas,
      };
    })
    .sort(
      (a, b) =>
        (a.numero_lista ?? Number.POSITIVE_INFINITY) - (b.numero_lista ?? Number.POSITIVE_INFINITY) ||
        a.name.localeCompare(b.name, "es"),
    );

  return {
    ...base,
    escuela: texto(escuela?.name),
    grupo: texto(grupo?.name),
    alumnos: salida,
  };
}

/** Semáforo de asistencia: bajo 80 % no acredita; bajo 90 % ya es ausentismo crónico. */
export function nivel_asistencia(porcentaje: number | null): string {
  if (porcentaje == null) return "Sin pases de lista";
  if (porcentaje < 80) return "Crítica";
  if (porcentaje < 90) return "En riesgo";
  return "Adecuada";
}

function fecha_legible(fecha: string): string {
  if (!fecha) return "";
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}

function etiqueta_incidencia(i: IncidenciaReporte): string {
  return [i.tipo, SEVERIDAD[i.severidad], CATEGORIA[i.categoria]].filter(Boolean).join(" · ");
}

function node(component: string, props: Record<string, unknown> = {}, children?: NoxUiNode[]): NoxUiNode {
  return children ? { component, props, children } : { component, props };
}

export function descriptor_invalido(): NoxUiNode {
  return node("nox.page", {}, [
    node("nox.empty", {
      title: "Enlace no disponible",
      description: "Este enlace no existe, ya caducó o la escuela lo retiró. Pide uno nuevo a la escuela.",
    }),
  ]);
}

export function descriptor_reporte(r: Reporte): NoxUiNode {
  const hijos: NoxUiNode[] = [];
  const periodo =
    r.desde || r.hasta
      ? `${fecha_legible(r.desde) || "inicio"} al ${fecha_legible(r.hasta) || "hoy"}`
      : "";
  hijos.push(
    node("nox.detail", {
      title: r.tipo === "incidencia" ? "Aviso de incidencia" : r.titulo || "Reporte escolar",
      items: [
        r.escuela && { label: "Escuela", value: r.escuela },
        r.grupo && { label: "Grupo", value: r.grupo },
        periodo && { label: "Periodo", value: periodo },
        { label: "Emitido", value: fecha_legible(r.generado) },
      ].filter(Boolean),
    }),
  );

  if (r.tipo === "incidencia") {
    const alumno = r.alumnos[0];
    const inc = alumno?.incidencias[0];
    if (!alumno || !inc) return descriptor_invalido();
    hijos.push(
      node("nox.detail", {
        title: alumno.name,
        items: [
          { label: "Fecha", value: [fecha_legible(inc.fecha), inc.hora].filter(Boolean).join(" ") },
          { label: "Tipo", value: etiqueta_incidencia(inc), emphasis: true },
          { label: "Descripción", value: inc.description || "Sin descripción" },
        ],
      }),
    );
  } else {
    const total_inc = r.alumnos.reduce((n, a) => n + a.incidencias.length, 0);
    const total_faltas = r.alumnos.reduce((n, a) => n + (a.asistencia?.ausentes ?? 0), 0);
    hijos.push(
      node("nox.stats", {
        items: [
          { label: "Alumnos", value: String(r.alumnos.length) },
          { label: "Incidencias", value: String(total_inc) },
          { label: "Faltas", value: String(total_faltas) },
        ],
      }),
    );
    if (!r.alumnos.length) {
      hijos.push(node("nox.empty", { title: "Sin alumnos", description: "Este reporte no incluye alumnos." }));
    }
    for (const alumno of r.alumnos) {
      const a = alumno.asistencia;
      const encabezado = alumno.numero_lista ? `${alumno.numero_lista}. ${alumno.name}` : alumno.name;
      const seccion: NoxUiNode[] = [];
      if (a) {
        seccion.push(
          node("nox.detail", {
            title: encabezado,
            items: [
              {
                label: "Asistencia",
                value:
                  a.porcentaje == null
                    ? "Sin pases de lista en el periodo"
                    : `${a.porcentaje} % · ${nivel_asistencia(a.porcentaje)}`,
                emphasis: true,
              },
              { label: "Presente", value: String(a.presentes) },
              { label: "Faltas", value: String(a.ausentes) },
              { label: "Faltas justificadas", value: String(a.justificadas) },
              { label: "Incidencias", value: String(alumno.incidencias.length) },
            ],
          }),
        );
      } else {
        seccion.push(
          node("nox.detail", {
            title: encabezado,
            items: [{ label: "Incidencias", value: String(alumno.incidencias.length), emphasis: true }],
          }),
        );
      }
      if (alumno.incidencias.length) {
        seccion.push(
          node("nox.table", {
            columns: [
              { key: "fecha", label: "Fecha" },
              { key: "tipo", label: "Tipo" },
              { key: "description", label: "Descripción" },
            ],
            rows: alumno.incidencias.map((i) => ({
              fecha: [fecha_legible(i.fecha), i.hora].filter(Boolean).join(" "),
              tipo: etiqueta_incidencia(i),
              description: i.description,
            })),
          }),
        );
      }
      if (alumno.faltas.length) {
        seccion.push(
          node("nox.table", {
            columns: [
              { key: "fecha", label: "Falta" },
              { key: "pase", label: "Pase de lista" },
              { key: "justificada", label: "Justificada" },
            ],
            rows: alumno.faltas.map((f) => ({
              fecha: fecha_legible(f.fecha),
              pase: f.pase,
              justificada: f.justificada ? "Sí" : "No",
            })),
          }),
        );
      }
      hijos.push(node("nox.stack", {}, seccion));
    }
  }

  hijos.push(
    node("nox.alert", {
      title: "Documento confidencial",
      description: r.expira
        ? `Enlace de solo lectura para la familia o la dirección de la escuela. Vigente hasta el ${fecha_legible(r.expira)}.`
        : "Enlace de solo lectura para la familia o la dirección de la escuela.",
    }),
  );
  return node("nox.page", {}, hijos);
}
