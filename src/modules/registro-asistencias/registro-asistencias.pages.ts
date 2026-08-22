import {
  build_feature_shell_page,
  type KirletPageDecl,
} from "@opus-perpetuus/imperium-core-kit";

const API = "api://m/subject-control-escolar";

export const registro_asistencias_pages: KirletPageDecl[] = [
  {
    id: "control-escolar.registro-asistencias",
    path: "registro-asistencias",
    permission: "subject.control-escolar.registro-asistencias.read",
    build: () =>
      build_feature_shell_page({
        id: "control-escolar.registro-asistencias",
        owner: "subject-control-escolar",
        title: "Registro de asistencias",
        props: {
          basePath: "registro-asistencias",
          idKey: "id",
          nameKey: "name",
          view: {
            title: "Registro de asistencias",
            subtitle: "Submenú de control-escolar",
            pluralLabel: "registro de asistencias",
            singularLabel: "registro de asistencias",
            emptyTitle: "Sin registros",
            emptyDescription: "Migra desde Mongo o crea el primero",
          },
          data: {
            list: `${API}/registro-asistencias`,
            record: `${API}/registro-asistencias/:id`,
            create: { method: "POST", action: `${API}/registro-asistencias` },
            update: { method: "PATCH", action: `${API}/registro-asistencias/:id` },
            delete: { method: "DELETE", action: `${API}/registro-asistencias/:id` },
          },
          table: {
            columns: [
              { key: "name", label: "Nombre", sortable: true, priority: 1 },
              { key: "is_active", label: "Activo", sortable: true, priority: 2 },
              { key: "ref", label: "Ref", sortable: true, priority: 3 },
              { key: "grupo_id", label: "grupo id", sortable: true, priority: 3 },
              { key: "materia_id", label: "materia id", sortable: true, priority: 3 },
              { key: "teacher_user_id", label: "teacher user id", sortable: true, priority: 3 },
              { key: "fecha_asistencia", label: "fecha asistencia", sortable: true, priority: 3 },
              { key: "estatus", label: "estatus", sortable: true, priority: 3 },
              { key: "total_alumnos", label: "total alumnos", sortable: true, priority: 3 },
            ],
            fillHeight: true,
            serverQuery: true,
          },
          form: {
            fields: [
              { name: "name", component: "input-text", label: "Nombre", required: true },
              { name: "description", component: "input-text", label: "Descripción" },
              { name: "ref", component: "input-text", label: "Referencia (_ref)" },
              { name: "grupo_id", component: "input-text", label: "grupo id" },
              { name: "materia_id", component: "input-text", label: "materia id" },
              { name: "teacher_user_id", component: "input-text", label: "teacher user id" },
              { name: "fecha_asistencia", component: "input-text", label: "fecha asistencia" },
              { name: "estatus", component: "input-text", label: "estatus" },
              { name: "total_alumnos", component: "input-number", label: "total alumnos" },
            ],
          },
        },
      }),
  },
];
