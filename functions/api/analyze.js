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
    const body   = await request.json();
    const prompt = body.messages?.[0]?.content || "";
    const key    = env.GROQ_KEY;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 8192,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: { message: data.error?.message || "Error Groq" } }), { status: res.status, headers: h });
    }

    const text = data.choices?.[0]?.message?.content || "";

    // Anthropic-compatible format so frontend works without changes
    return new Response(JSON.stringify({
      content: [{ type: "text", text }]
    }), { headers: h });

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
