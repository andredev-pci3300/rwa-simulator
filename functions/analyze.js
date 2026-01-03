export async function onRequestPost(context) {
    const { env, request } = context;

    try {
        const data = await request.json();
        const { type, value, yield: assetYield, term } = data;

        // 1. Verificação de Segurança (Onde o erro estava ocorrendo)
        if (!env.GEMINI_API_KEY) {
            return new Response(JSON.stringify({ 
                error: "A variável GEMINI_API_KEY não foi detectada. Verifique os Secrets na Cloudflare." 
            }), { status: 500, headers: { "Content-Type": "application/json" } });
        }

        // 2. Chamada para a API do Google (Modelo 2.5 Flash)
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
        
        const prompt = `Atue como analista sênior da BWB. Analise este ativo RWA: ${type}, R$ ${value}, yield de ${assetYield}% em ${term} meses. Seja executivo e direto.`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error.message);

        const aiText = result.candidates[0].content.parts[0].text;

        // 3. Salvar no Banco D1 (Binding configurado como 'DB')
        try {
            await env.DB.prepare(
                "INSERT INTO simulations (type, value, yield, term, analysis) VALUES (?, ?, ?, ?, ?)"
            ).bind(type, value, assetYield, term, aiText).run();
        } catch (dbError) {
            console.error("Erro ao gravar no D1:", dbError.message);
        }

        return new Response(JSON.stringify({ analysis: aiText }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}