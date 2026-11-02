import type { KirletManifestLeaf, KirletModuleDef } from "@opus-perpetuus/imperium-core-kit";

/**
 * Hoja de shell de cada página (`pages[].leaf` del /manifest en vivo).
 * Antes solo vivían en `manifest.json`; el kit sirve el manifest desde el
 * código, así que sin esto el /manifest salía sin hojas.
 */
export const PAGE_LEAVES: Record<string, KirletManifestLeaf> = {
  "control-escolar.tipos-incidencia": {
    "kind": "crud",
    "appBase": "tipos-incidencia",
    "icon": "fa-tags",
    "listHeaders": {
      "es": {
        "name": "Nombre",
        "categoria": "Categoría",
        "severidad": "Severidad",
        "orden": "Orden"
      }
    }
  },
  "control-escolar.periodos-examen": {
    "kind": "crud",
    "appBase": "periodos-examen",
    "icon": "fa-calendar-week",
    "listHeaders": {
      "es": {
        "name": "Nombre",
        "fecha_inicio": "Inicio",
        "fecha_fin": "Fin"
      }
    }
  }
};

/** Pone a cada página la hoja que le toca, sin pisar una declarada a mano. */
export function con_hojas(modules: KirletModuleDef[]): KirletModuleDef[] {
  return modules.map((mod) => ({
    ...mod,
    pages: mod.pages?.map((page) => (page.leaf || !PAGE_LEAVES[page.id] ? page : { ...page, leaf: PAGE_LEAVES[page.id] })),
  }));
}
