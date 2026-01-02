// 1. Variável global declarada apenas uma vez (Correção do erro de redeclaração)
if (typeof currentSearchData === 'undefined') {
    var currentSearchData = [];
}

/**
 * Função para pesquisar apólices
 */
async function pesquisarApolices() {
    const numero = document.getElementById('searchNumero').value;
    const cliente = document.getElementById('searchCliente').value;

    try {
        const response = await fetch(`http://localhost:3000/api/apolices?numero=${numero}&cliente=${cliente}`);
        const data = await response.json();
        
        // Atualiza a variável global
        currentSearchData = data;
        
        const tbody = document.querySelector('#resultsTable tbody');
        tbody.innerHTML = '';

        data.forEach((apolice, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${apolice.numero}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${apolice.cliente}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${apolice.vencimento}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="verDetalhes(${index})" class="text-indigo-600 hover:text-indigo-900">Detalhes</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Erro ao buscar apólices:', error);
    }
}

/**
 * Função para abrir o modal e preencher os dados
 * @param {number} index - Índice no array currentSearchData
 */
function verDetalhes(index) {
    const apolice = currentSearchData[index];
    if (!apolice) return;

    // Preenche os campos do modal (IDs devem coincidir com o index.html)
    document.getElementById('modalNumero').textContent = apolice.numero || 'N/A';
    document.getElementById('modalCliente').textContent = apolice.cliente || 'N/A';
    document.getElementById('modalVencimento').textContent = apolice.vencimento || 'N/A';
    document.getElementById('modalStatus').textContent = apolice.status || 'Ativo';
    
    // Coberturas (se for array ou string)
    const coberturasElement = document.getElementById('modalCoberturas');
    if (Array.isArray(apolice.coberturas)) {
        coberturasElement.textContent = apolice.coberturas.join(', ');
    } else {
        coberturasElement.textContent = apolice.coberturas || 'Nenhuma informada';
    }

    // Exibe o modal
    const modal = document.getElementById('detailsModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * Função para fechar o modal
 */
function fecharModal() {
    const modal = document.getElementById('detailsModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Garante que as funções estão no escopo global para o onclick do HTML funcionar
window.verDetalhes = verDetalhes;
window.fecharModal = fecharModal;
window.pesquisarApolices = pesquisarApolices;