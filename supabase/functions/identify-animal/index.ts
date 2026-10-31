import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { image } = await req.json();
    if (!image || typeof image !== "string" || !image.startsWith("data:image/")) return json({ error: "Envie uma foto válida." }, 400);
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ error: "IA não configurada." }, 500);

    const auth = req.headers.get("Authorization") ?? "";
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: comFoto } = await db.from("animais").select("id, nome, brinco, foto_url").not("foto_url", "is", null).eq("status", "ativo").limit(20);
    const refs = comFoto ?? [];

    const content: any[] = [
      { type: "text", text: `Foto tirada na fazenda (primeira imagem). Leia o número do brinco se visível, descreva pelagem/manchas/sexo aparente.${refs.length ? ` Depois compare com as ${refs.length} fotos de referência a seguir, cada uma precedida pelo ID do animal, e indique as mais parecidas.` : " Não há fotos de referência cadastradas."}` },
      { type: "image_url", image_url: { url: image } },
    ];
    refs.forEach((r) => { content.push({ type: "text", text: `ID ${r.id}` }); content.push({ type: "image_url", image_url: { url: r.foto_url } }); });

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: "Você identifica bovinos leiteiros (Gir, Girolando, Holandês) em fotos de fazenda. Seja honesto sobre incerteza." }, { role: "user", content }],
        tools: [{ type: "function", function: { name: "resultado", parameters: { type: "object", additionalProperties: false, required: ["brinco_lido", "descricao", "candidatos"], properties: {
          brinco_lido: { type: ["string", "null"], description: "Número/código do brinco lido na foto, ou null" },
          descricao: { type: "string", description: "Descrição curta do animal em português" },
          candidatos: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "confianca", "motivo"], properties: { id: { type: "string" }, confianca: { type: "number", description: "0 a 100" }, motivo: { type: "string" } } } },
        } } } }],
        tool_choice: { type: "function", function: { name: "resultado" } },
      }),
    });
    if (res.status === 429) return json({ error: "Muitas requisições, tente de novo em alguns segundos." }, 429);
    if (res.status === 402) return json({ error: "Créditos de IA esgotados. Adicione créditos em Configurações → Planos." }, 402);
    if (!res.ok) { console.error(res.status, await res.text()); return json({ error: "A IA não conseguiu analisar a foto." }, 502); }
    const data = await res.json();
    const args = JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}");

    const ids = new Map<string, { confianca: number; motivo: string }>();
    (args.candidatos ?? []).forEach((c: any) => { if (refs.some((r) => r.id === c.id)) ids.set(c.id, { confianca: c.confianca, motivo: c.motivo }); });
    const brinco = (args.brinco_lido ?? "").toString().trim();
    if (brinco) {
      const digits = brinco.replace(/\D/g, "");
      const { data: porBrinco } = await db.from("animais").select("id").or(`brinco.eq.${brinco},brinco.ilike.%${digits || brinco}%`).limit(5);
      (porBrinco ?? []).forEach((r) => ids.set(r.id, { confianca: 95, motivo: `Brinco ${brinco} lido na foto` }));
    }
    const lista = [...ids.keys()];
    const { data: animais } = lista.length ? await db.from("animais").select("id, nome, brinco, rgd, foto_url, tipo, status").in("id", lista) : { data: [] };
    const matches = (animais ?? []).map((a) => ({ ...a, ...ids.get(a.id)! })).sort((a, b) => b.confianca - a.confianca);
    return json({ brinco_lido: brinco || null, descricao: args.descricao ?? "", referencias: refs.length, matches });
  } catch (e) {
    console.error(e);
    return json({ error: "Erro ao identificar o animal." }, 500);
  }
});
