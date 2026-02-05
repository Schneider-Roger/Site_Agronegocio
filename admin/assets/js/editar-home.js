/**
 * EDITAR HOME - JAVASCRIPT
 * Funcionalidades específicas da página editar-home.html
 */

// ===== TOGGLE MODO LISTA/CARROSSEL =====
const API_BASE = getApiBase();

document.addEventListener('DOMContentLoaded', function() {
  initToggleViewMode();
  initImagePreviews();
  initFormSubmission();
  loadHomeData();
});

function getApiBase() {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocalhost && window.location.port && window.location.port !== '3000') {
    return 'http://localhost:3000';
  }
  return '';
}

function buildApiUrl(path) {
  return `${API_BASE}${path}`;
}

function buildAssetUrl(path) {
  return `${API_BASE}${path}`;
}

/**
 * Inicializa o toggle entre modo lista e carrossel
 */
function initToggleViewMode() {
  const toggleBtn = document.getElementById('toggle-view-mode');
  const container = document.getElementById('conteudo-container');
  
  if (!toggleBtn || !container) return;
  
  let isCarrousselMode = false;

  toggleBtn.addEventListener('click', function() {
    isCarrousselMode = !isCarrousselMode;
    
    // Adiciona animação suave
    container.style.opacity = '0.7';
    
    setTimeout(() => {
      if (isCarrousselMode) {
        container.classList.remove('modo-lista');
        container.classList.add('modo-carrossel');
        toggleBtn.innerHTML = '<span class="icon">🎠</span><span class="text">Modo Carrossel</span>';
        
        // Armazena preferência no localStorage
        localStorage.setItem('conteudo-view-mode', 'carrossel');
      } else {
        container.classList.remove('modo-carrossel');
        container.classList.add('modo-lista');
        toggleBtn.innerHTML = '<span class="icon">📋</span><span class="text">Modo Lista</span>';
        
        // Armazena preferência no localStorage
        localStorage.setItem('conteudo-view-mode', 'lista');
      }
      
      container.style.opacity = '1';
    }, 150);
  });

  // Restaura preferência salva
  const savedMode = localStorage.getItem('conteudo-view-mode');
  if (savedMode === 'carrossel') {
    toggleBtn.click();
  }
}

/**
 * Inicializa os previews de imagem
 */
function initImagePreviews() {
  // Preview modularizado
  addImagePreview('banner', 'banner-preview');
  addImagePreview('fotos', 'fotos-preview');
  
  // Preview para os cards da sessão "O QUE ESPERAR"
  for (let i = 1; i <= 8; i++) {
    initOqueEsperarCardPreview(i);
  }
  
  // Preview do mapa da feira (imagem ou PDF)
  addImagePreview('mapa_imagem', 'mapa-preview', { allowPdf: true, mapaStyle: true });
  
  // SEÇÃO A FEIRA - Gerenciamento individual com indicadores de status
  for (let i = 1; i <= 3; i++) {
    const input = document.getElementById(`afeira_imagem${i}`);
    const preview = document.getElementById(`afeira-imagem${i}-preview`);
    const statusElement = document.getElementById(`afeira-status-${i}`);
    
    if (input && preview) {
      input.addEventListener('change', function(e) {
        const formSection = this.closest('.form-section');
        
        if (this.files && this.files.length > 0) {
          // Mostrar preview da nova imagem
          const img = document.createElement('img');
          img.src = URL.createObjectURL(this.files[0]);
          img.alt = `Preview Imagem ${i}`;
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          img.style.maxHeight = '200px';
          img.style.objectFit = 'contain';
          img.style.borderRadius = '4px';
          
          preview.innerHTML = '';
          preview.appendChild(img);
          
          // Atualizar status para "preview"
          if (statusElement) {
            statusElement.textContent = '⏳ Preview';
            statusElement.className = 'image-status preview';
          }
          
          // Marcar seção como tendo mudanças não salvas
          if (formSection) {
            formSection.classList.add('has-changes');
          }
          
          console.log(`[DEBUG] ⏳ Nova imagem selecionada para posição ${i}`);
        } else {
          // Limpar preview
          preview.innerHTML = '';
          
          // Atualizar status para "vazia"
          if (statusElement) {
            statusElement.textContent = '⭕ Vazia';
            statusElement.className = 'image-status empty';
          }
          
          // Marcar seção como tendo mudanças não salvas
          if (formSection) {
            formSection.classList.add('has-changes');
          }
        }
      });
    }
  }
}

