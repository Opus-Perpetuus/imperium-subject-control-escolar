# Investigación: cómo es un buen sistema de gestión escolar

Base de las pantallas de aula de esta app (pase de lista, incidencias, enlaces
para familias y dirección, exámenes). Septiembre de 2026, 50 fuentes.

## Qué se tomó

| Hallazgo | Dónde quedó |
| --- | --- |
| Pase uno por uno con botones grandes, avance "n de N", deshacer en vez de confirmar, resumen con ausentes antes de cerrar | Pantalla completa de pase de lista (lanzador) + `/registro-asistencias/pase…` |
| Varias tomas al día (por hora o materia) | Cada pase es un registro nuevo con su materia opcional |
| Una falta no es una incidencia | Las faltas salen de `lista_asistencia.estado = ausente`; ya no se crea una incidencia por falta |
| Catálogo de tipos con categoría y severidad, precargado con la SEP | `tipos-incidencia` + semilla |
| Captura rápida en ≤3 toques, solo del grupo actual | Pantalla completa de incidencias: alumno, tipo, descripción |
| Enlace de solo lectura largo, que caduca, se retira y registra accesos; sin datos de otros alumnos | `enlaces-compartidos` (192 bits, 30 días, vistas) + página pública `/app/control-escolar?t=` |
| Reporte a dirección: conteos, % de asistencia con semáforo (80 % acredita, 90 % ausentismo crónico), incidencias con severidad | Página pública tipo `reporte` |
| Opción múltiple automática, abiertas a mano, foto de la hoja como evidencia (sin OMR), recalificar al cambiar la clave, escala 5–10, análisis por pregunta | `examenes` + resultados |

## Qué quedó fuera (deseable)

Retardo y salida anticipada como estados del pase (el pedido fue de dos
botones), justificación de faltas por la familia desde el enlace, avisos
automáticos a tutores, alertas por acumulación, modo sin conexión, banco de
preguntas y versiones A/B, lectura automática de hojas desde foto, tabla de
inscripciones por ciclo (hoy el alumno apunta a su grupo actual y cada renglón
guarda su nombre y número de lista).

## Fuentes consultadas (50)

