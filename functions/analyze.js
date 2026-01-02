export async function onRequestPost(context) {
    const { env } = context;

    try {
        const data = await context.request.json();
        const { type, value, yield: assetYield, term } = data;

        if (!env.GEMINI_API_KEY) {
            throw new Error("Chave GEMINI_API_KEY não configurada.");
        }

        // 1. Chamada para o Gemini 2.5 Flash
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
        
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Analise este ativo RWA ${type} de R$ ${value} com yield de ${assetYield}% em ${term} meses. Seja breve.` }] }]
            })
        });

        const result = await response.json();
        const aiText = result.candidates[0].content.parts[0].text;

        // 2. SALVAR NO BANCO DE DADOS D1
        // O 'env.DB' vem do binding que você configurou no wrangler.toml
        try {
            await env.DB.prepare(`
                INSERT INTO simulations (type, value, yield, term, analysis)
                VALUES (?, ?, ?, ?, ?)
            `).bind(type, value, assetYield, term, aiText).run();
            console.log("✅ Simulação salva no banco D1.");
        } catch (dbError) {
            console.error("❌ Erro ao salvar no banco:", dbError.message);
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