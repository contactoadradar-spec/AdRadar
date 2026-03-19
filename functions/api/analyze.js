// Proxy usando Google Gemini API (gratis)
export async function onRequestPost(context) {
  const { request, env } = context;
  const h = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") return new Response(null, { headers: h });

  try {
    const body = await request.json();

    // Extraer el mensaje del usuario del formato Anthropic
    const userMsg = body.messages?.find(m => m.role === "user")?.content || "";

    const GEMINI_KEY = env.GEMINI_KEY || "TU_KEY_AQUI";
    
    // CAMBIO AQUÍ: Usamos /v1/ y nos aseguramos de que el nombre del modelo sea correcto
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

    const geminiBody = {
      contents: [{
        parts: [{ text: userMsg }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        // Eliminamos responseMimeType a menos que sea estrictamente necesario, 
        // a veces causa conflictos en llamadas simples
      }
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({
        error: { message: data.error?.message || "Error en Gemini API: " + res.status }
      }), { status: res.status, headers: h });
    }

    // Convertir respuesta de Gemini al formato Anthropic que espera tu frontend
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    const anthropicFormat = {
      id: `msg_${Date.now()}`,
      type: "message",
      role: "assistant",
      model: "gemini-1.5-flash",
      content: [{ type: "text", text: text }],
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: { input_tokens: 0, output_tokens: 0 } // Gemini entrega esto, podrías mapearlo si quieres
    };

    return new Response(JSON.stringify(anthropicFormat), { headers: h });

  } catch(e) {
    return new Response(JSON.stringify({ error: { message: e.message } }), { status: 500, headers: h });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
