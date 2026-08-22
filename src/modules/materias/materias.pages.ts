import {
  build_feature_shell_page,
  type KirletPageDecl,
} from "@opus-perpetuus/imperium-core-kit";

const API = "api://m/subject-control-escolar";

export const materias_pages: KirletPageDecl[] = [
  {
    id: "control-escolar.materias",
    path: "materias",
    permission: "subject.control-escolar.materias.read",
    build: () =>
      build_feature_shell_page({
        id: "control-escolar.materias",
        owner: "subject-control-escolar",
        title: "Materias",
        props: {
          basePath: "materias",
          idKey: "id",
          nameKey: "name",
          view: {
            title: "Materias",
            subtitle: "Submenú de control-escolar",
            pluralLabel: "materias",
            singularLabel: "materias",
            emptyTitle: "Sin registros",
            emptyDescription: "Migra desde Mongo o crea el primero",
          },
          data: {
            list: `${API}/materias`,
            record: `${API}/materias/:id`,
            create: { method: "POST", action: `${API}/materias` },
            update: { method: "PATCH", action: `${API}/materias/:id` },
            delete: { method: "DELETE", action: `${API}/materias/:id` },
          },
          table: {
            columns: [
              { key: "name", label: "Nombre", sortable: true, priority: 1 },
              { key: "is_active", label: "Activo", sortable: true, priority: 2 },
              { key: "ref", label: "Ref", sortable: true, priority: 3 },
              { key: "clave", label: "clave", sortable: true, priority: 3 },
            ],
            fillHeight: true,
            serverQuery: true,
          },
          form: {
            fields: [
              { name: "name", component: "input-text", label: "Nombre", required: true },
              { name: "description", component: "input-text", label: "Descripción" },
              { name: "ref", component: "input-text", label: "Referencia (_ref)" },
              { name: "clave", component: "input-text", label: "clave" },
            ],
          },
        },
      }),
  },
];
