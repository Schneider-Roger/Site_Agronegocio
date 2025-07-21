// =====================
// server.js - Backend principal da aplicação
// =====================
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { getHomeData, saveHomeData, DATA_PATH } = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =====================
// Configuração do multer para upload de imagens
// =====================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // DEBUG: Criando diretório de upload se necessário
    console.log('[DEBUG] Criando diretório de upload:', file.fieldname);
    const dest = path.join(__dirname, 'uploads');
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    // DEBUG: Gerando nome de arquivo para upload
    console.log('[DEBUG] Gerando nome de arquivo para:', file.originalname);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// =====================
// GET dados da home
// =====================
app.get('/api/home', (req, res) => {
  // DEBUG: GET /api/home chamado
  console.log('[DEBUG] GET /api/home');
  const data = getHomeData() || {};
  res.json(data);
});

// =====================
// POST atualizar dados da home
// =====================
app.post('/api/home', upload.fields([
  { name: 'banner', maxCount: 1 },
  { name: 'fotos', maxCount: 10 },
  { name: 'afeira_imagens', maxCount: 3 }, // Novo campo para imagens da sessão A Feira
  // Campos para imagens dos 8 cards de O QUE ESPERAR
  { name: 'oqueesperar_card1_img', maxCount: 1 },
  { name: 'oqueesperar_card2_img', maxCount: 1 },
  { name: 'oqueesperar_card3_img', maxCount: 1 },
  { name: 'oqueesperar_card4_img', maxCount: 1 },
  { name: 'oqueesperar_card5_img', maxCount: 1 },
  { name: 'oqueesperar_card6_img', maxCount: 1 },
  { name: 'oqueesperar_card7_img', maxCount: 1 },
  { name: 'oqueesperar_card8_img', maxCount: 1 },
  // Campos para logos dos setores do Expositor
  { name: 'expositor_setor1_logos', maxCount: 20 },
  { name: 'expositor_setor2_logos', maxCount: 20 },
  { name: 'expositor_setor3_logos', maxCount: 20 },
  { name: 'expositor_setor4_logos', maxCount: 20 },
  // Campo para upload do mapa da feira
  { name: 'mapa_imagem', maxCount: 1 }
]), (req, res) => {
  // DEBUG: POST /api/home chamado
  console.log('[DEBUG] POST /api/home', { body: req.body, files: req.files });
  const { titulo, descricao } = req.body;
  let data = getHomeData() || {};

  // Banner
  if (req.files['banner']) {
    const bannerPath = `/uploads/${req.files['banner'][0].filename}`;
    data.banner = bannerPath;
    console.log('[DEBUG] Banner salvo:', bannerPath);
  }

  // Fotos
  if (req.files['fotos']) {
    data.fotos = req.files['fotos'].map(f => `/uploads/${f.filename}`);
    console.log('[DEBUG] Fotos salvas:', data.fotos);
  }

  // Imagens da sessão A Feira
  if (req.files['afeira_imagens']) {
    data.afeira_imagens = req.files['afeira_imagens'].map(f => `/uploads/${f.filename}`);
    console.log('[DEBUG] Imagens da Feira salvas:', data.afeira_imagens);
  }
  // Se não houver upload novo, mantém as imagens antigas
  else if (!data.afeira_imagens) {
    data.afeira_imagens = [];
  }

  // Mapa da Feira
  if (req.files['mapa_imagem']) {
    data.mapa_imagem = `/uploads/${req.files['mapa_imagem'][0].filename}`;
    console.log('[DEBUG] Mapa salvo:', data.mapa_imagem);
  }
  // Se não houver upload novo, mantém o mapa antigo
  else if (!data.mapa_imagem) {
    data.mapa_imagem = '';
  }

  // Textos
  if (typeof titulo !== 'undefined') data.titulo = titulo;
  if (typeof descricao !== 'undefined') data.descricao = descricao;

  // Faixa abaixo do banner
  if (typeof req.body.faixa_titulo !== 'undefined') data.faixa_titulo = req.body.faixa_titulo;
  if (typeof req.body.faixa_texto !== 'undefined') data.faixa_texto = req.body.faixa_texto;
  if (typeof req.body.faixa_botao_texto !== 'undefined') data.faixa_botao_texto = req.body.faixa_botao_texto;
  if (typeof req.body.faixa_botao_url !== 'undefined') data.faixa_botao_url = req.body.faixa_botao_url;
  data.faixa_botao_ativo = req.body.faixa_botao_ativo === 'on' || req.body.faixa_botao_ativo === true;

  // Campo do Google Maps (local)
  if (typeof req.body.local_maps_url !== 'undefined') data.local_maps_url = req.body.local_maps_url;

  // Sessão A Feira - textos
  if (typeof req.body.afeira_titulo !== 'undefined') data.afeira_titulo = req.body.afeira_titulo;
  if (typeof req.body.afeira_texto !== 'undefined') data.afeira_texto = req.body.afeira_texto;

  // Sessão O QUE ESPERAR
  if (typeof req.body.oqueesperar_titulo !== 'undefined') data.oqueesperar_titulo = req.body.oqueesperar_titulo;
  for (let i = 1; i <= 8; i++) {
    // Texto do card
    const textoKey = `oqueesperar_card${i}_texto`;
    if (typeof req.body[textoKey] !== 'undefined') {
      data[textoKey] = req.body[textoKey];
    }
    // Imagem do card
    const imgKey = `oqueesperar_card${i}_img`;
    if (req.files && req.files[imgKey]) {
      data[imgKey] = `/uploads/${req.files[imgKey][0].filename}`;
      console.log(`[DEBUG] Card ${i} imagem salva:`, data[imgKey]);
    }
    // Se não houver upload novo, mantém a imagem antiga
    else if (!data[imgKey]) {
      data[imgKey] = '';
    }
  }

  // Sessão Expositor
  if (typeof req.body.expositor_titulo !== 'undefined') data.expositor_titulo = req.body.expositor_titulo;
  for (let i = 1; i <= 4; i++) {
    const setorTextoKey = `expositor_setor${i}_texto`;
    if (typeof req.body[setorTextoKey] !== 'undefined') {
      data[setorTextoKey] = req.body[setorTextoKey];
    }
    // Logos do setor
    const logosKey = `expositor_setor${i}_logos`;
    if (req.files && req.files[logosKey]) {
      data[logosKey] = req.files[logosKey].map(f => `/uploads/${f.filename}`);
      console.log(`[DEBUG] Setor ${i} logos salvas:`, data[logosKey]);
    }
    // Se não houver upload novo, mantém as logos antigas
    else if (!data[logosKey]) {
      data[logosKey] = [];
    }
  }

  // Programação dinâmica (online e presencial)
  if (typeof req.body.programacao_online !== 'undefined') {
    try {
      data.programacao_online = JSON.parse(req.body.programacao_online);
      console.log('[DEBUG] Programação online recebida:', data.programacao_online);
    } catch (e) {
      data.programacao_online = [];
      console.error('[DEBUG] Erro ao parsear programação online:', e);
    }
  }
  if (typeof req.body.programacao_presencial !== 'undefined') {
    try {
      data.programacao_presencial = JSON.parse(req.body.programacao_presencial);
      console.log('[DEBUG] Programação presencial recebida:', data.programacao_presencial);
    } catch (e) {
      data.programacao_presencial = [];
      console.error('[DEBUG] Erro ao parsear programação presencial:', e);
    }
  }

  // Salva os dados no arquivo JSON
  saveHomeData(data);
  // DEBUG: Dados salvos com sucesso
  console.log('[DEBUG] Dados da home salvos com sucesso!');
  res.json({ success: true, data });
});

