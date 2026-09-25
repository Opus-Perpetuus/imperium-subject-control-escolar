import { now_iso, type KirletPageDecl } from "@opus-perpetuus/imperium-core-kit";
import { texto } from "../../lib/escolar.ts";
import { armar_reporte, descriptor_invalido, descriptor_reporte } from "../../lib/reporte.ts";

/**
 * Ruta del sitio público de la app (`/app/<slug>`): es la única página
 * pública, así que el lanzador la monta en la raíz y el token viaja en `?t=`.
 */
export const RUTA_PUBLICA = "/app/control-escolar";

const ID = "control-escolar.compartido";

export const enlaces_compartidos_pages: KirletPageDecl[] = [
  {
    id: ID,
    path: "compartido",
    public_access: "anonymous",
    public_segment: "compartido",
    public_label: "Documento compartido",
    build: async ({ url, data }) => {
      const token = texto(url?.searchParams.get("t"));
      const enlace = token ? await data.findOne("enlaces_compartidos", { token }) : null;
      const ahora = now_iso();
      const vigente =
        !!enlace && enlace.is_active !== false && (!enlace.expira_at || texto(enlace.expira_at) > ahora);
      if (!enlace || !vigente) {
        return { id: ID, owner: "subject-control-escolar", title: "Documento compartido", page: descriptor_invalido() };
      }
      await data.update(
        "enlaces_compartidos",
        { id: String(enlace.id) },
        { vistas: Number(enlace.vistas ?? 0) + 1, ultima_vista_at: ahora },
      );
      const reporte = await armar_reporte(data, enlace);
      return {
        id: ID,
        owner: "subject-control-escolar",
        title: reporte.tipo === "incidencia" ? "Aviso de incidencia" : reporte.titulo || "Reporte escolar",
        page: descriptor_reporte(reporte),
      };
    },
  },
];
