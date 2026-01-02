// =====================================================================
// CONFIGURAÇÃO DA API
// =====================================================================
// Em produção, utilizamos o caminho relativo. O Nginx no AlmaLinux 
// deve estar configurado para redirecionar /api para o backend (porta 3000).
const API_BASE_URL = '/api/apolices';

// =====================================================================
// LÓGICA DA APLICAÇÃO
// =====================================================================

// Definição global única para evitar o erro de redeclaração
if (typeof window.currentSearchData === 'undefined') {
    window.currentSearchData = [];
}

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const welcomeScreen = document.getElementById('welcomeScreen');
    const mainApp = document.getElementById('mainApp');
    const loginButton = document.getElementById('loginButton');
    const searchForm = document.getElementById('searchForm');
    const resultsSection = document.getElementById('resultsSection');
    const resultsBody = document.getElementById('resultsBody');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const policyModal = document.getElementById('policyModal');
    const closeModalButton = document.getElementById('closeModal');
    const modalContent = document.getElementById('modalContent');
    const changelogModal = document.getElementById('changelogModal');

    // --- LÓGICA DE LOGIN / WELCOME ---
    if (loginButton && welcomeScreen && mainApp) {
        loginButton.addEventListener('click', () => {
            welcomeScreen.classList.add('hidden');
            mainApp.classList.remove('hidden');
        });
    }

    // --- FUNÇÕES DE UTILIDADE ---
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR');
        } catch (e) { return dateString; }
    };

    /**
     * Renderiza a tabela de resultados
     */
    const renderResults = (data) => {
        if (!resultsBody) return;
        resultsBody.innerHTML = '';

        if (!data || data.length === 0) {
            resultsSection?.classList.add('hidden');
            noResultsMessage?.classList.remove('hidden');
            return;
        }

        noResultsMessage?.classList.add('hidden');
        resultsSection?.classList.remove('hidden');

        data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.className = "hover:bg-gray-50 border-b transition-colors";
            row.innerHTML = `
                <td class="p-3 text-sm text-gray-700 font-mono">${item.numero || item.id || 'N/A'}</td>
                <td class="p-3 text-sm text-gray-900 font-medium">${item.cliente || 'N/A'}</td>
                <td class="p-3 text-sm text-gray-600">${formatDate(item.vencimento)}</td>
                <td class="p-3 text-right">
                    <button 
                        onclick="openDetails(${index})" 
                        class="text-blue-600 hover:text-blue-800 font-bold text-sm transition-colors"
                    >
                        Detalhes
                    </button>
                </td>
            `;
            resultsBody.appendChild(row);
        });
    };

    /**
     * Submissão do Formulário de Pesquisa
     */
    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const numero = document.getElementById('numero')?.value || '';
            const cliente = document.getElementById('cliente')?.value || '';

            loadingIndicator?.classList.remove('hidden');
            resultsSection?.classList.add('hidden');
            noResultsMessage?.classList.add('hidden');

            try {
                const response = await fetch(`${API_BASE_URL}?numero=${numero}&cliente=${cliente}`);
                if (!response.ok) throw new Error('Erro na comunicação');
                
                const data = await response.json();
                window.currentSearchData = data; // Armazena globalmente para o modal
                renderResults(data);
            } catch (error) {
                console.error('Erro na busca:', error);
            } finally {
                loadingIndicator?.classList.add('hidden');
            }
        });
    }

    // --- LÓGICA DO MODAL (ESTRUTURA DEFENSIVA) ---

    /**
     * Função para abrir detalhes (Exposta globalmente)
     */
    window.openDetails = (index) => {
        const item = window.currentSearchData[index];
        if (!item || !policyModal || !modalContent) return;

        // Limpeza de segurança para evitar o erro 'reading Tag'
        // Definimos os campos que queremos exibir
        const displayFields = [
            { key: 'numero', label: 'Número' },
            { key: 'cliente', label: 'Segurado' },
            { key: 'vencimento', label: 'Vencimento', isDate: true },
            { key: 'status', label: 'Situação', isStatus: true },
            { key: 'coberturas', label: 'Coberturas' }
        ];

        let html = `
            <div class="mb-6 border-b pb-4">
                <h3 class="text-xl font-bold text-gray-800">${item.cliente || 'Dados do Cliente'}</h3>
                <p class="text-sm text-gray-500 font-mono">ID/Apólice: ${item.numero || item.id || 'N/A'}</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        `;

        displayFields.forEach(field => {
            const value = item[field.key];
            if (value === undefined || value === null) return;

            let formattedValue = value;
            if (field.isDate) formattedValue = formatDate(value);
            
            let extraClass = "";
            if (field.isStatus) {
                extraClass = value.toLowerCase() === 'ativa' ? 'text-green-600 font-bold' : 'text-red-600 font-bold';
            }

            html += `
                <div class="p-2 bg-gray-50 rounded">
                    <strong class="block text-[10px] text-gray-400 uppercase tracking-widest">${field.label}</strong>
                    <span class="${extraClass}">${formattedValue}</span>
                </div>
            `;
        });

        // Caso existam campos extras no JSON que não mapeamos acima
        Object.entries(item).forEach(([key, value]) => {
            if (displayFields.find(f => f.key === key) || ['id', 'cliente', 'numero'].includes(key)) return;
            if (typeof value === 'object') return;

            html += `
                <div class="p-2 bg-gray-50 rounded">
                    <strong class="block text-[10px] text-gray-400 uppercase tracking-widest">${key.replace(/_/g, ' ')}</strong>
                    <span>${value}</span>
                </div>
            `;
        });

        html += '</div>';
        
        modalContent.innerHTML = html;
        policyModal.classList.remove("hidden");
        policyModal.classList.add("flex");
        document.body.style.overflow = 'hidden';
    };

    // Alias para compatibilidade caso o HTML use showPolicyDetails
    window.showPolicyDetails = window.openDetails;

    /**
     * Função para fechar modal
     */
    window.closeModal = () => {
        policyModal?.classList.add('hidden');
        policyModal?.classList.remove('flex');
        changelogModal?.classList.add('hidden');
        document.body.style.overflow = 'auto';
    };

    if (closeModalButton) closeModalButton.addEventListener('click', window.closeModal);

    window.addEventListener('click', (e) => {
        if (e.target === policyModal || e.target === changelogModal) window.closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') window.closeModal();
    });
});