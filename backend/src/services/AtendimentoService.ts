import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NOCODB_URL,
  headers: {
    'xc-token': process.env.NOCODB_TOKEN
  }
});

const VISITAS_TABLE_ID = 'm0ya166asp9wk5b';
const MEDICOS_TABLE_ID = 'mid0imv26yvl2uj';
const BAIXADOS_TABLE_ID = 'mjaepbsec6qieim';

const LINK_VISITA_MILITAR = 'cut6qh5z0799mxm';
const LINK_VISITA_BAIXADO = 'cvee152e1icmcp9';
const LINK_BAIXADO_MILITAR = 'cun0vzrnsqbx51c';
const LINK_BAIXADO_VISITA = 'cifu7rzo7o0c1f3';

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

export class AtendimentoService {
  static async getMedicos() {
    try {
      const res = await api.get(`/api/v2/tables/${MEDICOS_TABLE_ID}/records`, {
        params: { limit: 100 }
      });
      return (res.data.list || []).map((m: any) => ({
        id: m.Id || m.id,
        nomeCompleto: m.nome_completo || '',
        crm: m.crm || ''
      }));
    } catch (error: any) {
      console.error('[AtendimentoService] Erro ao buscar médicos:', error?.response?.data || error.message);
      throw new Error('Não foi possível carregar a lista de médicos.');
    }
  }

  static async createMedico(data: { nomeCompleto: string; crm: string }) {
    try {
      const res = await api.post(`/api/v2/tables/${MEDICOS_TABLE_ID}/records`, {
        nome_completo: data.nomeCompleto,
        crm: data.crm
      });
      return res.data;
    } catch (error: any) {
      console.error('[AtendimentoService] Erro ao criar médico:', error?.response?.data || error.message);
      throw new Error('Não foi possível cadastrar o médico.');
    }
  }

  static async getVisitas() {
    try {
      const [visitasRes, baixadosRes] = await Promise.all([
        api.get(`/api/v2/tables/${VISITAS_TABLE_ID}/records`, {
          params: { limit: 1000 }
        }),
        api.get(`/api/v2/tables/${BAIXADOS_TABLE_ID}/records`, {
          params: { limit: 1000 }
        })
      ]);

      const visitsList = visitasRes.data.list || [];
      const baixadosList = baixadosRes.data.list || [];

      // Criar mapa de baixados para busca rápida por ID
      const baixadosMap = new Map();
      baixadosList.forEach((b: any) => {
        baixadosMap.set(b.Id || b.id, b);
      });

      return visitsList.map((v: any) => {
        const mil = v.militar;
        const rawPg = mil?.posto_graduacao || '';
        const formattedPg = PG_FORMAT_MAP[rawPg.toLowerCase()] || rawPg.toUpperCase();
        
        const rawBx = v.baixado1;
        const bxId = rawBx?.Id || rawBx?.id;
        const bx = bxId ? baixadosMap.get(bxId) : null;
        
        return {
          id: v.Id || v.id,
          militarId: mil?.Id || mil?.id || null,
          pgMilitar: formattedPg || 'N/A',
          nomeCompletoMilitar: mil?.nome_completo || mil?.nome_guerra || '',
          nomeGuerraMilitar: mil?.nome_guerra || '',
          dataVisita: v.data_visita || '',
          baixado: v.baixado || 'Não',
          medicoResponsavel: v.medico_responsavel || '',
          parecerMedico: v.parecer_medico || '',
          obs: v.obs || '',
          baixadoInfo: bx ? {
            id: bx.Id || bx.id,
            motivo: bx.motivo || '',
            dataInicio: bx.data_inicio || '',
            dataRetorno: bx.data_retorno || '',
            csd: Array.isArray(bx.csd) ? bx.csd : (bx.csd ? bx.csd.split(',').map((s: string) => s.trim()).filter(Boolean) : [])
          } : null
        };
      });
    } catch (error: any) {
      console.error('[AtendimentoService] Erro ao buscar visitas médicas:', error?.response?.data || error.message);
      throw new Error('Não foi possível buscar os atendimentos médicos.');
    }
  }

