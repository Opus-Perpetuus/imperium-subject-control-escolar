import {
  build_feature_shell_page,
  type KirletPageDecl,
} from "@opus-perpetuus/imperium-core-kit";

const API = "api://m/subject-control-escolar";

export const alumnos_pages: KirletPageDecl[] = [
  {
    id: "control-escolar.alumnos",
    path: "alumnos",
    permission: "subject.control-escolar.alumnos.read",
    build: () =>
      build_feature_shell_page({
        id: "control-escolar.alumnos",
        owner: "subject-control-escolar",
        title: "Alumnos",
        props: {
          basePath: "alumnos",
          idKey: "id",
          nameKey: "name",
          view: {
            title: "Alumnos",
            subtitle: "Submenú de control-escolar",
            pluralLabel: "alumnos",
            singularLabel: "alumnos",
            emptyTitle: "Sin registros",
            emptyDescription: "Migra desde Mongo o crea el primero",
          },
          data: {
            list: `${API}/alumnos`,
            record: `${API}/alumnos/:id`,
            create: { method: "POST", action: `${API}/alumnos` },
            update: { method: "PATCH", action: `${API}/alumnos/:id` },
            delete: { method: "DELETE", action: `${API}/alumnos/:id` },
          },
          table: {
            columns: [
              { key: "name", label: "Nombre", sortable: true, priority: 1 },
              { key: "is_active", label: "Activo", sortable: true, priority: 2 },
              { key: "ref", label: "Ref", sortable: true, priority: 3 },
              { key: "user_id", label: "user id", sortable: true, priority: 3 },
              { key: "grupo_id", label: "grupo id", sortable: true, priority: 3 },
              { key: "numero_lista", label: "numero lista", sortable: true, priority: 3 },
              { key: "email_contacto", label: "email contacto", sortable: true, priority: 3 },
              { key: "telefono_contacto", label: "telefono contacto", sortable: true, priority: 3 },
            ],
            fillHeight: true,
            serverQuery: true,
          },
          form: {
            fields: [
              { name: "name", component: "input-text", label: "Nombre", required: true },
              { name: "description", component: "input-text", label: "Descripción" },
              { name: "ref", component: "input-text", label: "Referencia (_ref)" },
              { name: "user_id", component: "input-text", label: "user id" },
              { name: "grupo_id", component: "input-text", label: "grupo id" },
              { name: "numero_lista", component: "input-number", label: "numero lista" },
              { name: "email_contacto", component: "input-text", label: "email contacto" },
              { name: "telefono_contacto", component: "input-text", label: "telefono contacto" },
            ],
          },
        },
      }),
  },
];
