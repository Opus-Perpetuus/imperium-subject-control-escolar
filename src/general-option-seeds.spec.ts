import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  GENERAL_OPTION_LIST_SEED_PATH,
  GENERAL_OPTION_LIST_SEEDS,
  general_option_list_options_source,
  push_general_option_seeds,
} from "./general-option-seeds";

describe("general option seeds", () => {
  test("optionsSource apunta al control del núcleo", () => {
    expect(
      general_option_list_options_source("subject-control-escolar/tipos-incidencia", "categoria"),
    ).toBe(
      "api://general-option-list-control/options?model_id=subject-control-escolar%2Ftipos-incidencia&list_key=categoria&as=options",
    );
  });

  test("2 listas B con valores únicos", () => {
    expect(GENERAL_OPTION_LIST_SEEDS).toHaveLength(2);
    for (const entry of GENERAL_OPTION_LIST_SEEDS) {
      expect(entry.model_id).toBe("subject-control-escolar/tipos-incidencia");
      for (const list of entry.lists) {
        const values = list.options.map((o) => o.value);
        expect(new Set(values).size).toBe(values.length);
      }
    }
  });

  test("tipos-incidencia usa optionsSource sin options literales", () => {
    const src = readFileSync(
      new URL("./modules/tipos-incidencia/tipos-incidencia.pages.ts", import.meta.url),
      "utf8",
    );
    expect(src).toContain("general_option_list_options_source");
    for (const field of ["categoria", "severidad"]) {
      expect(src).toContain(`name: "${field}"`);
      expect(src).not.toMatch(new RegExp(`name:\\s*"${field}"[\\s\\S]*?options:\\s*\\[`));
    }
  });
});

describe("push_general_option_seeds", () => {
  const env = {
    CORE_DATA_URL: "http://core:3000/api/kirlets/data/x",
    SUBJECT_TECHNICAL_ID: "subject-control-escolar",
    CORE_SUBJECT_GATEWAY_SECRET: "s",
  };

  test("sin env no llama", async () => {
    let called = false;
    const r = await push_general_option_seeds({
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
    const r = await push_general_option_seeds({ env, fetchImpl });
    expect(url).toBe(`http://core:3000${GENERAL_OPTION_LIST_SEED_PATH}`);
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body));
    expect(body.entries.length).toBe(GENERAL_OPTION_LIST_SEEDS.length);
    expect(r.pushed).toBe(true);
  });
});
