import {
  build_feature_shell_page,
  type KirletPageDecl,
} from "@opus-perpetuus/imperium-core-kit";

const API = "api://m/subject-control-escolar";

export const lista_asistencia_pages: KirletPageDecl[] = [
  {
    id: "control-escolar.lista-asistencia",
    path: "lista-asistencia",
    permission: "subject.control-escolar.lista-asistencia.read",
    build: () =>
      build_feature_shell_page({
        id: "control-escolar.lista-asistencia",
        owner: "subject-control-escolar",
        title: "Listas de asistencia",
        props: {
          basePath: "lista-asistencia",
          idKey: "id",
          nameKey: "name",
          view: {
            title: "Listas de asistencia",
            subtitle: "Submenú de control-escolar",
            pluralLabel: "listas de asistencia",
            singularLabel: "listas de asistencia",
            emptyTitle: "Sin registros",
            emptyDescription: "Migra desde Mongo o crea el primero",
          },
          data: {
            list: `${API}/lista-asistencia`,
            record: `${API}/lista-asistencia/:id`,
            create: { method: "POST", action: `${API}/lista-asistencia` },
            update: { method: "PATCH", action: `${API}/lista-asistencia/:id` },
            delete: { method: "DELETE", action: `${API}/lista-asistencia/:id` },
          },
          table: {
            columns: [
              { key: "name", label: "Nombre", sortable: true, priority: 1 },
              { key: "is_active", label: "Activo", sortable: true, priority: 2 },
              { key: "ref", label: "Ref", sortable: true, priority: 3 },
              { key: "registro_asistencia_id", label: "registro asistencia id", sortable: true, priority: 3 },
              { key: "alumno_id", label: "alumno id", sortable: true, priority: 3 },
              { key: "grupo_id", label: "grupo id", sortable: true, priority: 3 },
              { key: "alumno_nombre_snapshot", label: "alumno nombre snapshot", sortable: true, priority: 3 },
              { key: "numero_lista", label: "numero lista", sortable: true, priority: 3 },
              { key: "estado", label: "estado", sortable: true, priority: 3 },
            ],
            fillHeight: true,
            serverQuery: true,
          },
          form: {
            fields: [
              { name: "name", component: "input-text", label: "Nombre", required: true },
              { name: "description", component: "input-text", label: "Descripción" },
              { name: "ref", component: "input-text", label: "Referencia (_ref)" },
              { name: "registro_asistencia_id", component: "input-text", label: "registro asistencia id" },
              { name: "alumno_id", component: "input-text", label: "alumno id" },
              { name: "grupo_id", component: "input-text", label: "grupo id" },
              { name: "alumno_nombre_snapshot", component: "input-text", label: "alumno nombre snapshot" },
              { name: "numero_lista", component: "input-number", label: "numero lista" },
              { name: "estado", component: "input-text", label: "estado" },
              { name: "justificada", component: "input-checkbox", label: "justificada" },
              { name: "evidencia", component: "input-text", label: "evidencia" },
              { name: "registro_incidencia_id", component: "input-text", label: "registro incidencia id" },
            ],
          },
        },
      }),
  },
];
