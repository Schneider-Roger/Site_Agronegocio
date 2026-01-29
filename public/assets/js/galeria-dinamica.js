document.addEventListener('DOMContentLoaded', function () {
  // =====================
  // INFINITE LOGO CAROUSEL LOOP (mantido do site)
  // =====================
  function setupInfiniteLogoLoop() {
    const selectors = ['.setor-hover-panel .logos-container', '.carrossel-logos'];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(container => {
        if (container.dataset.infiniteLoop === '1') return;
        container.dataset.infiniteLoop = '1';
        const children = Array.from(container.children).filter(n => n.nodeType === 1);
        if (children.length < 2) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'logos-infinite-wrapper';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.flexWrap = 'nowrap';
        const computedGap = window.getComputedStyle(container).gap || '0px';
        wrapper.style.gap = computedGap;
        while (container.firstChild) {
          wrapper.appendChild(container.firstChild);
        }
        const originalChildren = Array.from(wrapper.children);
        const cloneFragment = document.createDocumentFragment();
        originalChildren.forEach(child => {
          cloneFragment.appendChild(child.cloneNode(true));
        });
        wrapper.appendChild(cloneFragment);
        container.appendChild(wrapper);
        const imgs = wrapper.querySelectorAll('img');
        let loaded = 0;
        if (imgs.length === 0) {
          startLoop();
        } else {
          imgs.forEach(img => {
            if (img.complete) {
              loaded++;
              if (loaded === imgs.length) startLoop();
            } else {
              img.onload = img.onerror = () => {
                loaded++;
                if (loaded === imgs.length) startLoop();
              };
            }
          });
        }
        function startLoop() {
          let logosWidth = 0;
          const gapPx = parseFloat(computedGap) || 0;
          for (let i = 0; i < originalChildren.length; i++) {
            const el = originalChildren[i];
            const style = window.getComputedStyle(el);
            const marginL = parseFloat(style.marginLeft) || 0;
            const marginR = parseFloat(style.marginRight) || 0;
            logosWidth += el.getBoundingClientRect().width + marginL + marginR;
            if (i < originalChildren.length - 1) logosWidth += gapPx;
          }
          if (logosWidth === 0) return;
          let pos = 0;
          const speed = 0.5;
          function animate() {
            pos -= speed;
            if (Math.abs(pos) >= logosWidth) {
              pos = 0;
            }
            wrapper.style.transform = `translateX(${pos}px)`;
            requestAnimationFrame(animate);
          }
          animate();
        }
      });
    });
  }
  setTimeout(setupInfiniteLogoLoop, 300);
  window.addEventListener('resize', () => {
    document.querySelectorAll('.logos-infinite-wrapper').forEach(w => {
      const parent = w.parentNode;
      while (w.firstChild) parent.insertBefore(w.firstChild, w);
      parent.removeChild(w);
      if (parent.dataset) parent.dataset.infiniteLoop = '';
    });
    setTimeout(setupInfiniteLogoLoop, 200);
  });

  // =====================
  // GALERIA DINÂMICA DE FOTOS
  // =====================
  const galeriaContainer = document.getElementById('galeria-container');
  let galeriaData = [];
  let currentModal = {
    ano: null,
    fotos: [],
    idx: 0
  };

  // Carrega o JSON de galerias
  fetch('/data/galerias.json')
    .then(r => r.json())
    .then(data => {
      galeriaData = Array.isArray(data) ? data : [];
      renderGalerias();
    })
    .catch(() => {
      galeriaContainer.innerHTML = '<div style="color:#900;text-align:center;font-size:1.2em;">Erro ao carregar galeria.</div>';
    });

  // ========== NOVA INTERAÇÃO: ZOOM E TRANSIÇÃO PARA GALERIA EXPANDIDA ==========
  function renderGalerias() {
    if (!galeriaData.length) {
      galeriaContainer.innerHTML = '<div style="color:#666;text-align:center;font-size:1.1em;">Nenhuma galeria disponível no momento.</div>';
      return;
    }
    galeriaData.sort((a, b) => (b.ano || '').localeCompare(a.ano || ''));
    galeriaContainer.innerHTML = '';
    galeriaData.forEach(gal => {
      const wrapper = document.createElement('div');
      wrapper.className = 'galeria-item-wrapper';
      // Card de capa do ano
      const capa = document.createElement('div');
      capa.className = 'galeria-item galeria-capa-ano';
      const img = document.createElement('img');
      img.src = gal.imagem || (gal.fotos && gal.fotos[0]) || '';
      img.alt = `Galeria ${gal.ano}`;
      img.loading = 'lazy';
      img.tabIndex = 0;
      capa.appendChild(img);
      // Bloco do ano
      const anoBloco = document.createElement('div');
      anoBloco.className = 'ano-bloco';
      anoBloco.innerHTML = `<h2>${gal.ano}</h2>`;
      wrapper.appendChild(capa);
      wrapper.appendChild(anoBloco);
      galeriaContainer.appendChild(wrapper);

      // Interação: zoom + transição
      capa.addEventListener('click', () => animateZoomAndExpand(wrapper, gal));
      capa.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') animateZoomAndExpand(wrapper, gal);
      });
    });
  }

  // ========== EFEITO DE ZOOM E TRANSIÇÃO ==========
  function animateZoomAndExpand(wrapper, gal) {
    // Cria overlay escuro
    let overlay = document.querySelector('.galeria-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'galeria-overlay';
      document.body.appendChild(overlay);
    }
    overlay.classList.add('active');

    // Clona o card clicado para animar
    const rect = wrapper.getBoundingClientRect();
    const clone = wrapper.cloneNode(true);
    clone.classList.add('galeria-transition-img');
    clone.style.position = 'fixed';
    clone.style.left = rect.left + 'px';
    clone.style.top = rect.top + 'px';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
    clone.style.margin = '0';
    clone.style.zIndex = 1001;
    clone.style.boxShadow = '0 8px 32px rgba(0,0,0,0.25)';
    document.body.appendChild(clone);

    // Calcula destino centralizado
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const targetW = Math.min(600, vw * 0.9);
    const targetH = Math.min(800, vh * 0.8);
    const targetX = (vw - targetW) / 2;
    const targetY = (vh - targetH) / 2;

    // Animação de zoom (Web Animations API)
    // Efeito mais suave e bonito: scale maior, fade, blur leve, duração maior
    clone.animate([
      {
        left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: rect.height + 'px',
        transform: 'scale(1)', filter: 'blur(0px)', opacity: 1
      },
      {
        left: targetX + 'px', top: targetY + 'px', width: targetW + 'px', height: targetH + 'px',
        transform: 'scale(1.22)', filter: 'blur(4px)', opacity: 0.7
      }
    ], {
      duration: 950,
      easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      fill: 'forwards'
    });

    setTimeout(() => {
      showGaleriaExpandida(gal, overlay, clone);
    }, 950);
  }

  // ========== GALERIA EXPANDIDA ==========
  function showGaleriaExpandida(gal, overlay, clone) {
    // Cria container da galeria expandida se não existir
    let expandida = document.querySelector('.galeria-expandida');
    if (!expandida) {
      expandida = document.createElement('div');
      expandida.className = 'galeria-expandida';
      document.body.appendChild(expandida);
    }
    expandida.innerHTML = `
      <div class="galeria-expandida-header">
        <button class="btn-voltar" title="Voltar" aria-label="Voltar">&#8592;</button>
        <div class="galeria-expandida-titulo">${gal.ano}</div>
        <div class="galeria-expandida-subtitle">Veja todos os registros do evento</div>
      </div>
      <div class="galeria-grid">
        ${(gal.fotos||[]).map(foto => `
          <div class="galeria-grid-item"><img src="${foto}" alt="Foto ${gal.ano}" loading="lazy"></div>
        `).join('')}
      </div>
    `;
    expandida.classList.add('active');

    // Fecha galeria expandida
    expandida.querySelector('.btn-voltar').onclick = () => {
      expandida.classList.remove('active');
      overlay.classList.remove('active');
      setTimeout(() => {
        expandida.innerHTML = '';
        clone.remove();
      }, 400);
    };

    // Clique fora da galeria fecha também
    overlay.onclick = () => {
      expandida.classList.remove('active');
      overlay.classList.remove('active');
      setTimeout(() => {
        expandida.innerHTML = '';
        clone.remove();
      }, 400);
    };
  }

  // =====================
  // MODAL DE IMAGEM AMPLIADA
  // =====================
  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('image-modal-img');
  const modalClose = document.getElementById('image-modal-close');
  const modalPrev = document.getElementById('image-modal-prev');
  const modalNext = document.getElementById('image-modal-next');

  function openModal(ano, fotos, idx) {
    currentModal.ano = ano;
    currentModal.fotos = fotos;
    currentModal.idx = idx;
    showModalImg();
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
  function showModalImg() {
    if (!currentModal.fotos.length) return;
    modalImg.src = currentModal.fotos[currentModal.idx];
    modalImg.alt = `Foto ${currentModal.idx + 1} - ${currentModal.ano}`;
  }
  function prevModalImg() {
    if (!currentModal.fotos.length) return;
    currentModal.idx = (currentModal.idx - 1 + currentModal.fotos.length) % currentModal.fotos.length;
    showModalImg();
  }
  function nextModalImg() {
    if (!currentModal.fotos.length) return;
    currentModal.idx = (currentModal.idx + 1) % currentModal.fotos.length;
    showModalImg();
  }
  modalClose.addEventListener('click', closeModal);
  modalPrev.addEventListener('click', prevModalImg);
  modalNext.addEventListener('click', nextModalImg);
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (!modal.classList.contains('show')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') prevModalImg();
    if (e.key === 'ArrowRight') nextModalImg();
  });
});