function renderOqueEsperarPreview(preview, text, imgSrc) {
  if (!preview) return;
  preview.innerHTML = '';

  if (imgSrc) {
    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = 'Preview do card';
    preview.appendChild(img);
  }

  if (text) {
    const textEl = document.createElement('div');
    textEl.className = 'oqueesperar-text-preview';
    textEl.textContent = text;
    preview.appendChild(textEl);
  }
}

function initOqueEsperarCardPreview(index) {
  const imgInput = document.getElementById(`oqueesperar_card${index}_img`);
  const textInput = document.getElementById(`oqueesperar_card${index}_texto`);
  const preview = document.getElementById(`oqueesperar_card${index}_preview`);

  if (!preview) return;

  function renderFromState() {
    const text = textInput ? textInput.value.trim() : '';
    const imgSrc = preview.dataset.imgSrc || '';
    renderOqueEsperarPreview(preview, text, imgSrc);
  }

  if (textInput) {
    textInput.addEventListener('input', renderFromState);
  }

  if (imgInput) {
    imgInput.addEventListener('change', function() {
      if (this.files && this.files.length > 0) {
        const url = URL.createObjectURL(this.files[0]);
        preview.dataset.imgSrc = url;
      } else {
        preview.dataset.imgSrc = '';
      }
      renderFromState();
    });
  }
}

/**
 * Função utilitária para adicionar preview de imagem a um input file
 */
function addImagePreview(inputId, previewId, options = {}) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  
  if (!input || !preview) return;
  
  input.addEventListener('change', function(e) {
    preview.innerHTML = '';
    
    if (this.files && this.files.length > 0) {
      // Caso especial para preview de PDF (usado no mapa)
      if (options.allowPdf && this.files[0].type === 'application/pdf') {
        preview.innerHTML = `<span style='color:#994C11;font-weight:bold;'>Arquivo PDF selecionado: ${this.files[0].name}</span>`;
        return;
      }
      
      Array.from(this.files).forEach((file, index) => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = `Preview ${index + 1}`;
        
        // Aplicar estilos específicos se necessário
        if (options.mapaStyle) {
          Object.assign(img.style, {
            maxWidth: '100%',
            height: 'auto',
            maxHeight: '700px',
            width: 'auto',
            display: 'block',
            margin: '0 auto',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            objectFit: 'contain'
          });
        }
        
        preview.appendChild(img);
      });
    }
  });
}

/**
 * Inicializa o envio do formulário
 */
