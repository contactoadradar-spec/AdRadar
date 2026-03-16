// Email alerts via Cloudflare Email Workers
export async function onRequestPost(context) {
  const { request, env } = context;
  const h = { "Content-Type":"application/json","Access-Control-Allow-Origin":"*" };

  try {
    const body = await request.json();
    const { to, subject, brand, changes } = body;
    if (!to || !subject) return new Response(JSON.stringify({error:"Falta to o subject"}),{status:400,headers:h});

    const html = `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="font-family:sans-serif;background:#f4f5f7;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="background:#0a0b0f;padding:24px 32px">
      <div style="font-weight:800;font-size:20px;color:#fff">Ad<span style="color:#4f7fff">Radar</span></div>
    </div>
    <div style="padding:32px">
      <h2 style="color:#111;font-size:18px;margin:0 0 8px">Alerta de cambio detectado</h2>
      <p style="color:#666;font-size:14px;margin:0 0 24px">Hemos detectado cambios en la presencia digital de <strong>${brand}</strong>.</p>
      ${changes.map(c => `
      <div style="background:#f8f9fa;border-left:4px solid #4f7fff;border-radius:4px;padding:14px 16px;margin-bottom:12px">
        <div style="font-weight:700;font-size:13px;color:#111;margin-bottom:4px">${c.title}</div>
        <div style="font-size:13px;color:#555">${c.description}</div>
      </div>`).join("")}
      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #eee;text-align:center">
        <a href="https://adradar.cl" style="display:inline-block;background:#4f7fff;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Ver en AdRadar →</a>
      </div>
    </div>
    <div style="background:#f8f9fa;padding:16px 32px;text-align:center">
      <p style="font-size:11px;color:#999;margin:0">AdRadar · Inteligencia competitiva para tu marca · <a href="https://adradar.cl" style="color:#4f7fff">adradar.cl</a></p>
    </div>
  </div>
</body></html>`;

    // Usar Cloudflare Email Workers (requiere configuración en dashboard)
    if (env.EMAIL_FROM && typeof env.EMAIL !== "undefined") {
      const msg = {
        from:    { email: env.EMAIL_FROM || "alertas@adradar.cl", name: "AdRadar" },
        to:      [{ email: to }],
        subject: subject,
        content: [{ type:"text/html", value: html }]
      };
      await env.EMAIL.send(msg);
      return new Response(JSON.stringify({ok:true, sent_to: to}),{headers:h});
    }

    // Fallback: loggear que se enviaría el email (hasta configurar Email Workers)
    console.log("EMAIL_PENDING", { to, subject, brand });
    return new Response(JSON.stringify({ok:true, pending:true, message:"Email pendiente de configuración en Cloudflare"}),{headers:h});

  } catch(e) {
    return new Response(JSON.stringify({error:e.message}),{status:500,headers:h});
  }
}

export async function onRequestOptions() {
  return new Response(null,{headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS"}});
}
