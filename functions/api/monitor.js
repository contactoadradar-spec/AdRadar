// Monitor de cambios web usando KV Storage de Cloudflare
// GET  /api/monitor?url=https://...&uid=user123  -> check current vs stored hash
// POST /api/monitor  body:{url, uid, email}       -> save snapshot

export async function onRequestGet(context) {
  const { request, env } = context;
  const url  = new URL(request.url);
  const site = url.searchParams.get("url");
  const uid  = url.searchParams.get("uid");
  const h    = { "Content-Type":"application/json","Access-Control-Allow-Origin":"*" };
  if (!site || !uid) return new Response(JSON.stringify({error:"Falta url o uid"}),{status:400,headers:h});

  try {
    // Fetch de la pagina actual
    const res  = await fetch(site, {headers:{"User-Agent":"Mozilla/5.0 (compatible; AdRadar/1.0)"}});
    const html = await res.text();

    // Hash simple del contenido (comparar con anterior)
    const encoder = new TextEncoder();
    const data    = encoder.encode(html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi,"").substring(0,50000));
    const hashBuf = await crypto.subtle.digest("SHA-256", data);
    const hash    = Array.from(new Uint8Array(hashBuf)).map(b=>b.toString(16).padStart(2,"0")).join("");

    const kvKey   = `monitor:${uid}:${btoa(site).substring(0,40)}`;
    const stored  = env.ADRADAR_KV ? await env.ADRADAR_KV.get(kvKey,"json") : null;

    let changed = false;
    let diff    = null;

    if (stored && stored.hash !== hash) {
      changed = true;
      diff    = {
        last_check:   stored.checked_at,
        current_check: new Date().toISOString(),
        message:       "El contenido del sitio ha cambiado desde la última revisión."
      };
    }

    // Guardar nuevo snapshot
    if (env.ADRADAR_KV) {
      await env.ADRADAR_KV.put(kvKey, JSON.stringify({hash, checked_at: new Date().toISOString(), url: site}), {expirationTtl: 86400*30});
    }

    // Extraer palabras clave de oferta
    const offerWords = ["descuento","oferta","cyber","liquidación","liquidacion","promoción","promocion","gratis","free","sale","off","rebaja"];
    const detected   = offerWords.filter(w => html.toLowerCase().includes(w));

    return new Response(JSON.stringify({
      url: site,
      changed,
      diff,
      hash,
      offer_keywords: detected,
      checked_at: new Date().toISOString()
    }),{headers:h});
  } catch(e) {
    return new Response(JSON.stringify({error:e.message}),{status:500,headers:h});
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const h = { "Content-Type":"application/json","Access-Control-Allow-Origin":"*" };
  try {
    const body = await request.json();
    const { url, uid, email } = body;
    if (!url || !uid) return new Response(JSON.stringify({error:"Falta url o uid"}),{status:400,headers:h});

    const alertKey = `alert:${uid}:${btoa(url).substring(0,40)}`;
    if (env.ADRADAR_KV) {
      await env.ADRADAR_KV.put(alertKey, JSON.stringify({url, uid, email, created_at: new Date().toISOString()}), {expirationTtl:86400*365});
    }
    return new Response(JSON.stringify({ok:true, message:"Monitor activado para " + url}),{headers:h});
  } catch(e) {
    return new Response(JSON.stringify({error:e.message}),{status:500,headers:h});
  }
}

export async function onRequestOptions() {
  return new Response(null,{headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS"}});
}