// =====================
// ENDPOINT PARA REMOVER LOGO DE UM SETOR
// =====================
app.post('/api/home/remover-logo', (req, res) => {
  try {
    // DEBUG: Remover logo chamado
    console.log('[DEBUG] POST /api/home/remover-logo', req.body);
    const { setor, logo } = req.body;
    if (!setor || !logo) return res.json({ success: false, error: 'Setor e logo obrigatórios.' });
    let data = getHomeData() || {};
    const key = `expositor_setor${setor}_logos`;
    if (!Array.isArray(data[key])) return res.json({ success: false, error: 'Setor não encontrado.' });
    // Remove do array
    data[key] = data[key].filter(l => l !== logo);
    // Remove o arquivo físico
    let filePath = logo;
    if (filePath.startsWith('/')) filePath = filePath.substring(1);
    filePath = path.join(__dirname, filePath.replace(/\//g, path.sep));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('[DEBUG] Logo removida do disco:', filePath);
    }
    saveHomeData(data);
    res.json({ success: true });
  } catch (err) {
    // DEBUG: Erro ao remover logo
    console.error('[DEBUG] Erro ao remover logo:', err);
    res.json({ success: false, error: err.message });
  }
});

// =====================
// Iniciar servidor
// =====================
app.listen(PORT, () => {
  // DEBUG: Servidor iniciado
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
