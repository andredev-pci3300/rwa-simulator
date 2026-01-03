document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('simulator-form');
    
    // 1. FILTRO DE CARACTERES INVÁLIDOS (Prevenção em tempo real)
    const numericInputs = document.querySelectorAll('input[type="number"]');
    numericInputs.forEach(input => {
        input.addEventListener('keydown', function(e) {
            // Bloqueia 'e', '+', '-' que são permitidos por padrão em inputs numéricos
            if (['e', 'E', '+', '-'].includes(e.key)) {
                e.preventDefault();
            }
        });
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const btn = document.getElementById('submit-btn');
        const responseBox = document.getElementById('ai-response');
        const resultSection = document.getElementById('result-section');

        // Captura de valores
        const data = {
            type: document.getElementById('asset-type').value,
            value: parseFloat(document.getElementById('asset-value').value),
            yield: parseFloat(document.getElementById('yield').value),
            term: parseInt(document.getElementById('term').value),
            stage: document.getElementById('project-stage').value,
            collateral: document.getElementById('collateral').value,
            useOfProceeds: document.getElementById('use-of-proceeds').value
        };

        // 2. VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS E VALORES REAIS
        if (!data.type || !data.stage || !data.collateral || !data.useOfProceeds || 
            isNaN(data.value) || data.value <= 0 || isNaN(data.yield) || isNaN(data.term)) {
            alert("Erro: Todos os campos são obrigatórios e devem conter valores válidos e positivos.");
            return;
        }

        btn.disabled = true;
        btn.innerText = "Validando Tese...";
        resultSection.classList.remove('hidden');
        responseBox.innerHTML = '<p class="loading">Analisando fundamentos econômicos e riscos do ativo...</p>';

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();

            if (response.ok) {
                const formattedText = result.analysis
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br>');
                responseBox.innerHTML = `<div class="ai-content">${formattedText}</div>`;
            } else {
                responseBox.innerHTML = `<p style="color: #e11d48;">Erro: ${result.error}</p>`;
            }
        } catch (error) {
            responseBox.innerHTML = `<p style="color: #e11d48;">Falha na conexão com o validador.</p>`;
        } finally {
            btn.disabled = false;
            btn.innerText = "Validar Nova Tese";
        }
    });

    // Lógica dos Tooltips (Mantida)
    const tooltipIcons = document.querySelectorAll('.tooltip-icon');
    tooltipIcons.forEach(icon => {
        icon.addEventListener('click', function(e) {
            e.stopPropagation();
            const container = this.parentElement;
            document.querySelectorAll('.tooltip-container').forEach(c => { if (c !== container) c.classList.remove('active'); });
            container.classList.toggle('active');
        });
    });
    document.addEventListener('click', () => {
        document.querySelectorAll('.tooltip-container').forEach(c => c.classList.remove('active'));
    });
});