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
  try {
    // DEBUG: Lendo dados do arquivo JSON
    console.log('[DEBUG] Lendo dados do arquivo:', DATA_PATH);
    if (!fs.existsSync(DATA_PATH)) return null;
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch (error) {
    console.error('[DEBUG] Erro ao ler dados:', error);
    return null;
  }
}

// =====================
// Salva os dados da home no arquivo JSON
// =====================
function saveHomeData(data) {
  try {
    // DEBUG: Salvando dados no arquivo JSON
    console.log('[DEBUG] Salvando dados no arquivo:', DATA_PATH, data);
    // Validação: verifica se os dados são serializáveis
    let jsonString;
    try {
      jsonString = JSON.stringify(data, null, 2);
    } catch (validationError) {
      console.error('[DEBUG] Erro de validação dos dados antes de salvar:', validationError);
      throw new Error('Os dados enviados possuem estrutura inválida para salvar. Verifique se não há referências circulares ou valores não suportados.');
    }
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, jsonString, 'utf8');
  } catch (error) {
    console.error('[DEBUG] Erro ao salvar dados:', error);
    throw error;
  }
}

// Exporta funções utilitárias
module.exports = { getHomeData, saveHomeData, DATA_PATH };
