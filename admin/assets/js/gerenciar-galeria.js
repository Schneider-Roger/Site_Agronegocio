// Script para adicionar nova galeria via formulário

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('form-galeria');
  const statusMsg = document.getElementById('status-galeria');

  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      statusMsg.textContent = '';
      const formData = new FormData(form);
      try {
        const apiUrl = window.location.origin.replace(/:5500$/, ':3000') + '/api/galerias';
        const resp = await fetch(apiUrl, {
          method: 'POST',
          body: formData
        });
        const data = await resp.json();
        if (data.success) {
          statusMsg.textContent = 'Galeria adicionada com sucesso!';
          form.reset();
        } else {
          statusMsg.textContent = data.error || 'Erro ao adicionar galeria.';
        }
      } catch (err) {
        statusMsg.textContent = 'Erro ao conectar ao servidor.';
      }
    });
  }
});
