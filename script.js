/* ========================================
   INVENTÁRIO ARBÓREO DE ANDRADAS
   JavaScript - Interatividade Premium
   ======================================== */

// Estado do formulário
let currentStep = 1;
let formData = {
    latitude: '',
    longitude: '',
    logradouro: '',
    referencia: '',
    localPlantio: '',
    especie: '',
    certeza: '',
    porte: '',
    tronco: '',
    intervencao: '',
    mesPoda: '',
    historicoPoda: '',
    observacoes: '',
    condicoes: [],
    interferencias: []
};

// Lista de espécies comuns
const especiesComuns = [
    'Ipê Amarelo', 'Ipê Roxo', 'Ipê Branco', 'Paineira', 'Sibipiruna',
    'Figueira', 'Caroba', 'Angico', 'Salamoia', 'Eucalipto',
    'Pinsheiro', 'Cedro', 'Sabicó', 'Castanheira', 'Nogueira',
    'Mangueira', 'Laranjeira', 'Limoeiro', 'Pitangueira', 'Coqueiro',
    'Palmeira Imperial', 'Palmeira Real', 'Palmeira de Judas', 'Aroeira',
    'Murici', 'Jatobá', 'Sucupira', 'Peroba', 'Cinamomo', 'Falso Pimenteira',
    'Jacarandá', 'Flamboyant', 'Bougainville', 'Hibisco', 'Manacá'
];

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    initSearchableSelects();
    initPhotoUploads();
    initGPS();
    initPillOptions();
    initProgressPills();
    updateProgressBar();
});

// ========================================
// NAVEGAÇÃO ENTRE ETAPAS
// ========================================

