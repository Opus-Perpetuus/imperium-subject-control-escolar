import {
  build_feature_shell_page,
  type KirletPageDecl,
} from "@opus-perpetuus/imperium-core-kit";

const API = "api://m/subject-control-escolar";

export const periodos_examen_pages: KirletPageDecl[] = [
  {
    id: "control-escolar.periodos-examen",
    path: "periodos-examen",
    permission: "subject.control-escolar.periodos-examen.read",
    build: () =>
      build_feature_shell_page({
        id: "control-escolar.periodos-examen",
        owner: "subject-control-escolar",
        title: "Periodos de exámenes",
        props: {
          basePath: "periodos-examen",
          idKey: "id",
          nameKey: "name",
          view: {
            title: "Periodos de exámenes",
            subtitle: "Bimestres, trimestres o parciales del ciclo escolar",
            pluralLabel: "periodos de exámenes",
            singularLabel: "periodo de exámenes",
            emptyTitle: "Sin periodos de exámenes",
            emptyDescription: "Crea el primer periodo para agrupar los exámenes del ciclo",
          },
          data: {
            list: `${API}/periodos-examen`,
            record: `${API}/periodos-examen/:id`,
            create: { method: "POST", action: `${API}/periodos-examen` },
            update: { method: "PATCH", action: `${API}/periodos-examen/:id` },
            delete: { method: "DELETE", action: `${API}/periodos-examen/:id` },
          },
          table: {
            columns: [
              { key: "name", label: "Nombre", sortable: true, priority: 1 },
              { key: "fecha_inicio", label: "Inicio", sortable: true, priority: 2 },
              { key: "fecha_fin", label: "Fin", sortable: true, priority: 2 },
              { key: "is_active", label: "Activo", sortable: true, priority: 3 },
            ],
            fillHeight: true,
            serverQuery: true,
          },
          form: {
            fields: [
              { name: "name", component: "input-text", label: "Nombre", required: true, placeholder: "Primer bimestre" },
              {
                name: "ciclo_escolar_id",
                component: "input-datalist",
                label: "Ciclo escolar",
                optionsSource: `${API}/ciclos-escolares?as=options&limite=1000`,
              },
              {
                name: "escuela_id",
                component: "input-datalist",
                label: "Escuela",
                optionsSource: `${API}/escuelas?as=options&limite=1000`,
              },
              { name: "fecha_inicio", component: "input-date", label: "Inicio" },
              { name: "fecha_fin", component: "input-date", label: "Fin" },
              { name: "description", component: "input-textarea", label: "Notas", column_span: "full" },
            ],
          },
        },
      }),
  },
];