  static async createVisita(data: {
    militarId: number;
    motivoVisita: string;
    dataVisita: string;
    medicoResponsavel: string;
    parecerMedico: string;
    obs: string;
    baixado: 'Sim' | 'Não';
    motivoBaixa?: string;
    dataRetorno?: string;
    csd?: string[];
  }) {
    try {
      // 1. Criar a Visita Médica
      const visitaRes = await api.post(`/api/v2/tables/${VISITAS_TABLE_ID}/records`, {
        motivo_visita: data.motivoVisita,
        data_visita: data.dataVisita,
        baixado: data.baixado,
        medico_responsavel: data.medicoResponsavel,
        parecer_medico: data.parecerMedico,
        obs: data.obs
      });
      const visitaId = visitaRes.data.Id || visitaRes.data.id;

      // 2. Vincular o Militar à Visita Médica
      if (data.militarId) {
        await api.post(`/api/v2/tables/${VISITAS_TABLE_ID}/links/${LINK_VISITA_MILITAR}/records/${visitaId}`, {
          Id: data.militarId
        });
      }

      // 3. Se for baixado, cria o registro de baixa e faz os vínculos
      if (data.baixado === 'Sim') {
        const baixaRes = await api.post(`/api/v2/tables/${BAIXADOS_TABLE_ID}/records`, {
          motivo: data.motivoBaixa || '',
          data_inicio: data.dataVisita,
          data_retorno: data.dataRetorno || null,
          csd: data.csd || []
        });
        const baixaId = baixaRes.data.Id || baixaRes.data.id;

        // Vincular Militar ao Baixado
        if (data.militarId) {
          await api.post(`/api/v2/tables/${BAIXADOS_TABLE_ID}/links/${LINK_BAIXADO_MILITAR}/records/${baixaId}`, {
            Id: data.militarId
          });
        }

        // Vincular Visita ao Baixado
        await api.post(`/api/v2/tables/${VISITAS_TABLE_ID}/links/${LINK_VISITA_BAIXADO}/records/${visitaId}`, {
          Id: baixaId
        });
      }

      return visitaRes.data;
    } catch (error: any) {
      console.error('[AtendimentoService] Erro ao criar visita médica:', error?.response?.data || error.message);
      throw new Error('Não foi possível salvar o atendimento médico.');
    }
  }

  static async deleteVisita(id: number) {
    try {
      // 1. Buscar a visita para ver se tem baixado vinculado
      const visitaRes = await api.get(`/api/v2/tables/${VISITAS_TABLE_ID}/records/${id}`);
      const baixadoId = visitaRes.data?.baixado1?.Id || visitaRes.data?.baixado1?.id || null;

      // 2. Excluir o baixado se existir
      if (baixadoId) {
        try {
          await api.delete(`/api/v2/tables/${BAIXADOS_TABLE_ID}/records`, {
            data: [{ Id: baixadoId }]
          });
        } catch (e) {
          console.error('[AtendimentoService] Erro ao deletar baixado vinculado:', e);
        }
      }

      // 3. Excluir a visita médica
      await api.delete(`/api/v2/tables/${VISITAS_TABLE_ID}/records`, {
        data: [{ Id: id }]
      });
    } catch (error: any) {
      console.error('[AtendimentoService] Erro ao excluir visita médica:', error?.response?.data || error.message);
      throw new Error('Não foi possível excluir o atendimento médico.');
    }
  }

  static async updateMedico(id: number, data: { nomeCompleto: string; crm: string }) {
    try {
      const res = await api.patch(`/api/v2/tables/${MEDICOS_TABLE_ID}/records`, {
        Id: id,
        nome_completo: data.nomeCompleto,
        crm: data.crm
      });
      return res.data;
    } catch (error: any) {
      console.error('[AtendimentoService] Erro ao atualizar médico:', error?.response?.data || error.message);
      throw new Error('Não foi possível atualizar o médico.');
    }
  }

  static async deleteMedico(id: number) {
    try {
      await api.delete(`/api/v2/tables/${MEDICOS_TABLE_ID}/records`, {
        data: [{ Id: id }]
      });
    } catch (error: any) {
      console.error('[AtendimentoService] Erro ao excluir médico:', error?.response?.data || error.message);
      throw new Error('Não foi possível excluir o médico.');
    }
  }
}
