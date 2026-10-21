import type { RiskBandName } from "@/lib/risk/engine";

type Narrative = {
  narrativa: string;
  factores: string[];
  acciones: string[];
  notificar: boolean;
  motivo: string;
};

function endpoint() {
  const base = (process.env.AI_BASE_URL || "").replace(/\/$/, "");
  const key = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  if (!base || !key || !model) throw new Error("La configuración de IA está incompleta.");
  return { base, key, model };
}

async function chat(messages: { role: "system" | "user"; content: string }[], json: boolean) {
  const { base, key, model } = endpoint();
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!response.ok) {
    throw new Error(`La IA respondió ${response.status}.`);
  }
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("La IA no devolvió contenido.");
  return content;
}

export async function narrateRisk(input: {
  nombre: string;
  programa: string;
  banda: RiskBandName;
  puntaje: number;
  factores: Record<string, number>;
  accionesBase: string[];
  actividadAula: string;
}) {
  const content = await chat(
    [
      {
        role: "system",
        content:
          "Eres el analista de permanencia de Aula 360. Respondes únicamente JSON con las claves narrativa, factores, acciones, notificar y motivo. narrativa es un párrafo en español, sin emojis y sin cifras distintas a las entregadas. factores y acciones son listas cortas de frases. notificar es booleano. En banda BAJO notificar es false. En banda CRITICO notificar es true. No digas que eres un modelo.",
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
    true,
  );
  const parsed = JSON.parse(content) as Partial<Narrative>;
  if (typeof parsed.narrativa !== "string" || typeof parsed.notificar !== "boolean") {
    throw new Error("La IA devolvió un JSON incompleto.");
  }
  return {
    narrativa: parsed.narrativa,
    factores: Array.isArray(parsed.factores) ? parsed.factores.map(String) : [],
    acciones: Array.isArray(parsed.acciones) ? parsed.acciones.map(String) : [],
    notificar: parsed.notificar,
    motivo: typeof parsed.motivo === "string" ? parsed.motivo : "",
  };
}

export async function replyToStudent(input: {
  nombre: string;
  mensaje: string;
  actividadAula: string;
  historial: string[];
}) {
  return chat(
    [
      {
        role: "system",
        content:
          "Eres el acompañamiento de Aula 360 por WhatsApp. Respondes en español, en menos de 70 palabras, sin emojis. Ayudas a retomar clases y entregas. No inventas notas, porcentajes ni el nivel de riesgo. Si preguntan por su riesgo, indicas que Bienestar lo revisa en el observatorio y que su docente puede continuar la conversación. No pides contraseñas ni datos bancarios.",
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
    false,
  );
}
