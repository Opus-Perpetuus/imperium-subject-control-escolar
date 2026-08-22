import {
  build_feature_shell_page,
  type KirletPageDecl,
} from "@opus-perpetuus/imperium-core-kit";

const API = "api://m/subject-control-escolar";

export const horarios_pages: KirletPageDecl[] = [
  {
    id: "control-escolar.horarios",
    path: "horarios",
    permission: "subject.control-escolar.horarios.read",
    build: () =>
      build_feature_shell_page({
        id: "control-escolar.horarios",
        owner: "subject-control-escolar",
        title: "Horarios",
        props: {
          basePath: "horarios",
          idKey: "id",
          nameKey: "name",
          view: {
            title: "Horarios",
            subtitle: "Submenú de control-escolar",
            pluralLabel: "horarios",
            singularLabel: "horarios",
            emptyTitle: "Sin registros",
            emptyDescription: "Migra desde Mongo o crea el primero",
          },
          data: {
            list: `${API}/horarios`,
            record: `${API}/horarios/:id`,
            create: { method: "POST", action: `${API}/horarios` },
            update: { method: "PATCH", action: `${API}/horarios/:id` },
            delete: { method: "DELETE", action: `${API}/horarios/:id` },
          },
          table: {
            columns: [
              { key: "name", label: "Nombre", sortable: true, priority: 1 },
              { key: "is_active", label: "Activo", sortable: true, priority: 2 },
              { key: "ref", label: "Ref", sortable: true, priority: 3 },
            ],
            fillHeight: true,
            serverQuery: true,
          },
          form: {
            fields: [
              { name: "name", component: "input-text", label: "Nombre", required: true },
              { name: "description", component: "input-text", label: "Descripción" },
              { name: "ref", component: "input-text", label: "Referencia (_ref)" },
            ],
          },
        },
      }),
  },
];
