export async function onRequestPost(context) {
    const { env, request } = context;

    try {
        const data = await request.json();
        const { type, value, yield: assetYield, term, stage, collateral, useOfProceeds } = data;

        if (!env.GEMINI_API_KEY) {
            return new Response(JSON.stringify({ error: "Chave de API não configurada." }), { status: 500 });
        }

        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
        
        // PROMPT RIGOROSO
        const prompt = `
        Aja como um sistema gerador de relatórios HTML (Backend API).
        NÃO CONVERSE. NÃO DÊ BOM DIA. NÃO USE MARKDOWN.
        
        Sua tarefa é gerar um relatório HTML puro sobre este ativo RWA:
        - Setor: ${type}
        - Valuation: R$ ${value}
        - Yield: ${assetYield}% a.a.
        - Prazo: ${term} meses
        - Estágio: ${stage}
        - Garantia: ${collateral}
        - Destino: ${useOfProceeds}

        ESTRUTURA OBRIGATÓRIA (HTML PURO):
        Comece IMEDIATAMENTE com <div class="report-container">.
        
        <div class="report-container">
            <h3>1. BWB Score (0-100)</h3>
            <p>[Sua nota e análise breve]</p>

            <h3>2. Análise de Estruturação</h3>
            <p><strong>Sustentabilidade do Yield:</strong> [Análise]</p>
            <p><strong>Robustez da Garantia:</strong> [Análise crítica]</p>
            <p><strong>Uso dos Recursos:</strong> [Análise]</p>

            <h3>3. Veredito Final</h3>
            <p class="verdict">[APROVADO / RESSALVAS / REPROVADO]</p>
            <ul>
                <li>[Recomendação 1]</li>
                <li>[Recomendação 2]</li>
            </ul>
        </div>
        `;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error.message);

        let aiText = result.candidates[0].content.parts[0].text;

        // --- LIMPEZA CIRÚRGICA DE DADOS ---
        // 1. Remove blocos de código markdown (```html e ```)
        aiText = aiText.replace(/```html/g, '').replace(/```/g, '');
        
        // 2. Remove qualquer texto introdutório antes da primeira tag HTML
        // Procura onde começa o primeiro "<" e joga fora o que tem antes
        const firstTagIndex = aiText.indexOf('<');
        if (firstTagIndex !== -1) {
            aiText = aiText.substring(firstTagIndex);
        }

        // Gravação no Banco (Mantida)
        try {
            await env.DB.prepare(
                `INSERT INTO simulations (type, value, yield, term, project_stage, collateral, use_of_proceeds, analysis) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(type, value, assetYield, term, stage, collateral, useOfProceeds, aiText).run();
        } catch (dbError) {
            console.error("Erro D1:", dbError.message);
        }

        return new Response(JSON.stringify({ analysis: aiText }), {
            headers: { "Content-Type": "application/json; charset=utf-8" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json; charset=utf-8" }
        });
    }
}