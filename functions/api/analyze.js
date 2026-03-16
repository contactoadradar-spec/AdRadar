// Proxy seguro para Anthropic API con web search tool
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

    // Agregar web_search tool si no viene en el body
    if (!body.tools) {
      body.tools = [{
        type: "web_search_20250305",
        name: "web_search"
      }];
    }

    const res  = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":        "application/json",
        "anthropic-version":   "2023-06-01",
        "anthropic-beta":      "web-search-2025-03-05",
        "x-api-key":           env.ANTHROPIC_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: h });

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
