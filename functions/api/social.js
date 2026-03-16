// Scraping publico de perfiles sociales sin API key
export async function onRequestGet(context) {
  const { request } = context;
  const url    = new URL(request.url);
  const brand  = url.searchParams.get("brand");
  const h      = { "Content-Type":"application/json","Access-Control-Allow-Origin":"*" };
  if (!brand) return new Response(JSON.stringify({error:"Falta brand"}),{status:400,headers:h});

  try {
    // Buscar perfiles usando DuckDuckGo (no requiere API key)
    const query   = encodeURIComponent(`${brand} site:instagram.com OR site:facebook.com OR site:tiktok.com OR site:linkedin.com OR site:twitter.com`);
    const ddg     = await fetch(`https://html.duckduckgo.com/html/?q=${query}`,{
      headers:{"User-Agent":"Mozilla/5.0 (compatible; AdRadar/1.0)"}
    });
    const html    = await ddg.text();

    // Extraer URLs de redes sociales encontradas
    const patterns = {
      instagram: /instagram\.com\/([a-zA-Z0-9_.]+)/g,
      facebook:  /facebook\.com\/([a-zA-Z0-9_.]+)/g,
      tiktok:    /tiktok\.com\/@([a-zA-Z0-9_.]+)/g,
      linkedin:  /linkedin\.com\/company\/([a-zA-Z0-9_-]+)/g,
      twitter:   /(?:twitter|x)\.com\/([a-zA-Z0-9_]+)/g,
    };

    const profiles = {};
    for (const [net, re] of Object.entries(patterns)) {
      const matches = [...html.matchAll(re)];
      if (matches.length > 0) {
        const handle = matches[0][1];
        if (!["search","explore","reels","hashtag","p","stories"].includes(handle)) {
          profiles[net] = { handle, url: `https://${net === "twitter" ? "x" : net}.com/${net === "tiktok" ? "@" : ""}${handle}` };
        }
      }
    }

    return new Response(JSON.stringify({brand, profiles, found: Object.keys(profiles).length}),{headers:h});
  } catch(e) {
    return new Response(JSON.stringify({error:e.message}),{status:500,headers:h});
  }
}
export async function onRequestOptions() {
  return new Response(null,{headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,OPTIONS"}});
}
