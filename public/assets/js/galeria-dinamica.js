document.addEventListener('DOMContentLoaded', function () {
  const galeriaContainer = document.querySelector('.galeria-container');
  if (!galeriaContainer) return;

  const isLiveServer = location.port === "5500" || location.hostname === "127.0.0.1";
  const apiBase = isLiveServer ? "http://localhost:3000" : "";

  // Criar elementos para transição imersiva
  const overlay = document.createElement('div');
  overlay.className = 'galeria-overlay';
  document.body.appendChild(overlay);

  const galeriaExpandida = document.createElement('div');
  galeriaExpandida.className = 'galeria-expandida';
  document.body.appendChild(galeriaExpandida);

  // Criar modal para visualização de imagem grande
  const imageModal = document.createElement('div');
  imageModal.className = 'image-modal';
  imageModal.innerHTML = `
    <div class="image-modal-content">
      <button class="image-modal-close">&times;</button>
      <img class="image-modal-img" src="" alt="">
      <div class="image-modal-nav">
        <button class="image-modal-prev">‹</button>
        <button class="image-modal-next">›</button>
      </div>
    </div>
  `;
  document.body.appendChild(imageModal);

  let currentImageIndex = 0;
  let currentImages = [];

  function createExpandedGallery(ano) {
    // Gerar 40 fotos de exemplo (você pode substituir pela sua lógica de dados)
    const fotosExemplo = [];
    for (let i = 1; i <= 40; i++) {
      fotosExemplo.push({
        src: `https://picsum.photos/800/800?random=${ano}-${i}`,
        alt: `Foto ${i} do ano ${ano}`
      });
    }

    currentImages = fotosExemplo; // Armazenar imagens para navegação

    galeriaExpandida.innerHTML = `
      <div class="galeria-expandida-header">
        <button class="btn-voltar">&times;</button>
        <h2 class="galeria-expandida-titulo">Galeria ${ano}</h2>
        <p class="galeria-expandida-subtitle">Explore todas as fotos deste ano memorável</p>
      </div>
      <div class="galeria-grid">
        ${fotosExemplo.map((foto, index) => `
          <div class="galeria-grid-item" data-index="${index}">
            <img src="${foto.src}" alt="${foto.alt}" loading="lazy">
          </div>
        `).join('')}
      </div>
    `;

    // Event listener para botão voltar
    const btnVoltar = galeriaExpandida.querySelector('.btn-voltar');
    btnVoltar.addEventListener('click', closeExpandedGallery);

    // Event listeners para clique nas imagens
    const gridItems = galeriaExpandida.querySelectorAll('.galeria-grid-item');
    gridItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const index = parseInt(item.dataset.index);
        openImageModal(index);
      });
    });
  }

  function openExpandedGallery(cardElement, ano) {
    const img = cardElement.querySelector('img');
    const imgRect = img.getBoundingClientRect();

    // Criar imagem de transição
    const transitionImg = document.createElement('img');
    transitionImg.src = img.src;
    transitionImg.className = 'galeria-transition-img';
    transitionImg.style.left = imgRect.left + 'px';
    transitionImg.style.top = imgRect.top + 'px';
    transitionImg.style.width = imgRect.width + 'px';
    transitionImg.style.height = imgRect.height + 'px';
    document.body.appendChild(transitionImg);

    // Mostrar overlay
    overlay.classList.add('active');

    // Criar galeria expandida
    createExpandedGallery(ano);

    // Animar transição
    setTimeout(() => {
      transitionImg.style.left = '50%';
      transitionImg.style.top = '50%';
      transitionImg.style.transform = 'translate(-50%, -50%) scale(2)';
      transitionImg.style.opacity = '0';
      transitionImg.classList.add('zooming');
    }, 100);

    // Mostrar galeria expandida após animação
    setTimeout(() => {
      galeriaExpandida.classList.add('active');
      document.body.removeChild(transitionImg);
    }, 800);

    // Prevenir scroll do body
    document.body.style.overflow = 'hidden';
  }

  function closeExpandedGallery() {
    galeriaExpandida.classList.remove('active');
    
    setTimeout(() => {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }, 300);
  }

  function openImageModal(index) {
    currentImageIndex = index;
    const modalImg = imageModal.querySelector('.image-modal-img');
    modalImg.src = currentImages[index].src;
    modalImg.alt = currentImages[index].alt;
    
    // Garantir que a imagem seja carregada antes de mostrar o modal
    modalImg.onload = function() {
      imageModal.classList.add('active');
    };
    
    // Se a imagem já estiver carregada, mostrar imediatamente
    if (modalImg.complete) {
      imageModal.classList.add('active');
    }
  }

  function closeImageModal() {
    imageModal.classList.remove('active');
  }

  function showPreviousImage() {
    if (currentImageIndex > 0) {
      openImageModal(currentImageIndex - 1);
    }
  }

  function showNextImage() {
    if (currentImageIndex < currentImages.length - 1) {
      openImageModal(currentImageIndex + 1);
    }
  }

  // Event listeners para modal de imagem
  const modalClose = imageModal.querySelector('.image-modal-close');
  const modalPrev = imageModal.querySelector('.image-modal-prev');
  const modalNext = imageModal.querySelector('.image-modal-next');

  modalClose.addEventListener('click', closeImageModal);
  modalPrev.addEventListener('click', showPreviousImage);
  modalNext.addEventListener('click', showNextImage);

  // Fechar modal ao clicar fora da imagem
  imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal) {
      closeImageModal();
    }
  });

  // Event listener para fechar ao clicar no overlay
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeExpandedGallery();
    }
  });

  // Event listener para ESC key e navegação por teclado
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (imageModal.classList.contains('active')) {
        closeImageModal();
      } else if (galeriaExpandida.classList.contains('active')) {
        closeExpandedGallery();
      }
    }
    
    // Navegação por teclado no modal de imagem
    if (imageModal.classList.contains('active')) {
      if (e.key === 'ArrowLeft') {
        showPreviousImage();
      } else if (e.key === 'ArrowRight') {
        showNextImage();
      }
    }
  });

  fetch(`${apiBase}/api/galerias`)
    .then(resp => resp.json())
    .then(galerias => {
      galeriaContainer.innerHTML = '';
      if (!galerias.length) {
        galeriaContainer.innerHTML = '<p style="text-align:center;color:#888;">Nenhuma galeria cadastrada ainda.</p>';
        return;
      }

      galerias.reverse();

      let current = 0;
      const cardsPorVez = 3;

      function renderCards(idx, direction = 'left') {
        // Fade out dos cards atuais
        const currentCards = galeriaContainer.querySelectorAll('.galeria-item-wrapper');
        currentCards.forEach((card, index) => {
          setTimeout(() => {
            card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            card.style.transform = direction === 'left' ? 'translateX(-100px)' : 'translateX(100px)';
            card.style.opacity = '0';
          }, index * 50);
        });

        setTimeout(() => {
          galeriaContainer.innerHTML = '';

          for (let i = idx; i < idx + cardsPorVez && i < galerias.length; i++) {
            const gal = galerias[i];

            // Criar wrapper para card + ano
            const wrapper = document.createElement('div');
            wrapper.className = 'galeria-item-wrapper';
            
            // Posicionar inicialmente fora da tela (direção oposta)
            wrapper.style.transform = direction === 'left' ? 'translateX(100px)' : 'translateX(-100px)';
            wrapper.style.opacity = '0';
            wrapper.style.transition = 'transform 0.4s ease, opacity 0.4s ease';

            // Criar card da galeria
            const item = document.createElement('div');
            item.className = 'galeria-item';
            item.innerHTML = `<img src="${gal.imagem}" alt="Imagem do ano ${gal.ano}">`;

            // Adicionar event listener para transição imersiva
            item.addEventListener('click', () => {
              openExpandedGallery(item, gal.ano);
            });

            // Criar bloco do ano
            const ano = document.createElement('div');
            ano.className = 'ano-bloco';
            ano.innerHTML = `<h2>${gal.ano}</h2>`;

            // Montar estrutura: wrapper > item + ano
            wrapper.appendChild(item);
            wrapper.appendChild(ano);
            galeriaContainer.appendChild(wrapper);
          }

          // Animar entrada de cada card com delay escalonado
          const newCards = galeriaContainer.querySelectorAll('.galeria-item-wrapper');
          newCards.forEach((card, index) => {
            setTimeout(() => {
              card.style.transform = 'translateX(0)';
              card.style.opacity = '1';
            }, index * 100 + 100);
          });
        }, 400);
      }

      // Renderização inicial sem animação
      galeriaContainer.innerHTML = '';
      for (let i = 0; i < cardsPorVez && i < galerias.length; i++) {
        const gal = galerias[i];

        // Criar wrapper para card + ano
        const wrapper = document.createElement('div');
        wrapper.className = 'galeria-item-wrapper';

        // Criar card da galeria
        const item = document.createElement('div');
        item.className = 'galeria-item';
        item.innerHTML = `<img src="${gal.imagem}" alt="Imagem do ano ${gal.ano}">`;

        // Adicionar event listener para transição imersiva
        item.addEventListener('click', () => {
          openExpandedGallery(item, gal.ano);
        });

        // Criar bloco do ano
        const ano = document.createElement('div');
        ano.className = 'ano-bloco';
        ano.innerHTML = `<h2>${gal.ano}</h2>`;

        // Montar estrutura: wrapper > item + ano
        wrapper.appendChild(item);
        wrapper.appendChild(ano);
        galeriaContainer.appendChild(wrapper);
      }

      const btnEsq = document.getElementById('seta-esquerda');
      const btnDir = document.getElementById('seta-direita');

      if (btnEsq && btnDir) {
        btnEsq.onclick = () => {
          if (current > 0) {
            current--;
            renderCards(current, 'right'); // Cards vêm da direita
          }
        };

        btnDir.onclick = () => {
          if (current + cardsPorVez < galerias.length) {
            current++;
            renderCards(current, 'left'); // Cards vêm da esquerda
          }
        };
      }
    })
    .catch(() => {
      galeriaContainer.innerHTML = '<p style="text-align:center;color:red;">Erro ao carregar galerias.</p>';
    });
});