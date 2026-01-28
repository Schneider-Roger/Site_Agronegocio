// =====================
// REQUIRES ESSENCIAIS
// =====================
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { getHomeData, saveHomeData, DATA_PATH } = require('./db');

const app = express();
app.use(cors());

// DEBUG: log simples para todas as requisições (ajuda a identificar rotas que chegam ao servidor)
app.use((req, res, next) => {
  try {
    console.log(`[REQ] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  } catch (e) {
    // ignore logging errors
  }
  next();
});

// Configurações para uploads grandes
// IMPORTANTE: express.json() removido globalmente para evitar conflito com multer
// Será aplicado apenas nas rotas que não usam multipart/form-data
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Aplicar express.json() apenas nas rotas específicas que não usam multer
app.use('/api/galerias', express.json({ limit: '50mb' }));
app.use('/api/home/remover-logo', express.json({ limit: '50mb' }));
app.use('/api/home/remover-setor', express.json({ limit: '50mb' }));
// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
// Servir arquivos de upload de imagens
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =====================
// GALERIAS API
// =====================
const galeriasDataPath = path.join(__dirname, 'data', 'galerias.json');
const storageGalerias = multer.diskStorage({
  destination: function (req, file, cb) {
    const dest = path.join(__dirname, 'uploads');
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, 'galeria_' + Date.now() + ext);
  }
});
const uploadGalerias = multer({ storage: storageGalerias });

// storage para fotos internas da galeria (reescreve nome para galeriaId_index.ext)
const storageGaleriaFotos = multer.diskStorage({
  destination: function (req, file, cb) {
    const dest = path.join(__dirname, 'uploads');
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const galId = req.params.id || 'gal';
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `gal_${galId}_${unique}${ext}`);
  }
});
const uploadGaleriaFotos = multer({ storage: storageGaleriaFotos, limits: { files: 40, fileSize: 10 * 1024 * 1024 } });

// GET /api/galerias - lista todas as galerias
app.get('/api/galerias', (req, res) => {
  try {
    let galerias = fs.existsSync(galeriasDataPath)
      ? JSON.parse(fs.readFileSync(galeriasDataPath, 'utf8'))
      : [];

    // Normaliza: garante id e fotos para compatibilidade com versões antigas
    let changed = false;
    galerias = galerias.map((g, idx) => {
      const copy = Object.assign({}, g);
      if (typeof copy.id === 'undefined' || copy.id === null) {
        copy.id = Date.now() + idx; // atribui id único
        changed = true;
      }
      if (!Array.isArray(copy.fotos)) {
        copy.fotos = copy.imagem ? [copy.imagem] : [];
        changed = true;
      }
      return copy;
    });

    if (changed) {
      try {
        fs.writeFileSync(galeriasDataPath, JSON.stringify(galerias, null, 2), 'utf8');
        console.log('[DEBUG] galerias.json normalizado e salvo');
      } catch (e) {
        console.error('[DEBUG] Erro ao salvar galerias normalizadas:', e);
      }
    }

    res.json(galerias);
  } catch (err) {
    console.error('[DEBUG] Erro ao ler galerias:', err);
    res.status(500).json({ error: 'Erro ao ler galerias.' });
  }
});

// GET /api/galerias/:id - retorna uma galeria específica
app.get('/api/galerias/:id', (req, res) => {
  try {
    const id = req.params.id;
    const galerias = fs.existsSync(galeriasDataPath)
      ? JSON.parse(fs.readFileSync(galeriasDataPath, 'utf8'))
      : [];
    const gal = galerias.find(g => String(g.id) === String(id));
    if (!gal) return res.status(404).json({ success: false, error: 'Galeria não encontrada.' });
    res.json(gal);
  } catch (err) {
    console.error('[DEBUG] Erro ao ler galeria por id:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/galerias - adiciona nova galeria (ano + imagem)
app.post('/api/galerias', uploadGalerias.single('imagem'), (req, res) => {
  try {
    const { ano } = req.body;
    if (!ano || !req.file) {
      return res.status(400).json({ error: 'Ano e imagem são obrigatórios.' });
    }
    const galerias = fs.existsSync(galeriasDataPath)
      ? JSON.parse(fs.readFileSync(galeriasDataPath, 'utf8'))
      : [];
    const novaGaleria = {
      id: Date.now(),
      ano: ano,
      imagem: '/uploads/' + req.file.filename,
      // fotos armazena as imagens desta galeria (capa incluída)
      fotos: ['/uploads/' + req.file.filename]
    };
    galerias.push(novaGaleria);
    fs.writeFileSync(galeriasDataPath, JSON.stringify(galerias, null, 2), 'utf8');
    console.log('[DEBUG] Nova galeria adicionada:', novaGaleria);
    res.json({ success: true, galeria: novaGaleria });
  } catch (err) {
    console.error('[DEBUG] Erro ao adicionar galeria:', err);
    res.status(500).json({ error: 'Erro ao adicionar galeria.' });
  }
});

// POST /api/galerias/:id/fotos - adiciona fotos à galeria (máx 40 por requisição / acúmulo)
app.post('/api/galerias/:id/fotos', uploadGaleriaFotos.array('fotos', 40), (req, res) => {
  try {
    const id = req.params.id;
    let galerias = fs.existsSync(galeriasDataPath)
      ? JSON.parse(fs.readFileSync(galeriasDataPath, 'utf8'))
      : [];
    const idx = galerias.findIndex(g => String(g.id) === String(id));
    if (idx === -1) return res.status(404).json({ success: false, error: 'Galeria não encontrada.' });

    const files = req.files || [];
    const caminhos = files.map(f => '/uploads/' + f.filename);

    // Acumula sem ultrapassar 40 fotos
    galerias[idx].fotos = galerias[idx].fotos || [];
    const totalAfter = galerias[idx].fotos.length + caminhos.length;
    if (totalAfter > 40) {
      return res.status(400).json({ success: false, error: 'Limite de 40 fotos por galeria.' });
    }
    galerias[idx].fotos = [...galerias[idx].fotos, ...caminhos];
    fs.writeFileSync(galeriasDataPath, JSON.stringify(galerias, null, 2), 'utf8');
    res.json({ success: true, fotos: galerias[idx].fotos });
  } catch (err) {
    console.error('[DEBUG] Erro ao adicionar fotos à galeria:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/galerias/:id/fotos - remover foto específica (body: { foto })
app.delete('/api/galerias/:id/fotos', express.json({ limit: '50mb' }), (req, res) => {
  try {
    const id = req.params.id;
    const { foto } = req.body;
    if (!foto) return res.status(400).json({ success: false, error: 'Campo foto obrigatório.' });
    let galerias = fs.existsSync(galeriasDataPath)
      ? JSON.parse(fs.readFileSync(galeriasDataPath, 'utf8'))
      : [];
    const idx = galerias.findIndex(g => String(g.id) === String(id));
    if (idx === -1) return res.status(404).json({ success: false, error: 'Galeria não encontrada.' });

    galerias[idx].fotos = galerias[idx].fotos || [];
    galerias[idx].fotos = galerias[idx].fotos.filter(f => f !== foto);

    // Remove arquivo do disco
    let filePath = foto;
    if (filePath.startsWith('/')) filePath = filePath.substring(1);
    filePath = path.join(__dirname, filePath.replace(/\//g, path.sep));
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('[DEBUG] Foto removida do disco:', filePath);
      }
    } catch (e) {
      console.error('[DEBUG] Erro ao remover foto do disco:', e);
    }

    fs.writeFileSync(galeriasDataPath, JSON.stringify(galerias, null, 2), 'utf8');
    res.json({ success: true, fotos: galerias[idx].fotos });
  } catch (err) {
    console.error('[DEBUG] Erro ao deletar foto da galeria:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/galerias - remove uma galeria por id (body JSON: { id })
app.delete('/api/galerias', (req, res) => {
  try {
    const { id } = req.body;
    if (typeof id === 'undefined') return res.status(400).json({ success: false, error: 'id é obrigatório.' });

    const galerias = fs.existsSync(galeriasDataPath)
      ? JSON.parse(fs.readFileSync(galeriasDataPath, 'utf8'))
      : [];

    const idx = galerias.findIndex(g => g.id === id || String(g.id) === String(id));
    if (idx === -1) return res.status(404).json({ success: false, error: 'Galeria não encontrada.' });

    const [removida] = galerias.splice(idx, 1);

    // Remove arquivos físicos associados (se existirem)
    if (removida && Array.isArray(removida.fotos)) {
      removida.fotos.forEach(f => {
        if (!f) return;
        let filePath = f;
        if (filePath.startsWith('/')) filePath = filePath.substring(1);
        filePath = path.join(__dirname, filePath.replace(/\//g, path.sep));
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('[DEBUG] Arquivo de galeria removido do disco:', filePath);
          }
        } catch (e) {
          console.error('[DEBUG] Erro ao remover arquivo de galeria:', filePath, e);
        }
      });
    }

    fs.writeFileSync(galeriasDataPath, JSON.stringify(galerias, null, 2), 'utf8');
    res.json({ success: true });
  } catch (err) {
    console.error('[DEBUG] Erro ao deletar galeria:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/galerias/:id - alternativa que aceita id via URL
app.delete('/api/galerias/:id', (req, res) => {
  try {
    const id = req.params.id;
    if (typeof id === 'undefined') return res.status(400).json({ success: false, error: 'id é obrigatório.' });

    const galerias = fs.existsSync(galeriasDataPath)
      ? JSON.parse(fs.readFileSync(galeriasDataPath, 'utf8'))
      : [];

    const idx = galerias.findIndex(g => g.id === id || String(g.id) === String(id));
    if (idx === -1) return res.status(404).json({ success: false, error: 'Galeria não encontrada.' });

    const [removida] = galerias.splice(idx, 1);

    if (removida && Array.isArray(removida.fotos)) {
      removida.fotos.forEach(f => {
        if (!f) return;
        let filePath = f;
        if (filePath.startsWith('/')) filePath = filePath.substring(1);
        filePath = path.join(__dirname, filePath.replace(/\//g, path.sep));
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('[DEBUG] Arquivo de galeria removido do disco:', filePath);
          }
        } catch (e) {
          console.error('[DEBUG] Erro ao remover arquivo de galeria:', filePath, e);
        }
      });
    }

    fs.writeFileSync(galeriasDataPath, JSON.stringify(galerias, null, 2), 'utf8');
    res.json({ success: true });
  } catch (err) {
    console.error('[DEBUG] Erro ao deletar galeria (by id):', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/galerias/remover - fallback para remover galeria por id ou por propriedade (ano/imagem)
app.post('/api/galerias/remover', express.json({ limit: '50mb' }), (req, res) => {
  try {
    const { id, ano, imagem } = req.body || {};
    let galerias = fs.existsSync(galeriasDataPath)
      ? JSON.parse(fs.readFileSync(galeriasDataPath, 'utf8'))
      : [];

    let idx = -1;
    if (typeof id !== 'undefined' && id !== null) {
      idx = galerias.findIndex(g => g.id === id || String(g.id) === String(id));
    }
    // if id not provided or not found, try to match by imagem (best) or ano
    if (idx === -1 && imagem) {
      idx = galerias.findIndex(g => g.imagem === imagem || (g.fotos && g.fotos.includes(imagem)));
    }
    if (idx === -1 && ano) {
      idx = galerias.findIndex(g => String(g.ano) === String(ano));
    }

    if (idx === -1) return res.status(404).json({ success: false, error: 'Galeria não encontrada (fallback).' });

    const [removida] = galerias.splice(idx, 1);
    if (removida && Array.isArray(removida.fotos)) {
      removida.fotos.forEach(f => {
        if (!f) return;
        let filePath = f;
        if (filePath.startsWith('/')) filePath = filePath.substring(1);
        filePath = path.join(__dirname, filePath.replace(/\//g, path.sep));
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('[DEBUG] Arquivo de galeria removido do disco (fallback):', filePath);
          }
        } catch (e) {
          console.error('[DEBUG] Erro ao remover arquivo de galeria (fallback):', filePath, e);
        }
      });
    }

    fs.writeFileSync(galeriasDataPath, JSON.stringify(galerias, null, 2), 'utf8');
    res.json({ success: true });
  } catch (err) {
    console.error('[DEBUG] Erro no POST /api/galerias/remover:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Expositores API ---
const expositorDataPath = path.join(__dirname, 'data', 'expositores.json');
const storageExpositores = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'expositor_' + unique + ext);
  }
});
const uploadExpositores = multer({ storage: storageExpositores });

app.post('/api/expositores', uploadExpositores.any(), (req, res) => {
  try {
    // Organiza os dados recebidos
    const body = req.body;
    const files = req.files;
    const espacos = ['logos-legado', 'logos-evolucao', 'logos-conexao', 'logos-raiz'];
    let result = { titulo: body.expositor_titulo || '', espacos: {} };
    espacos.forEach(espaco => {
      result.espacos[espaco] = [];
      const nomes = body[espaco + '_empresa_nome[]'] || [];
      // Pode ser string se só um nome
      const nomesArr = Array.isArray(nomes) ? nomes : nomes ? [nomes] : [];
      // Filtra arquivos deste espaço
      const filesArr = files.filter(f => f.fieldname === espaco + '_empresa_logo[]');
      for (let i = 0; i < nomesArr.length; i++) {
        result.espacos[espaco].push({
          nome: nomesArr[i],
          logo: filesArr[i] ? ('/uploads/' + filesArr[i].filename) : ''
        });
      }
    });
    fs.writeFileSync(expositorDataPath, JSON.stringify(result, null, 2), 'utf8');
    console.log('[DEBUG] Expositores salvos:', result);
    res.json({ ok: true });
  } catch (err) {
    console.error('[DEBUG] Erro ao salvar expositores:', err);
    res.status(500).json({ error: 'Erro ao salvar expositores.' });
  }
});
// =====================
// server.js - Backend principal da aplicação
// =====================





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
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${timestamp}-${random}${ext}`);
  }
});
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB por arquivo (aumentado)
    files: 50, // máximo 50 arquivos
    fieldSize: 10 * 1024 * 1024, // 10MB por campo
    fieldNameSize: 300, // tamanho máximo do nome do campo
    fields: 100 // número máximo de campos não-arquivo
  },
  fileFilter: function (req, file, cb) {
    // DEBUG: Verificando tipo de arquivo
    console.log('[DEBUG] Verificando arquivo:', file.fieldname, file.originalname, file.mimetype);
    
    // Permitir todos os tipos de arquivo para flexibilidade
    // O frontend já faz a validação de tipos na interface
    cb(null, true);
  }
});
app.get('/api/home', (req, res) => {
  // DEBUG: GET /api/home chamado
  console.log('[DEBUG] GET /api/home');
  const data = getHomeData() || {};
  // =====================
  // Normalização de datas da programação (MM/DD/AAAA -> DD/MM/AAAA)
  // =====================
  function maybeNormalizeDate(str) {
    if (typeof str !== 'string') return str;
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str; // formato não padrão
    const [p1, p2, ano] = str.split('/').map(Number);
    // Heurística: se p1 é mês válido e p2 > 12 interpretamos como MM/DD/AAAA
    if (p1 >= 1 && p1 <= 12 && p2 >= 13 && p2 <= 31) {
      const dd = String(p2).padStart(2,'0');
      const mm = String(p1).padStart(2,'0');
      const normal = `${dd}/${mm}/${ano}`;
      if (normal !== str) {
        console.log('[DEBUG] Normalizando data programação:', str, '->', normal);
      }
      return normal;
    }
    return str;
  }
  function normalizeProgramacaoArray(arr) {
    if (!Array.isArray(arr)) return arr;
    return arr.map(dia => {
      if (dia && typeof dia.data === 'string') {
        dia.data = maybeNormalizeDate(dia.data);
      }
      return dia;
    });
  }
  if (data.programacao_online) {
    data.programacao_online = normalizeProgramacaoArray(data.programacao_online);
  }
  if (data.programacao_presencial) {
    data.programacao_presencial = normalizeProgramacaoArray(data.programacao_presencial);
  }
  
  // Garantir dados padrão para os expositores
  if (!data.expositor_titulo) {
    data.expositor_titulo = "O CORAÇÃO DA FEIRA";
  }
  
  // Garantir que os 4 setores padrão existam com nomes corretos
  const nomesPadrao = [
    'ESPAÇO LEGADO',
    'ESPAÇO EVOLUÇÃO', 
    'ESPAÇO CONEXÃO',
    'ESPAÇO RAIZ'
  ];
  
  for (let i = 1; i <= 4; i++) {
    if (!data[`expositor_setor${i}_texto`]) {
      data[`expositor_setor${i}_texto`] = nomesPadrao[i-1];
    } else {
      // Corrige espaços duplos nos nomes dos setores
      data[`expositor_setor${i}_texto`] = data[`expositor_setor${i}_texto`].replace(/\s+/g, ' ').trim();
    }
    if (!data[`expositor_setor${i}_logos`]) {
      data[`expositor_setor${i}_logos`] = [];
    }
  }
  
  res.json(data);
});

