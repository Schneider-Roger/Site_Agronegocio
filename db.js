// =====================
// db.js - Banco de dados simples em arquivo JSON
// =====================
const fs = require('fs');
const path = require('path');

// Caminho do arquivo de dados
const DATA_PATH = path.join(__dirname, 'data', 'home.json');

// =====================
// Lê os dados da home do arquivo JSON
// =====================
function getHomeData() {
  // DEBUG: Lendo dados do arquivo JSON
  console.log('[DEBUG] Lendo dados do arquivo:', DATA_PATH);
  if (!fs.existsSync(DATA_PATH)) return null;
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

// =====================
// Salva os dados da home no arquivo JSON
// =====================
function saveHomeData(data) {
  // DEBUG: Salvando dados no arquivo JSON
  console.log('[DEBUG] Salvando dados no arquivo:', DATA_PATH, data);
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// Exporta funções utilitárias
module.exports = { getHomeData, saveHomeData, DATA_PATH };