1. PowerSchool, asistencia: https://support.powerschool.com/help/sms/843/SchoolUser/Content/Topics/Attendance.htm
2. Códigos de PowerSchool: https://www.leveldata.com/decoding-attendance-codes-in-powerschool-understanding-their-meanings/
3. Infinite Campus Workflow: https://www.infinitecampus.com/products/premium-products-and-suites/campus-workflow-suite
4. Especificación de pase de lista (zschool): https://github.com/leaderiop/zschool/issues/100
5. openSIS, asistencia: https://opensis.com/feature-attendance
6. Gibbon, asistencia: https://gibbonedu.org/features/people/attendance/
7. Fedena, tipos de asistencia: https://support.fedena.com/support/solutions/articles/211471-how-can-i-set-up-student-attendance-type-for-an-institution-
8. ClassDojo y PBIS: https://www.classdojo.com/pbis/
9. Class Charts, visibilidad: https://class-charts.help.tes.com/support/solutions/articles/75000141989-how-to-select-what-pupils-and-parents-see-through-their-accounts
10. Arbor, registrar incidencias: https://support.arbor-education.com/hc/en-us/articles/115000183829-Logging-editing-and-resolving-Behaviour-Incidents
11. Arbor, flujos: https://support.arbor-education.com/hc/en-us/articles/11564038857757-Customise-your-Behaviour-Incident-Workflows
12. Bromcom, evento de conducta: https://docs.bromcom.com/knowledge-base/how-to-record-a-behaviour-event-for-a-student/
13. Bromcom, revisión previa: https://docs.bromcom.com/knowledge-base/how-to-use-record-review-for-behaviour-events/
14. SchoolMint Hero, modo kiosco: https://schoolminthero.zendesk.com/hc/en-us/articles/28896649084827-Kiosk-Mode
15. Toddle, conducta: https://www.toddleapp.com/product/behavior-management/
16. Gibbon, conducta: https://docs.gibbonedu.org/guides/modules/behaviour/behaviour
17. PBISApps, reportes disciplinarios: http://support.pbisapps.org/customer/portal/articles/944369-how-do-i-define-a-coherent-office-discipline-referral-process-
18. Panorama, reporte de incidencias: https://www.panoramaed.com/blog/behavior-incident-report
19. SEP, faltas en secundaria: https://www.gob.mx/cms/uploads/attachment/file/64028/secundaria.pdf
20. Reglamento de educación básica, Jalisco: https://info.jalisco.gob.mx/sites/default/files/leyes/reglamento_para_el_gobierno_y_funcionamiento_de_las_escuelas_de_educacion_basica_(2).pdf
21. Reglamento de la Secundaria Técnica 84: https://secutecegl84.blogspot.com/p/reglamento.html
22. SEP, Normas de Control Escolar: https://www.controlescolar.sep.gob.mx/es/controlescolar/Documento_de_Normas
23. SIGED, escuelas: https://www.siged.sep.gob.mx/SIGED/escuelas.html
24. Educamos, manual para familias: https://colegiolostilos.com/pdf/educamos.pdf
25. Alexia Gestión: https://www.alexiaeducaria.com/gestion/
26. Seesaw, familias: https://seesaw.com/features/family-communication/
27. Remind: https://www.remind.com/
28. Edutopia, correos a padres: https://www.edutopia.org/article/guidelines-emails-between-teachers-parents/
29. Attendance Works, ausentismo crónico: https://www.attendanceworks.org/wp-content/uploads/2017/06/Reporting-on-Chronic-Absence-1-pager4.28.16.pdf
30. LGDNNA, art. 76: https://mley.mx/LGDNNA/articulo/76/
31. FERPA, guía para padres: https://studentprivacy.ed.gov/resources/parent-guide-family-educational-rights-and-privacy-act-ferpa
32. Seguridad de enlaces mágicos: https://guptadeepak.com/mastering-magic-link-security-a-deep-dive-for-developers/
33. NN/g, confirmación: https://www.nngroup.com/articles/confirmation-dialog/
34. LeanCode, uso sin conexión: https://leancode.co/blog/offline-mobile-app-design
35. Áreas táctiles (LogRocket): https://blog.logrocket.com/ux-design/all-accessible-touch-target-sizes/
36. Gradescope, hoja de burbujas: https://guides.gradescope.com/hc/en-us/articles/22246010755853-Creating-a-Bubble-Sheet-Assignment
37. Gradescope, grupos de respuestas: https://guides.gradescope.com/hc/en-us/articles/24838908062093-AI-assisted-grading-and-answer-groups
38. ZipGrade, formatos: https://www.zipgrade.com/forms/
39. GradeCam: https://www.commonsense.org/education/reviews/gradecam
40. OMRChecker: https://github.com/Udayraj123/OMRChecker
41. Edpuzzle, calificación automática: https://support.edpuzzle.com/hc/en-us/articles/14355700455693-How-do-I-use-Autograde-for-open-ended-questions
42. Google Classroom, rúbricas: https://support.google.com/edu/classroom/answer/9335069
43. Moodle, cuestionarios: https://docs.moodle.org/502/en/Building_Quiz
44. Universidad de Washington, análisis por reactivo: https://www.washington.edu/assessment/scanning-scoring/scoring/reports/item-analysis/
45. Classter, buenas prácticas de asistencia: https://www.classter.com/blog/school-management/best-practices-for-your-students-attendance-management-system-project
46. Kinderpedia, familias: https://www.kinderpedia.co/en/users/parents-students
47. Phidias: https://go.phidias.com/
48. RosarioSIS: https://www.rosariosis.org/discover/
49. Sycamore K-12: https://sycamoreleaf.com/solutions/school-k-12/
50. Plickers, tarjetas: https://help.plickers.com/hc/en-us/articles/360009089113-Cards-Overview

## Hallazgos

