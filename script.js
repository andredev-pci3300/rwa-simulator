document.getElementById('simulator-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const btn = document.getElementById('submit-btn');
    const responseBox = document.getElementById('ai-response');
    const resultSection = document.getElementById('result-section');

    // 1. CAPTURA E CONVERSÃO DE DADOS
    // Convertemos explicitamente para garantir que o banco D1 receba o tipo correto
    const assetType = document.getElementById('asset-type').value;
    const assetValue = parseFloat(document.getElementById('asset-value').value);
    const assetYield = parseFloat(document.getElementById('yield').value);
    const assetTerm = parseInt(document.getElementById('term').value);

    // 2. CAMADA DE VALIDAÇÃO LÓGICA
    // Verifica se os valores são números reais e positivos
    if (isNaN(assetValue) || assetValue <= 0 || isNaN(assetYield) || isNaN(assetTerm) || assetTerm <= 0) {
        alert("Por favor, preencha todos os campos com valores numéricos positivos.");
        return; 
    }

    const data = {
        type: assetType,
        value: assetValue,
        yield: assetYield,
        term: assetTerm
    };

    // 3. ESTADO DE CARREGAMENTO (White-label)
    btn.disabled = true;
    btn.innerText = "Por favor, aguarde...";
    resultSection.classList.remove('hidden');
    responseBox.innerHTML = '<p class="loading">Processando viabilidade com nossa inteligência artificial...</p>';

    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (response.ok) {
            // Formatação do Markdown para HTML (Negritos e Quebras de linha)
            // Preparado para a saída robusta do Gemini 2.5 Flash
            const formattedText = result.analysis
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
            
            responseBox.innerHTML = `<div class="ai-content">${formattedText}</div>`;
        } else {
            responseBox.innerHTML = `<p style="color: #e11d48;">Erro: ${result.error}</p>`;
        }

    } catch (error) {
        responseBox.innerHTML = `<p style="color: #e11d48;">Falha na comunicação com o servidor.</p>`;
    } finally {
        // 4. RESTAURAÇÃO DO BOTÃO
        btn.disabled = false;
        btn.innerText = "Gerar Análise com IA";
    }
});