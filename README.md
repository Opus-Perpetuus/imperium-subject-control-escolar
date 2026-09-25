# SUBJECT-control-escolar

App de primer nivel del menú principal de Imperium: escuelas, ciclos, grupos,
alumnos, pase de lista, incidencias, enlaces para familias y dirección, y
exámenes.

| | |
|--|--|
| Catalog id | `SUBJECT-control-escolar` |
| Technical id | `subject-control-escolar` |
| Image | `ghcr.io/opus-perpetuus/subject-control-escolar:<version>` |
| SQL schema | `subject_control_escolar` (versión de esquema en `src/subject.ts`) |
| Repo | `Opus-Perpetuus/imperium-subject-control-escolar` |

## Pantallas de aula

Las pinta el lanzador Angular (monorepo, `frontend/src/app/components/control-escolar/aula/` y
`examenes/`); la lógica vive aquí, en rutas de la app (`/api/m/subject-control-escolar/…`).

- **Contexto** — `GET /grupo/contexto?fecha=AAAA-MM-DD[&escuela_id=]`: escuelas, ciclo vigente
  en la fecha del dispositivo (entre inicio y fin) y los grupos de ese ciclo. Con una sola
  escuela no se pregunta.
- **Pase de lista** — `POST /registro-asistencias/pase` crea un registro con un renglón por
  alumno en orden de número de lista; `…/pase/:id/marcar` (presente/ausente/pendiente),
  `…/pase/:id/cerrar`, `GET /registro-asistencias/pases?grupo_id&fecha`. Se puede pasar lista
  las veces que haga falta. Una falta no crea incidencia.
- **Incidencias** — catálogo `tipos-incidencia` (categoría, severidad; sembrado con las
  categorías de convivencia de la SEP) y `POST /registro-incidencias/rapida` con alumno, tipo y
  descripción; escuela, ciclo y grado salen del grupo.
- **Enlaces compartidos** — `POST /enlaces-compartidos/incidencia/:id` (familia) o
  `/enlaces-compartidos/reporte` (dirección: alumnos, periodo, incidencias y/o faltas). Token
  aleatorio de 192 bits, 30 días de vigencia, se retiran y cuentan vistas. Se abren sin sesión en
  `/app/control-escolar?t=<token>` (página pública `control-escolar.compartido`).
- **Exámenes** — `periodos-examen`, `examenes` (preguntas de opción múltiple con clave o
  abiertas con puntos), respuestas por alumno con foto de la hoja
  (`PUT /examenes/:id/respuestas/:alumno_id`), calificación 5–10 y recalificación al cambiar la
  clave, `GET /examenes/:id/resultados`.

Por qué así: [`docs/investigacion-gestion-escolar.md`](docs/investigacion-gestion-escolar.md).

```bash
bun install
bun test          # conformance + src/escolar.spec.ts
bun run local     # contra el núcleo v13 en :3100
```