function initFormSubmission() {
  const form = document.getElementById('form-editar-home');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    console.log('[DEBUG] Submit do formulário Editar Home');
    
    // Validação básica - verificar se campos essenciais existem (simplificada)
    const camposEssenciais = ['faixa_titulo'];
    const camposFaltando = [];
    
    camposEssenciais.forEach(campo => {
      const elemento = document.getElementById(campo);
      if (!elemento) {
        camposFaltando.push(campo);
      } else {
        console.log(`[DEBUG] Campo ${campo} encontrado, valor:`, elemento.value?.substring(0, 50) + '...');
      }
    });
    
    if (camposFaltando.length > 0) {
      console.error('[DEBUG] Campos faltando:', camposFaltando);
      showErrorMessage('Erro: campos essenciais não encontrados');
      return;
    }
    
    // Mostrar indicador de carregamento
    showLoadingState();
    
    // Sincroniza arquivos dos previews dos setores
    syncSetorFiles();
    
    // Criar FormData e enviar
    const formData = new FormData(form);

    // Garantir envio de checkboxes mesmo quando desmarcados
    const checkboxesFix = ['contador_data_ativo', 'mapa_ativo', 'material_ativo'];
    checkboxesFix.forEach(name => {
      if (!formData.has(name)) {
        const el = document.getElementById(name);
        formData.append(name, el && el.checked ? 'true' : 'false');
      }
    });
    
    // Debug: listar dados do FormData
    console.log('[DEBUG] === ENVIANDO DADOS ===');
    let camposTexto = 0;
    let arquivos = 0;
    let bannerFiles = 0;
    let afeiraFiles = 0;
    
    for (let pair of formData.entries()) {
      if (typeof pair[1] === 'string') {
        console.log('[DEBUG] Campo texto:', pair[0], '=', pair[1].substring(0, 100) + (pair[1].length > 100 ? '...' : ''));
        camposTexto++;
      } else {
        console.log('[DEBUG] Arquivo:', pair[0], '=', pair[1].name || 'file object');
        if (pair[0].includes('banners')) {
          console.log('[DEBUG] *** BANNER ARQUIVO ENCONTRADO ***:', pair[0], pair[1].name);
          bannerFiles++;
        }
        if (pair[0].includes('afeira_imagem')) {
          console.log('[DEBUG] *** AFEIRA ARQUIVO ENCONTRADO ***:', pair[0], pair[1].name);
          afeiraFiles++;
        }
        arquivos++;
      }
    }
    
    console.log(`[DEBUG] Total: ${camposTexto} campos de texto, ${arquivos} arquivos, ${bannerFiles} arquivos de banner, ${afeiraFiles} arquivos da seção A Feira`);
    console.log('[DEBUG] === FIM DOS DADOS ===');
    
    // Enviar dados para o backend
    fetch(buildApiUrl('/api/home'), {
      method: 'POST',
      body: formData
    })
    .then(async response => {
      const contentType = response.headers.get('content-type') || '';
      const rawText = await response.text();
      let data = null;
      if (contentType.includes('application/json') && rawText) {
        data = JSON.parse(rawText);
      }
      if (!response.ok) {
        const message = (data && data.error) ? data.error : (rawText || 'Erro ao salvar dados');
        throw new Error(message);
      }
      return data || {};
    })
    .then(data => {
      console.log('[DEBUG] Resposta do backend:', data);
      
      hideLoadingState();
      showSuccessMessage('Dados salvos com sucesso!');
      
      // Verificação: recarregar dados do servidor para confirmar persistência
      setTimeout(() => {
        console.log('[DEBUG] === VERIFICANDO PERSISTÊNCIA ===');
        fetch(buildApiUrl('/api/home'))
          .then(res => res.json())
          .then(dadosVerificacao => {
            console.log('[DEBUG] Dados recarregados do servidor:', Object.keys(dadosVerificacao));
            
            // Verificar se campos específicos foram salvos
            const camposParaVerificar = ['faixa_titulo', 'afeira_titulo', 'local_endereco'];
            let camposSalvos = 0;
            
            camposParaVerificar.forEach(campo => {
              const elemento = document.getElementById(campo);
              if (elemento && dadosVerificacao[campo] && elemento.value === dadosVerificacao[campo]) {
                console.log(`[DEBUG] ✅ Campo ${campo} salvo corretamente`);
                camposSalvos++;
              } else {
                console.log(`[DEBUG] ❌ Campo ${campo} - Problema:`, {
                  formulario: elemento?.value,
                  servidor: dadosVerificacao[campo]
                });
              }
            });
            
            if (camposSalvos === camposParaVerificar.length) {
              console.log('[DEBUG] ✅ Todos os campos foram salvos corretamente!');
              
              // Atualizar status das imagens A Feira para "salva"
              updateAfeiraStatusAfterSave();
            } else {
              console.log('[DEBUG] ⚠️ Alguns campos não foram salvos. Recarregando formulário...');
              // Force reload do formulário
              populateFormFields(dadosVerificacao);
              updateCurrentPreviews(dadosVerificacao);
              loadBanners(dadosVerificacao);
              loadLocalFields(dadosVerificacao);
            }
            
            // Verificar e atualizar banners especificamente
            if (dadosVerificacao.banners && Array.isArray(dadosVerificacao.banners)) {
              console.log('[DEBUG] ✅ Atualizando previews dos banners salvos:', dadosVerificacao.banners.length);
              setTimeout(() => {
                const bannerItems = document.querySelectorAll('.banner-item');
                dadosVerificacao.banners.forEach((banner, index) => {
                  if (bannerItems[index] && banner.src) {
                    const preview = bannerItems[index].querySelector('.banner-preview-item');
                    if (preview) {
                      preview.innerHTML = `<img src="${buildAssetUrl(banner.src)}" alt="Banner ${index+1}" style="max-width:100%;height:auto;max-height:200px;object-fit:contain;border-radius:4px;">`;
                      console.log(`[DEBUG] ✅ Preview do banner ${index+1} atualizado`);
                    }
                  }
                });
              }, 500);
            } else if (dadosVerificacao.banner) {
              console.log('[DEBUG] ✅ Banner único encontrado (compatibilidade)');
            }
            
            console.log('[DEBUG] === FIM DA VERIFICAÇÃO ===');
          })
          .catch(err => {
            console.error('[DEBUG] Erro ao verificar dados salvos:', err);
          });
      }, 1500);
    })
    .catch(error => {
      console.error('[DEBUG] Erro ao salvar dados:', error);
      hideLoadingState();
      showErrorMessage('Erro ao salvar dados!');
    });
  });
}

