// =====================================================================
// CONFIGURAÇÃO DA API
// =====================================================================
// Em produção, utilizamos caminhos relativos para que o proxy reverso (Nginx/Apache)
// encaminhe os pedidos corretamente sem expor IPs internos ou portas específicas.
const API_BASE_URL = '/api/apolices';

// =====================================================================
// LÓGICA DA APLICAÇÃO
// =====================================================================

// 1. Definição segura da variável global para evitar erro de redeclaração
// Usamos o objeto window para garantir que ela exista apenas uma vez no escopo global
if (typeof window.currentSearchData === 'undefined') {
    window.currentSearchData = [];
}

document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA PARA A TELA DE BOAS-VINDAS ---
    const welcomeScreen = document.getElementById('welcomeScreen');
    const mainApp = document.getElementById('mainApp');
    const loginButton = document.getElementById('loginButton');

    if (loginButton) {
        loginButton.addEventListener('click', () => {
            welcomeScreen.classList.add('hidden');
            mainApp.classList.remove('hidden');
        });
    }

    // --- LÓGICA DA PÁGINA DE CONSULTA DE APÓLICES ---
    const searchForm = document.getElementById('searchForm');
    const resultsSection = document.getElementById('resultsSection');
    const resultsTable = document.getElementById('resultsTable');
    const resultsBody = document.getElementById('resultsBody');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const policyModal = document.getElementById('policyModal');
    const closeModalButton = document.getElementById('closeModal');
    const modalContent = document.getElementById('modalContent');
    const changelogModal = document.getElementById('changelogModal');

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
        resultsBody.innerHTML = '';
        if (data.length === 0) {
            resultsSection.classList.add('hidden');
            noResultsMessage.classList.remove('hidden');
            return;
        }

        noResultsMessage.classList.add('hidden');
        resultsSection.classList.remove('hidden');

        data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.className = "hover:bg-gray-50 border-b transition-colors";
            row.innerHTML = `
                <td class="p-3 text-sm text-gray-700">${item.numero || item.id}</td>
                <td class="p-3 text-sm text-gray-900 font-medium">${item.cliente}</td>
                <td class="p-3 text-sm text-gray-600">${formatDate(item.vencimento)}</td>
                <td class="p-3 text-right">
                    <button 
                        onclick="showPolicyDetails(${index})" 
                        class="text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors"
                    >
                        Detalhes
                    </button>
                </td>
            `;
            resultsBody.appendChild(row);
        });
    };

    /**
     * Função para buscar apólices no Backend
     */
    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const numero = document.getElementById('numero')?.value || '';
            const cliente = document.getElementById('cliente')?.value || '';

            loadingIndicator.classList.remove('hidden');
            resultsSection.classList.add('hidden');
            noResultsMessage.classList.add('hidden');

            try {
                const response = await fetch(`${API_BASE_URL}?numero=${numero}&cliente=${cliente}`);
                if (!response.ok) throw new Error('Erro ao buscar dados');
                
                const data = await response.json();
                
                // Atualiza os dados globais
                window.currentSearchData = data;
                
                renderResults(data);
            } catch (error) {
                console.error('Erro:', error);
                // Aqui poderias adicionar um aviso visual de erro
            } finally {
                loadingIndicator.classList.add('hidden');
            }
        });
    }

    /**
     * Lógica para fechar os modais
     */
    const closeAllModals = () => {
        if (policyModal) policyModal.classList.add('hidden');
        if (changelogModal) changelogModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    };

    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeAllModals);
    }

    [policyModal, changelogModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) closeAllModals();
            });
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeAllModals();
    });

    // --- EXPOSIÇÃO DE FUNÇÕES AO ESCOPO GLOBAL ---
    // Isto é necessário para que o onclick="showPolicyDetails(index)" no HTML funcione
    
    window.showPolicyDetails = (index) => {
        const item = window.currentSearchData[index];
        if (!item || !policyModal || !modalContent) return;

        // Limpa e preenche o modal
        let detailsHtml = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Número</p>
                        <p class="font-semibold text-gray-800">${item.numero || item.id}</p>
                    </div>
                    <div>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                        <p class="font-bold text-green-600">${item.status || 'Ativa'}</p>
                    </div>
                </div>
                <div>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Segurado</p>
                    <p class="text-lg font-bold text-gray-900">${item.cliente}</p>
                </div>
                <div>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vencimento</p>
                    <p class="text-gray-700">${formatDate(item.vencimento)}</p>
                </div>
                <div class="pt-4 border-t">
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Coberturas</p>
                    <p class="text-sm text-gray-600 leading-relaxed italic">${Array.isArray(item.coberturas) ? item.coberturas.join(', ') : (item.coberturas || 'Cláusulas padrão')}</p>
                </div>
            </div>
        `;

        modalContent.innerHTML = detailsHtml;
        policyModal.classList.remove("hidden");
        policyModal.classList.add("flex");
        document.body.style.overflow = 'hidden';
    };
});