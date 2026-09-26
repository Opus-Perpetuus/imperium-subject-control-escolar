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

- **Contexto** — `GET /grupo/contexto?fecha=AAAA-MM-DD[&escuela_id=][&ciclo_id=]`: escuelas,
  ciclo vigente en la fecha del dispositivo (o el pedido, para preparar el siguiente o ver uno
  pasado), sus periodos y el que está en curso, y los grupos de ese ciclo. Cada grupo dice si el
  usuario lo tiene asignado (`mio`, `materias_mias`) y quiénes lo atienden (`docentes`); los
  propios van primero. Con una sola escuela no se pregunta.
- **Mi grupo** — cómo se organiza un ciclo sin suponer un tipo de escuela:
  - `POST /grupo/:id/asignarme` / `…/dejar` (`materia_id` opcional): el docente se asigna el
    grupo como titular (sin materia; primaria: una maestra por grupo que cambia cada ciclo) o
    como docente de una materia (secundaria, universidad: un profesor en varios grupos). Tabla
    `asignaciones_docente` (usuario, grupo, materia); el ciclo sale del grupo. Nadie queda fuera
    por no estar asignado: los grupos ajenos se marcan, no se esconden.
  - `POST /grupo/:id/alumnos/lote` (`nombres`: texto pegado, uno por renglón; quita la
    numeración y no repite a quien ya está), `…/alumnos/numerar` (1…N alfabético) y
    `…/alumnos/mover` (`destino_grupo_id`: pasar el grupo al del ciclo siguiente; lo capturado
    antes se queda con el grupo viejo).
  - `POST /periodos-examen/generar` (`ciclo_escolar_id`, `cantidad`, `nombre`): divide el ciclo
    en periodos seguidos de duración casi igual ("Bimestre 1…5", "Trimestre 1…3"); la tabla
    `periodos_examen` guarda los periodos del ciclo aunque conserve su nombre.
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