/**
 * Sincroniza arquivos dos setores para o submit
 */
function syncSetorFiles() {
  const grid = document.getElementById('expositor-setores-admin-grid');
  const setorDivs = grid?.querySelectorAll('.logos-admin-wrapper') || [];
  
  if (window.setoresPreviewFiles) {
    setorDivs.forEach((wrapper, idx) => {
      console.log(`[DEBUG] Sincronizando arquivos do setor ${idx+1}:`, window.setoresPreviewFiles[idx]);
      
      const inputLogo = wrapper.querySelector('.input-logo-setor');
      const previewFiles = window.setoresPreviewFiles[idx] || [];
      const dt = new DataTransfer();
      
      previewFiles.forEach(f => dt.items.add(f));
      if (inputLogo) {
        inputLogo.files = dt.files;
      }
    });
  }
}

/**
 * Carrega dados atuais da home
 */
function loadHomeData() {
  fetch(buildApiUrl('/api/home'))
    .then(res => res.json())
    .then(data => {
      console.log('[DEBUG] Dados carregados do backend:', data);
      populateFormFields(data);
      updateCurrentPreviews(data);
      loadBanners(data);
      loadLocalFields(data);
    })
    .catch(error => {
      console.error('[DEBUG] Erro ao carregar dados:', error);
      showErrorMessage('Erro ao carregar dados da home');
    });
}

/**
 * Carrega múltiplos banners
 */
function loadBanners(data) {
  console.log('[DEBUG] Carregando banner único - dados recebidos:', { 
    banner: data.banner ? 'existe' : 'undefined',
    banners: data.banners ? data.banners.length : 'undefined' 
  });
  
  // Verifica se há banner único ou converte de múltiplos banners
  let bannerSrc = null;
  
  if (data.banner) {
    bannerSrc = data.banner;
    console.log('[DEBUG] Banner único encontrado:', bannerSrc);
  } else if (data.banners && Array.isArray(data.banners) && data.banners.length > 0) {
    bannerSrc = data.banners[0].arquivo || data.banners[0].src;
    console.log('[DEBUG] Convertendo de múltiplos banners para banner único:', bannerSrc);
  }
  
  // Atualiza o preview do banner se houver imagem
  const preview = document.getElementById('banner-preview');
  if (preview && bannerSrc) {
    preview.innerHTML = `<img src="${buildAssetUrl(bannerSrc)}" alt="Banner" style="max-width:100%;height:auto;max-height:200px;object-fit:contain;border-radius:4px;">`;
    console.log('[DEBUG] Preview do banner atualizado');
  } else if (preview) {
    preview.innerHTML = '';
  }
}

/**
 * Carrega campos do local
 */
function loadLocalFields(data) {
  const enderecoField = document.getElementById('local_endereco');
  const mapsField = document.getElementById('local_maps_url');
  
  if (enderecoField && data.local_endereco) {
    enderecoField.value = data.local_endereco;
  }
  
  if (mapsField && data.local_maps_url) {
    mapsField.value = data.local_maps_url;
  }
}

