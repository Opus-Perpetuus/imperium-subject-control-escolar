import {
  build_feature_shell_page,
  type KirletPageDecl,
} from "@opus-perpetuus/imperium-core-kit";

const API = "api://m/subject-control-escolar";

export const ciclos_escolares_pages: KirletPageDecl[] = [
  {
    id: "control-escolar.ciclos-escolares",
    path: "ciclos-escolares",
    permission: "subject.control-escolar.ciclos-escolares.read",
    build: () =>
      build_feature_shell_page({
        id: "control-escolar.ciclos-escolares",
        owner: "subject-control-escolar",
        title: "Ciclos escolares",
        props: {
          basePath: "ciclos-escolares",
          idKey: "id",
          nameKey: "name",
          view: {
            title: "Ciclos escolares",
            subtitle: "Submenú de control-escolar",
            pluralLabel: "ciclos escolares",
            singularLabel: "ciclos escolares",
            emptyTitle: "Sin registros",
            emptyDescription: "Migra desde Mongo o crea el primero",
          },
          data: {
            list: `${API}/ciclos-escolares`,
            record: `${API}/ciclos-escolares/:id`,
            create: { method: "POST", action: `${API}/ciclos-escolares` },
            update: { method: "PATCH", action: `${API}/ciclos-escolares/:id` },
            delete: { method: "DELETE", action: `${API}/ciclos-escolares/:id` },
          },
          table: {
            columns: [
              { key: "name", label: "Nombre", sortable: true, priority: 1 },
              { key: "is_active", label: "Activo", sortable: true, priority: 2 },
              { key: "ref", label: "Ref", sortable: true, priority: 3 },
              { key: "fecha_inicio", label: "fecha inicio", sortable: true, priority: 3 },
              { key: "fecha_fin", label: "fecha fin", sortable: true, priority: 3 },
              { key: "ciclo_actual", label: "ciclo actual", sortable: true, priority: 3 },
            ],
            fillHeight: true,
            serverQuery: true,
          },
          form: {
            fields: [
              { name: "name", component: "input-text", label: "Nombre", required: true },
              { name: "description", component: "input-text", label: "Descripción" },
              { name: "ref", component: "input-text", label: "Referencia (_ref)" },
              { name: "fecha_inicio", component: "input-text", label: "fecha inicio" },
              { name: "fecha_fin", component: "input-text", label: "fecha fin" },
              { name: "ciclo_actual", component: "input-checkbox", label: "ciclo actual" },
            ],
          },
        },
      }),
  },
];
