import {
  build_feature_shell_page,
  type KirletPageDecl,
} from "@opus-perpetuus/imperium-core-kit";

const API = "api://m/subject-control-escolar";

export const escuelas_pages: KirletPageDecl[] = [
  {
    id: "control-escolar.escuelas",
    path: "escuelas",
    permission: "subject.control-escolar.escuelas.read",
    build: () =>
      build_feature_shell_page({
        id: "control-escolar.escuelas",
        owner: "subject-control-escolar",
        title: "Escuelas",
        props: {
          basePath: "escuelas",
          idKey: "id",
          nameKey: "name",
          view: {
            title: "Escuelas",
            subtitle: "Submenú de control-escolar",
            pluralLabel: "escuelas",
            singularLabel: "escuelas",
            emptyTitle: "Sin registros",
            emptyDescription: "Migra desde Mongo o crea el primero",
          },
          data: {
            list: `${API}/escuelas`,
            record: `${API}/escuelas/:id`,
            create: { method: "POST", action: `${API}/escuelas` },
            update: { method: "PATCH", action: `${API}/escuelas/:id` },
            delete: { method: "DELETE", action: `${API}/escuelas/:id` },
          },
          table: {
            columns: [
              { key: "name", label: "Nombre", sortable: true, priority: 1 },
              { key: "is_active", label: "Activo", sortable: true, priority: 2 },
              { key: "ref", label: "Ref", sortable: true, priority: 3 },
              { key: "clave", label: "clave", sortable: true, priority: 3 },
              { key: "direccion", label: "direccion", sortable: true, priority: 3 },
              { key: "telefono", label: "telefono", sortable: true, priority: 3 },
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
              { name: "direccion", component: "input-text", label: "direccion" },
              { name: "telefono", component: "input-text", label: "telefono" },
            ],
          },
        },
      }),
  },
];