/**
 * Preenche os campos do formulário com os dados carregados
 */
function populateFormFields(data) {
  console.log('[DEBUG] === PREENCHENDO CAMPOS ===');
  
  // Campos de texto simples - só preenche se o elemento existir
  const fields = [
    'faixa_titulo', 'faixa_texto', 'faixa_botao_texto', 'faixa_botao_url', 
    'afeira_titulo', 'afeira_texto', 'oqueesperar_titulo', 'expositor_titulo',
    'local_endereco'
  ];
  
  fields.forEach(field => {
    const element = document.getElementById(field);
    if (element) {
      if (data[field]) {
        element.value = data[field];
        console.log(`[DEBUG] ✅ Campo ${field} preenchido:`, data[field].substring(0, 50) + '...');
      } else {
        console.log(`[DEBUG] ⚠️ Campo ${field} - sem dados no servidor`);
      }
    } else {
      console.log(`[DEBUG] ❌ Campo ${field} - elemento não encontrado no DOM`);
    }
  });

  // Campo especial para data do contador
  const contadorDataField = document.getElementById('contador_data_feira');
  if (contadorDataField) {
    if (data.contador_data_feira) {
      // Converte timestamp ou string de data para formato datetime-local
      let dataFormatada = '';
      try {
        if (typeof data.contador_data_feira === 'number') {
          // Se for timestamp
          const date = new Date(data.contador_data_feira);
          dataFormatada = date.toISOString().slice(0, 16);
        } else if (typeof data.contador_data_feira === 'string') {
          // Se for string de data, tenta converter
          const date = new Date(data.contador_data_feira);
          if (!isNaN(date.getTime())) {
            // Converte para horário local para o input datetime-local
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            dataFormatada = localDate.toISOString().slice(0, 16);
          } else {
            dataFormatada = data.contador_data_feira;
          }
        }
        contadorDataField.value = dataFormatada;
        console.log('[DEBUG] ✅ Campo contador_data_feira preenchido:', dataFormatada);
        console.log('[DEBUG] Data original:', data.contador_data_feira);
      } catch (error) {
        console.error('[DEBUG] Erro ao converter data do contador:', error);
        console.log('[DEBUG] Data problemática:', data.contador_data_feira);
      }
    } else {
      console.log('[DEBUG] ⚠️ Campo contador_data_feira - sem dados no servidor');
    }
  } else {
    console.log('[DEBUG] ❌ Campo contador_data_feira - elemento não encontrado no DOM');
  }
  
  // Campo especial para maps
  const mapsField = document.getElementById('local_maps_url');
  if (mapsField) {
    if (data.local_maps_url) {
      mapsField.value = data.local_maps_url;
      console.log('[DEBUG] ✅ Campo local_maps_url preenchido:', data.local_maps_url);
    } else {
      console.log('[DEBUG] ⚠️ Campo local_maps_url - sem dados no servidor');
    }
  } else {
    console.log('[DEBUG] ❌ Campo local_maps_url - elemento não encontrado no DOM');
  }
  
  // Checkbox
  if (typeof data.faixa_botao_ativo !== 'undefined') {
    const checkbox = document.getElementById('faixa_botao_ativo');
    if (checkbox) {
      checkbox.checked = !!data.faixa_botao_ativo;
      console.log('[DEBUG] ✅ Checkbox faixa_botao_ativo preenchido:', data.faixa_botao_ativo);
    } else {
      console.log('[DEBUG] ❌ Checkbox faixa_botao_ativo - elemento não encontrado');
    }
  }

  // Checkbox contador data
  if (typeof data.contador_data_ativo !== 'undefined') {
    const checkboxContador = document.getElementById('contador_data_ativo');
    if (checkboxContador) {
      checkboxContador.checked = !!data.contador_data_ativo;
      console.log('[DEBUG] ✅ Checkbox contador_data_ativo preenchido:', data.contador_data_ativo);
    } else {
      console.log('[DEBUG] ❌ Checkbox contador_data_ativo - elemento não encontrado');
    }
  }
  
  // Cards da sessão "O QUE ESPERAR"
  for (let i = 1; i <= 8; i++) {
    const textoField = document.getElementById(`oqueesperar_card${i}_texto`);
    if (textoField && data[`oqueesperar_card${i}_texto`]) {
      textoField.value = data[`oqueesperar_card${i}_texto`];
      console.log(`[DEBUG] ✅ Card ${i} texto preenchido`);
    }
  }
  
  // Setores do expositor
  for (let i = 1; i <= 4; i++) {
    const setorField = document.getElementById(`expositor_setor${i}_texto`);
    if (setorField && data[`expositor_setor${i}_texto`]) {
      setorField.value = data[`expositor_setor${i}_texto`];
      console.log(`[DEBUG] ✅ Setor ${i} texto preenchido`);
    }
  }
  
  console.log('[DEBUG] === FIM DO PREENCHIMENTO ===');
}

