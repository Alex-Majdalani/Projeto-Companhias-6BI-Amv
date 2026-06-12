import axios from 'axios';

// Instância do Axios configurada para comunicação direta com a API do NocoDB
const api = axios.create({
  baseURL: process.env.NOCODB_URL,
  headers: {
    'xc-token': process.env.NOCODB_TOKEN // Chave de API de autenticação do NocoDB
  }
});

// IDs das tabelas de férias no NocoDB
const PERIODOS_TABLE_ID = 'my58sjyxf1tjlij'; // Tabela: periodos_ferias

export interface PeriodoRecord {
  Id: number;
  Nome_Periodo: string;
  data_inicio: string;
  data_fim: string;
}

export class FeriasService {
  /**
   * Obtém a listagem completa dos períodos de férias cadastrados no banco de dados.
   * Adicionado comentários para manter a organização dos arquivos conforme solicitado.
   */
  static async getPeriodos(): Promise<PeriodoRecord[]> {
    try {
      const response = await api.get(`/api/v2/tables/${PERIODOS_TABLE_ID}/records`, {
        params: { limit: 100 }
      });
      return response.data.list as PeriodoRecord[];
    } catch (error: any) {
      console.error('[FeriasService] Erro ao buscar períodos:', error?.response?.data || error.message);
      throw new Error('Não foi possível buscar os períodos de férias.');
    }
  }

  /**
   * Cria um novo período de férias no NocoDB.
   * Recebe o nome do período, data de início e data de fim.
   */
  static async createPeriodo(nome: string, inicio: string, fim: string): Promise<PeriodoRecord> {
    try {
      const response = await api.post(`/api/v2/tables/${PERIODOS_TABLE_ID}/records`, {
        Nome_Periodo: nome,
        data_inicio: inicio,
        data_fim: fim
      });
      // Retorna o registro contendo o ID e os campos originais
      return {
        Id: response.data.Id,
        Nome_Periodo: nome,
        data_inicio: inicio,
        data_fim: fim
      };
    } catch (error: any) {
      console.error('[FeriasService] Erro ao criar período:', error?.response?.data || error.message);
      throw new Error('Não foi possível criar o período de férias.');
    }
  }

  /**
   * Exclui um período de férias do banco de dados pelo seu ID.
   */
  static async deletePeriodo(id: number): Promise<void> {
    try {
      await api.delete(`/api/v2/tables/${PERIODOS_TABLE_ID}/records`, {
        data: [{ Id: id }]
      });
    } catch (error: any) {
      console.error('[FeriasService] Erro ao excluir período:', error?.response?.data || error.message);
      throw new Error('Não foi possível excluir o período de férias.');
    }
  }
}
