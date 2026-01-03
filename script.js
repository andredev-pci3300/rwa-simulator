document.getElementById('simulator-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const btn = document.getElementById('submit-btn');
    const responseBox = document.getElementById('ai-response');
    const resultSection = document.getElementById('result-section');

    // 1. CAPTURA DOS DADOS (Quantitativos + Qualitativos)
    const assetType = document.getElementById('asset-type').value;
    const assetValue = parseFloat(document.getElementById('asset-value').value);
    const assetYield = parseFloat(document.getElementById('yield').value);
    const assetTerm = parseInt(document.getElementById('term').value);
    
    // Novos campos estratégicos
    const projectStage = document.getElementById('project-stage').value;
    const collateral = document.getElementById('collateral').value;
    const useOfProceeds = document.getElementById('use-of-proceeds').value;

    // 2. VALIDAÇÃO DE SEGURANÇA
    if (isNaN(assetValue) || assetValue <= 0 || isNaN(assetYield) || isNaN(assetTerm) || assetTerm <= 0) {
        alert("Atenção: Para uma validação precisa, insira apenas valores numéricos positivos nos campos financeiros.");
        return; 
    }

    const data = {
        type: assetType,
        value: assetValue,
        yield: assetYield,
        term: assetTerm,
        // Enviando os novos dados para o backend
        stage: projectStage,
        collateral: collateral,
        useOfProceeds: useOfProceeds
    };

    // 3. UX "PROFISSIONAL"
    btn.disabled = true;
    btn.innerText = "Validando Tese...";
    resultSection.classList.remove('hidden');
    
    // Mensagem de loading alinhada com a marca "Validator"
    responseBox.innerHTML = `
        <p class="loading">
            O Comitê de IA da BWB está analisando a estrutura de risco, as garantias e a viabilidade econômica do ativo...
        </p>`;

    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (response.ok) {
            // Formatação inteligente
            const formattedText = result.analysis
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
            
            responseBox.innerHTML = `<div class="ai-content">${formattedText}</div>`;
        } else {
            responseBox.innerHTML = `<p style="color: #e11d48;">Erro na Validação: ${result.error}</p>`;
        }

    } catch (error) {
        responseBox.innerHTML = `<p style="color: #e11d48;">Falha de conexão com o servidor de validação.</p>`;
    } finally {
        btn.disabled = false;
        btn.innerText = "Validar Nova Tese";
    }
});