// =====================
// POST atualizar dados da home
// =====================
app.post('/api/home', (req, res) => {
  // Middleware customizado para capturar erros de upload
  upload.any()(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('[DEBUG] Erro de Multer:', err.code, err.message);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ 
          success: false, 
          error: 'Arquivo muito grande. Tamanho máximo: 50MB por imagem.' 
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(413).json({ 
          success: false, 
          error: 'Muitos arquivos. Máximo permitido: 50 arquivos.' 
        });
      }
      return res.status(400).json({ 
        success: false, 
        error: `Erro no upload: ${err.message}` 
      });
    } else if (err) {
      console.error('[DEBUG] Erro geral no upload:', err);
      return res.status(500).json({ 
        success: false, 
        error: `Erro no servidor: ${err.message}` 
      });
    }

    // Se não houve erro, continua com o processamento normal
    try {
    // DEBUG: POST /api/home chamado com informações detalhadas
    console.log('[DEBUG] POST /api/home');
    console.log('[DEBUG] req.body:', req.body);
    console.log('[DEBUG] req.body keys:', req.body ? Object.keys(req.body) : 'req.body is null/undefined');
    console.log('[DEBUG] req.files length:', req.files ? req.files.length : 0);
    console.log('[DEBUG] req.files fieldnames:', req.files ? req.files.map(f => `${f.fieldname}:${f.originalname}`) : []);
    
    // Debug específico para banners
    const bannerFiles = req.files ? req.files.filter(f => f.fieldname.includes('banners')) : [];
    console.log('[DEBUG] BANNER FILES:', bannerFiles && bannerFiles.length > 0 ? bannerFiles.map(f => `${f.fieldname} -> ${f.filename}`) : 'Nenhum banner file');
    
    let data = getHomeData() || {};
    console.log('[DEBUG] ========== DADOS CARREGADOS ==========');
    console.log('[DEBUG] Data carregada:', typeof data, data ? 'existe' : 'null/undefined');
    console.log('[DEBUG] Logos existentes nos dados:');
    for (let i = 1; i <= 4; i++) {
      const logosKey = `expositor_setor${i}_logos`;
      const logosExistentes = data[logosKey];
      console.log(`[DEBUG] - ${logosKey}:`, logosExistentes ? `${logosExistentes.length} logos` : 'undefined');
      if (logosExistentes && logosExistentes.length > 0) {
        console.log(`[DEBUG]   - Logos: ${logosExistentes.join(', ')}`);
      }
    }
    console.log('[DEBUG] ========== FIM DADOS CARREGADOS ==========');

    // Processamento de banner único
    console.log('[DEBUG] === PROCESSANDO BANNER ÚNICO ===');
    
    // Verifica se há arquivo de banner enviado
    const bannerFile = req.files && req.files.find(f => f.fieldname === 'banner');
    if (bannerFile) {
      // Novo arquivo de banner
      data.banner = `/uploads/${bannerFile.filename}`;
      console.log('[DEBUG] Novo banner salvo:', data.banner);
    }
    // Se não há novo arquivo mas existe banner antigo, mantém o antigo
    else if (data.banner) {
      console.log('[DEBUG] Mantendo banner existente:', data.banner);
    }
    // Se existe banners múltiplos (formato antigo), converte para banner único
    else if (data.banners && Array.isArray(data.banners) && data.banners.length > 0) {
      data.banner = data.banners[0].arquivo || data.banners[0].src;
      console.log('[DEBUG] Convertendo de múltiplos banners para banner único:', data.banner);
    }
    
    // Remove campo de banners múltiplos se existir
    if (data.banners) {
      delete data.banners;
      console.log('[DEBUG] Campo banners múltiplos removido');
    }
    
    console.log('[DEBUG] === FIM PROCESSAMENTO BANNER ===');

    // Fotos (campo não existe mais no formulário atual, removido)
    // const fotosFiles = req.files && req.files.filter(f => f.fieldname === 'fotos');
    // if (fotosFiles && fotosFiles.length > 0) {
    //   data.fotos = fotosFiles.map(f => `/uploads/${f.filename}`);
    //   console.log('[DEBUG] Fotos salvas:', data.fotos);
    // }

    // Imagens da sessão A Feira
    console.log('[DEBUG] === PROCESSANDO IMAGENS A FEIRA ===');
    const afeiraFiles = req.files && req.files.filter(f => 
      f.fieldname === 'afeira_imagem1' || 
      f.fieldname === 'afeira_imagem2' || 
      f.fieldname === 'afeira_imagem3'
    );
    console.log('[DEBUG] Arquivos recebidos para A Feira:', afeiraFiles ? afeiraFiles.length : 0);
    
    if (afeiraFiles && afeiraFiles.length > 0) {
      console.log('[DEBUG] Detalhes dos arquivos A Feira:');
      afeiraFiles.forEach((file, index) => {
        console.log(`[DEBUG] - Arquivo ${index + 1}: ${file.fieldname} -> ${file.filename} (${Math.round(file.size/1024/1024)}MB)`);
      });
      
      // Para os inputs individuais, substituímos as imagens existentes
      const novasImagens = ['', '', '']; // Array de 3 posições
      
      afeiraFiles.forEach(file => {
        if (file.fieldname === 'afeira_imagem1') {
          novasImagens[0] = `/uploads/${file.filename}`;
          console.log('[DEBUG] Nova imagem 1 definida:', novasImagens[0]);
        } else if (file.fieldname === 'afeira_imagem2') {
          novasImagens[1] = `/uploads/${file.filename}`;
          console.log('[DEBUG] Nova imagem 2 definida:', novasImagens[1]);
        } else if (file.fieldname === 'afeira_imagem3') {
          novasImagens[2] = `/uploads/${file.filename}`;
          console.log('[DEBUG] Nova imagem 3 definida:', novasImagens[2]);
        }
      });
      
      // Mantém imagens existentes que não foram substituídas
      const imagensExistentes = data.afeira_imagens || ['', '', ''];
      console.log('[DEBUG] Imagens existentes antes da atualização:', imagensExistentes);
      
      // Normaliza para garantir exatamente 3 posições
      const imagensNormalizadas = [
        imagensExistentes[0] || '',
        imagensExistentes[1] || '',
        imagensExistentes[2] || ''
      ];
      
      data.afeira_imagens = [
        novasImagens[0] || imagensNormalizadas[0],
        novasImagens[1] || imagensNormalizadas[1],
        novasImagens[2] || imagensNormalizadas[2]
      ];
      
      console.log('[DEBUG] Imagens A Feira FINAIS após processamento:', data.afeira_imagens);
    } else {
      // Não há novos arquivos - preserva as imagens existentes mas normaliza para 3 posições
      if (!data.afeira_imagens || !Array.isArray(data.afeira_imagens)) {
        data.afeira_imagens = ['', '', ''];
        console.log('[DEBUG] Inicializando array de imagens da Feira');
      } else {
        // Normaliza array para exatamente 3 posições
        data.afeira_imagens = [
          data.afeira_imagens[0] || '',
          data.afeira_imagens[1] || '',
          data.afeira_imagens[2] || ''
        ];
        console.log('[DEBUG] Normalizando imagens existentes da Feira para 3 posições:', data.afeira_imagens);
      }
    }
    console.log('[DEBUG] === FIM PROCESSAMENTO IMAGENS A FEIRA ===');

    // Mapa da Feira
    const mapaFile = req.files && req.files.find(f => f.fieldname === 'mapa_imagem');
    if (mapaFile) {
      data.mapa_imagem = `/uploads/${mapaFile.filename}`;
      console.log('[DEBUG] Mapa salvo:', data.mapa_imagem);
    }
    // Se não houver upload novo, mantém o mapa antigo
    else if (!data.mapa_imagem) {
      data.mapa_imagem = '';
    }  // Textos (campos titulo e descricao removidos - não existem mais no formulário)
  // if (typeof titulo !== 'undefined') data.titulo = titulo;
  // if (typeof descricao !== 'undefined') data.descricao = descricao;

  // Faixa abaixo do banner
  if (typeof req.body.faixa_titulo !== 'undefined') data.faixa_titulo = req.body.faixa_titulo;
  if (typeof req.body.faixa_texto !== 'undefined') data.faixa_texto = req.body.faixa_texto;
  if (typeof req.body.faixa_botao_texto !== 'undefined') data.faixa_botao_texto = req.body.faixa_botao_texto;
  if (typeof req.body.faixa_botao_url !== 'undefined') data.faixa_botao_url = req.body.faixa_botao_url;
  data.faixa_botao_ativo = req.body.faixa_botao_ativo === 'on' || req.body.faixa_botao_ativo === true || req.body.faixa_botao_ativo === 'true';

  // Contador Data
  if (typeof req.body.contador_data_feira !== 'undefined') {
    // Converte para timestamp para facilitar comparações
    const dataFeira = new Date(req.body.contador_data_feira);
    if (!isNaN(dataFeira.getTime())) {
      data.contador_data_feira = dataFeira.toISOString();
      console.log('[DEBUG] Data da feira salva:', data.contador_data_feira);
    }
  }
  data.contador_data_ativo = req.body.contador_data_ativo === 'on' || req.body.contador_data_ativo === true || req.body.contador_data_ativo === 'true';

  // Campo do Google Maps (local)
  if (typeof req.body.local_maps_url !== 'undefined') data.local_maps_url = req.body.local_maps_url;
  if (typeof req.body.local_endereco !== 'undefined') data.local_endereco = req.body.local_endereco;

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
    const cardFile = req.files && req.files.find(f => f.fieldname === imgKey);
    if (cardFile) {
      data[imgKey] = `/uploads/${cardFile.filename}`;
      console.log(`[DEBUG] Card ${i} imagem salva:`, data[imgKey]);
    }
    // Se não houver upload novo, mantém a imagem antiga
    else if (!data[imgKey]) {
      data[imgKey] = '';
    }
  }

  // Sessão Expositor
  if (typeof req.body.expositor_titulo !== 'undefined') data.expositor_titulo = req.body.expositor_titulo;
  
  // Detectar quantos setores processar
  let totalSetoresProcessar = 4; // Mínimo 4 setores padrão
  if (req.body.total_setores_expositor && parseInt(req.body.total_setores_expositor) > 4) {
    totalSetoresProcessar = parseInt(req.body.total_setores_expositor);
  }
  console.log(`[DEBUG] Processando ${totalSetoresProcessar} setores de expositores`);
  
  for (let i = 1; i <= totalSetoresProcessar; i++) {
    const setorTextoKey = `expositor_setor${i}_texto`;
    if (typeof req.body[setorTextoKey] !== 'undefined') {
      data[setorTextoKey] = req.body[setorTextoKey];
    }
    // Logos do setor
    const logosKey = `expositor_setor${i}_logos`;
    const setorLogosFiles = req.files && req.files.filter(f => f.fieldname === logosKey);
    
    console.log(`[DEBUG] ========== SETOR ${i} ANÁLISE COMPLETA ==========`);
    console.log(`[DEBUG] - logosKey: ${logosKey}`);
    console.log(`[DEBUG] - req.files total: ${req.files ? req.files.length : 0}`);
    console.log(`[DEBUG] - setorLogosFiles encontrados: ${setorLogosFiles ? setorLogosFiles.length : 0}`);
    console.log(`[DEBUG] - setorLogosFiles:`, setorLogosFiles ? setorLogosFiles.map(f => f.filename) : 'nenhum');
    console.log(`[DEBUG] - data[${logosKey}] ANTES:`, data[logosKey] || 'undefined');
    
    if (setorLogosFiles && setorLogosFiles.length > 0) {
      // COMPORTAMENTO DE ACÚMULO: Se há logos antigas, mantém elas e adiciona as novas
      const logosAnteriores = data[logosKey] || [];
      const novasLogos = setorLogosFiles.map(f => `/uploads/${f.filename}`);
      
      console.log(`[DEBUG] *** EXECUTANDO ACÚMULO SETOR ${i} ***`);
      console.log(`[DEBUG] - Logos anteriores (${logosAnteriores.length}):`, logosAnteriores);
      console.log(`[DEBUG] - Novas logos (${novasLogos.length}):`, novasLogos);
      
      // SEMPRE ACUMULA: uma ou várias imagens são ADICIONADAS às existentes
      data[logosKey] = [...logosAnteriores, ...novasLogos];
      
      console.log(`[DEBUG] - RESULTADO FINAL (${data[logosKey].length}):`, data[logosKey]);
      console.log(`[DEBUG] *** ACÚMULO CONCLUÍDO SETOR ${i} ***`);
    } else {
      console.log(`[DEBUG] - Nenhum arquivo novo para setor ${i}, mantendo dados existentes`);
      if (!data[logosKey]) {
        data[logosKey] = [];
        console.log(`[DEBUG] - Inicializando array vazio para setor ${i}`);
      } else {
        console.log(`[DEBUG] - Mantendo logos existentes para setor ${i}:`, data[logosKey]);
      }
    }
    console.log(`[DEBUG] ========== FIM SETOR ${i} ==========`);
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

  // Material Oficial
  console.log('[DEBUG] === PROCESSANDO MATERIAL OFICIAL ===');
  console.log('[DEBUG] All req.files:', req.files ? req.files.map(f => `${f.fieldname}:${f.originalname}`) : 'No files');
  
  const materialManualFile = req.files && req.files.find(f => f.fieldname === 'material_manual');
  console.log('[DEBUG] materialManualFile encontrado:', materialManualFile ? `${materialManualFile.fieldname}:${materialManualFile.originalname}` : 'Não encontrado');
  
  if (materialManualFile) {
    console.log('[DEBUG] ANTES - data.material_manual:', data.material_manual);
    data.material_manual = `/uploads/${materialManualFile.filename}`;
    console.log('[DEBUG] DEPOIS - data.material_manual:', data.material_manual);
    console.log('[DEBUG] Manual do Expositor salvo:', data.material_manual);
  }
  // Se não houver upload novo, mantém o arquivo antigo
  else if (!data.material_manual) {
    console.log('[DEBUG] Nenhum material_manual novo, definindo como vazio');
    data.material_manual = '';
  } else {
    console.log('[DEBUG] Mantendo material_manual existente:', data.material_manual);
  }

  const materialReleaseFile = req.files && req.files.find(f => f.fieldname === 'material_release');
  console.log('[DEBUG] materialReleaseFile encontrado:', materialReleaseFile ? `${materialReleaseFile.fieldname}:${materialReleaseFile.originalname}` : 'Não encontrado');
  
  if (materialReleaseFile) {
    console.log('[DEBUG] ANTES - data.material_release:', data.material_release);
    data.material_release = `/uploads/${materialReleaseFile.filename}`;
    console.log('[DEBUG] DEPOIS - data.material_release:', data.material_release);
    console.log('[DEBUG] Release de Imprensa salvo:', data.material_release);
  }
  // Se não houver upload novo, mantém o arquivo antigo
  else if (!data.material_release) {
    console.log('[DEBUG] Nenhum material_release novo, definindo como vazio');
    data.material_release = '';
  } else {
    console.log('[DEBUG] Mantendo material_release existente:', data.material_release);
  }
  console.log('[DEBUG] === FIM PROCESSAMENTO MATERIAL OFICIAL ===');
  console.log('[DEBUG] FINAL - data.material_manual:', data.material_manual);
  console.log('[DEBUG] FINAL - data.material_release:', data.material_release);

  // Salva os dados no arquivo JSON
  console.log('[DEBUG] ========== SALVANDO DADOS ==========');
  console.log('[DEBUG] Logos antes de salvar:');
  for (let i = 1; i <= 4; i++) {
    const logosKey = `expositor_setor${i}_logos`;
    const logos = data[logosKey];
    console.log(`[DEBUG] - ${logosKey}: ${logos ? logos.length : 0} logos`);
    if (logos && logos.length > 0) {
      console.log(`[DEBUG]   Logos: ${logos.join(', ')}`);
    }
  }
  
  saveHomeData(data);
  
  // DEBUG: Verifica se os dados foram salvos corretamente
  const dadosSalvos = getHomeData();
  console.log('[DEBUG] Logos após salvar (verificação):');
  for (let i = 1; i <= 4; i++) {
    const logosKey = `expositor_setor${i}_logos`;
    const logos = dadosSalvos[logosKey];
    console.log(`[DEBUG] - ${logosKey}: ${logos ? logos.length : 0} logos`);
    if (logos && logos.length > 0) {
      console.log(`[DEBUG]   Logos: ${logos.join(', ')}`);
    }
  }
  console.log('[DEBUG] ========== DADOS SALVOS ==========');
  
  // DEBUG: Dados salvos com sucesso
  console.log('[DEBUG] *** DADOS DA HOME SALVOS COM SUCESSO! ***');
  res.json({ success: true });
  
  } catch (error) {
    // DEBUG: Erro no processamento
    console.error('[DEBUG] Erro no POST /api/home:', error);
    res.status(500).json({ success: false, error: error.message });
  }
  
  }); // Fecha o middleware do multer
});

