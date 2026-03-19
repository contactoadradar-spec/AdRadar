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

    // Extract the user message from Anthropic format
    const userMsg = body.messages?.find(m => m.role === "user")?.content || "";

    const GEMINI_KEY = env.GEMINI_KEY || "AIzaSyD2i2npM4gNVglnK_n_1wPsNdwmQGTNB8c";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

    const geminiBody = {
      contents: [{
        parts: [{ text: userMsg }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain"
      }
    };

    const res  = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({
        error: { message: data.error?.message || "Error Gemini " + res.status }
      }), { status: res.status, headers: h });
    }

    // Convert Gemini response to Anthropic format (what the frontend expects)
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const anthropicFormat = {
      content: [{ type: "text", text }],
      stop_reason: "end_turn"
    };

    return new Response(JSON.stringify(anthropicFormat), { headers: h });

  } catch(e) {
    return new Response(JSON.stringify({ error: { message: e.message } }), { status: 500, headers: h });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
