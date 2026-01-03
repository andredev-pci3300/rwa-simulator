document.addEventListener('DOMContentLoaded', function() {
    // --- Lógica de Proteção de Inputs ---
    const numericInputs = document.querySelectorAll('input[type="number"]');
    numericInputs.forEach(input => {
        input.addEventListener('keydown', function(e) {
            if (['e', 'E', '+', '-'].includes(e.key)) {
                e.preventDefault();
            }
        });
    });

    // --- Lógica de Envio do Formulário ---
    document.getElementById('simulator-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        const btn = document.getElementById('submit-btn');
        const responseBox = document.getElementById('ai-response');
        const resultSection = document.getElementById('result-section');

        const data = {
            type: document.getElementById('asset-type').value,
            value: parseFloat(document.getElementById('asset-value').value),
            yield: parseFloat(document.getElementById('yield').value),
            term: parseInt(document.getElementById('term').value),
            stage: document.getElementById('project-stage').value,
            collateral: document.getElementById('collateral').value,
            useOfProceeds: document.getElementById('use-of-proceeds').value
        };

        // Validação
        if (!data.type || !data.stage || !data.collateral || !data.useOfProceeds || 
            isNaN(data.value) || data.value <= 0 || isNaN(data.yield) || isNaN(data.term)) {
            alert("Erro: Todos os campos são obrigatórios e devem conter valores válidos.");
            return;
        }

        // Estado de Carregamento
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
                // CORREÇÃO: Não usamos mais replace. O HTML vem pronto do backend.
                responseBox.innerHTML = `<div class="ai-content fade-in">${result.analysis}</div>`;
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

    // --- Tooltips ---
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