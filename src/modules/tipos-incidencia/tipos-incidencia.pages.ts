import {
  build_feature_shell_page,
  type KirletPageDecl,
} from "@opus-perpetuus/imperium-core-kit";
import { general_option_list_options_source } from "../../general-option-seeds.ts";

const API = "api://m/subject-control-escolar";

export const tipos_incidencia_pages: KirletPageDecl[] = [
  {
    id: "control-escolar.tipos-incidencia",
    path: "tipos-incidencia",
    permission: "subject.control-escolar.tipos-incidencia.read",
    build: () =>
      build_feature_shell_page({
        id: "control-escolar.tipos-incidencia",
        owner: "subject-control-escolar",
        title: "Tipos de incidencia",
        props: {
          basePath: "tipos-incidencia",
          idKey: "id",
          nameKey: "name",
          view: {
            title: "Tipos de incidencia",
            subtitle: "Catálogo que se elige al registrar una incidencia",
            pluralLabel: "tipos de incidencia",
            singularLabel: "tipo de incidencia",
            emptyTitle: "Sin tipos de incidencia",
            emptyDescription: "Crea los tipos que usarán los docentes al registrar incidencias",
          },
          data: {
            list: `${API}/tipos-incidencia`,
            record: `${API}/tipos-incidencia/:id`,
            create: { method: "POST", action: `${API}/tipos-incidencia` },
            update: { method: "PATCH", action: `${API}/tipos-incidencia/:id` },
            delete: { method: "DELETE", action: `${API}/tipos-incidencia/:id` },
          },
          table: {
            columns: [
              { key: "name", label: "Nombre", sortable: true, priority: 1 },
              { key: "categoria", label: "Categoría", sortable: true, priority: 2 },
              { key: "severidad", label: "Severidad", sortable: true, priority: 2 },
              { key: "orden", label: "Orden", sortable: true, priority: 3 },
              { key: "is_active", label: "Activo", sortable: true, priority: 3 },
            ],
            fillHeight: true,
            serverQuery: true,
          },
          form: {
            fields: [
              { name: "name", component: "input-text", label: "Nombre", required: true },
              {
                name: "categoria",
                component: "input-radio-buttons",
                label: "Categoría",
                required: true,
                // Opciones: general-option-list-control (seed en general-option-seeds.ts).
                optionsSource: general_option_list_options_source(
                  "subject-control-escolar/tipos-incidencia",
                  "categoria",
                ),
              },
              {
                name: "severidad",
                component: "input-radio-buttons",
                label: "Severidad",
                required: true,
                // Opciones: general-option-list-control (seed en general-option-seeds.ts).
                optionsSource: general_option_list_options_source(
                  "subject-control-escolar/tipos-incidencia",
                  "severidad",
                ),
              },
              { name: "orden", component: "input-number", label: "Orden en la pantalla", min: 0 },
              {
                name: "description",
                component: "input-textarea",
                label: "Medidas sugeridas",
                column_span: "full",
              },
            ],
          },
        },
      }),
  },
];
