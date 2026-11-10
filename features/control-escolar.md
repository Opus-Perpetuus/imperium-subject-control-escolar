# Control escolar

Quien usa la app consulta el catálogo de escuelas desde el menú "Control
escolar" y ve la tabla con nombre, estado activo, referencia, clave, dirección
y teléfono. Queda probado que la app responde sana y que la lista de escuelas
se lee sin escribir nada.

## Sub-features

La app hace la acción de `escuelas`. Escribe: no. Esta ficha no lleva línea
`Subject:` con imagen: el catálogo no da un tag para rellenarla. El hueco está
en `despliegue.md` del monorepo
`codice-progressio/imperium-SIC-ayuntamiento-zapotlanejo` (dependencia externa).

- `health` deja un resultado observable: `GET /health` 200 con
  `service: "subject-control-escolar"`.
- `escuelas` deja un resultado observable: la página `control-escolar.escuelas`
  con título "Escuelas" y su lista desde `api://m/subject-control-escolar/escuelas`.

### Archivos y contratos

- `src/subject.ts` — `define_subject` de `subject-control-escolar`
  (`id: "SUBJECT-control-escolar"`); no declara `dependsOn`.
- `src/modules/escuelas/escuelas.pages.ts` — página `control-escolar.escuelas`,
  `path: "escuelas"`, permiso `subject.control-escolar.escuelas.read`.
- `src/modules/escuelas/escuelas.routes.ts` — `define_crud` de `escuelas`,
  orden por defecto `name:asc`.
- `GET /health` y `GET /manifest` de la app, servidos por el kit.

### Mapa

| id | ruta | rol semilla | pasos | esperado | muta | receta |
| --- | --- | --- | --- | --- | --- | --- |
| `subject-control-escolar.health` | `GET /health` | ninguno | pedir `/health` a `:3206` | 200, `status: "ok"`, `ready: true`, `service: "subject-control-escolar"` | no | `arnes health` |
| `subject-control-escolar.escuelas` | `escuelas` | sin definir (requiere `subject.control-escolar.escuelas.read`) | abrir Control escolar → Escuelas | título "Escuelas" y tabla con columna "Nombre" | no | `arnes escuelas` |

## How to get to it (user POV)

- Menú "Control escolar" → "Escuelas" en la UI del núcleo.

## Driving it with arnes

Preconditions:

- Doctor en 0. Si falta `subject-control-escolar`, la receta sale `omitida`.
- Usuario con `subject.control-escolar.escuelas.read`; sin él, la receta
  `escuelas` sale `omitida`.

- **Abrir.** Ruta `escuelas` y título "Escuelas"; la respuesta GET de la lista
  se registra antes del `goto`.
- **Proof.** `evidence/control-escolar/`.

## Gotchas

- Una receta de lectura que escribe sale en fallo aunque la pantalla se vea bien.
- La base QA no está nombrada: ninguna receta muta hasta que se fije.
- `omitida` no cuenta como probada.
