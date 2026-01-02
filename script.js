document.getElementById('simulator-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const btn = document.getElementById('submit-btn');
    const responseBox = document.getElementById('ai-response');
    const resultSection = document.getElementById('result-section');

    const data = {
        type: document.getElementById('asset-type').value,
        value: document.getElementById('asset-value').value,
        yield: document.getElementById('yield').value,
        term: document.getElementById('term').value
    };

    // 1. ESTADO DE CARREGAMENTO (White-label)
    btn.disabled = true;
    btn.innerText = "Por favor, aguarde..."; // Label solicitada
    
    resultSection.classList.remove('hidden');
    
    // Mensagem alterada para remover a menção ao Gemini
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
            const formattedText = result.analysis
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
            
            responseBox.innerHTML = `<div class="ai-content">${formattedText}</div>`;
        } else {
            responseBox.innerHTML = `<p style="color: #e11d48;">Erro: ${result.error}</p>`;
        }

    } catch (error) {
        responseBox.innerHTML = `<p style="color: #e11d48;">Falha na conexão com o servidor de análise.</p>`;
    } finally {
        // 2. RESTAURAÇÃO DO BOTÃO
        btn.disabled = false;
        btn.innerText = "Gerar Análise com IA";
    }
});