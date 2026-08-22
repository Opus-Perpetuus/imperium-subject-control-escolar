import {
  build_feature_shell_page,
  type KirletPageDecl,
} from "@opus-perpetuus/imperium-core-kit";

const API = "api://m/subject-control-escolar";

export const grupo_pages: KirletPageDecl[] = [
  {
    id: "control-escolar.grupo",
    path: "grupo",
    permission: "subject.control-escolar.grupo.read",
    build: () =>
      build_feature_shell_page({
        id: "control-escolar.grupo",
        owner: "subject-control-escolar",
        title: "Grupos",
        props: {
          basePath: "grupo",
          idKey: "id",
          nameKey: "name",
          view: {
            title: "Grupos",
            subtitle: "Submenú de control-escolar",
            pluralLabel: "grupos",
            singularLabel: "grupos",
            emptyTitle: "Sin registros",
            emptyDescription: "Migra desde Mongo o crea el primero",
          },
          data: {
            list: `${API}/grupo`,
            record: `${API}/grupo/:id`,
            create: { method: "POST", action: `${API}/grupo` },
            update: { method: "PATCH", action: `${API}/grupo/:id` },
            delete: { method: "DELETE", action: `${API}/grupo/:id` },
          },
          table: {
            columns: [
              { key: "name", label: "Nombre", sortable: true, priority: 1 },
              { key: "is_active", label: "Activo", sortable: true, priority: 2 },
              { key: "ref", label: "Ref", sortable: true, priority: 3 },
              { key: "grado_escolar_id", label: "grado escolar id", sortable: true, priority: 3 },
              { key: "ciclo_escolar_id", label: "ciclo escolar id", sortable: true, priority: 3 },
              { key: "escuela_id", label: "escuela id", sortable: true, priority: 3 },
              { key: "letra", label: "letra", sortable: true, priority: 3 },
            ],
            fillHeight: true,
            serverQuery: true,
          },
          form: {
            fields: [
              { name: "name", component: "input-text", label: "Nombre", required: true },
              { name: "description", component: "input-text", label: "Descripción" },
              { name: "ref", component: "input-text", label: "Referencia (_ref)" },
              { name: "grado_escolar_id", component: "input-text", label: "grado escolar id" },
              { name: "ciclo_escolar_id", component: "input-text", label: "ciclo escolar id" },
              { name: "escuela_id", component: "input-text", label: "escuela id" },
              { name: "letra", component: "input-text", label: "letra" },
            ],
          },
        },
      }),
  },
];