/**
 * Atualiza previews com dados atuais
 */
function updateCurrentPreviews(data) {
  // Imagens da sessão "A Feira" - NOVO SISTEMA COM INPUTS INDIVIDUAIS
  if (data.afeira_imagens && Array.isArray(data.afeira_imagens)) {
    updateAfeiraIndividualPreviews(data.afeira_imagens);
  }
  
  // Cards da sessão "O QUE ESPERAR"
  for (let i = 1; i <= 8; i++) {
    const cardImg = data[`oqueesperar_card${i}_img`];
    const cardText = data[`oqueesperar_card${i}_texto`];
    const preview = document.getElementById(`oqueesperar_card${i}_preview`);
    if (!preview) continue;
    if (cardImg) {
      preview.dataset.imgSrc = buildAssetUrl(cardImg);
      renderOqueEsperarPreview(preview, cardText || '', preview.dataset.imgSrc);
    } else {
      preview.dataset.imgSrc = '';
      renderOqueEsperarPreview(preview, cardText || '', '');
    }
  }
  
  // Mapa
  if (data.mapa_imagem) {
    updateMapaPreview(data.mapa_imagem);
  }
}

/**
 * Atualiza previews individuais das imagens da sessão "A Feira"
 * Sistema novo com 3 inputs separados
 */
function updateAfeiraIndividualPreviews(images) {
  console.log('[DEBUG] Atualizando previews individuais da Feira:', images);
  
  // Para cada um dos 3 inputs de imagem
  for (let i = 1; i <= 3; i++) {
    const preview = document.getElementById(`afeira-imagem${i}-preview`);
    const statusElement = document.getElementById(`afeira-status-${i}`);
    const formSection = preview ? preview.closest('.form-section') : null;
    
    if (preview) {
      // Limpa o preview primeiro
      preview.innerHTML = '';
      
      // Se há uma imagem para esta posição, mostra ela
      if (images && images[i-1]) {
        const img = document.createElement('img');
        img.src = `${buildAssetUrl(images[i-1])}`;
        img.alt = `Imagem ${i} da Sessão A Feira`;
        preview.appendChild(img);
        console.log(`[DEBUG] ✅ Preview ${i} atualizado com:`, images[i-1]);
        
        // Atualizar status para "salva"
        if (statusElement) {
          statusElement.textContent = '✅ Salva';
          statusElement.className = 'image-status saved';
        }
        
        // Remover indicador de mudanças não salvas
        if (formSection) {
          formSection.classList.remove('has-changes');
        }
      } else {
        console.log(`[DEBUG] ⚠️ Preview ${i} - sem imagem para exibir`);
        
        // Atualizar status para "vazia"
        if (statusElement) {
          statusElement.textContent = '⭕ Vazia';
          statusElement.className = 'image-status empty';
        }
        
        // Remover indicador de mudanças não salvas
        if (formSection) {
          formSection.classList.remove('has-changes');
        }
      }
    } else {
      console.log(`[DEBUG] ❌ Preview ${i} - elemento não encontrado no DOM`);
    }
  }
}

/**
 * Atualiza preview do mapa
 */
