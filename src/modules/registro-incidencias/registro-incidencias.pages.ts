import {
  build_feature_shell_page,
  type KirletPageDecl,
} from "@opus-perpetuus/imperium-core-kit";

const API = "api://m/subject-control-escolar";

export const registro_incidencias_pages: KirletPageDecl[] = [
  {
    id: "control-escolar.registro-incidencias",
    path: "registro-incidencias",
    permission: "subject.control-escolar.registro-incidencias.read",
    build: () =>
      build_feature_shell_page({
        id: "control-escolar.registro-incidencias",
        owner: "subject-control-escolar",
        title: "Registro de incidencias",
        props: {
          basePath: "registro-incidencias",
          idKey: "id",
          nameKey: "name",
          view: {
            title: "Registro de incidencias",
            subtitle: "Submenú de control-escolar",
            pluralLabel: "registro de incidencias",
            singularLabel: "registro de incidencias",
            emptyTitle: "Sin registros",
            emptyDescription: "Migra desde Mongo o crea el primero",
          },
          data: {
            list: `${API}/registro-incidencias`,
            record: `${API}/registro-incidencias/:id`,
            create: { method: "POST", action: `${API}/registro-incidencias` },
            update: { method: "PATCH", action: `${API}/registro-incidencias/:id` },
            delete: { method: "DELETE", action: `${API}/registro-incidencias/:id` },
          },
          table: {
            columns: [
              { key: "name", label: "Nombre", sortable: true, priority: 1 },
              { key: "is_active", label: "Activo", sortable: true, priority: 2 },
              { key: "ref", label: "Ref", sortable: true, priority: 3 },
              { key: "alumno_id", label: "alumno id", sortable: true, priority: 3 },
              { key: "grupo_id", label: "grupo id", sortable: true, priority: 3 },
              { key: "registro_asistencia_id", label: "registro asistencia id", sortable: true, priority: 3 },
              { key: "lista_asistencia_id", label: "lista asistencia id", sortable: true, priority: 3 },
              { key: "materia_id", label: "materia id", sortable: true, priority: 3 },
              { key: "grado_escolar_id", label: "grado escolar id", sortable: true, priority: 3 },
            ],
            fillHeight: true,
            serverQuery: true,
          },
          form: {
            fields: [
              { name: "name", component: "input-text", label: "Nombre", required: true },
              { name: "description", component: "input-text", label: "Descripción" },
              { name: "ref", component: "input-text", label: "Referencia (_ref)" },
              { name: "alumno_id", component: "input-text", label: "alumno id" },
              { name: "grupo_id", component: "input-text", label: "grupo id" },
              { name: "registro_asistencia_id", component: "input-text", label: "registro asistencia id" },
              { name: "lista_asistencia_id", component: "input-text", label: "lista asistencia id" },
              { name: "materia_id", component: "input-text", label: "materia id" },
              { name: "grado_escolar_id", component: "input-text", label: "grado escolar id" },
              { name: "escuela_id", component: "input-text", label: "escuela id" },
              { name: "tipo", component: "input-text", label: "tipo" },
              { name: "justificada", component: "input-checkbox", label: "justificada" },
              { name: "evidencia", component: "input-text", label: "evidencia" },
              { name: "fecha_asistencia", component: "input-text", label: "fecha asistencia" },
            ],
          },
        },
      }),
  },
];
