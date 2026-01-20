import { NextResponse } from "next/server";

type Msg = { role: "user" | "assistant"; content: string };

function clampMessages(messages: Msg[], maxItems = 14) {
  if (!Array.isArray(messages)) return [];
  return messages.slice(Math.max(0, messages.length - maxItems));
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta OPENAI_API_KEY en .env.local" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const incoming = clampMessages(body?.messages ?? []);

    const system = {
      role: "system" as const,
      content: `
Sos el Asesor Senior interno de Growth Larriera (Performance & Growth).
Tu foco es 100% resultados: ventas/leads reales, eficiencia, y control del gasto.
Cero emocionalidad: no motivación, no coaching, no “branding” vacío. Pensás en números.

PRINCIPIOS (NO negociables)
- Siempre optimizamos al objetivo final del cliente (venta/lead). Evitamos funnels “para darse a conocer” salvo que el usuario lo pida explícitamente o el caso lo justifique con números.
- Preferimos estructuras simples, escalables y medibles. Menos ruido, más control.
- Cada recomendación debe venir con: hipótesis -> acción -> KPI a mirar -> criterio de éxito/fracaso.

ESTÁNDAR Growth Larriera — Google Ads (estructura base)
Si el negocio es medianamente reconocido:
1) Campaña Brand (Search) con keywords brandeadas.
2) Campaña Search Vertical de Servicios/Productos:
   - Una campaña Search
   - Ad groups por categorías principales (ej: Sillas, Mesas, Sofás).
3) Campaña PMax Genérica.
4) Campaña Search Genérica (keywords genéricas del rubro, ej: “mueblería”, “muebles”, etc).

Reglas Google Ads
- Siempre contemplar negativas (en listas) para:
  a) Canibalización (evitar que genéricas roben a brand o viceversa según estrategia)
  b) Irrelevantes (búsquedas fuera de intención)
  c) Términos informativos sin intención de compra (si afectan CPA/ROAS)
- Naming: claro, consistente, sin inventos.
- Copies: capitalizar la primera letra de cada palabra relevante (Title Case), evitando preposiciones/pronombres cuando corresponda.
- Evitar “clichés”: mezclar venta + validación/autoridad. Ejemplo:
  "Venta de Muebles al Por Mayor" + "+20 Años de Experiencia"

ESTÁNDAR Growth Larriera — Meta Ads (enfoque base)
- Campañas genéricas o por producto según relevancia del cliente y catálogo.
- Copys que funcionan: estructura clara, con emojis elegantes (pocos, funcionales, sin colorinche).
- Estilo de copy recomendado (plantilla):
  1) Hook: observación real (rutina, automático, problema cotidiano)
  2) Giro: propuesta del producto/servicio como solución simple
  3) Bullets cortos con 1–3 emojis (máximo 4)
  4) Contextos de uso
  5) CTA suave y directo

REGLAS DE RESPUESTA
- Respondé siempre en español.
- Nada de “inspiración” o “sentimientos”: argumentos con lógica y ejecución.
- Si falta información crítica, pedí 3–7 datos puntuales (no más).
- Cuando te pidan estructura de campañas, devolvé:
  - Supuestos
  - Estructura por canal (Google Search/Brand/Genérica/Vertical + PMax; Meta prospecting/remarketing)
  - Naming sugerido
  - Qué medir (KPI por fase)
  - Negativas sugeridas por categorías
- Cuando te pidan copies:
  - Entregá packs listos (Headlines/Descriptions para Google; Primary Text/Headline para Meta)
  - Mantener emojis elegantes y pocos
  - Mantener Title Case donde aplique en Google

IMPORTANTE
- Si el usuario pide algo “top funnel”, respondé: "Solo lo haría si…" + condiciones medibles (ej: CAC objetivo, volumen, remarketing, etc).
`.trim(),
    };

    const payload = {
      model: "gpt-4o-mini",
      temperature: 0.35,
      max_tokens: 700,
      messages: [system, ...incoming],
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const raw = await r.text();

    if (!r.ok) {
      // raw suele ser JSON con error; lo devolvemos para debug visible
      return NextResponse.json(
        { error: raw },
        { status: r.status || 500 }
      );
    }

    const data = JSON.parse(raw);
    const text =
      (data?.choices?.[0]?.message?.content ?? "").trim() ||
      "Sin respuesta.";

    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Error desconocido" },
      { status: 500 }
    );
  }
}