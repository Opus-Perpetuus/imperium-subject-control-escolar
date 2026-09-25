import type { KirletDataClient, NoxServices } from "@opus-perpetuus/imperium-core-kit";
import { new_id, now_iso } from "@opus-perpetuus/imperium-core-kit";

/**
 * Tipos de incidencia de partida, tomados de las categorías de faltas del
 * marco de convivencia escolar de la SEP más un reconocimiento positivo. Cada
 * escuela los edita o desactiva desde el catálogo.
 */
const TIPOS_INCIDENCIA = [
  { name: "Retardo", categoria: "negativa", severidad: "leve" },
  { name: "Falta de material o tarea", categoria: "negativa", severidad: "leve" },
  { name: "Uniforme o presentación", categoria: "negativa", severidad: "leve" },
  { name: "Indisciplina en clase", categoria: "negativa", severidad: "leve" },
  { name: "Conducta que perturba el orden", categoria: "negativa", severidad: "grave" },
  { name: "Falta de respeto o discriminación", categoria: "negativa", severidad: "grave" },
  { name: "Agresión física o verbal", categoria: "negativa", severidad: "muy_grave" },
  { name: "Conducta que pone en peligro", categoria: "negativa", severidad: "muy_grave" },
  { name: "Salud o accidente", categoria: "neutral", severidad: "leve" },
  { name: "Reconocimiento positivo", categoria: "positiva", severidad: "leve" },
] as const;

/**
 * Siembra los tipos solo si la tabla nunca tuvo ninguno: si la escuela los
 * desactivó todos, se respeta.
 */
export async function sembrar_tipos_incidencia(data: KirletDataClient): Promise<void> {
  const n = await data.count("tipos_incidencia");
  if (n > 0) return;
  const ts = now_iso();
  await data.batch(
    TIPOS_INCIDENCIA.map((tipo, i) => ({
      op: "insert",
      table: "tipos_incidencia",
      row: {
        id: new_id("tipo-inc"),
        ...tipo,
        orden: i + 1,
        is_active: true,
        search_field: tipo.name.toLowerCase(),
        created_at: ts,
        updated_at: ts,
      },
    })),
  );
}

export async function seed_demo(ctx: {
  data: KirletDataClient;
  nox: NoxServices;
  technical_id: string;
}): Promise<void> {
  await sembrar_tipos_incidencia(ctx.data);
}
