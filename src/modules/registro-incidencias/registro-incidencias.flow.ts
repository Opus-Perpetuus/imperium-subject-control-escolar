import { define_routes, new_id, now_iso } from "@opus-perpetuus/imperium-core-kit";
import {
  LIMITE_FILAS,
  campo_busqueda,
  falla,
  fecha_cliente,
  grupo_activo,
  hora_cliente,
  texto,
} from "../../lib/escolar.ts";

type IncidenciaRapida = {
  grupo_id?: string;
  alumno_id?: string;
  tipo_incidencia_id?: string;
  description?: string;
  fecha?: string;
  hora?: string;
};

/**
 * Captura de incidencias a pantalla completa: el docente solo elige alumno,
 * tipo y descripción; escuela, ciclo y grado salen del grupo, y la fecha del
 * dispositivo.
 */
export const registro_incidencias_flow = define_routes({
  "POST /registro-incidencias/rapida": async (ctx) => {
    const body = await ctx.body<IncidenciaRapida>();
    const grupo = await grupo_activo(ctx, texto(body.grupo_id));
    const alumno_id = texto(body.alumno_id);
    if (!alumno_id) falla(400, "Elige al alumno");
    const alumno = await ctx.data.findOne("alumnos", { id: alumno_id });
    if (!alumno || alumno.is_active === false) falla(404, "El alumno no existe o está dado de baja");
    if (texto(alumno.grupo_id) !== String(grupo.id)) {
      falla(400, "El alumno no pertenece a este grupo");
    }
    const tipo_id = texto(body.tipo_incidencia_id);
    if (!tipo_id) falla(400, "Elige el tipo de incidencia");
    const tipo = await ctx.data.findOne("tipos_incidencia", { id: tipo_id });
    if (!tipo || tipo.is_active === false) falla(404, "El tipo de incidencia no existe");

    const fecha = fecha_cliente(body.fecha);
    const description = texto(body.description);
    const ts = now_iso();
    const name = `${texto(tipo.name)} · ${texto(alumno.name)}`;
    const created = await ctx.data.insert("registro_incidencias", {
      id: new_id("registro"),
      name,
      description,
      is_active: true,
      created_by: ctx.actor,
      search_field: campo_busqueda(name, description),
      alumno_id,
      grupo_id: grupo.id,
      escuela_id: texto(grupo.escuela_id) || null,
      ciclo_escolar_id: texto(grupo.ciclo_escolar_id) || null,
      grado_escolar_id: texto(grupo.grado_escolar_id) || null,
      tipo_incidencia_id: tipo_id,
      // `tipo` es la columna que ya pintaba el listado del lanzador.
      tipo: texto(tipo.name),
      categoria: texto(tipo.categoria) || null,
      severidad: texto(tipo.severidad) || null,
      justificada: false,
      fecha,
      hora: hora_cliente(body.hora),
      fecha_asistencia: `${fecha}T00:00:00.000Z`,
      created_at: ts,
      updated_at: ts,
    });
    return ctx.created(created);
  },

  "GET /registro-incidencias/recientes": async (ctx) => {
    const grupo_id = texto(ctx.query.get("grupo_id"));
    if (!grupo_id) falla(400, "Elige un grupo");
    const fecha = fecha_cliente(ctx.query.get("fecha"));
    const rows = await ctx.data.findMany("registro_incidencias", {
      where: { grupo_id, fecha, is_active: true },
      limit: LIMITE_FILAS,
    });
    const alumnos = await ctx.data.findMany("alumnos", {
      where: { grupo_id },
      limit: LIMITE_FILAS,
    });
    const nombre = new Map(alumnos.map((a) => [String(a.id), texto(a.name)]));
    const data = rows
      .map((r) => ({
        id: r.id,
        alumno_id: r.alumno_id,
        alumno_nombre: nombre.get(texto(r.alumno_id)) ?? "",
        tipo: r.tipo,
        categoria: r.categoria,
        severidad: r.severidad,
        description: r.description,
        fecha: r.fecha,
        hora: r.hora,
      }))
      .sort((a, b) => texto(b.hora).localeCompare(texto(a.hora)));
    return { data, total_elementos: data.length };
  },
});
