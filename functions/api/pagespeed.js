export async function onRequestGet(context) {
  const { request, env } = context;
  const url  = new URL(request.url);
  const site = url.searchParams.get("url");
  const h    = { "Content-Type":"application/json","Access-Control-Allow-Origin":"*" };
  if (!site) return new Response(JSON.stringify({error:"Falta url"}),{status:400,headers:h});
  try {
    const key = env.PAGESPEED_KEY || "AIzaSyCUrPVgi_N5vfaCPMDhN5sJ_wXNeFrkatQ";
    const api = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(site)}&strategy=mobile&key=${key}&category=PERFORMANCE&category=SEO`;
    const res  = await fetch(api);
    const data = await res.json();
    if (!res.ok) return new Response(JSON.stringify({error:data.error?.message||"Error PageSpeed"}),{status:res.status,headers:h});
    const lr    = data.lighthouseResult;
    const score = Math.round((lr?.categories?.performance?.score||0)*100);
    const seo   = Math.round((lr?.categories?.seo?.score||0)*100);
    return new Response(JSON.stringify({
      url:site,score,seo,
      lcp:lr?.audits?.["largest-contentful-paint"]?.displayValue||"—",
      tbt:lr?.audits?.["total-blocking-time"]?.displayValue||"—",
      cls:lr?.audits?.["cumulative-layout-shift"]?.displayValue||"—",
      label:score>=90?"Rápida":score>=50?"Media":"Lenta",
      color:score>=90?"#3ecf8e":score>=50?"#c8a96e":"#f56565",
    }),{headers:h});
  } catch(e) {
    return new Response(JSON.stringify({error:e.message}),{status:500,headers:h});
  }
}
export async function onRequestOptions() {
  return new Response(null,{headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,OPTIONS"}});
}