### (a) Asistencia
- **Lo habitual es que todos empiecen como Presente** y el docente marque solo las excepciones (1, 4). El pase secuencial de 2 botones está bien como modo "enfoque", con botones de 48 dp o más (35). Con 40 alumnos es más lento, así que conviene tener también una vista de lista.
- **Estados:** Presente, Ausente, Retardo, Justificada y Salida anticipada. Cada escuela configura su catálogo (2, 5).
- **Reglas en México:**
  - Mínimo 80 % de asistencia para acreditar (22).
  - 3 retardos cuentan como 1 falta (21).
  - El justificante se entrega en 72 h o menos (21).
  - Al alumno que llega tarde no se le niega la entrada, pero se avisa a los padres (20, art. 55).

  Por eso **Justificada es un cambio posterior**, no un botón del pase. En Educamos la familia justifica y la falta cambia de color (24).
- **Varias tomas al día:** diaria o por materia (1, 7). Si el pase no se entrega a tiempo hay alerta, y dirección puede capturarlo (5).
- **Errores:** mejor deshacer que preguntar "¿Seguro?" (33). zschool muestra los conteos antes de confirmar y da 3 minutos para cancelar el aviso a los tutores (4).
- **Sin conexión:** cola local e indicador de sincronización (4, 34).

### (b) Incidencias
- **Qué capturar:** qué, dónde, cuándo, quién y con qué frecuencia; en las mayores, también antecedente, consecuencia y resultado (18). Las menores las resuelve el docente y las mayores, dirección (17).
- **Tipos:**
  - Positivo, negativo o neutral (8, 12, 16).
  - Severidad por niveles (16).
  - Un solo tipo por incidencia, porque la severidad depende del tipo (10).
- **Catálogo SEP para secundaria (19):** categorías de indisciplina leve, perturban el orden, altamente perturbadoras, provocan peligro, discriminatorias y violentas. Las medidas van de menor a mayor: plática, exhorto, reunión con padres, reunión con dirección, sanción interna, suspensión de 1 clase o de 3 a 5 días, y canalización psicológica.
- **Flujo:**
  - La incidencia pasa de sin resolver a resuelta y se asigna a un responsable.
  - Aviso por SMS o correo con plantilla según la severidad.
  - Sube de nivel sola si se acumulan N incidencias en X días.
  - Edición restringida, porque sirve como evidencia (10, 11).
  - **Los padres no la ven hasta que alguien la revisa** (13).
  - Qué ven los padres se configura por rol (9, 15).
- **Captura rápida:** primero el tipo y luego alumnos seguidos (14). Un evento admite varios alumnos y testigos (12, 16).

### (c) Estructura
- **Ciclo:** se divide en periodos de evaluación, con escala de 5 a 10 y aviso a las familias después de cada periodo. La inscripción lleva CURP (22) y tiene fecha de alta y de baja (5).
- **Alumno:** pertenece a la escuela cuando queda registrado en un grupo (20, art. 54).
- **Escuela:** CCT, turno y nivel (23).
- **Número de lista:** va en la **inscripción** (alumno × grupo × ciclo), no en el alumno, porque el alumno sigue existiendo de un ciclo a otro.

### (d) Padres y dirección
- **Padres:**
  - Avisos en tiempo real (3, 8).
  - Justificación en línea (3, 24, 25).
  - Traducción y horario de atención (27).
  - Cada familia ve solo a su hijo (26).
  - Temas graves por llamada, no por correo (28).
- **Dirección:**
  - Ausentismo crónico: faltar al 10 % o más de los días **por cualquier motivo**, incluidas las justificadas, con desglose por escuela, grado y grupo (29).
- **Enlace:**
  - Token aleatorio de 128 bits o más, guardado como hash, solo por HTTPS (32).
  - Los 15 minutos de OWASP son para iniciar sesión; aquí, caducidad en días, revocable y con registro de accesos.
  - La LGDNNA prohíbe difundir datos que identifiquen a un menor (30), y los padres tienen derecho a revisar el expediente y pedir correcciones (31).
  - Por lo tanto: datos mínimos y **sin nombrar a otros alumnos**.

### (e) Exámenes
- **Banco de preguntas:** con categorías y etiquetas, preguntas al azar y opciones barajadas (43).
- **Calificación:** la opción múltiple se califica sola y la abierta, a mano; la IA de Edpuzzle solo da 0 o 100 (41).
- **Hojas de respuesta:**
  - ZipGrade: hojas de 20, 50 o 100 preguntas, ID de alumno con burbujas y 4 marcas en las esquinas; la clave se escribe o se escanea (38).
  - Gradescope: plantilla fija con una burbuja clara por pregunta (36).
  - GradeCam: varias versiones del examen (39).
