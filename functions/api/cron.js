// Cloudflare Cron Trigger — se ejecuta diariamente
// Configurar en Cloudflare Pages: Settings > Functions > Cron Triggers > "0 9 * * *"

export async function scheduled(event, env, ctx) {
  console.log("Cron ejecutado:", new Date().toISOString());

  if (!env.ADRADAR_KV) {
    console.log("KV no configurado, saltando cron");
    return;
  }

  // Listar todas las alertas registradas
  const list = await env.ADRADAR_KV.list({ prefix: "alert:" });

  for (const key of list.keys) {
    try {
      const alert = await env.ADRADAR_KV.get(key.name, "json");
      if (!alert) continue;

      // Verificar si cambió la web
      const monitorRes = await fetch(`https://adradar.cl/api/monitor?url=${encodeURIComponent(alert.url)}&uid=${alert.uid}`);
      const monitor    = await monitorRes.json();

      const changes = [];

      if (monitor.changed) {
        changes.push({
          title: "Cambio en sitio web detectado",
          description: `El sitio ${alert.url} ha modificado su contenido.`
        });
      }

      if (monitor.offer_keywords?.length > 0) {
        changes.push({
          title: "Palabras de oferta detectadas",
          description: `Se encontraron: ${monitor.offer_keywords.join(", ")}`
        });
      }

      // Enviar email si hay cambios y hay email configurado
      if (changes.length > 0 && alert.email) {
        await fetch("https://adradar.cl/api/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to:      alert.email,
            subject: `AdRadar: cambio detectado en ${alert.url}`,
            brand:   alert.url,
            changes
          })
        });
        console.log("Alerta enviada a", alert.email, "por", alert.url);
      }

    } catch(e) {
      console.error("Error procesando alerta", key.name, e.message);
    }
  }
}
