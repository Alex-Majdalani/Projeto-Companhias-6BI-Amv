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
const PLANOS_TABLE_ID = 'merte6jebbddnb1'; // Tabela: planos_ferias
const MILITAR_LINK_COL_ID = 'cpkbthmraha5uxc'; // Coluna de link com militares
const PERIODO_LINK_COL_ID = 'cdq9e4v7a1mzuvq'; // Coluna de link com periodos_ferias

export interface PeriodoRecord {
  Id: number;
  Nome_Periodo: string;
  data_inicio: string;
  data_fim: string;
}

export interface PlanoFeriasRecord {
  id: number;
  militarId: number | null;
  nomeMilitar: string;
  periodoId: number | null;
  periodoIdList: number[];
  periodo: string;
  dias: string;
  status: string;
  obs: string;
  parcelas: number;
  anoReferencia: number;
}

const PG_FORMAT_MAP: Record<string, string> = {
  'cel': 'CEL',
  'tc': 'TC',
  'maj': 'MAJ',
  'cap': 'CAP',
  '1ten': '1º TEN',
  '2ten': '2º TEN',
  'asp': 'ASP',
  'st': 'ST',
  '1sgt': '1º SGT',
  '2sgt': '2º SGT',
  '3sgt': '3º SGT',
  'cb': 'CB',
  'sdep': 'SD EP',
  'sdev': 'SD EV'
};

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
      return response.data.list.map((p: any) => ({
        Id: p.Id,
        Nome_Periodo: p.nome_periodo || p.Nome_Periodo || '',
        data_inicio: p.data_inicio,
        data_fim: p.data_fim
      }));
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
        nome_periodo: nome,
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

  /**
   * Obtém a listagem completa dos planos de férias com militares e períodos resolvidos.
   */
  static async getPlanos(): Promise<PlanoFeriasRecord[]> {
    try {
      const response = await api.get(`/api/v2/tables/${PLANOS_TABLE_ID}/records`, {
        params: { limit: 1000 }
      });
      
      return response.data.list.map((p: any) => {
        const militar = p.militares;
        const periodosList = p.periodos_ferias || [];
        const pIds = periodosList.map((po: any) => po.Id);
        const parcelasCount = Number(p.parcelas || periodosList.length || 1);

        let diasStr = '30';
        if (parcelasCount === 2) diasStr = '15 + 15';
        if (parcelasCount === 3) diasStr = '10 + 10 + 10';
        
        return {
          id: p.Id,
          militarId: militar?.Id || null,
          nomeMilitar: militar?.nome_guerra || 'Militar não vinculado',
          periodoId: pIds[0] || null,
          periodoIdList: pIds,
          periodo: periodosList.length > 0
            ? periodosList.map((po: any) => `${po.nome_periodo || 'Período'} (${po.data_inicio || ''} a ${po.data_fim || ''})`).join(' / ')
            : 'Sem período',
          dias: diasStr,
          status: p.status || 'Pendente',
          obs: p.observações || p.observa__es || '',
          parcelas: parcelasCount,
          anoReferencia: Number(p.ano_referencia || new Date().getFullYear())
        };
      });
    } catch (error: any) {
      console.error('[FeriasService] Erro ao buscar planos de férias:', error?.response?.data || error.message);
      throw new Error('Não foi possível buscar os planos de férias.');
    }
  }

  /**
   * Cria um novo plano de férias e estabelece os vínculos relacionais.
   */
  static async createPlano(militarId: number, periodoIds: number[], parcelas: number, status: string, obs: string, anoReferencia: number): Promise<PlanoFeriasRecord> {
    try {
      // Busca dados do militar para formatar o título como P/G Nome Completo
      let pgNome = 'Militar não vinculado';
      if (militarId) {
        try {
          const milRes = await api.get(`/api/v2/tables/m5bfeui27vdb3rx/records/${militarId}`);
          if (milRes.data) {
            const rawPg = milRes.data.posto_graduacao || '';
            const formattedPg = PG_FORMAT_MAP[rawPg.toLowerCase()] || rawPg.toUpperCase();
            pgNome = `${formattedPg} ${milRes.data.nome_completo || milRes.data.nome_guerra || ''}`.trim();
          }
        } catch (e) {
          console.error('[FeriasService] Erro ao carregar dados do militar para título:', e);
        }
      }

      // 1. Cria o registro base do plano
      const response = await api.post(`/api/v2/tables/${PLANOS_TABLE_ID}/records`, {
        titulo: `${pgNome} ${anoReferencia}`.trim(),
        status: status,
        observa__es: obs,
        parcelas: String(parcelas),
        ano_referencia: anoReferencia
      });
      const newPlanId = response.data.Id;

      // 2. Cria o link com o militar
      if (militarId) {
        await api.post(`/api/v2/tables/${PLANOS_TABLE_ID}/links/${MILITAR_LINK_COL_ID}/records/${newPlanId}`, {
          Id: militarId
        });
      }

      // 3. Cria os links com os períodos
      for (const pId of periodoIds) {
        if (pId) {
          await api.post(`/api/v2/tables/${PLANOS_TABLE_ID}/links/${PERIODO_LINK_COL_ID}/records/${newPlanId}`, {
            Id: pId
          });
        }
      }

      // 4. Busca o registro completo para retornar formatado
      const fetchResponse = await api.get(`/api/v2/tables/${PLANOS_TABLE_ID}/records/${newPlanId}`);
      const p = fetchResponse.data;
      const militar = p.militares;
      const periodosList = p.periodos_ferias || [];
      const pIds = periodosList.map((po: any) => po.Id);

      let diasStr = '30';
      if (parcelas === 2) diasStr = '15 + 15';
      if (parcelas === 3) diasStr = '10 + 10 + 10';

      return {
        id: p.Id,
        militarId: militar?.Id || null,
        nomeMilitar: militar?.nome_guerra || 'Militar não vinculado',
        periodoId: pIds[0] || null,
        periodoIdList: pIds,
        periodo: periodosList.length > 0
          ? periodosList.map((po: any) => `${po.nome_periodo || 'Período'} (${po.data_inicio || ''} a ${po.data_fim || ''})`).join(' / ')
          : 'Sem período',
        dias: diasStr,
        status: p.status || 'Pendente',
        obs: p.observações || p.observa__es || '',
        parcelas: parcelas,
        anoReferencia: Number(p.ano_referencia || new Date().getFullYear())
      };
    } catch (error: any) {
      console.error('[FeriasService] Erro ao criar plano de férias:', error?.response?.data || error.message);
      throw new Error('Não foi possível criar o plano de férias.');
    }
  }

  /**
   * Atualiza um plano de férias existente no banco.
   */
  static async updatePlano(id: number, militarId: number, periodoIds: number[], parcelas: number, status: string, obs: string, anoReferencia: number): Promise<PlanoFeriasRecord> {
    try {
      // Busca dados do militar para formatar o título como P/G Nome Completo
      let pgNome = 'Militar não vinculado';
      if (militarId) {
        try {
          const milRes = await api.get(`/api/v2/tables/m5bfeui27vdb3rx/records/${militarId}`);
          if (milRes.data) {
            const rawPg = milRes.data.posto_graduacao || '';
            const formattedPg = PG_FORMAT_MAP[rawPg.toLowerCase()] || rawPg.toUpperCase();
            pgNome = `${formattedPg} ${milRes.data.nome_completo || milRes.data.nome_guerra || ''}`.trim();
          }
        } catch (e) {
          console.error('[FeriasService] Erro ao carregar dados do militar para título:', e);
        }
      }

      // 1. Atualiza os dados básicos do plano
      await api.patch(`/api/v2/tables/${PLANOS_TABLE_ID}/records`, {
        Id: id,
        titulo: `${pgNome} ${anoReferencia}`.trim(),
        status: status,
        observa__es: obs,
        parcelas: String(parcelas),
        ano_referencia: anoReferencia
      });

      // Busca o registro atual antes de alterar links
      const currentRes = await api.get(`/api/v2/tables/${PLANOS_TABLE_ID}/records/${id}`);
      const currentPlan = currentRes.data;

      // 2. Gerencia o relacionamento do militar se mudou
      const currentMilitarId = currentPlan.militares?.Id || null;
      if (militarId !== currentMilitarId) {
        if (currentMilitarId) {
          try {
            await api.delete(`/api/v2/tables/${PLANOS_TABLE_ID}/links/${MILITAR_LINK_COL_ID}/records/${id}`, {
              data: { Id: currentMilitarId }
            });
          } catch (e) {}
        }
        if (militarId) {
          await api.post(`/api/v2/tables/${PLANOS_TABLE_ID}/links/${MILITAR_LINK_COL_ID}/records/${id}`, {
            Id: militarId
          });
        }
      }

      // 3. Gerencia o relacionamento dos períodos (remove todos os links antigos e adiciona os novos)
      const currentPeriodoIds = currentPlan.periodos_ferias?.map((po: any) => po.Id) || [];
      for (const oldId of currentPeriodoIds) {
        try {
          await api.delete(`/api/v2/tables/${PLANOS_TABLE_ID}/links/${PERIODO_LINK_COL_ID}/records/${id}`, {
            data: { Id: oldId }
          });
        } catch (e) {}
      }
      for (const pId of periodoIds) {
        if (pId) {
          await api.post(`/api/v2/tables/${PLANOS_TABLE_ID}/links/${PERIODO_LINK_COL_ID}/records/${id}`, {
            Id: pId
          });
        }
      }

      // 4. Busca o registro completo atualizado
      const fetchResponse = await api.get(`/api/v2/tables/${PLANOS_TABLE_ID}/records/${id}`);
      const p = fetchResponse.data;
      const militar = p.militares;
      const periodosList = p.periodos_ferias || [];
      const pIds = periodosList.map((po: any) => po.Id);

      let diasStr = '30';
      if (parcelas === 2) diasStr = '15 + 15';
      if (parcelas === 3) diasStr = '10 + 10 + 10';

      return {
        id: p.Id,
        militarId: militar?.Id || null,
        nomeMilitar: militar?.nome_guerra || 'Militar não vinculado',
        periodoId: pIds[0] || null,
        periodoIdList: pIds,
        periodo: periodosList.length > 0
          ? periodosList.map((po: any) => `${po.nome_periodo || 'Período'} (${po.data_inicio || ''} a ${po.data_fim || ''})`).join(' / ')
          : 'Sem período',
        dias: diasStr,
        status: p.status || 'Pendente',
        obs: p.observações || p.observa__es || '',
        parcelas: parcelas,
        anoReferencia: Number(p.ano_referencia || new Date().getFullYear())
      };
    } catch (error: any) {
      console.error('[FeriasService] Erro ao atualizar plano de férias:', error?.response?.data || error.message);
      throw new Error('Não foi possível atualizar o plano de férias.');
    }
  }

  /**
   * Exclui um plano de férias.
   */
  static async deletePlano(id: number): Promise<void> {
    try {
      await api.delete(`/api/v2/tables/${PLANOS_TABLE_ID}/records`, {
        data: [{ Id: id }]
      });
    } catch (error: any) {
      console.error('[FeriasService] Erro ao excluir plano de férias:', error?.response?.data || error.message);
      throw new Error('Não foi possível excluir o plano de férias.');
    }
  }
}
