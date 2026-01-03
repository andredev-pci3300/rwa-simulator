export async function onRequestPost(context) {
    const { env, request } = context;

    try {
        const data = await request.json();
        // Desestruturando os novos campos
        const { type, value, yield: assetYield, term, stage, collateral, useOfProceeds } = data;

        if (!env.GEMINI_API_KEY) {
            return new Response(JSON.stringify({ error: "Chave de API não configurada." }), { status: 500 });
        }

        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
        
        // --- O PROMPT MESTRE DA BWB ---
        const prompt = `
        Atue como o **Head de Estruturação e Risco da BWB (Blockchain Real World Assets)**. 
        Sua missão é validar a viabilidade de tokenização deste ativo com rigor institucional.
        
        DADOS DA OPERAÇÃO:
        - Ativo/Setor: ${type}
        - Valuation: R$ ${value}
        - Yield Oferta: ${assetYield}% a.a.
        - Prazo: ${term} meses
        - Maturidade do Projeto: ${stage}
        - Garantia (Colateral): ${collateral}
        - Destinação dos Recursos: ${useOfProceeds}

        DIRETRIZES DE ANÁLISE (Output em HTML):
        1. **BWB Score (0-100):** Dê uma nota de viabilidade baseada no trinômio Risco-Retorno-Garantia.
        2. **Análise de Estruturação:**
           - O Yield de ${assetYield}% é sustentável para um projeto ${stage}?
           - A garantia (${collateral}) cobre o risco de default? Seja crítico.
           - O uso de recursos para ${useOfProceeds} gera valor ou apenas cobre buracos?
        3. **Veredito Final:** "APROVADO PARA ESTRUTURAÇÃO", "APROVADO COM RESSALVAS" ou "REPROVADO".
        
        Formatação: Use <strong> para destaques, <ul> para listas e parágrafos curtos. Seja direto, técnico e executivo.
        `;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error.message);

        const aiText = result.candidates[0].content.parts[0].text;

        // Persistência no D1 com as novas colunas
        try {
            await env.DB.prepare(
                `INSERT INTO simulations (type, value, yield, term, project_stage, collateral, use_of_proceeds, analysis) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(type, value, assetYield, term, stage, collateral, useOfProceeds, aiText).run();
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