// =====================
// ENDPOINT PARA REMOVER SETOR COMPLETO
// =====================
app.post('/api/home/remover-setor', (req, res) => {
  try {
    console.log('[DEBUG] POST /api/home/remover-setor', req.body);
    const { setor } = req.body;
    
    if (!setor || setor < 5) {
      return res.json({ 
        success: false, 
        error: 'Não é possível remover os 4 setores padrão da feira.' 
      });
    }
    
    let data = getHomeData() || {};
    
    // Remove textos e logos do setor
    const textoKey = `expositor_setor${setor}_texto`;
    const logosKey = `expositor_setor${setor}_logos`;
    
    // Remove arquivos físicos das logos
    if (Array.isArray(data[logosKey])) {
      data[logosKey].forEach(logo => {
        let filePath = logo;
        if (filePath.startsWith('/')) filePath = filePath.substring(1);
        filePath = path.join(__dirname, filePath.replace(/\//g, path.sep));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('[DEBUG] Logo removida do disco:', filePath);
        }
      });
    }
    
    // Remove dados do setor
    delete data[textoKey];
    delete data[logosKey];
    
    // Reorganiza setores (move setores superiores para baixo)
    let totalSetores = 0;
    for (let i = 1; i <= 20; i++) {
      if (data[`expositor_setor${i}_texto`] !== undefined || 
          (data[`expositor_setor${i}_logos`] && data[`expositor_setor${i}_logos`].length > 0)) {
        totalSetores = i;
      }
    }
    
    // Move setores para preencher lacuna
    for (let i = setor; i < totalSetores; i++) {
      const proximoTextoKey = `expositor_setor${i+1}_texto`;
      const proximoLogosKey = `expositor_setor${i+1}_logos`;
      const atualTextoKey = `expositor_setor${i}_texto`;
      const atualLogosKey = `expositor_setor${i}_logos`;
      
      data[atualTextoKey] = data[proximoTextoKey] || '';
      data[atualLogosKey] = data[proximoLogosKey] || [];
      
      delete data[proximoTextoKey];
      delete data[proximoLogosKey];
    }
    
    saveHomeData(data);
    res.json({ success: true });
  } catch (err) {
    console.error('[DEBUG] Erro ao remover setor:', err);
    res.json({ success: false, error: err.message });
  }
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
// MIDDLEWARE DE TRATAMENTO DE ERRO GLOBAL
// =====================
app.use((err, req, res, next) => {
  console.error('[DEBUG] Erro global capturado:', err);
  
  // Tratamento específico para erros do Multer
  if (err instanceof multer.MulterError) {
    console.error('[DEBUG] MulterError específico:', err.code, err.field);
    
    if (err.code === 'UNEXPECTED_FIELD') {
      return res.status(400).json({
        success: false,
        error: `Campo inesperado: ${err.field}. Verifique se todos os campos do formulário estão configurados corretamente.`,
        field: err.field
      });
    }
  }
  
  // Garantir que sempre retorna JSON
  if (!res.headersSent) {
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Erro interno do servidor' 
    });
  }
});

// =====================
// MIDDLEWARE PARA ROTAS NÃO ENCONTRADAS
// =====================
app.use((req, res) => {
  // Para rotas da API, retorna JSON
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ 
      success: false, 
      error: 'Rota não encontrada' 
    });
  } else {
    // Para outras rotas, pode retornar HTML normal
    res.status(404).send('Página não encontrada');
  }
});

// =====================
// Iniciar servidor
// =====================
const PORT = 3000;
app.listen(PORT, () => {
  // DEBUG: Servidor iniciado
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
