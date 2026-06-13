import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NOCODB_URL,
  headers: {
    'xc-token': process.env.NOCODB_TOKEN
  }
});

const FUNCOES_TABLE_ID = 'm53uey4mkuimti7'; // Tabela: funcoes_cia

export interface FuncaoRecord {
  id: number;
  funcao: string;
  efetivoId?: number | null;
  substitutoId?: number | null;
}

export class FuncaoService {
  /**
   * Obtém a listagem de todas as funções cadastradas no NocoDB.
   */
  static async list(): Promise<FuncaoRecord[]> {
    try {
      const response = await api.get(`/api/v2/tables/${FUNCOES_TABLE_ID}/records`, {
        params: { limit: 100 }
      });
      return response.data.list.map((r: any) => ({
        id: r.Id || r.id,
        funcao: r.funcao || '',
        efetivoId: r.efetivo?.Id || r.efetivo?.id || null,
        substitutoId: r.substituto?.Id || r.substituto?.id || null
      }));
    } catch (error: any) {
      console.error('[FuncaoService] Erro ao listar funções:', error?.response?.data || error.message);
      throw new Error('Não foi possível listar as funções da cia.');
    }
  }

  /**
   * Cria uma nova função no banco de dados.
   */
  static async create(funcao: string): Promise<FuncaoRecord> {
    try {
      const response = await api.post(`/api/v2/tables/${FUNCOES_TABLE_ID}/records`, {
        funcao: funcao
      });
      return {
        id: response.data.Id || response.data.id,
        funcao: funcao
      };
    } catch (error: any) {
      console.error('[FuncaoService] Erro ao criar função:', error?.response?.data || error.message);
      throw new Error('Não foi possível criar a função.');
    }
  }

  /**
   * Remove uma função pelo ID.
   */
  static async delete(id: number): Promise<void> {
    try {
      await api.delete(`/api/v2/tables/${FUNCOES_TABLE_ID}/records`, {
        data: [{ Id: id }]
      });
    } catch (error: any) {
      console.error('[FuncaoService] Erro ao excluir função:', error?.response?.data || error.message);
      throw new Error('Não foi possível excluir a função.');
    }
  }

  /**
   * Atualiza o nome de uma função pelo ID.
   */
  static async update(id: number, funcao: string): Promise<FuncaoRecord> {
    try {
      await api.patch(`/api/v2/tables/${FUNCOES_TABLE_ID}/records`, {
        Id: id,
        funcao: funcao
      });
      return {
        id,
        funcao
      };
    } catch (error: any) {
      console.error('[FuncaoService] Erro ao atualizar função:', error?.response?.data || error.message);
      throw new Error('Não foi possível atualizar a função.');
    }
  }
}
