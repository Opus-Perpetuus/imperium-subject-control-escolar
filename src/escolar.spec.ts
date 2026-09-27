import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  MemoryKirletDataClient,
  create_kirlet_test_context,
  sign_kirlet_identity,
  type DomainRow,
} from "@opus-perpetuus/imperium-core-kit";
import { SUBJECT } from "./subject.ts";
import { seed_demo } from "./seed.ts";
import { calificar, escala_5_10, normalizar_preguntas } from "./lib/calificacion.ts";
import { ciclo_para_fecha, dividir_rango, nombres_de_lista, ordenar_alumnos } from "./lib/escolar.ts";

const TS = "2026-09-01T00:00:00.000Z";
const SECRETO = "secreto-de-prueba";

type Server = ReturnType<typeof create_kirlet_test_context>;

let data: MemoryKirletDataClient;
let server: Server;

async function call(method: string, path: string, body?: unknown, identidad: Record<string, string> = {}) {
  const res = await server.fetch(
    new Request(`http://t${path}`, {
      method,
      headers: { ...identidad, ...(body === undefined ? {} : { "content-type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
  const json = (await res.json()) as Record<string, unknown>;
  return { status: res.status, json, data: json.data as any };
}

/**
 * Petición firmada como un usuario concreto (sin firma, el servidor usa un
 * admin sintético). Con `recursos`, no es admin y solo tiene esos grants, como
 * los arma el núcleo a partir de los menús que ve.
 */
function como(user_id: string, recursos?: string[]) {
  const grants = (recursos ?? []).map((r) => ({
    resource: `kirlet.control-escolar.${r}`,
    c: true,
    r: true,
    u: true,
    d: true,
  }));
  const identidad = sign_kirlet_identity(
    {
      user_id,
      email: `${user_id}@escuela.test`,
      is_admin: !recursos,
      kirlet_id: "subject-control-escolar",
      grants,
    },
    SECRETO,
  );
  return (method: string, path: string, body?: unknown) => call(method, path, body, identidad);
}

async function insert(table: string, row: DomainRow) {
  return data.insert(table, { is_active: true, created_at: TS, updated_at: TS, ...row });
}

/** Escuela con un ciclo vigente, un ciclo pasado, dos grupos y alumnos. */
async function escenario() {
  await insert("escuelas", { id: "esc1", name: "Escuela Uno" });
  await insert("ciclos_escolares", {
    id: "cic-pasado",
    name: "2025-2026",
    fecha_inicio: "2025-08-25",
    fecha_fin: "2026-07-15",
  });
  await insert("ciclos_escolares", {
    id: "cic1",
    name: "2026-2027",
    fecha_inicio: "2026-08-24",
    fecha_fin: "2027-07-16",
  });
  await insert("grupo", { id: "g1", name: "1A", ciclo_escolar_id: "cic1", escuela_id: "esc1" });
  await insert("grupo", { id: "g-viejo", name: "6B", ciclo_escolar_id: "cic-pasado", escuela_id: "esc1" });
  await insert("alumnos", { id: "a3", name: "Carla", grupo_id: "g1", numero_lista: 3 });
  await insert("alumnos", { id: "a1", name: "Ana", grupo_id: "g1", numero_lista: 1 });
  await insert("alumnos", { id: "a2", name: "Beto", grupo_id: "g1", numero_lista: 2 });
  await insert("alumnos", { id: "a-baja", name: "Baja", grupo_id: "g1", numero_lista: 4, is_active: false });
  await insert("alumnos", { id: "a-otro", name: "Otro", grupo_id: "g-viejo", numero_lista: 1 });
  await seed_demo({ data, nox: {} as never, technical_id: "subject-control-escolar" });
}

beforeEach(async () => {
  data = new MemoryKirletDataClient(SUBJECT.schema());
  server = create_kirlet_test_context(SUBJECT, { data, gateway_secret: SECRETO });
  await escenario();
});

afterEach(() => server.stop());

describe("reglas", () => {
  test("ciclo vigente por fecha del dispositivo", () => {
    const ciclos = [
      { id: "a", fecha_inicio: "2025-08-25", fecha_fin: "2026-07-15" },
      { id: "b", fecha_inicio: "2026-08-24T00:00:00.000Z", fecha_fin: "2027-07-16" },
      { id: "c", fecha_inicio: "2020-01-01", fecha_fin: "2020-12-31", ciclo_actual: true },
    ];
    expect(ciclo_para_fecha(ciclos, "2026-09-25")?.id).toBe("b");
    expect(ciclo_para_fecha(ciclos, "2026-07-01")?.id).toBe("a");
    // Vacaciones: ninguno vigente → el marcado como actual.
    expect(ciclo_para_fecha(ciclos, "2026-08-01")?.id).toBe("c");
  });

  test("orden de lista con números faltantes", () => {
    const orden = ordenar_alumnos([
      { id: "x", name: "Zoe" },
      { id: "y", name: "Beto", numero_lista: 2 },
      { id: "z", name: "Ana" },
      { id: "w", name: "Carlos", numero_lista: 1 },
    ]);
    expect(orden.map((a) => a.id)).toEqual(["w", "y", "z", "x"]);
    expect(orden.map((a) => a.numero_lista)).toEqual([1, 2, 3, 4]);
  });

  test("calificación: opción múltiple automática, abiertas manuales, escala 5–10", () => {
    const preguntas = normalizar_preguntas([
      { id: "p1", tipo: "opcion", enunciado: "2+2", opciones: ["3", "4", "5"], clave: "b", puntos: 2 },
      { id: "p2", tipo: "opcion", enunciado: "Capital", opciones: ["A", "B"], clave: "A", puntos: 2 },
      { id: "p3", tipo: "abierta", enunciado: "Explica", puntos: 6 },
    ]);
    expect(preguntas[0]!.clave).toBe("B");
    const pendiente = calificar(preguntas, [
      { pregunta_id: "p1", respuesta: "b" },
      { pregunta_id: "p2", respuesta: "B" },
      { pregunta_id: "p3", respuesta: "Porque sí" },
    ]);
    expect(pendiente.puntos).toBe(2);
    expect(pendiente.estado).toBe("pendiente");
    const final = calificar(preguntas, [
      { pregunta_id: "p1", respuesta: "B" },
      { pregunta_id: "p2", respuesta: "B" },
      { pregunta_id: "p3", respuesta: "Porque sí", puntos: 99 },
    ]);
    expect(final.respuestas[2]!.puntos).toBe(6);
    expect(final.puntos).toBe(8);
    expect(final.porcentaje).toBe(80);
    expect(final.calificacion).toBe(8);
    expect(final.estado).toBe("calificado");
    expect(escala_5_10(12)).toBe(5);
  });
});

describe("contexto de aula", () => {
  test("una escuela: ciclo vigente y solo sus grupos", async () => {
    const r = await call("GET", "/grupo/contexto?fecha=2026-09-25");
    expect(r.status).toBe(200);
    expect(r.data.escuela_id).toBe("esc1");
    expect(r.data.ciclo.id).toBe("cic1");
    expect(r.data.grupos.map((g: any) => g.id)).toEqual(["g1"]);
    expect(r.data.grupos[0].total_alumnos).toBe(3);
    expect(r.data.tipos_incidencia.length).toBeGreaterThan(5);
  });

  test("varias escuelas: sin elegir no hay grupos", async () => {
    await insert("escuelas", { id: "esc2", name: "Escuela Dos" });
    await insert("grupo", { id: "g2", name: "2A", ciclo_escolar_id: "cic1", escuela_id: "esc2" });
    const sin = await call("GET", "/grupo/contexto?fecha=2026-09-25");
    expect(sin.data.escuela_id).toBeNull();
    expect(sin.data.grupos).toEqual([]);
    const con = await call("GET", "/grupo/contexto?fecha=2026-09-25&escuela_id=esc2");
    expect(con.data.grupos.map((g: any) => g.id)).toEqual(["g2"]);
  });

  test("alumnos del grupo en orden de lista, sin bajas", async () => {
    const r = await call("GET", "/grupo/g1/alumnos");
    expect(r.data.map((a: any) => a.name)).toEqual(["Ana", "Beto", "Carla"]);
  });
});

describe("pase de lista", () => {
  test("un registro con un renglón por alumno; marcar, contar y cerrar", async () => {
    const inicio = await call("POST", "/registro-asistencias/pase", {
      grupo_id: "g1",
      fecha: "2026-09-25",
      hora: "08:00",
    });
    expect(inicio.status).toBe(201);
    const { registro, renglones } = inicio.data;
    expect(registro.name).toBe("Pase de lista 1 · 1A · 2026-09-25");
    expect(registro.escuela_id).toBe("esc1");
    expect(registro.ciclo_escolar_id).toBe("cic1");
    expect(renglones.map((r: any) => [r.numero_lista, r.alumno_nombre_snapshot, r.estado])).toEqual([
      [1, "Ana", "pendiente"],
      [2, "Beto", "pendiente"],
      [3, "Carla", "pendiente"],
    ]);

    const marcar = (renglon_id: string, estado: string) =>
      call("POST", `/registro-asistencias/pase/${registro.id}/marcar`, { renglon_id, estado });
    await marcar(renglones[0].id, "presente");
    await marcar(renglones[1].id, "ausente");
    const tercero = await marcar(renglones[2].id, "presente");
    expect(tercero.data.registro.presentes).toBe(2);
    expect(tercero.data.registro.ausentes).toBe(1);

    // Corregir desde el resumen.
    const corregido = await marcar(renglones[1].id, "presente");
    expect(corregido.data.registro.ausentes).toBe(0);

    const cerrado = await call("POST", `/registro-asistencias/pase/${registro.id}/cerrar`, { hora: "08:05" });
    expect(cerrado.data.registro.estatus).toBe("cerrada");
    expect(cerrado.data.registro.hora_fin).toBe("08:05");
    const tarde = await marcar(renglones[0].id, "ausente");
    expect(tarde.status).toBe(409);

    // Una falta no genera incidencia.
    expect(await data.count("registro_incidencias")).toBe(0);
  });

  test("se puede pasar lista varias veces el mismo día", async () => {
    await call("POST", "/registro-asistencias/pase", { grupo_id: "g1", fecha: "2026-09-25" });
    const segundo = await call("POST", "/registro-asistencias/pase", { grupo_id: "g1", fecha: "2026-09-25" });
    expect(segundo.data.registro.name).toStartWith("Pase de lista 2 ·");
    const pases = await call("GET", "/registro-asistencias/pases?grupo_id=g1&fecha=2026-09-25");
    expect(pases.data.length).toBe(2);
    const reanudar = await call("GET", `/registro-asistencias/pase/${segundo.data.registro.id}`);
    expect(reanudar.data.renglones.length).toBe(3);
    expect(reanudar.data.grupo.name).toBe("1A");
  });

  test("grupo sin alumnos o renglón ajeno", async () => {
    await insert("grupo", { id: "vacio", name: "Vacío", ciclo_escolar_id: "cic1" });
    expect((await call("POST", "/registro-asistencias/pase", { grupo_id: "vacio" })).status).toBe(400);
    const pase = await call("POST", "/registro-asistencias/pase", { grupo_id: "g1" });
    const ajeno = await call("POST", `/registro-asistencias/pase/${pase.data.registro.id}/marcar`, {
      renglon_id: "no-existe",
      estado: "presente",
    });
    expect(ajeno.status).toBe(404);
  });
});

describe("incidencias", () => {
  async function tipo(name: string) {
    const r = await call("GET", "/grupo/contexto?fecha=2026-09-25");
    return r.data.tipos_incidencia.find((t: any) => t.name === name).id as string;
  }

  test("captura rápida deriva escuela, ciclo y fecha", async () => {
    const tipo_id = await tipo("Retardo");
    const r = await call("POST", "/registro-incidencias/rapida", {
      grupo_id: "g1",
      alumno_id: "a2",
      tipo_incidencia_id: tipo_id,
      description: "Llegó 15 minutos tarde",
      fecha: "2026-09-25",
      hora: "08:15",
    });
    expect(r.status).toBe(201);
    expect(r.data).toMatchObject({
      name: "Retardo · Beto",
      tipo: "Retardo",
      severidad: "leve",
      escuela_id: "esc1",
      ciclo_escolar_id: "cic1",
      fecha: "2026-09-25",
    });
    const hoy = await call("GET", "/registro-incidencias/recientes?grupo_id=g1&fecha=2026-09-25");
    expect(hoy.data[0].alumno_nombre).toBe("Beto");
  });

  test("rechaza alumno de otro grupo", async () => {
    const r = await call("POST", "/registro-incidencias/rapida", {
      grupo_id: "g1",
      alumno_id: "a-otro",
      tipo_incidencia_id: await tipo("Retardo"),
    });
    expect(r.status).toBe(400);
  });
});

describe("tipos de incidencia", () => {
  test("categoría y severidad son obligatorias", async () => {
    const sin = await call("POST", "/tipos-incidencia", { name: "Tipo sin datos", categoria: "", severidad: "" });
    expect(sin.status).toBe(400);
    const ok = await call("POST", "/tipos-incidencia", { name: "Tipo completo", categoria: "negativa", severidad: "leve" });
    expect(ok.status).toBe(201);
    const vaciar = await call("PATCH", `/tipos-incidencia/${ok.data.id}`, { severidad: "" });
    expect(vaciar.status).toBe(400);
  });
});

describe("enlaces compartidos y página pública", () => {
  async function pagina(token: string) {
    const res = await server.fetch(
      new Request(`http://t/pages/control-escolar.compartido?t=${encodeURIComponent(token)}`),
    );
    return (await res.json()) as { title: string; page: any };
  }

  function textos(node: any): string[] {
    const propios = Object.values(node.props ?? {}).flatMap((v: any) =>
      typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap((x) => (x && typeof x === "object" ? Object.values(x) : [x])) : [],
    );
    return [...propios.map(String), ...(node.children ?? []).flatMap(textos)];
  }

  test("la página es pública en el manifiesto", () => {
    const m = SUBJECT.manifest() as any;
    expect(m.public.pages.map((p: any) => p.id)).toContain("control-escolar.compartido");
  });

  test("enlace de una incidencia: reutiliza el vigente y cuenta vistas", async () => {
    const ctx = await call("GET", "/grupo/contexto?fecha=2026-09-25");
    const tipo_id = ctx.data.tipos_incidencia[0].id;
    const inc = await call("POST", "/registro-incidencias/rapida", {
      grupo_id: "g1",
      alumno_id: "a1",
      tipo_incidencia_id: tipo_id,
      description: "Sin tarea",
      fecha: "2026-09-25",
    });
    const e1 = await call("POST", `/enlaces-compartidos/incidencia/${inc.data.id}`, {});
    const e2 = await call("POST", `/enlaces-compartidos/incidencia/${inc.data.id}`, {});
    expect(e1.status).toBe(201);
    expect(e2.data.token).toBe(e1.data.token);
    expect(e1.data.token.length).toBeGreaterThanOrEqual(32);
    expect(e1.data.ruta).toBe(`/app/control-escolar?t=${e1.data.token}`);

    const doc = await pagina(e1.data.token);
    const todo = textos(doc.page).join(" | ");
    expect(doc.title).toBe("Aviso de incidencia");
    expect(todo).toContain("Ana");
    expect(todo).toContain("Sin tarea");
    expect(todo).not.toContain("Beto");
    const guardado = await data.findOne("enlaces_compartidos", { id: e1.data.id });
    expect(guardado?.vistas).toBe(1);
  });

  describe("firma de enterado", () => {
    const FIRMA = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

    async function enlace() {
      const ctx = await call("GET", "/grupo/contexto?fecha=2026-09-25");
      const inc = await call("POST", "/registro-incidencias/rapida", {
        grupo_id: "g1",
        alumno_id: "a1",
        tipo_incidencia_id: ctx.data.tipos_incidencia[0].id,
        description: "Sin tarea",
        fecha: "2026-09-25",
      });
      const e = await call("POST", `/enlaces-compartidos/incidencia/${inc.data.id}`, {});
      return { incidencia_id: inc.data.id as string, enlace: e.data };
    }

    function nodos(node: any, component: string): any[] {
      return [
        ...(node.component === component ? [node] : []),
        ...(node.children ?? []).flatMap((c: any) => nodos(c, component)),
      ];
    }

    test("apagada por defecto: sin formulario y el envío se rechaza", async () => {
      const { enlace: e } = await enlace();
      expect(e.solicitar_firma).toBe(false);
      expect(nodos((await pagina(e.token)).page, "nox.form")).toHaveLength(0);
      const r = await call("POST", "/enlaces-compartidos/firmar", { t: e.token, firma: FIRMA });
      expect(r.status).toBe(403);
    });

    test("se firma una sola vez y luego ya no se ofrece ni se acepta", async () => {
      const { incidencia_id, enlace: e } = await enlace();
      const on = await call("POST", `/enlaces-compartidos/${e.id}/solicitar-firma`, { solicitar_firma: true });
      expect(on.data.solicitar_firma).toBe(true);
      expect(on.data.firmado_at).toBeNull();

      const antes = (await pagina(e.token)).page;
      const [form] = nodos(antes, "nox.form");
      expect(form.props.action).toBe("api://enlaces-compartidos/firmar");
      expect(nodos(form, "nox.input-signature")).toHaveLength(1);
      expect(nodos(form, "nox.input-hidden")[0].props.value).toBe(e.token);

      expect((await call("POST", "/enlaces-compartidos/firmar", { t: e.token, firma: "" })).status).toBe(400);
      expect((await call("POST", "/enlaces-compartidos/firmar", { t: e.token, firma: "data:text/html;base64,PHA+" })).status).toBe(400);

      const [a, b] = await Promise.all([
        call("POST", "/enlaces-compartidos/firmar", { t: e.token, firma: FIRMA }),
        call("POST", "/enlaces-compartidos/firmar", { t: e.token, firma: FIRMA }),
      ]);
      expect([a.status, b.status].sort()).toEqual([200, 409]);
      const otra = await call("POST", "/enlaces-compartidos/firmar", { t: e.token, firma: FIRMA.replace("Ggg", "Ggh") });
      expect(otra.status).toBe(409);

      const guardada = await data.findOne("registro_incidencias", { id: incidencia_id });
      expect(guardada?.firma).toBe(FIRMA);
      expect(String(guardada?.firmado_at)).toMatch(/^\d{4}-\d{2}-\d{2}T/);

      const despues = (await pagina(e.token)).page;
      expect(nodos(despues, "nox.form")).toHaveLength(0);
      expect(nodos(despues, "nox.image-viewer")[0].props.src).toBe(FIRMA);

      const off = await call("POST", `/enlaces-compartidos/${e.id}/solicitar-firma`, { solicitar_firma: false });
      expect(off.status).toBe(409);
      const patch = await call("PATCH", `/registro-incidencias/${incidencia_id}`, { firma: FIRMA });
      expect(patch.status).toBe(400);
    });

    test("un enlace retirado ya no acepta firma", async () => {
      const { enlace: e } = await enlace();
      await call("POST", `/enlaces-compartidos/${e.id}/solicitar-firma`, { solicitar_firma: true });
      await call("POST", `/enlaces-compartidos/${e.id}/retirar`);
      expect((await call("POST", "/enlaces-compartidos/firmar", { t: e.token, firma: FIRMA })).status).toBe(404);
    });

    test("firmar es una ruta pública del manifiesto", () => {
      const m = SUBJECT.manifest() as any;
      const rutas = JSON.stringify(m.public ?? {});
      expect(rutas).toContain("/enlaces-compartidos/firmar");
    });
  });

  test("reporte para dirección con faltas, porcentaje e incidencias", async () => {
    const pase = await call("POST", "/registro-asistencias/pase", { grupo_id: "g1", fecha: "2026-09-24" });
    const [ana, beto] = pase.data.renglones;
    const marcar = (id: string, estado: string) =>
      call("POST", `/registro-asistencias/pase/${pase.data.registro.id}/marcar`, { renglon_id: id, estado });
    await marcar(ana.id, "ausente");
    await marcar(beto.id, "presente");
    const ctx = await call("GET", "/grupo/contexto?fecha=2026-09-25");
    await call("POST", "/registro-incidencias/rapida", {
      grupo_id: "g1",
      alumno_id: "a1",
      tipo_incidencia_id: ctx.data.tipos_incidencia[0].id,
      description: "Llegó tarde",
      fecha: "2026-09-25",
    });
    const e = await call("POST", "/enlaces-compartidos/reporte", {
      grupo_id: "g1",
      alumno_ids: ["a1", "a2"],
      desde: "2026-09-01",
      hasta: "2026-09-30",
    });
    expect(e.status).toBe(201);
    const todo = textos((await pagina(e.data.token)).page).join(" | ");
    expect(todo).toContain("Ana");
    expect(todo).toContain("Beto");
    expect(todo).not.toContain("Carla");
    expect(todo).toContain("0 % · Crítica");
    expect(todo).toContain("100 % · Adecuada");
    expect(todo).toContain("Llegó tarde");
    expect(todo).toContain("24/09/2026");
  });

  test("retirado o inválido no enseña nada", async () => {
    const e = await call("POST", "/enlaces-compartidos/reporte", { grupo_id: "g1", alumno_ids: ["a1"] });
    await call("POST", `/enlaces-compartidos/${e.data.id}/retirar`);
    for (const token of [e.data.token, "inventado"]) {
      const doc = await pagina(token);
      expect(textos(doc.page).join(" ")).toContain("Enlace no disponible");
      expect(textos(doc.page).join(" ")).not.toContain("Ana");
    }
  });

  test("no deja reportar alumnos de otro grupo", async () => {
    const r = await call("POST", "/enlaces-compartidos/reporte", { grupo_id: "g1", alumno_ids: ["a1", "a-otro"] });
    expect(r.status).toBe(400);
  });
});

describe("exámenes", () => {
  test("captura, calificación y recalificación al cambiar la clave", async () => {
    const periodo = await call("POST", "/periodos-examen", {
      name: "Primer bimestre",
      ciclo_escolar_id: "cic1",
      fecha_inicio: "2026-10-01",
      fecha_fin: "2026-10-10",
    });
    expect(periodo.status).toBe(201);
    const malo = await call("POST", "/periodos-examen", {
      name: "Al revés",
      fecha_inicio: "2026-10-10",
      fecha_fin: "2026-10-01",
    });
    expect(malo.status).toBe(400);

    const examen = await call("POST", "/examenes", {
      name: "Matemáticas B1",
      periodo_examen_id: periodo.data.id,
      grupo_id: "g1",
      fecha: "2026-10-05",
      preguntas: [
        { id: "p1", tipo: "opcion", enunciado: "2+2", opciones: ["3", "4"], clave: "B", puntos: 5 },
        { id: "p2", tipo: "abierta", enunciado: "Explica la suma", puntos: 5 },
      ],
    });
    expect(examen.status).toBe(201);
    expect(examen.data.total_puntos).toBe(10);

    const captura = await call("GET", `/examenes/${examen.data.id}/captura`);
    expect(captura.data.alumnos.map((a: any) => a.name)).toEqual(["Ana", "Beto", "Carla"]);

    const foto = "data:image/jpeg;base64,/9j/AAAA";
    const r = await call("PUT", `/examenes/${examen.data.id}/respuestas/a1`, {
      respuestas: [
        { pregunta_id: "p1", respuesta: "B" },
        { pregunta_id: "p2", respuesta: "", foto, puntos: 3 },
      ],
      foto_hoja: foto,
    });
    expect(r.status).toBe(200);
    expect(r.data.calificacion).toBe(8);
    expect(r.data.tiene_foto_hoja).toBe(true);
    expect(r.data.foto_hoja).toBeUndefined();
    expect(r.data.respuestas[1].tiene_foto).toBe(true);

    const completa = await call("GET", `/examenes/${examen.data.id}/respuestas/a1`);
    expect(completa.data.foto_hoja).toBe(foto);

    // Beto contesta A; luego se corrige la clave a A y se recalifica.
    await call("PUT", `/examenes/${examen.data.id}/respuestas/a2`, {
      respuestas: [{ pregunta_id: "p1", respuesta: "A" }, { pregunta_id: "p2", puntos: 5 }],
    });
    await call("PATCH", `/examenes/${examen.data.id}`, {
      preguntas: [
        { id: "p1", tipo: "opcion", enunciado: "2+2", opciones: ["3", "4"], clave: "A", puntos: 5 },
        { id: "p2", tipo: "abierta", enunciado: "Explica la suma", puntos: 5 },
      ],
    });
    const resultados = await call("GET", `/examenes/${examen.data.id}/resultados`);
    const por_alumno = Object.fromEntries(
      resultados.data.alumnos.map((a: any) => [a.alumno_id, a.calificacion]),
    );
    expect(por_alumno).toEqual({ a1: 5, a2: 10 });
    expect(resultados.data.preguntas[0].distribucion).toEqual({ A: 1, B: 1 });

    const rechazo = await call("PUT", `/examenes/${examen.data.id}/respuestas/a1`, {
      respuestas: [{ pregunta_id: "p2", foto: "javascript:alert(1)" }],
    });
    expect(rechazo.status).toBe(400);
  });
});

describe("organización del ciclo", () => {
  const maestra = () => como("u-maestra");
  const otro = () => como("u-otro");

  test("dividir un rango en periodos casi iguales", () => {
    const tramos = dividir_rango("2026-08-24", "2027-07-16", 5);
    expect(tramos.length).toBe(5);
    expect(tramos[0]!.inicio).toBe("2026-08-24");
    expect(tramos[4]!.fin).toBe("2027-07-16");
    for (let i = 1; i < tramos.length; i++) {
      const fin_anterior = Date.parse(`${tramos[i - 1]!.fin}T00:00:00Z`);
      expect(Date.parse(`${tramos[i]!.inicio}T00:00:00Z`) - fin_anterior).toBe(86_400_000);
    }
    expect(dividir_rango("2026-01-01", "2026-01-02", 3)).toEqual([]);
  });

  test("lista pegada: sin numeración ni renglones vacíos", () => {
    expect(nombres_de_lista("1. Pérez Ana\n\n2) López  Beto\n3 - Cruz Eva\n\tDíaz Leo ")).toEqual([
      "Pérez Ana",
      "López Beto",
      "Cruz Eva",
      "Díaz Leo",
    ]);
  });

  test("sin asignaciones: todos los grupos, ninguno propio", async () => {
    const r = await maestra()("GET", "/grupo/contexto?fecha=2026-09-25");
    expect(r.data.grupos.map((g: any) => [g.id, g.mio])).toEqual([["g1", false]]);
    expect(r.data.ciclo.vigente).toBe(true);
    expect(r.data.periodos).toEqual([]);
    expect(r.data.periodo_id).toBeNull();
  });

  test("la docente se asigna su grupo; los demás lo ven con su nombre", async () => {
    await insert("grupo", { id: "g1b", name: "1B", ciclo_escolar_id: "cic1", escuela_id: "esc1" });
    const alta = await maestra()("POST", "/grupo/g1b/asignarme", {});
    expect(alta.status).toBe(201);
    // Asignarse dos veces no duplica.
    expect((await maestra()("POST", "/grupo/g1b/asignarme", {})).data.id).toBe(alta.data.id);

    const suyo = await maestra()("GET", "/grupo/contexto?fecha=2026-09-25");
    expect(suyo.data.grupos[0]).toMatchObject({ id: "g1b", mio: true, materias_mias: [] });
    expect(suyo.data.grupos[0].docentes).toEqual(["u-maestra@escuela.test"]);
    expect(suyo.data.grupos[1]).toMatchObject({ id: "g1", mio: false });

    const ajeno = await otro()("GET", "/grupo/contexto?fecha=2026-09-25");
    expect(ajeno.data.grupos.find((g: any) => g.id === "g1b")).toMatchObject({
      mio: false,
      docentes: ["u-maestra@escuela.test"],
    });

    expect((await maestra()("POST", "/grupo/g1b/dejar", {})).data.retiradas).toBe(1);
    const despues = await maestra()("GET", "/grupo/contexto?fecha=2026-09-25");
    expect(despues.data.grupos.every((g: any) => !g.mio)).toBe(true);
  });

  test("una maestra sin admin: con el menú Grupos organiza su grupo; los periodos son de admin", async () => {
    const maestra_real = como("u-maestra", ["grupo", "registro-asistencias"]);
    expect((await maestra_real("GET", "/grupo/contexto?fecha=2026-09-25")).status).toBe(200);
    expect((await maestra_real("POST", "/grupo/g1/asignarme", {})).status).toBe(201);
    expect((await maestra_real("POST", "/grupo/g1/alumnos/lote", { nombres: "Diego" })).status).toBe(201);
    expect((await maestra_real("POST", "/registro-asistencias/pase", { grupo_id: "g1" })).status).toBe(201);
    const periodos = await maestra_real("POST", "/periodos-examen/generar", { ciclo_escolar_id: "cic1", cantidad: 5 });
    expect(periodos.status).toBe(403);

    const sin_grupos = como("u-otra", ["registro-asistencias"]);
    expect((await sin_grupos("POST", "/grupo/g1/asignarme", {})).status).toBe(403);
  });

  test("docente de una materia en varios grupos", async () => {
    await insert("materias", { id: "mat-calc", name: "Cálculo" });
    await insert("grupo", { id: "g1b", name: "1B", ciclo_escolar_id: "cic1", escuela_id: "esc1" });
    await otro()("POST", "/grupo/g1/asignarme", { materia_id: "mat-calc" });
    await otro()("POST", "/grupo/g1b/asignarme", { materia_id: "mat-calc" });
    const r = await otro()("GET", "/grupo/contexto?fecha=2026-09-25");
    expect(r.data.grupos.map((g: any) => [g.id, g.mio, g.materias_mias])).toEqual([
      ["g1", true, ["mat-calc"]],
      ["g1b", true, ["mat-calc"]],
    ]);
    expect((await otro()("POST", "/grupo/g1/asignarme", { materia_id: "no-existe" })).status).toBe(404);
  });

  test("el grupo del ciclo siguiente se prepara antes de que empiece", async () => {
    await insert("ciclos_escolares", {
      id: "cic2",
      name: "2027-2028",
      fecha_inicio: "2027-08-23",
      fecha_fin: "2028-07-14",
    });
    await insert("grupo", { id: "g2", name: "2A", ciclo_escolar_id: "cic2", escuela_id: "esc1" });
    const r = await call("GET", "/grupo/contexto?fecha=2026-09-25&ciclo_id=cic2");
    expect(r.data.ciclo).toMatchObject({ id: "cic2", vigente: false });
    expect(r.data.grupos.map((g: any) => g.id)).toEqual(["g2"]);
    expect(r.data.ciclos.map((c: any) => c.id)).toEqual(["cic2", "cic1", "cic-pasado"]);
  });

  test("alta de alumnos por lista pegada, sin repetir", async () => {
    const r = await call("POST", "/grupo/g1/alumnos/lote", { nombres: "1. Diego\n\n2) ana\nEva\nDiego" });
    expect(r.status).toBe(201);
    expect(r.data.creados.map((a: any) => [a.numero_lista, a.name])).toEqual([
      [4, "Diego"],
      [5, "Eva"],
    ]);
    expect(r.data.repetidos).toEqual(["ana", "Diego"]);
    expect(r.data.alumnos.length).toBe(5);
    expect((await call("POST", "/grupo/g1/alumnos/lote", { nombres: "\n \n" })).status).toBe(400);
  });

  test("numerar por orden alfabético", async () => {
    await call("POST", "/grupo/g1/alumnos/lote", { nombres: ["Abel"] });
    const r = await call("POST", "/grupo/g1/alumnos/numerar", {});
    expect(r.data.map((a: any) => [a.numero_lista, a.name])).toEqual([
      [1, "Abel"],
      [2, "Ana"],
      [3, "Beto"],
      [4, "Carla"],
    ]);
  });

  test("pasar alumnos al grupo del ciclo siguiente sin perder el historial", async () => {
    const pase = await call("POST", "/registro-asistencias/pase", { grupo_id: "g1", fecha: "2026-09-25" });
    await insert("ciclos_escolares", { id: "cic2", name: "2027-2028", fecha_inicio: "2027-08-23", fecha_fin: "2028-07-14" });
    await insert("grupo", { id: "g2", name: "2A", ciclo_escolar_id: "cic2", escuela_id: "esc1" });

    const r = await call("POST", "/grupo/g1/alumnos/mover", { destino_grupo_id: "g2" });
    expect(r.data.movidos).toBe(3);
    expect((await call("GET", "/grupo/g1/alumnos")).data).toEqual([]);
    expect((await call("GET", "/grupo/g2/alumnos")).data.map((a: any) => [a.numero_lista, a.name])).toEqual([
      [1, "Ana"],
      [2, "Beto"],
      [3, "Carla"],
    ]);
    // El pase viejo sigue con su grupo y sus nombres.
    const viejo = await call("GET", `/registro-asistencias/pase/${pase.data.registro.id}`);
    expect(viejo.data.grupo.name).toBe("1A");
    expect(viejo.data.renglones.length).toBe(3);

    // Al destino con alumnos, los que llegan siguen su numeración.
    await insert("alumnos", { id: "a-nuevo", name: "Zoe", grupo_id: "g-viejo", numero_lista: 1 });
    await call("POST", "/grupo/g-viejo/alumnos/mover", { destino_grupo_id: "g2", alumno_ids: ["a-nuevo"] });
    const destino = (await call("GET", "/grupo/g2/alumnos")).data;
    expect(destino.at(-1)).toMatchObject({ name: "Zoe", numero_lista: 4 });
    // El alumno "a-otro" no se pidió y se queda.
    expect((await call("GET", "/grupo/g-viejo/alumnos")).data.map((a: any) => a.id)).toEqual(["a-otro"]);

    expect((await call("POST", "/grupo/g2/alumnos/mover", { destino_grupo_id: "g2" })).status).toBe(400);
  });

  test("dividir el ciclo en periodos y saber el vigente", async () => {
    const r = await call("POST", "/periodos-examen/generar", {
      ciclo_escolar_id: "cic1",
      cantidad: 5,
      nombre: "Bimestre",
    });
    expect(r.status).toBe(201);
    expect(r.data.map((p: any) => p.name)).toEqual(["Bimestre 1", "Bimestre 2", "Bimestre 3", "Bimestre 4", "Bimestre 5"]);
    expect(r.data[0].fecha_inicio).toBe("2026-08-24");
    expect(r.data[4].fecha_fin).toBe("2027-07-16");

    const otra_vez = await call("POST", "/periodos-examen/generar", { ciclo_escolar_id: "cic1", cantidad: 3 });
    expect(otra_vez.status).toBe(409);

    const ctx = await call("GET", "/grupo/contexto?fecha=2026-11-20");
    expect(ctx.data.periodos.length).toBe(5);
    expect(ctx.data.periodo_id).toBe(ctx.data.periodos[1].id);
  });
});
