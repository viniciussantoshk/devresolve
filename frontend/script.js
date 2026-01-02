// =====================================================================
// CONFIGURAÇÃO DA API
// =====================================================================
// Em produção, usamos o caminho relativo para que o Nginx/Apache 
// encaminhe para o backend corretamente.
const API_BASE_URL = '/api/apolices';

// =====================================================================
// LÓGICA DA APLICAÇÃO
// =====================================================================

// 1. Definição segura da variável global para evitar erros de redeclaração
// e garantir que os dados fiquem acessíveis ao Modal.
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

    // --- LÓGICA DE BOAS-VINDAS ---
    if (loginButton && welcomeScreen && mainApp) {
        loginButton.addEventListener('click', () => {
            welcomeScreen.classList.add('hidden');
            mainApp.classList.remove('hidden');
        });
    }

    // --- FUNÇÕES DE UTILIDADE ---
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    /**
     * Renderiza a tabela de resultados
     */
    const renderResults = (data) => {
        if (!resultsBody) return;
        resultsBody.innerHTML = '';

        if (data.length === 0) {
            if (resultsSection) resultsSection.classList.add('hidden');
            if (noResultsMessage) noResultsMessage.classList.remove('hidden');
            return;
        }

        if (noResultsMessage) noResultsMessage.classList.add('hidden');
        if (resultsSection) resultsSection.classList.remove('hidden');

        data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.className = "hover:bg-gray-50 border-b transition-colors";
            row.innerHTML = `
                <td class="p-3 text-sm text-gray-700 font-mono">${item.numero || item.id}</td>
                <td class="p-3 text-sm text-gray-900 font-medium">${item.cliente}</td>
                <td class="p-3 text-sm text-gray-600">${formatDate(item.vencimento)}</td>
                <td class="p-3 text-right">
                    <button 
                        onclick="showPolicyDetails(${index})" 
                        class="text-blue-600 hover:text-blue-800 font-bold text-sm"
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

            if (loadingIndicator) loadingIndicator.classList.remove('hidden');
            if (resultsSection) resultsSection.classList.add('hidden');
            if (noResultsMessage) noResultsMessage.classList.add('hidden');

            try {
                const response = await fetch(`${API_BASE_URL}?numero=${numero}&cliente=${cliente}`);
                if (!response.ok) throw new Error('Erro na comunicação com o servidor');
                
                const data = await response.json();
                window.currentSearchData = data; // Armazena no window para acesso global
                renderResults(data);
            } catch (error) {
                console.error('Erro na busca:', error);
            } finally {
                if (loadingIndicator) loadingIndicator.classList.add('hidden');
            }
        });
    }

    // --- LÓGICA DO MODAL (EXPOSTA AO WINDOW PARA O ONCLICK FUNCIONAR) ---
    
    /**
     * Função para mostrar detalhes da apólice
     * @param {number} index - Índice no array global
     */
    window.showPolicyDetails = (index) => {
        const item = window.currentSearchData[index];
        if (!item || !policyModal || !modalContent) return;

        // Cabeçalho do Modal
        let contentHtml = `
            <div class="mb-6 border-b pb-4">
                <h3 class="text-xl font-bold text-gray-800">${item.cliente}</h3>
                <p class="text-sm text-gray-500">Apólice: ${item.numero || item.id}</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        `;

        // Mapeamento dinâmico de todos os campos (Mantendo sua lógica original)
        Object.entries(item).forEach(([key, value]) => {
            if (['cliente', 'numero', 'id'].includes(key)) return;

            const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
            
            if (key.toLowerCase().includes('vencimento') || key.toLowerCase().includes('data')) {
                contentHtml += `<div><strong class="text-gray-600">${label}:</strong> ${formatDate(value)}</div>`;
            } else if (key === 'status') {
                const color = value?.toLowerCase() === 'ativa' ? 'text-green-600' : 'text-red-600';
                contentHtml += `<div><strong class="text-gray-600">${label}:</strong> <span class="font-bold ${color}">${value}</span></div>`;
            } else if (value !== null && typeof value !== 'object') {
                contentHtml += `<div><strong class="text-gray-600">${label}:</strong> ${value}</div>`;
            }
        });

        contentHtml += '</div>';
        
        modalContent.innerHTML = contentHtml;
        
        // Exibição do Modal
        policyModal.classList.remove("hidden");
        policyModal.classList.add("flex");
        document.body.style.overflow = 'hidden';
    };

    /**
     * Função para fechar modais
     */
    window.closeModal = () => {
        if (policyModal) {
            policyModal.classList.add('hidden');
            policyModal.classList.remove('flex');
        }
        if (changelogModal) changelogModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    };

    // Eventos de fecho
    if (closeModalButton) {
        closeModalButton.addEventListener('click', window.closeModal);
    }

    // Fechar ao clicar na área escura
    window.addEventListener('click', (e) => {
        if (e.target === policyModal || e.target === changelogModal) {
            window.closeModal();
        }
    });

    // Tecla ESC para fechar
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') window.closeModal();
    });
});