import {
  build_feature_shell_page,
  type KirletPageDecl,
} from "@opus-perpetuus/imperium-core-kit";

const API = "api://m/subject-control-escolar";

export const aulas_pages: KirletPageDecl[] = [
  {
    id: "control-escolar.aulas",
    path: "aulas",
    permission: "subject.control-escolar.aulas.read",
    build: () =>
      build_feature_shell_page({
        id: "control-escolar.aulas",
        owner: "subject-control-escolar",
        title: "Aulas",
        props: {
          basePath: "aulas",
          idKey: "id",
          nameKey: "name",
          view: {
            title: "Aulas",
            subtitle: "Submenú de control-escolar",
            pluralLabel: "aulas",
            singularLabel: "aulas",
            emptyTitle: "Sin registros",
            emptyDescription: "Migra desde Mongo o crea el primero",
          },
          data: {
            list: `${API}/aulas`,
            record: `${API}/aulas/:id`,
            create: { method: "POST", action: `${API}/aulas` },
            update: { method: "PATCH", action: `${API}/aulas/:id` },
            delete: { method: "DELETE", action: `${API}/aulas/:id` },
          },
          table: {
            columns: [
              { key: "name", label: "Nombre", sortable: true, priority: 1 },
              { key: "is_active", label: "Activo", sortable: true, priority: 2 },
              { key: "ref", label: "Ref", sortable: true, priority: 3 },
              { key: "escuela_id", label: "escuela id", sortable: true, priority: 3 },
              { key: "capacidad", label: "capacidad", sortable: true, priority: 3 },
            ],
            fillHeight: true,
            serverQuery: true,
          },
          form: {
            fields: [
              { name: "name", component: "input-text", label: "Nombre", required: true },
              { name: "description", component: "input-text", label: "Descripción" },
              { name: "ref", component: "input-text", label: "Referencia (_ref)" },
              { name: "escuela_id", component: "input-text", label: "escuela id" },
              { name: "capacidad", component: "input-number", label: "capacidad" },
            ],
          },
        },
      }),
  },
];
