import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um sistema de OCR para notas fiscais de fazenda/agropecuária. 
Extraia os itens da nota fiscal e retorne APENAS usando a função fornecida.
Para cada item, identifique:
- nome do produto
- quantidade
- unidade (kg, L, un, saco, etc)
- valor_unitario (preço por unidade)
- valor_total
- categoria: uma de [Ração, Medicamento, Suplemento, Fertilizante, Semente, Combustível, Peça, Material, Outro]
- centro_custo: sugira o centro de custo mais adequado entre [Ração, Medicamento, Veterinário, Plantio, Combustível, Manutenção, Equipamento, Outros]
- compoe_nutricao: true se o item é ração, silagem, sal mineral, suplemento ou ingrediente de trato animal

Também extraia:
- fornecedor: nome do fornecedor/vendedor se visível
- data_nota: data da nota fiscal no formato YYYY-MM-DD
- numero_nota: número da nota se visível`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
              {
                type: "text",
                text: "Extraia todos os itens desta nota fiscal.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "registrar_nota_fiscal",
              description: "Registra os itens extraídos de uma nota fiscal",
              parameters: {
                type: "object",
                properties: {
                  fornecedor: { type: "string" },
                  data_nota: { type: "string" },
                  numero_nota: { type: "string" },
                  itens: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        nome: { type: "string" },
                        quantidade: { type: "number" },
                        unidade: { type: "string" },
                        valor_unitario: { type: "number" },
                        valor_total: { type: "number" },
                        categoria: { type: "string" },
                        centro_custo: { type: "string" },
                        compoe_nutricao: { type: "boolean" },
                      },
                      required: ["nome", "quantidade", "unidade", "valor_total", "categoria"],
                    },
                  },
                },
                required: ["itens"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "registrar_nota_fiscal" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao processar imagem" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Não foi possível extrair dados da nota" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-invoice error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
