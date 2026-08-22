import {
  build_feature_shell_page,
  type KirletPageDecl,
} from "@opus-perpetuus/imperium-core-kit";

const API = "api://m/subject-control-escolar";

export const grados_escolares_pages: KirletPageDecl[] = [
  {
    id: "control-escolar.grados-escolares",
    path: "grados-escolares",
    permission: "subject.control-escolar.grados-escolares.read",
    build: () =>
      build_feature_shell_page({
        id: "control-escolar.grados-escolares",
        owner: "subject-control-escolar",
        title: "Grados escolares",
        props: {
          basePath: "grados-escolares",
          idKey: "id",
          nameKey: "name",
          view: {
            title: "Grados escolares",
            subtitle: "Submenú de control-escolar",
            pluralLabel: "grados escolares",
            singularLabel: "grados escolares",
            emptyTitle: "Sin registros",
            emptyDescription: "Migra desde Mongo o crea el primero",
          },
          data: {
            list: `${API}/grados-escolares`,
            record: `${API}/grados-escolares/:id`,
            create: { method: "POST", action: `${API}/grados-escolares` },
            update: { method: "PATCH", action: `${API}/grados-escolares/:id` },
            delete: { method: "DELETE", action: `${API}/grados-escolares/:id` },
          },
          table: {
            columns: [
              { key: "name", label: "Nombre", sortable: true, priority: 1 },
              { key: "is_active", label: "Activo", sortable: true, priority: 2 },
              { key: "ref", label: "Ref", sortable: true, priority: 3 },
              { key: "clave", label: "clave", sortable: true, priority: 3 },
              { key: "nivel_orden", label: "nivel orden", sortable: true, priority: 3 },
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
              { name: "nivel_orden", component: "input-number", label: "nivel orden" },
            ],
          },
        },
      }),
  },
];
