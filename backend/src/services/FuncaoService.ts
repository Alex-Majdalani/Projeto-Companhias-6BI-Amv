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
  nomeEfetivo?: string | null;
  substitutoId?: number | null;
  nomeSubstituto?: string | null;
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
      return response.data.list.map((r: any) => {
        // As colunas de link de militares vêm como objetos se vinculadas
        const ef = r.efetivo;
        const sub = r.substituto;
        return {
          id: r.Id || r.id,
          funcao: r.funcao || '',
          efetivoId: ef?.Id || ef?.id || null,
          nomeEfetivo: ef ? `${ef.posto_graduacao || ''} ${ef.nome_guerra || ''}`.trim() : null,
          substitutoId: sub?.Id || sub?.id || null,
          nomeSubstituto: sub ? `${sub.posto_graduacao || ''} ${sub.nome_guerra || ''}`.trim() : null
        };
      });
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

  /**
   * Designa (vincula) militares efetivo e substituto para uma função.
   */
  static async assign(id: number, efetivoId: number | null, substitutoId: number | null): Promise<void> {
    console.log('[FuncaoService] assign recebido:', { id, efetivoId, substitutoId });
    try {
      // 1. Busca o registro atual para verificar vínculos anteriores
      const response = await api.get(`/api/v2/tables/${FUNCOES_TABLE_ID}/records/${id}`);
      const current = response.data;
      const oldEfetivoId = current.efetivo?.Id ? Number(current.efetivo.Id) : (current.efetivo?.id ? Number(current.efetivo.id) : null);
      const oldSubstitutoId = current.substituto?.Id ? Number(current.substituto.Id) : (current.substituto?.id ? Number(current.substituto.id) : null);
      console.log('[FuncaoService] old links:', { oldEfetivoId, oldSubstitutoId });

      const effId = efetivoId ? Number(efetivoId) : null;
      const subId = substitutoId ? Number(substitutoId) : null;

      // 2. Gerencia o link de militar efetivo
      if (effId !== oldEfetivoId) {
        if (oldEfetivoId) {
          try {
            await api.delete(`/api/v2/tables/${FUNCOES_TABLE_ID}/links/cfp8hcod98hlx1h/records/${id}`, {
              data: { Id: oldEfetivoId }
            });
          } catch (e) {}
        }
        if (effId) {
          await api.post(`/api/v2/tables/${FUNCOES_TABLE_ID}/links/cfp8hcod98hlx1h/records/${id}`, {
            Id: effId
          });
        }
      }

      // 3. Gerencia o link de militar substituto
      if (subId !== oldSubstitutoId) {
        if (oldSubstitutoId) {
          try {
            await api.delete(`/api/v2/tables/${FUNCOES_TABLE_ID}/links/czhgonijkr9p44c/records/${id}`, {
              data: { Id: oldSubstitutoId }
            });
          } catch (e) {}
        }
        if (subId) {
          await api.post(`/api/v2/tables/${FUNCOES_TABLE_ID}/links/czhgonijkr9p44c/records/${id}`, {
            Id: subId
          });
        }
      }
    } catch (error: any) {
      console.error('[FuncaoService] Erro ao designar militares:', error?.response?.data || error.message);
      throw new Error('Não foi possível designar os militares para a função.');
    }
  }
}
