import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  LISTA_ASISTENCIA_ESTADO_OPTIONS,
  REGISTRO_ASISTENCIAS_ESTATUS_OPTIONS,
  push_status_seeds,
  STATUS_OPTION_SEED_PATH,
  STATUS_OPTION_SEEDS,
} from "./status-seeds";

describe("status seeds", () => {
  test("lista-asistencia estado + registro-asistencias estatus", () => {
    expect(STATUS_OPTION_SEEDS).toHaveLength(2);
    const lista = STATUS_OPTION_SEEDS[0]!;
    expect(lista.model_id).toBe("subject-control-escolar/lista-asistencia");
    expect(lista.status_fields).toEqual(["estado"]);
    expect(lista.options.map((o) => o.value)).toEqual(LISTA_ASISTENCIA_ESTADO_OPTIONS.map((o) => o.value));
    expect(
      lista.options.every((o) => /^#[0-9a-f]{6}$/.test(o.color) && /^fas fa-[a-z0-9-]+$/.test(o.icon ?? "")),
    ).toBe(true);
    const reg = STATUS_OPTION_SEEDS[1]!;
    expect(reg.model_id).toBe("subject-control-escolar/registro-asistencias");
    expect(reg.status_fields).toEqual(["estatus"]);
    expect(reg.options.map((o) => o.value)).toEqual(REGISTRO_ASISTENCIAS_ESTATUS_OPTIONS.map((o) => o.value));
  });

  test("pages usan input-status sin options literales", () => {
    const lista = readFileSync(new URL("./modules/lista-asistencia/lista-asistencia.pages.ts", import.meta.url), "utf8");
    expect(lista).toMatch(/name:\s*"estado"/);
    expect(lista).toMatch(/component:\s*"input-status"/);
    expect(lista).not.toMatch(/name:\s*"estado"[\s\S]*?options:\s*\[/);
    const reg = readFileSync(
      new URL("./modules/registro-asistencias/registro-asistencias.pages.ts", import.meta.url),
      "utf8",
    );
    expect(reg).toMatch(/name:\s*"estatus"/);
    expect(reg).toMatch(/component:\s*"input-status"/);
    expect(reg).not.toMatch(/name:\s*"estatus"[\s\S]*?options:\s*\[/);
  });
});

describe("push_status_seeds", () => {
  const env = {
    CORE_DATA_URL: "http://core:3000/api/kirlets/data/x",
    SUBJECT_TECHNICAL_ID: "subject-control-escolar",
    CORE_SUBJECT_GATEWAY_SECRET: "s",
  };

  test("sin env no llama", async () => {
    let called = false;
    const r = await push_status_seeds({
      env: {},
      fetchImpl: (async () => {
        called = true;
        return new Response();
      }) as unknown as typeof fetch,
    });
    expect(r).toEqual({ pushed: false, reason: "core_not_configured" });
    expect(called).toBe(false);
  });

  test("POST entries a seed-defaults del núcleo", async () => {
    let url = "";
    let init: RequestInit | undefined;
    const fetchImpl = (async (u: string, i: RequestInit) => {
      url = u;
      init = i;
      return Response.json({ data: [{ inserted: 1 }] });
    }) as unknown as typeof fetch;
    const r = await push_status_seeds({ env, fetchImpl });
    expect(url).toBe(`http://core:3000${STATUS_OPTION_SEED_PATH}`);
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body));
    expect(body.entries.map((e: { model_id: string }) => e.model_id)).toEqual([
      "subject-control-escolar/lista-asistencia",
      "subject-control-escolar/registro-asistencias",
    ]);
    expect(r.pushed).toBe(true);
  });

  test("rechazo del núcleo no lanza", async () => {
    const fetchImpl = (async () => Response.json({ error: "x" }, { status: 401 })) as unknown as typeof fetch;
    expect(await push_status_seeds({ env, fetchImpl })).toEqual({
      pushed: false,
      reason: "core_refused",
      status: 401,
    });
  });
});
