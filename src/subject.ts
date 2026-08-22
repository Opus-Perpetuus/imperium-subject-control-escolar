import { define_subject } from "@opus-perpetuus/imperium-core-kit";
import pkg from "../package.json" with { type: "json" };
import { registro_incidencias_module } from "./modules/registro-incidencias/registro-incidencias.routes.ts";
import { grupo_module } from "./modules/grupo/grupo.routes.ts";
import { registro_asistencias_module } from "./modules/registro-asistencias/registro-asistencias.routes.ts";
import { aulas_module } from "./modules/aulas/aulas.routes.ts";
import { alumnos_module } from "./modules/alumnos/alumnos.routes.ts";
import { horarios_module } from "./modules/horarios/horarios.routes.ts";
import { lista_asistencia_module } from "./modules/lista-asistencia/lista-asistencia.routes.ts";
import { escuelas_module } from "./modules/escuelas/escuelas.routes.ts";
import { grados_escolares_module } from "./modules/grados-escolares/grados-escolares.routes.ts";
import { ciclos_escolares_module } from "./modules/ciclos-escolares/ciclos-escolares.routes.ts";
import { materias_module } from "./modules/materias/materias.routes.ts";
import { seed_demo } from "./seed.ts";

export const SUBJECT = define_subject({
  id: "SUBJECT-control-escolar",
  name: "Control escolar",
  version: pkg.version,
  image: `ghcr.io/opus-perpetuus/subject-control-escolar:${pkg.version}`,
  compat: { nox: ">=0.5.0", kit: "^0.5.0" },
  schema_version: 1,
  menu_root: {
    id: "control-escolar.root",
    label: "Control escolar",
    order: 0,
  },
  modules: [registro_incidencias_module, grupo_module, registro_asistencias_module, aulas_module, alumnos_module, horarios_module, lista_asistencia_module, escuelas_module, grados_escolares_module, ciclos_escolares_module, materias_module],
  seed: seed_demo,
});

export const KIRLET = SUBJECT;
