// =====================================================================
// CONFIGURAÇÃO DA API
// =====================================================================
const API_BASE_URL = 'http://192.168.23.89:3000/api/apolices';

// =====================================================================
// LÓGICA DA APLICAÇÃO
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA PARA A TELA DE BOAS-VINDAS ---
    const welcomeScreen = document.getElementById('welcomeScreen');
    const mainApp = document.getElementById('mainApp');
    const loginButton = document.getElementById('loginButton');

    loginButton.addEventListener('click', () => {
        welcomeScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
    });

    // --- LÓGICA DA PÁGINA DE CONSULTA DE APÓLICES ---
    const searchForm = document.getElementById('searchForm');
    const resultsSection = document.getElementById('resultsSection');
    const resultsTable = document.getElementById('resultsTable');
    const resultsBody = document.getElementById('resultsBody');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const policyModal = document.getElementById('policyModal');
    const closeModalButton = document.getElementById('closeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const beneficiaryTypeSelect = document.getElementById('beneficiaryType');
    const policyNumberInput = document.getElementById('policyNumber');
    const clientNameInput = document.getElementById('clientName');
    const documentNumberInput = document.getElementById('documentNumber');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const searchButton = document.getElementById('searchButton');

    // =============================================================
    // NOVO: LÓGICA DO INFORMATIVO DE NOVIDADES (CHANGELOG)
    // =============================================================
    const openChangelogBtn = document.getElementById('openChangelogBtn');
    const changelogModal = document.getElementById('changelogModal');
    const closeChangelogModal = document.getElementById('closeChangelogModal');
    const changelogContent = document.getElementById('changelogContent');

    // Função para carregar e exibir as novidades
    const loadChangelog = async () => {
        try {
            const response = await fetch('changelog.json');
            if (!response.ok) {
                throw new Error('Não foi possível carregar as novidades.');
            }
            const data = await response.json();

            let htmlContent = '';
            data.forEach(release => {
                htmlContent += `
                    <div class="mb-6">
                        <h4 class="text-lg font-bold text-gray-800">${release.version} <span class="text-sm font-normal text-gray-500">- ${release.date}</span></h4>
                        <ul class="list-disc list-inside mt-2 space-y-1 text-gray-600">
                            ${release.changes.map(change => `<li>${change}</li>`).join('')}
                        </ul>
                    </div>
                `;
            });
            changelogContent.innerHTML = htmlContent;

        } catch (error) {
            changelogContent.innerHTML = `<p class="text-red-500">${error.message}</p>`;
            console.error(error);
        }
    };
    
    openChangelogBtn.addEventListener('click', () => {
        changelogModal.classList.remove('hidden');
    });

    closeChangelogModal.addEventListener('click', () => {
        changelogModal.classList.add('hidden');
    });

    // Carrega as novidades quando a página é iniciada
    loadChangelog();
    // =============================================================
    // FIM DA LÓGICA DE NOVIDADES
    // =============================================================

    function toggleSearchButtonState() {
        const isBeneficiaryTypeSelected = beneficiaryTypeSelect.value !== '';
        const otherFields = [policyNumberInput, clientNameInput, documentNumberInput, startDateInput, endDateInput];
        const isAtLeastOneOtherFieldFilled = otherFields.some(field => field.value.trim() !== '');
        searchButton.disabled = !(isBeneficiaryTypeSelected && isAtLeastOneOtherFieldFilled);
    }

    const fieldsToValidate = [beneficiaryTypeSelect, policyNumberInput, clientNameInput, documentNumberInput, startDateInput, endDateInput];
    fieldsToValidate.forEach(field => {
        field.addEventListener('input', toggleSearchButtonState);
    });

    searchForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        resultsSection.classList.remove('hidden');
        resultsTable.classList.add('hidden');
        noResultsMessage.classList.add('hidden');
        loadingIndicator.classList.remove('hidden');
        resultsBody.innerHTML = '';
        const formData = new FormData(searchForm);
        const params = new URLSearchParams();
        for (const [key, value] of formData) {
            if (value) {
                params.append(key, value);
            }
        }
        if (params.has('beneficiaryType')) {
            params.set('tipoBeneficiario', params.get('beneficiaryType'));
            params.delete('beneficiaryType');
        }
        try {
            const apiUrl = `${API_BASE_URL}?${params.toString()}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const policies = await response.json();
            loadingIndicator.classList.add('hidden');
            if (policies && policies.length > 0) {
                displayResults(policies);
                resultsTable.classList.remove('hidden');
                noResultsMessage.classList.add('hidden');
            } else {
                noResultsMessage.querySelector('h3').textContent = "Nenhuma apólice encontrada";
                noResultsMessage.classList.remove('hidden');
                resultsTable.classList.add('hidden');
            }
        } catch (error) {
            console.error("Falha na requisição ao backend:", error);
            loadingIndicator.classList.add('hidden');
            resultsTable.classList.add('hidden');
            noResultsMessage.querySelector('h3').textContent = "Erro de Conexão";
            noResultsMessage.querySelector('p').textContent = "Não foi possível conectar ao servidor. Verifique o console para mais detalhes.";
            noResultsMessage.classList.remove('hidden');
        }
    });

    function displayResults(policies) {
        resultsBody.innerHTML = '';
        policies.forEach(policy => {
            const row = resultsBody.insertRow();
            row.className = 'hover:bg-gray-50 transition duration-150';
            row.insertCell().textContent = policy.id;
            row.insertCell().textContent = policy.client;
            row.insertCell().textContent = policy.documento || 'N/A';
            row.insertCell().textContent = policy.type;
            row.insertCell().textContent = policy.details?.placa ?? 'N/A';
            row.insertCell().textContent = `${formatDate(policy.startDate)} - ${formatDate(policy.endDate)}`;
            const statusCell = row.insertCell();
            const statusBadge = document.createElement('span');
            statusBadge.classList.add('px-2', 'inline-flex', 'text-xs', 'leading-5', 'font-semibold', 'rounded-full');
            if (policy.details?.status === 'Vencida') {
                statusBadge.textContent = 'Vencida';
                statusBadge.classList.add('bg-red-100', 'text-red-800');
            } else {
                statusBadge.textContent = policy.details?.status ?? 'Ativa';
                statusBadge.classList.add('bg-green-100', 'text-green-800');
            }
            statusCell.appendChild(statusBadge);
            const actionsCell = row.insertCell();
            const viewButton = document.createElement('button');
            viewButton.textContent = 'Ver Detalhes';
            viewButton.classList.add('text-blue-600', 'hover:text-blue-800', 'font-medium', 'py-1', 'px-2', 'rounded', 'hover:bg-blue-100', 'transition', 'duration-150');
            viewButton.onclick = () => showPolicyDetails(policy);
            actionsCell.appendChild(viewButton);
        });
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Data inválida';
        return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }

    function showPolicyDetails(policy) {
        modalTitle.textContent = `Detalhes da Apólice: ${policy.id}`;
        let basicInfoHtml = `<p class="mb-2"><strong class="font-semibold text-gray-700">Segurado:</strong> ${policy.client || "N/A"}</p><p class="mb-2"><strong class="font-semibold text-gray-700">Documento:</strong> ${policy.documento || "N/A"}</p><p class="mb-2"><strong class="font-semibold text-gray-700">Tipo de Seguro:</strong> ${policy.type || "N/A"}</p><p class="mb-2"><strong class="font-semibold text-gray-700">Vigência:</strong> ${formatDate(policy.startDate)} até ${formatDate(policy.endDate)}</p>`;
        let detailsHtml = '';
        if (policy.details) {
            detailsHtml += '<hr class="my-3"> <h4 class="font-semibold text-blue-700 mb-2">Informações Adicionais:</h4>';
            const detailsOrder = [
                { label: 'Status', key: 'status' }, { label: 'Data Emissao', key: 'dataEmissao' }, { label: 'Nome Corretor', key: 'nomeCorretor' }, { label: 'Marca Modelo', key: 'marcaModelo' }, { label: 'Ano Modelo', key: 'anoModelo' }, { label: 'Chassi', key: 'chassi' }, { label: 'Categoria Tarifaria', key: 'categoriaTarifaria' }, { label: 'Movimentacao', key: 'movimentacao' }, { label: 'Código Clausula', key: 'codigoClausula' }, { label: 'Descrição Clausula', key: 'descricaoClausula' }];
            detailsOrder.forEach(item => {
                let value = policy.details[item.key];
                if (value !== null && typeof value !== 'undefined' && value !== '') {
                    if (item.key === 'status') {
                        const statusClass = value === "Vencida" ? "text-red-600 font-bold" : "text-green-600 font-bold";
                        detailsHtml += `<p class="mb-1 capitalize"><strong class="font-semibold text-gray-600">${item.label}:</strong> <span class="${statusClass}">${value}</span></p>`;
                    } else if (item.key.toLowerCase().includes('data')) {
                        detailsHtml += `<p class="mb-1"><strong class="font-semibold text-gray-600">${item.label}:</strong> ${formatDate(value)}</p>`;
                    } else {
                        detailsHtml += `<p class="mb-1"><strong class="font-semibold text-gray-600">${item.label}:</strong> ${value}</p>`;
                    }
                }
            });
        }
        modalContent.innerHTML = basicInfoHtml + detailsHtml;
        policyModal.classList.remove("hidden");
    }

    // Lógica para fechar todos os modais
    [policyModal, changelogModal].forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });

    closeModalButton.addEventListener('click', () => {
        policyModal.classList.add('hidden');
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (!policyModal.classList.contains('hidden')) {
                policyModal.classList.add('hidden');
            }
            if (!changelogModal.classList.contains('hidden')) {
                changelogModal.classList.add('hidden');
            }
        }
    });
});