function updateMapaPreview(mapaImagem) {
  const preview = document.getElementById('mapa-preview');
  if (!preview) return;
  
  if (mapaImagem.endsWith('.pdf')) {
    preview.innerHTML = `<a href="${buildAssetUrl(mapaImagem)}" download style="color:#994C11;font-weight:bold;">Download do Mapa (PDF)</a>`;
  } else {
    preview.innerHTML = `<img src="${buildAssetUrl(mapaImagem)}" alt="Mapa da Feira" style="max-width:100%;height:auto;max-height:700px;width:auto;display:block;margin:0 auto;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.08);object-fit:contain;">`;
  }
}

/**
 * Atualiza status das imagens A Feira após salvamento
 */
function updateAfeiraStatusAfterSave() {
  console.log('[DEBUG] 🔄 Atualizando status das imagens A Feira após salvamento');
  
  for (let i = 1; i <= 3; i++) {
    const statusElement = document.getElementById(`afeira-status-${i}`);
    const preview = document.getElementById(`afeira-imagem${i}-preview`);
    const formSection = preview ? preview.closest('.form-section') : null;
    
    if (statusElement && preview && preview.children.length > 0) {
      // Se há preview (imagem), marcar como salva
      statusElement.textContent = '✅ Salva';
      statusElement.className = 'image-status saved';
      
      // Remover indicador de mudanças não salvas
      if (formSection) {
        formSection.classList.remove('has-changes');
      }
      
      console.log(`[DEBUG] ✅ Status da imagem ${i} atualizado para "salva"`);
    } else if (statusElement) {
      // Se não há preview, marcar como vazia
      statusElement.textContent = '⭕ Vazia';
      statusElement.className = 'image-status empty';
      
      // Remover indicador de mudanças não salvas
      if (formSection) {
        formSection.classList.remove('has-changes');
      }
    }
  }
}

/**
 * Atualiza preview do mapa (Função única)
 */
function updateMapaPreview(mapaPath) {
  const preview = document.getElementById('mapa-preview');
  if (!preview) return;
  
  if (mapaPath.endsWith('.pdf')) {
    preview.innerHTML = `<a href="${buildAssetUrl(mapaPath)}" download style="color:#994C11;font-weight:bold;">Download do Mapa (PDF)</a>`;
  } else {
    preview.innerHTML = `<img src="${buildAssetUrl(mapaPath)}" alt="Mapa da Feira" style="max-width:100%;height:auto;max-height:700px;width:auto;display:block;margin:0 auto;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.08);object-fit:contain;">`;
  }
}

/**
 * Estados visuais para feedback do usuário
 */
function showLoadingState() {
  const cards = document.querySelectorAll('.conteudo-card');
  cards.forEach(card => card.classList.add('loading'));
  
  const submitBtn = document.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Salvando...';
  }
}

function hideLoadingState() {
  const cards = document.querySelectorAll('.conteudo-card');
  cards.forEach(card => card.classList.remove('loading'));
  
  const submitBtn = document.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Salvar Alterações';
  }
}

function showSuccessMessage(message) {
  // Criar toast de sucesso
  const toast = createToast(message, 'success');
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function showErrorMessage(message) {
  // Criar toast de erro
  const toast = createToast(message, 'error');
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 5000);
}

function createToast(message, type) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  Object.assign(toast.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 20px',
    borderRadius: '8px',
    color: 'white',
    fontWeight: '600',
    zIndex: '9999',
    animation: 'slideInRight 0.3s ease-out',
    background: type === 'success' ? '#28a745' : '#dc3545'
  });
  
  return toast;
}

// ===== UTILITÁRIOS GLOBAIS =====

/**
 * Debounce function para otimizar eventos
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Validar formulário antes do envio
 */
function validateForm() {
  const requiredFields = ['titulo', 'descricao'];
  let isValid = true;
  
  requiredFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field && !field.value.trim()) {
      field.style.borderColor = '#dc3545';
      isValid = false;
    } else if (field) {
      field.style.borderColor = '#e9ecef';
    }
  });
  
  return isValid;
}

// CSS adicional para animações
const additionalStyles = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .toast {
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
`;

// Adicionar estilos ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