- **Foto con el celular:** OMRChecker acierta alrededor del 90 % con fotos de celular, frente a casi 100 % con escáner (40). Por eso **la lectura automática de hojas por foto no es para el MVP**.
- **Abiertas:** rúbrica de criterios × niveles con puntos, reutilizable y con puntajes intermedios (42). Las respuestas parecidas se pueden agrupar para calificarlas juntas (37).
- **Análisis por reactivo:** dificultad, discriminación y distractores; detecta claves mal capturadas (44).

## Funciones recomendadas (entre paréntesis, el punto del alcance)

**MVP**
1. **(3) Datos base:**
   - Escuela: nombre, CCT, nivel, turno.
   - Ciclo: nombre, inicio, fin y estado (planeado, activo o cerrado; uno activo por escuela).
   - Periodo: nombre y fechas.
   - Grupo: grado, sección, turno y titular.
   - Alumno: nombre, CURP y tutores con teléfono y correo.
   - **Inscripción:** alumno, grupo, número de lista, alta, baja y estado.
2. **(1) Pase de lista:**
   - Pase: grupo, docente, inicio, cierre, etiqueta ("1.ª hora") y estado (borrador o cerrado).
   - Detalle por alumno: inscripción, estado, hora y nota.
   - Solo inscripciones activas, por número de lista.
3. **(1) Pantalla del pase:**
   - Nombre grande, número de lista y progreso ("12/38").
   - Botones grandes de Presente y Ausente, y Retardo como secundario.
   - "Atrás" para deshacer.
   - Al final, un **resumen** con conteos y la lista de ausentes (tocar uno lo corrige), y luego "Cerrar".
4. **(1) Justificación posterior:** Ausente cambia a Justificada con motivo y archivo adjunto, y queda registrado quién la justificó.
5. **(2) Catálogo de tipos por escuela:** nombre, categoría, severidad (leve, grave o muy grave), positivo o negativo, si se avisa a los padres y medidas sugeridas. Viene precargado con las categorías de la SEP.
6. **(2) Captura de incidencias en pantalla completa:**
   - Alumno o alumnos (búsqueda por nombre o número de lista).
   - Tipo, descripción, fecha y hora (por defecto, ahora), lugar y medida tomada.
   - Se guarda en 3 toques o menos.
7. **(2/4) Estados de la incidencia:** registrada → revisada → notificada → cerrada. El seguimiento lleva autor y fecha; después de notificar solo se pueden agregar notas.
8. **(4) Enlace para padres:**
   - Solo existe a partir del estado "notificada".
   - Token con hash, solo lectura, caduca (por ejemplo, a los 30 días), se puede revocar y registra los accesos.
   - No muestra a otros alumnos ni la CURP, y no se indexa en buscadores.
9. **(4) Reporte para dirección:**
   - Filtros por alumnos y rango de fechas.
   - Conteos de Presente, Ausente, Retardo y Justificada.
   - Porcentaje de asistencia con semáforo: rojo si está debajo del 80 % o si falta al 10 % o más.
   - Incidencias con su severidad y estado.
   - PDF y enlace con la misma política.
10. **(5) Exámenes:**
    - Examen: periodo, grupo, materia, fecha y puntaje total.
    - Pregunta: tipo (opción múltiple o abierta), opciones, clave y puntos.
    - Respuesta: opción o texto, puntos, comentario y quién calificó.
    - **Foto de la hoja como evidencia adjunta**.
    - Captura en una tabla de alumnos × preguntas; la opción múltiple se califica sola y las abiertas quedan pendientes; se vuelve a calificar si cambia la clave; resultado en escala de 5 a 10.

**Deseables:**
- Vista de lista y modo sin conexión.
- Aviso automático a tutores, cancelable.
- Justificación solicitada por los padres.
- Alerta por N incidencias en X días.
- Reconocimientos positivos.
- Banco de preguntas y versiones A/B.
- Rúbricas y análisis por reactivo.
- Lectura de hojas por foto, con revisión humana.
