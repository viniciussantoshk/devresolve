/**
 * Script para Consulta de Apólices - HMG
 * Sistema de gestão e visualização de detalhes de apólices
 */

// 1. Variáveis Globais (Declaradas apenas UMA vez para evitar erros de âmbito)
let currentSearchData = []; // Armazena os resultados da pesquisa atual vindos do backend
let selectedApolice = null; // Armazena a apólice selecionada para exibição no modal

// 2. Elementos do DOM
const searchForm = document.getElementById('searchForm');
const resultsTableBody = document.querySelector('#resultsTable tbody');
const detailsModal = document.getElementById('detailsModal');

/**
 * Função para pesquisar apólices via API
 * @param {Event} event - Evento de submissão do formulário
 */
async function handleSearch(event) {
    if (event) event.preventDefault();
    
    const formData = new FormData(searchForm);
    const queryParams = new URLSearchParams(formData).toString();

    try {
        // Chamada ao backend local
        const response = await fetch(`http://localhost:3000/api/apolices?${queryParams}`);
        
        if (!response.ok) {
            throw new Error('Erro na resposta do servidor');
        }

        const data = await response.json();
        
        // Atualizamos a variável global com os novos resultados
        currentSearchData = data; 
        
        // Renderizamos a tabela com os dados obtidos
        renderTable(currentSearchData);
    } catch (error) {
        console.error("Erro ao buscar apólices:", error);
        // Nota: Em produção, substituir por um componente de alerta na UI
    }
}

/**
 * Renderiza as linhas da tabela de resultados
 * @param {Array} data - Lista de apólices a exibir
 */
function renderTable(data) {
    if (!resultsTableBody) return;

    resultsTableBody.innerHTML = '';
    
    if (data.length === 0) {
        resultsTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center p-8 text-gray-500 italic">
                    Nenhum resultado encontrado para os critérios selecionados.
                </td>
            </tr>`;
        return;
    }

    data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.className = "hover:bg-blue-50/50 cursor-pointer border-b border-gray-100 transition-colors group";
        
        row.innerHTML = `
            <td class="p-4 text-gray-700">${item.numero}</td>
            <td class="p-4 text-gray-700 font-medium">${item.cliente}</td>
            <td class="p-4 text-gray-600">${item.vencimento}</td>
            <td class="p-4 text-right">
                <button 
                    onclick="openDetails(${index})" 
                    class="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition-all font-semibold text-sm"
                >
                    Ver Detalhes
                </button>
            </td>
        `;
        resultsTableBody.appendChild(row);
    });
}

/**
 * Abre o modal de detalhes preenchendo as informações da apólice selecionada
 * @param {number} index - Índice do item no array global currentSearchData
 */
function openDetails(index) {
    selectedApolice = currentSearchData[index];
    
    if (!selectedApolice || !detailsModal) return;

    // Mapeamento e preenchimento dos campos do modal
    const campos = {
        'modalNumero': selectedApolice.numero,
        'modalCliente': selectedApolice.cliente,
        'modalVencimento': selectedApolice.vencimento,
        'modalStatus': selectedApolice.status || 'Ativa',
        'modalCoberturas': Array.isArray(selectedApolice.coberturas) 
            ? selectedApolice.coberturas.join(', ') 
            : (selectedApolice.coberturas || 'N/A')
    };

    // Atualiza o texto de cada elemento se ele existir no DOM
    Object.keys(campos).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = campos[id];
        }
    });
    
    // Gestão de visibilidade do modal (estilo Tailwind)
    detailsModal.classList.remove('hidden');
    detailsModal.classList.add('flex');
    
    // Impede o scroll do corpo da página quando o modal está aberto
    document.body.style.overflow = 'hidden';
}

/**
 * Fecha o modal de detalhes e limpa a seleção
 */
function closeDetails() {
    if (!detailsModal) return;
    
    detailsModal.classList.add('hidden');
    detailsModal.classList.remove('flex');
    
    // Restaura o scroll da página
    document.body.style.overflow = 'auto';
    selectedApolice = null;
}

// 3. Event Listeners e Inicialização
document.addEventListener('DOMContentLoaded', () => {
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }

    // Fechar modal ao clicar fora da área de conteúdo (opcional)
    if (detailsModal) {
        detailsModal.addEventListener('click', (e) => {
            if (e.target === detailsModal) closeDetails();
        });
    }

    console.log("Módulo de Consulta de Apólices (HMG) inicializado com sucesso.");
});