function nextStep(step) {
    collectStepData(currentStep);
    currentStep = step;
    showStep(step);
    updateProgressBar();
    
    if (step === 6) {
        updateSummary();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep(step) {
    collectStepData(currentStep);
    currentStep = step;
    showStep(step);
    updateProgressBar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showStep(step) {
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`section${step}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    document.querySelectorAll('.pill-step').forEach((pill, index) => {
        pill.classList.remove('active', 'completed');
        if (index + 1 === step) {
            pill.classList.add('active');
        } else if (index + 1 < step) {
            pill.classList.add('completed');
        }
    });
}

function updateProgressBar() {
    const progress = ((currentStep - 1) / 5) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
}

// ========================================
// PILL OPTIONS
// ========================================

function initProgressPills() {
    document.querySelectorAll('.pill-step').forEach(pill => {
        pill.addEventListener('click', () => {
            const step = parseInt(pill.dataset.step);
            if (step < currentStep) {
                prevStep(step);
            } else if (step > currentStep) {
                nextStep(step);
            }
        });
    });
}

function initPillOptions() {
    document.querySelectorAll('.pill-option input, .month-pill input, .trunk-card input, .size-card input, .certainty-card input, .intervention-card input').forEach(input => {
        input.addEventListener('change', function() {
            const name = this.getAttribute('name');
            const value = this.value;
            
            if (name === 'localPlantio') formData.localPlantio = value;
            if (name === 'porte') formData.porte = value;
            if (name === 'tronco') formData.tronco = value;
            if (name === 'certeza') formData.certeza = value;
            if (name === 'intervencao') formData.intervencao = value;
            if (name === 'mesPoda') formData.mesPoda = value;
        });
    });
}

// ========================================
// COLETA DE DADOS
// ========================================

function collectStepData(step) {
    switch(step) {
        case 1:
            formData.logradouro = document.getElementById('logradouro')?.value || '';
            formData.referencia = document.getElementById('referencia')?.value || '';
            const localRadio = document.querySelector('input[name="localPlantio"]:checked');
            if (localRadio) formData.localPlantio = localRadio.value;
            break;
        case 2:
            formData.especie = document.getElementById('especie')?.value || '';
            const certezaRadio = document.querySelector('input[name="certeza"]:checked');
            if (certezaRadio) formData.certeza = certezaRadio.value;
            break;
        case 4:
            const porteRadio = document.querySelector('input[name="porte"]:checked');
            if (porteRadio) formData.porte = porteRadio.value;
            const troncoRadio = document.querySelector('input[name="tronco"]:checked');
            if (troncoRadio) formData.tronco = troncoRadio.value;
            break;
        case 5:
            formData.condicoes = [];
            document.querySelectorAll('input[name^="condicao"]:checked').forEach(cb => {
                formData.condicoes.push(cb.value);
            });
            formData.interferencias = [];
            document.querySelectorAll('input[name="interferencia"]:checked').forEach(cb => {
                formData.interferencias.push(cb.value);
            });
            break;
        case 6:
            formData.historicoPoda = document.getElementById('historicoPoda')?.value || '';
            formData.observacoes = document.getElementById('observacoes')?.value || '';
            const intervencaoRadio = document.querySelector('input[name="intervencao"]:checked');
            if (intervencaoRadio) formData.intervencao = intervencaoRadio.value;
            const mesRadio = document.querySelector('input[name="mesPoda"]:checked');
            if (mesRadio) formData.mesPoda = mesRadio.value;
            break;
    }
}

// ========================================
// SEARCHABLE SELECT (Espécies)
// ========================================

function initSearchableSelects() {
    const searchInput = document.getElementById('especieSearch');
    const resultsContainer = document.getElementById('especieResults');
    const hiddenInput = document.getElementById('especie');
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (query.length < 1) {
            resultsContainer.classList.remove('active');
            return;
        }
        
        const filtered = especiesComuns.filter(esp => 
            esp.toLowerCase().includes(query)
        );
        
        let html = '';
        
        if (filtered.length > 0) {
            filtered.slice(0, 6).forEach(esp => {
                html += `
                    <div class="search-item" data-value="${esp}">
                        <i class="fas fa-leaf"></i>
                        <span>${esp}</span>
                    </div>
                `;
            });
        }
        
        html += `
            <div class="search-item new-item" data-value="${query}">
                <i class="fas fa-plus-circle"></i>
                <span>Adicionar "${query}"</span>
            </div>
        `;
        
        resultsContainer.innerHTML = html;
        resultsContainer.classList.add('active');
        
        resultsContainer.querySelectorAll('.search-item').forEach(item => {
            item.addEventListener('click', () => {
                const value = item.dataset.value;
                searchInput.value = value;
                hiddenInput.value = value;
                resultsContainer.classList.remove('active');
                formData.especie = value;
            });
        });
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            resultsContainer.classList.remove('active');
        }
    });
}

// ========================================
// GPS
// ========================================

function initGPS() {
    const captureBtn = document.getElementById('captureGps');
    const gpsDisplay = document.getElementById('gpsDisplay');
    
    if (!captureBtn) return;
    
    captureBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            showToast('Geolocalização não suportada');
            return;
        }
        
        captureBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Capturando...';
        captureBtn.disabled = true;
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                
                formData.latitude = latitude.toFixed(8);
                formData.longitude = longitude.toFixed(8);
                
                document.getElementById('latitude').value = formData.latitude;
                document.getElementById('longitude').value = formData.longitude;
                
                gpsDisplay.innerHTML = `
                    <div class="gps-pulse"></div>
                    <i class="fas fa-check-circle"></i>
                    <span>Lat: ${formData.latitude}<br>Long: ${formData.longitude}</span>
                `;
                gpsDisplay.classList.add('active');
                
                captureBtn.innerHTML = '<i class="fas fa-check"></i> Capturado';
                captureBtn.style.background = 'linear-gradient(135deg, var(--success) 0%, #45a049 100%)';
                
                showToast('Coordenadas capturadas com sucesso!');
            },
            (error) => {
                let errorMsg = 'Erro ao capturar GPS';
                if (error.code === error.PERMISSION_DENIED) errorMsg = 'Permissão negada';
                else if (error.code === error.POSITION_UNAVAILABLE) errorMsg = 'Indisponível';
                else if (error.code === error.TIMEOUT) errorMsg = 'Tempo limite';
                
                captureBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Tentar novamente';
                captureBtn.disabled = false;
                showToast(errorMsg);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });
}

// ========================================
// UPLOAD DE FOTOS
// ========================================

function initPhotoUploads() {}

function triggerUpload(photoNumber) {
    const input = document.getElementById(`photo${photoNumber}`);
    input.click();
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const preview = document.getElementById(`preview${photoNumber}`);
            preview.src = event.target.result;
            preview.style.display = 'block';
            
            const card = input.closest('.card-photo');
            card.querySelector('.photo-upload').classList.add('has-photo');
            card.querySelector('.photo-content').style.display = 'none';
            
            showToast(`Foto ${photoNumber} adicionada!`);
        };
        reader.readAsDataURL(file);
    }, { once: true });
}

// ========================================
// RESUMO
// ========================================

function updateSummary() {
    const summaryContent = document.getElementById('summaryContent');
    if (!summaryContent) return;
    
    collectStepData(currentStep);
    
    const localMap = {
        'calcada': 'Calçada', 'praca': 'Praça/Parque', 'canteiro': 'Canteiro Central',
        'privada': 'Privada', 'area_verde': 'Área Verde'
    };
    
    const intervencaoMap = {
        'nenhuma': 'Nenhuma', 'limpeza': 'Poda de Limpeza',
        'adequacao': 'Adequação', 'urgente': 'Urgente'
    };
    
    const mesMap = {
        'jan': 'Janeiro', 'fev': 'Fevereiro', 'mar': 'Março', 'abr': 'Abril',
        'mai': 'Maio', 'jun': 'Junho', 'jul': 'Julho', 'ago': 'Agosto',
        'set': 'Setembro', 'out': 'Outubro', 'nov': 'Novembro', 'dez': 'Dezembro'
    };
    
    const html = `
        <div class="summary-item">
            <label>Endereço</label>
            <span>${formData.logradouro || 'Não informado'}</span>
        </div>
        <div class="summary-item">
            <label>Local</label>
            <span>${localMap[formData.localPlantio] || 'Não selecionado'}</span>
        </div>
        <div class="summary-item">
            <label>Espécie</label>
            <span>${formData.especie || 'Não identificada'}</span>
        </div>
        <div class="summary-item">
            <label>Porte</label>
            <span>${formData.porte ? formData.porte.charAt(0).toUpperCase() + formData.porte.slice(1) : 'Não informado'}</span>
        </div>
        <div class="summary-item">
            <label>Intervenção</label>
            <span>${intervencaoMap[formData.intervencao] || 'Não avaliada'}</span>
        </div>
        <div class="summary-item">
            <label>Próxima Poda</label>
            <span>${mesMap[formData.mesPoda] || 'Não definida'}</span>
        </div>
    `;
    
    summaryContent.innerHTML = html;
}

// ========================================
// ENVIO DO FORMULÁRIO
// ========================================

function submitForm() {
    collectStepData(6);
    
    const submitBtn = document.querySelector('.btn-save');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        console.log('Dados do formulário:', formData);
        
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Salvo com sucesso!';
        submitBtn.style.background = 'linear-gradient(135deg, var(--success) 0%, #45a049 100%)';
        submitBtn.classList.add('success-animation');
        
        showToast('Registro salvo com sucesso!');
        
        setTimeout(() => {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Registro';
            submitBtn.style.background = '';
            submitBtn.disabled = false;
            submitBtn.classList.remove('success-animation');
        }, 3000);
    }, 1500);
}

// ========================================
// TOAST
// ========================================

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
