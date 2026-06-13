const axios = require('axios');
require('dotenv').config();

const api = axios.create({
  baseURL: process.env.NOCODB_URL,
  headers: {
    'xc-token': process.env.NOCODB_TOKEN
  }
});

const PERIODOS_TABLE_ID = 'my58sjyxf1tjlij';

async function run() {
  try {
    const periodsToCreate = [];
    for (let i = 6; i <= 15; i++) {
      const dayStr = String(i).padStart(2, '0');
      periodsToCreate.push({
        nome_periodo: `${i}º Período de testes`,
        data_inicio: `2026-06-${dayStr}`,
        data_fim: `2026-07-${dayStr}`
      });
    }

    console.log('Iniciando criação de 10 períodos no NocoDB...');
    for (const p of periodsToCreate) {
      const response = await api.post(`/api/v2/tables/${PERIODOS_TABLE_ID}/records`, p);
      console.log(`Período criado com sucesso: ${response.data.nome_periodo || response.data.Nome_Periodo} (ID: ${response.data.Id})`);
    }
    console.log('Todos os 10 períodos foram criados!');
  } catch (error) {
    console.error('Erro ao criar períodos:', error.response?.data || error.message);
  }
}

run();
