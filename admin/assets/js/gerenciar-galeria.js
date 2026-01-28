// Script para adicionar nova galeria via formulário

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('form-galeria');
  const statusMsg = document.getElementById('status-galeria');
  const galeriasGrid = document.getElementById('galerias-grid');
  // one-time auto-normalize flag to avoid loops
  let attemptedNormalize = false;

  // API base: aponta para o backend em mesma máquina na porta 3000
  // (assume servidor backend roda em :3000; é robusto quando a página é servida por Live Server em :5500)
  const apiBase = `${window.location.protocol}//${window.location.hostname}:3000`;

  // Buscar e renderizar galerias
  async function loadGalerias() {
    if (!galeriasGrid) return;
    galeriasGrid.innerHTML = '';
    try {
      const resp = await fetch(apiBase + '/api/galerias');
  const galerias = await resp.json();
  console.log('DEBUG: galerias carregadas:', galerias);
      if (!Array.isArray(galerias) || galerias.length === 0) {
        galeriasGrid.innerHTML = '<p>Nenhuma galeria encontrada.</p>';
        return;
      }
  galerias.forEach((g, idx) => {
        const card = document.createElement('div');
        card.className = 'galeria-card';

        const img = document.createElement('img');
        img.className = 'galeria-capa';
        img.src = g.imagem || '/assets/img/placeholder.png';
        img.alt = 'Capa ' + (g.ano || '');
        // clicar na capa abre gerenciamento de fotos
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
          if (typeof g.id !== 'undefined' && g.id !== null) {
            window.location.href = `./gerenciar-fotos.html?galeriaId=${encodeURIComponent(g.id)}`;
          } else {
            // fallback: pass ano+imagem para localizar a galeria na próxima página
            const imagem = encodeURIComponent(img.src || '');
            const anoParam = encodeURIComponent(g.ano || '');
            window.location.href = `./gerenciar-fotos.html?ano=${anoParam}&imagem=${imagem}`;
          }
        });

        const body = document.createElement('div');
        body.className = 'galeria-body';

        const ano = document.createElement('div');
        ano.className = 'galeria-ano';
        ano.textContent = g.ano || '-';

        const count = document.createElement('div');
        count.className = 'galeria-count';
        const fotosCount = Array.isArray(g.fotos) ? g.fotos.length : (g.fotos ? 1 : 0);
        count.textContent = fotosCount + ' foto' + (fotosCount === 1 ? '' : 's');

        const actions = document.createElement('div');
        actions.className = 'galeria-actions';

        const delBtn = document.createElement('button');
        delBtn.className = 'btn-excluir-galeria';
        delBtn.textContent = 'Excluir';
        // Always attach a click handler: if id exists use it; otherwise try to resolve id via API
        delBtn.addEventListener('click', async () => {
          // If id exists, delete normally
          if (typeof g.id !== 'undefined' && g.id !== null) {
            return handleDeleteGaleria(g.id, card);
          }

          // Try to resolve the gallery id by fetching the current list and matching ano/imagem
          try {
            const resp = await fetch(apiBase + '/api/galerias');
            const list = await resp.json();
            if (Array.isArray(list)) {
              const found = list.find(x => {
                const sameAno = String(x.ano || '') === String(g.ano || '');
                const sameImagem = (x.imagem || '') === (g.imagem || '') || (x.imagem || '') === (img.src || '');
                return sameAno && sameImagem;
              });
              if (found && found.id) {
                return handleDeleteGaleria(found.id, card);
              }
            }
          } catch (e) {
            console.error('Erro ao resolver id da galeria:', e);
          }

          // If still not found, perform fallback removal using the remover endpoint
          if (!confirm('Confirma exclusão desta galeria? Esta ação não pode ser desfeita.')) return;
          try {
            const ano = g.ano;
            const imagem = img.src || g.imagem;
            const resp2 = await fetch(apiBase + '/api/galerias/remover', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: null, ano, imagem })
            });
            const data2 = await resp2.json();
            if (data2 && data2.success) {
              if (card) {
                card.style.transition = 'opacity 0.25s, transform 0.25s';
                card.style.opacity = '0';
                card.style.transform = 'translateY(-8px)';
                setTimeout(() => {
                  if (card.parentNode) card.parentNode.removeChild(card);
                }, 260);
              }
              return;
            } else {
              alert(data2.error || 'Erro ao excluir galeria (fallback).');
            }
          } catch (err) {
            console.error('Erro no fallback remover:', err);
            alert('Erro ao conectar ao servidor (fallback).');
          }
        });

        actions.appendChild(delBtn);

        body.appendChild(ano);
        body.appendChild(count);
        body.appendChild(actions);

        card.appendChild(img);
        card.appendChild(body);

        galeriasGrid.appendChild(card);
      });
        // If some items lack id, attempt a one-time automatic normalization
        const missing = galerias.filter(g => typeof g.id === 'undefined' || g.id === null);
        if (missing.length > 0 && !attemptedNormalize) {
          attemptedNormalize = true;
          console.log('DEBUG: items missing id detected. Triggering server normalization (one-time).');
          try {
            // call GET to trigger server-side normalization and saving
            await fetch(apiBase + '/api/galerias?_force=' + Date.now());
            // reload the list once to pick up normalized ids
            await loadGalerias();
            return; // prevent further processing in this invocation
          } catch (e) {
            console.error('Erro ao solicitar normalização automática:', e);
            // allow UI to render with disabled delete buttons
          }
        }
    } catch (e) {
      galeriasGrid.innerHTML = '<p>Erro ao carregar galerias.</p>';
    }
  }

  async function handleDeleteGaleria(id, cardEl) {
    if (!confirm('Confirma exclusão desta galeria? Esta ação não pode ser desfeita.')) return;
    try {
  console.log('DEBUG: deletando galeria id=', id);
  // Use URL param alt endpoint to avoid body-with-delete issues on some setups
  const resp = await fetch(`${apiBase}/api/galerias/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const data = await resp.json();
  console.log('DEBUG: resposta exclusão', data, 'status', resp.status);
      if (data && data.success) {
        // animação simples de remoção
        if (cardEl) {
          cardEl.style.transition = 'opacity 0.25s, transform 0.25s';
          cardEl.style.opacity = '0';
          cardEl.style.transform = 'translateY(-8px)';
          setTimeout(() => {
            if (cardEl.parentNode) cardEl.parentNode.removeChild(cardEl);
          }, 260);
        }
        return;
      } else {
        // fallback: if id undefined or deletion failed, try POST /api/galerias/remover
        console.warn('DELETE falhou, tentando fallback remover:', data);
      }
    } catch (err) {
      alert('Erro ao conectar ao servidor.');
      return;
    }

    // Fallback attempt: use POST /api/galerias/remover with id/ano/imagem
    try {
      // attempt to extract ano/imagem from the DOM card if available
      const anoEl = cardEl && cardEl.querySelector('.galeria-ano');
      const imgEl = cardEl && cardEl.querySelector('.galeria-capa');
      const ano = anoEl ? anoEl.textContent.trim() : undefined;
      const imagem = imgEl ? imgEl.src : undefined;
      console.log('DEBUG: tentando fallback remover com', { id, ano, imagem });
      const resp2 = await fetch(apiBase + '/api/galerias/remover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ano, imagem })
      });
      const data2 = await resp2.json();
      console.log('DEBUG: resposta fallback remover', data2, 'status', resp2.status);
      if (data2 && data2.success) {
        if (cardEl) {
          cardEl.style.transition = 'opacity 0.25s, transform 0.25s';
          cardEl.style.opacity = '0';
          cardEl.style.transform = 'translateY(-8px)';
          setTimeout(() => {
            if (cardEl.parentNode) cardEl.parentNode.removeChild(cardEl);
          }, 260);
        }
        return;
      } else {
        alert(data2.error || 'Erro ao excluir galeria (fallback).');
      }
    } catch (e) {
      console.error('Erro no fallback remover:', e);
      alert('Erro ao tentar remover galeria (fallback).');
    }
  }

  // Carrega galerias inicialmente
  loadGalerias();

  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      statusMsg.textContent = '';
      const formData = new FormData(form);
      try {
        const apiUrl = apiBase + '/api/galerias';
        const resp = await fetch(apiUrl, {
          method: 'POST',
          body: formData
        });
        const data = await resp.json();
        if (data.success) {
            statusMsg.textContent = 'Galeria adicionada com sucesso!';
            // Tenta extrair id retornado pelo servidor (nome de campo comum: id, galeria.id ou gallery.id)
            const newId = data.id || (data.galeria && data.galeria.id) || (data.gallery && data.gallery.id);
            const submittedAno = formData.get('ano') || '';
            form.reset();
            // Se servidor retornou id, direciona para gerenciar-fotos da nova galeria;
            // caso contrário usa fallback por ano (o gerenciar-fotos tentará localizar pela ano/imagem)
            if (newId) {
              window.location.href = `./gerenciar-fotos.html?galeriaId=${encodeURIComponent(newId)}`;
              return;
            } else {
              // redireciona por ano como fallback
              window.location.href = `./gerenciar-fotos.html?ano=${encodeURIComponent(submittedAno)}`;
              return;
            }
        } else {
          statusMsg.textContent = data.error || 'Erro ao adicionar galeria.';
        }
      } catch (err) {
        statusMsg.textContent = 'Erro ao conectar ao servidor.';
      }
    });
  }
});
