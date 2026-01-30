document.addEventListener('DOMContentLoaded', function() {
  const fotosGrid = document.getElementById('fotos-grid');
  const form = document.getElementById('form-fotos');
  const status = document.getElementById('status-fotos');
  const titulo = document.getElementById('galeria-titulo');

  const apiBase = getApiBase();

  function getApiBase() {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost && window.location.port && window.location.port !== '3000') {
      return 'http://localhost:3000';
    }
    return '';
  }

  function buildApiUrl(path) {
    return `${apiBase}${path}`;
  }

  function buildAssetUrl(path) {
    return `${apiBase}${path}`;
  }

  function normalizePath(value) {
    if (!value || typeof value !== 'string') return value;
    try {
      if (value.startsWith('http://') || value.startsWith('https://')) {
        return new URL(value).pathname;
      }
    } catch (e) {
      // ignore parse errors
    }
    return value;
  }

  // read galeriaId or fallback ano+imagem from query
  const params = new URLSearchParams(window.location.search);
  let galeriaId = params.get('galeriaId');
  const fallbackAno = params.get('ano');
  const fallbackImagem = params.get('imagem');

  async function resolveGaleriaIfNeeded() {
    if (galeriaId) return galeriaId;
    try {
      const resp = await fetch(buildApiUrl('/api/galerias'));
      const all = await resp.json();
      // try to match by imagem (exact) then by ano
      if (fallbackImagem) {
        const decodedImg = normalizePath(decodeURIComponent(fallbackImagem));
        const found = all.find(g => {
          const img = normalizePath(g.imagem);
          const fotos = Array.isArray(g.fotos) ? g.fotos.map(normalizePath) : [];
          return img === decodedImg || fotos.includes(decodedImg);
        });
        if (found) {
          galeriaId = found.id;
          return galeriaId;
        }
      }
      if (fallbackAno) {
        const found = all.find(g => String(g.ano) === String(fallbackAno));
        if (found) {
          galeriaId = found.id;
          return galeriaId;
        }
      }
    } catch (e) {
      console.error('Erro ao resolver galeria por fallback:', e);
    }
    return null;
  }

  async function loadGaleria() {
    try {
      if (!galeriaId) {
        galeriaId = await resolveGaleriaIfNeeded();
        if (!galeriaId) {
          alert('Galeria não especificada ou não encontrada.');
          return;
        }
      }
      const resp = await fetch(buildApiUrl(`/api/galerias/${encodeURIComponent(galeriaId)}`));
      if (!resp.ok) throw new Error('Galeria não encontrada');
      const gal = await resp.json();
      titulo.textContent = `Gerenciar Fotos — ${gal.ano || ''}`;
      renderFotos(gal.fotos || []);
    } catch (e) {
      console.error(e);
      alert('Erro ao carregar galeria.');
    }
  }

  function renderFotos(fotos) {
    fotosGrid.innerHTML = '';
    fotos.forEach(f => {
      const card = document.createElement('div');
      card.className = 'galeria-card';

      const img = document.createElement('img');
      img.className = 'galeria-capa';
      img.src = buildAssetUrl(f);
      img.alt = '';

      const body = document.createElement('div');
      body.className = 'galeria-body';

      const actions = document.createElement('div');
      actions.className = 'galeria-actions';

      const del = document.createElement('button');
      del.className = 'btn-excluir-galeria';
      del.textContent = 'Remover foto';
      del.addEventListener('click', async () => {
        if (!confirm('Remover esta foto?')) return;
        try {
          // ensure we have a resolved galeriaId (fallback resolver)
          const idResolved = await resolveGaleriaIfNeeded();
          if (!idResolved) {
            alert('Galeria não encontrada. Atualize a página e tente novamente.');
            return;
          }
          const r = await fetch(buildApiUrl(`/api/galerias/${encodeURIComponent(galeriaId)}/fotos`), {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ foto: f })
          });
          const data = await r.json();
          if (data && data.success) {
            renderFotos(data.fotos || []);
          } else {
            alert(data.error || 'Erro ao remover foto');
          }
        } catch (err) {
          alert('Erro ao conectar ao servidor');
        }
      });

      actions.appendChild(del);
      body.appendChild(actions);
      card.appendChild(img);
      card.appendChild(body);
      fotosGrid.appendChild(card);
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.textContent = '';
      const fd = new FormData(form);
      try {
        const idResolved = await resolveGaleriaIfNeeded();
        if (!idResolved) {
          alert('Galeria não encontrada. Atualize a página e tente novamente.');
          return;
        }
        const resp = await fetch(buildApiUrl(`/api/galerias/${encodeURIComponent(galeriaId)}/fotos`), {
          method: 'POST',
          body: fd
        });
        const data = await resp.json();
        if (data && data.success) {
          status.textContent = 'Fotos adicionadas com sucesso.';
          form.reset();
          renderFotos(data.fotos || []);
        } else {
          status.textContent = data.error || 'Erro ao adicionar fotos.';
        }
      } catch (err) {
        status.textContent = 'Erro ao conectar ao servidor.';
      }
    });
  }

  loadGaleria();
});
