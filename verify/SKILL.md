---
name: verify-subject
description: >
  Verificación de la app imperium-subject-control-escolar
  (subject-control-escolar). Cinco fases: Launch, Doctor, Drive, Evidence y
  Cleanup. Usar al comprobar un cambio de esta app contra el artefacto, no solo
  con el typecheck.
---

# verify-subject

Skill para el siguiente agente del repo `imperium-subject-control-escolar`
(`subject-control-escolar`). Prueba esa app. El arranque del núcleo y de la UI
compartida es la skill `verify-imperiumsic` del monorepo
`codice-progressio/imperium-SIC-ayuntamiento-zapotlanejo`, dependencia externa:
esta no lo duplica y no levanta otro stack.

| Dato | Valor |
| --- | --- |
| slug | `control-escolar` (de `package.json` `name: subject-control-escolar`) |
| technical-id | `subject-control-escolar` |
| puerto | `3206` (`scripts/dev-local.ts`; `PORT` lo sobrescribe) |
| feature | `control-escolar` (`features/control-escolar.md`) |
| base QA | sin definir; mientras no se nombre, no corre ninguna receta que mute |

## Launch

Ready = `GET http://127.0.0.1:3206/health` responde 200 con
`status: "ok"`, `ready: true` y `service` igual a `subject-control-escolar`, y
el doctor sale en 0. El log de arranque del kit es
`subject-control-escolar listening on http://0.0.0.0:3206`.

1. `git rev-parse HEAD` es el `ref` de `control-escolar` en
   `modular/repos.lock.json` del monorepo (dependencia externa), o el PR nombra
   el SHA distinto.
2. Con el núcleo ya en marcha en `http://127.0.0.1:3100` (`CORE_URL` lo
   sobrescribe), la app se levanta con `bun run local`.
3. Si el núcleo no responde, Launch sale en 1. No corre compose, no restaura
   un dump y no siembra datos.
4. Si el puerto ya tiene un proceso que esta corrida no arrancó, Launch lo
   adopta solo cuando el doctor pasa. Si el doctor falla, sale en 1 y no
   mata ese proceso.
5. Guardar en `run/state.json` si esta corrida arrancó la app (`started: true`
   y el pid) o si la adoptó (`started: false`).

## Doctor

Solo lectura. Sale en 0 cuando todas pasan; si una falla, sale en 1 y no hay
Drive.

- `GET /health` de la app, en menos de 5 s, con `status: "ok"`, `ready: true`
  y `service: "subject-control-escolar"`.
- `GET /manifest` de la app nombra el mismo `subject-control-escolar`.
- `VERIFY_EXPECT_ROOT` es la raíz de este repo. Otro árbol sale en 1.
- La corrida no hace login de más ni llama métodos distintos de GET.

El cuerpo de `/health` de la app es el del kit (`status`, `service`, `ready`).
El `/health` del núcleo usa otra forma; lo juzga `verify-imperiumsic`.

## Drive

Conducir la ficha `features/control-escolar.md` como usuario o como cliente.
Handles estables: `data-manual-anchor`, nombre ARIA, ruta o status HTTP. Sin
coordenadas, sin setters internos y sin esperas de tiempo fijo.

Registrar la espera de la respuesta antes del clic o del `goto` que la
dispara.

Salidas: 0 pasa, 1 falla, 2 error del arnés, 3 omitida. Omitida es un
prerrequisito que la ficha nombra (app no instalada, dato semilla ausente).
No se reporta como pasa.

La receta de lectura no dispara métodos distintos de GET. La receta que muta
lo dice en la ficha y solo corre contra la base QA nombrada arriba.

## Evidence

Escribir `evidence/run.json` y dejar los archivos bajo
`evidence/control-escolar/`. `run.json` no lleva `sha`:

```json
{
  "feature": "control-escolar",
  "action": "<qué se hizo>",
  "result": "<status o texto observado>",
  "artifacts": ["evidence/control-escolar/<archivo>"]
}
```

`feature`, `action` y `result` van rellenos, sin ángulos. `artifacts` lista
archivos que existen después del cleanup. Cada uno muestra la acción y el
estado que resultó. Secretos, SMTP y contraseñas no entran a `run.json` ni a
esos archivos.

El workflow `.github/workflows/agent-evidence.yml` no corre Launch, Doctor ni
Drive. En un `pull_request`, Actions si no se le pide otra cosa baja el merge
de prueba. Este job hace checkout de `github.event.pull_request.head.sha` y
compara `git rev-parse HEAD` con esa punta: el SHA verificado es el de ese
checkout, no el del merge. Lee `evidence/run.json` (sin campo `sha`), escribe
`evidence/manifest.json` con `sha` igual a ese HEAD y lo publica como
artefacto `agent-evidence`. Ese manifiesto no se commitea.

## Cleanup

Leer `run/state.json`. Si `started` es true, detener ese pid. Si Launch adoptó
un proceso, no tocarlo. No usar `pkill` por nombre. No borrar `evidence/`.
