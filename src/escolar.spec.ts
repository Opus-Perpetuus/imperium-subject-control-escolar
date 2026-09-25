import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  MemoryKirletDataClient,
  create_kirlet_test_context,
  type DomainRow,
} from "@opus-perpetuus/imperium-core-kit";
import { SUBJECT } from "./subject.ts";
import { seed_demo } from "./seed.ts";
import { ciclo_para_fecha, ordenar_alumnos } from "./lib/escolar.ts";

const TS = "2026-09-01T00:00:00.000Z";

type Server = ReturnType<typeof create_kirlet_test_context>;

let data: MemoryKirletDataClient;
let server: Server;

async function call(method: string, path: string, body?: unknown) {
  const res = await server.fetch(
    new Request(`http://t${path}`, {
      method,
      headers: body === undefined ? {} : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
  const json = (await res.json()) as Record<string, unknown>;
  return { status: res.status, json, data: json.data as any };
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
  server = create_kirlet_test_context(SUBJECT, { data });
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
