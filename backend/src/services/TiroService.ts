import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NOCODB_URL,
  headers: {
    'xc-token': process.env.NOCODB_TOKEN
  }
});

const ATIVIDADES_TIRO_TABLE_ID = 'm1czdjoy5z64l97';
const TESTE_TIRO_TABLE_ID = 'm19usfkn4lkn99z';
const MILITAR_TABLE_ID = 'm5bfeui27vdb3rx';
const CIVIL_TABLE_ID = 'mtixj1e4vmt6ktl';

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

function calculateAge(birthDateStr: string): number {
  if (!birthDateStr) return 0;
  const cleanDateStr = typeof birthDateStr === 'string' ? birthDateStr.split('T')[0] : '';
  if (!cleanDateStr) return 0;
  const parts = cleanDateStr.split(/[-/]/);
  if (parts.length < 3) return 0;

  const year = parseInt(parts[0] || '0', 10);
  const month = parseInt(parts[1] || '0', 10) - 1;
  const day = parseInt(parts[2] || '0', 10);

  const birthDate = new Date(year, month, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export class TiroService {
  static async getTiroRecords() {
    try {
      const [testeTiroRes, militaresRes, civilRes] = await Promise.all([
        api.get(`/api/v2/tables/${TESTE_TIRO_TABLE_ID}/records`, {
          params: { limit: 1000 }
        }),
        api.get(`/api/v2/tables/${MILITAR_TABLE_ID}/records`, {
          params: { limit: 1000 }
        }),
        api.get(`/api/v2/tables/${CIVIL_TABLE_ID}/records`, {
          params: { limit: 1000 }
        })
      ]);

      const testeTiroList = testeTiroRes.data.list || [];
      const militaresList = militaresRes.data.list || [];
      const civilList = civilRes.data.list || [];

      const civilMap = new Map();
      civilList.forEach((c: any) => {
        civilMap.set(c.Id || c.id, c);
      });

      const militaresMap = new Map();
      militaresList.forEach((m: any) => {
        const civilId = m.dados_civil?.Id || m.dados_civil?.id || m.dados_civil;
        const civilObj = civilId ? civilMap.get(civilId) : null;
        
        militaresMap.set(m.Id || m.id, {
          id: m.Id || m.id,
          nomeGuerra: m.nome_guerra || '',
          posto: m.posto_graduacao || 'SD EP',
          pelotao: m.pelotao || 'Não informado',
          sexo: civilObj ? (civilObj.sexo || civilObj.clvz9v8k8jkivub || 'Não informado') : 'Não informado',
          dataNascimento: civilObj ? civilObj.data_nascimento : null
        });
      });

      return testeTiroList
        .map((t: any) => {
          const rawMilitarId = t.militar?.Id || t.militar?.id || t._nc_m2m_teste_tiro_militares?.[0]?.militares_id;
          if (!rawMilitarId) return null;

          const mil = militaresMap.get(rawMilitarId);
          const rawPg = mil ? mil.posto : '';
          const formattedPg = PG_FORMAT_MAP[rawPg.toLowerCase()] || rawPg.toUpperCase();
          const idade = mil && mil.dataNascimento ? calculateAge(mil.dataNascimento) : 0;

          // Obter os detalhes da atividade
          const atividadeObj = t.atividade_tiro || t._nc_m2m_teste_tiro_atividades_tiros?.[0]?.atividades_tiro;

          return {
            id: t.Id || t.id,
            atividade: atividadeObj?.atividade || 'Não informada',
            militarId: rawMilitarId || null,
            pgMilitar: formattedPg || 'N/A',
            nomeGuerraMilitar: mil ? mil.nomeGuerra : 'Militar não encontrado',
            pelotaoMilitar: mil ? mil.pelotao : 'Não informado',
            idade: idade > 0 ? `${idade} anos` : 'Não informada',
            sexo: mil ? mil.sexo : 'Não informado',
            mencao: t.mencao || 'N/A',
            segundaChamada: atividadeObj?.segunda_chamada === 'Sim' || atividadeObj?.segunda_chamada === true || atividadeObj?.segunda_chamada === 1
          };
        })
        .filter(Boolean);
    } catch (error: any) {
      console.error('[TiroService] Erro ao buscar registros de Tiro:', error?.response?.data || error.message);
      throw new Error('Não foi possível carregar a lista de testes de tiro.');
    }
  }

  static async getAtividades() {
    try {
      const res = await api.get(`/api/v2/tables/${ATIVIDADES_TIRO_TABLE_ID}/records`, {
        params: { limit: 1000 }
      });
      const list = res.data.list || [];
      const activities = Array.from(
        new Set(list.map((t: any) => t.atividade).filter(Boolean))
      ) as string[];
      return activities.sort((a, b) => a.localeCompare(b));
    } catch (error: any) {
      console.error('[TiroService] Erro ao buscar atividades:', error?.response?.data || error.message);
      throw new Error('Não foi possível carregar as atividades.');
    }
  }

  static async createAtividade(nome: string) {
    try {
      const res = await api.get(`/api/v2/tables/${ATIVIDADES_TIRO_TABLE_ID}/records`, {
        params: { limit: 1000 }
      });
      const list = res.data.list || [];
      
      const exists = list.some((t: any) => t.atividade && t.atividade.toLowerCase() === nome.toLowerCase());
      if (exists) {
        throw new Error('Já existe uma atividade cadastrada com este nome.');
      }

      const isSegunda = nome.toLowerCase().includes('2ª chamada') || nome.toLowerCase().includes('2a chamada') ? 'Sim' : 'Não';

      const created = await api.post(`/api/v2/tables/${ATIVIDADES_TIRO_TABLE_ID}/records`, {
        atividade: nome,
        segunda_chamada: isSegunda
      });

      return created.data;
    } catch (error: any) {
      console.error('[TiroService] Erro ao criar atividade de tiro:', error?.response?.data || error.message);
      throw new Error(error.message || 'Não foi possível cadastrar a atividade.');
    }
  }

  static async updateAtividade(nomeAntigo: string, novoNome: string) {
    try {
      const res = await api.get(`/api/v2/tables/${ATIVIDADES_TIRO_TABLE_ID}/records`, {
        params: { limit: 1000 }
      });
      const list = res.data.list || [];
      
      const exists = list.some((t: any) => t.atividade && t.atividade.toLowerCase() === novoNome.toLowerCase() && t.atividade.toLowerCase() !== nomeAntigo.toLowerCase());
      if (exists) {
        throw new Error('Já existe uma atividade cadastrada com este nome.');
      }

      const recordToUpdate = list.find((t: any) => t.atividade && t.atividade.toLowerCase() === nomeAntigo.toLowerCase());
      if (!recordToUpdate) {
        throw new Error('Atividade não encontrada.');
      }

      const isSegunda = novoNome.toLowerCase().includes('2ª chamada') || novoNome.toLowerCase().includes('2a chamada') ? 'Sim' : 'Não';

      await api.patch(`/api/v2/tables/${ATIVIDADES_TIRO_TABLE_ID}/records`, {
        Id: recordToUpdate.Id || recordToUpdate.id,
        atividade: novoNome,
        segunda_chamada: isSegunda
      });
    } catch (error: any) {
      console.error('[TiroService] Erro ao atualizar atividade de tiro:', error?.response?.data || error.message);
      throw new Error(error.message || 'Não foi possível atualizar a atividade.');
    }
  }

  static async deleteAtividade(nome: string) {
    try {
      const res = await api.get(`/api/v2/tables/${ATIVIDADES_TIRO_TABLE_ID}/records`, {
        params: { limit: 1000 }
      });
      const list = res.data.list || [];

      const recordToDelete = list.find((t: any) => t.atividade && t.atividade.toLowerCase() === nome.toLowerCase());
      if (recordToDelete) {
        const actId = recordToDelete.Id || recordToDelete.id;

        // Buscar e deletar também os testes de tiro associados a esta atividade antes de excluí-la
        const testRes = await api.get(`/api/v2/tables/${TESTE_TIRO_TABLE_ID}/records`, {
          params: { limit: 1000 }
        });
        const testList = testRes.data.list || [];
        const testsToDelete = testList.filter((t: any) => {
          const rawActId = t.atividade_tiro?.Id || t.atividade_tiro?.id || t._nc_m2m_teste_tiro_atividades_tiros?.[0]?.atividades_tiro_id;
          return rawActId === actId;
        });

        if (testsToDelete.length > 0) {
          await api.delete(`/api/v2/tables/${TESTE_TIRO_TABLE_ID}/records`, {
            data: testsToDelete.map((r: any) => ({ Id: r.Id || r.id }))
          });
        }

        await api.delete(`/api/v2/tables/${ATIVIDADES_TIRO_TABLE_ID}/records`, {
          data: { Id: actId }
        });
      }
    } catch (error: any) {
      console.error('[TiroService] Erro ao excluir atividade de tiro:', error?.response?.data || error.message);
      throw new Error('Não foi possível excluir a atividade.');
    }
  }

  static async createTiroRecord(data: { militarId: number; atividade: string; mencao?: string | null }) {
    try {
      // 1. Obter ID da atividade a partir do nome
      const resAct = await api.get(`/api/v2/tables/${ATIVIDADES_TIRO_TABLE_ID}/records`, {
        params: { limit: 1000 }
      });
      const actList = resAct.data.list || [];
      const matchedAct = actList.find((a: any) => a.atividade && a.atividade.toLowerCase() === data.atividade.toLowerCase());
      if (!matchedAct) {
        throw new Error('Atividade de tiro correspondente não encontrada.');
      }
      const atividadeId = matchedAct.Id || matchedAct.id;

      // 2. Obter nome de guerra do militar
      const resMilitar = await api.get(`/api/v2/tables/${MILITAR_TABLE_ID}/records/${data.militarId}`);
      const militarObj = resMilitar.data;
      const nomeGuerra = militarObj.nome_guerra || militarObj.nome || 'Militar';

      const titulo = `${nomeGuerra} ${data.atividade}`;

      // 3. Cadastrar registro em teste_tiro
      const created = await api.post(`/api/v2/tables/${TESTE_TIRO_TABLE_ID}/records`, {
        titulo: titulo,
        militar: data.militarId,
        atividade_tiro: atividadeId,
        mencao: data.mencao || null
      });
      return created.data;
    } catch (error: any) {
      console.error('[TiroService] Erro ao criar registro de Tiro:', error?.response?.data || error.message);
      throw new Error(error.message || 'Não foi possível cadastrar o teste de tiro.');
    }
  }

  static async updateTiroRecord(id: number, data: { atividade?: string; mencao?: string | null }) {
    try {
      const payload: any = {
        Id: id,
        mencao: data.mencao || null
      };

      if (data.atividade) {
        const resAct = await api.get(`/api/v2/tables/${ATIVIDADES_TIRO_TABLE_ID}/records`, {
          params: { limit: 1000 }
        });
        const actList = resAct.data.list || [];
        const matchedAct = actList.find((a: any) => a.atividade && a.atividade.toLowerCase() === data.atividade.toLowerCase());
        if (!matchedAct) {
          throw new Error('Atividade de tiro correspondente não encontrada.');
        }
        const atividadeId = matchedAct.Id || matchedAct.id;

        payload.atividade_tiro = atividadeId;

        // Atualizar o título do teste se a atividade mudou
        // Precisamos buscar o registro de teste atual para saber qual o militar associado
        const testRes = await api.get(`/api/v2/tables/${TESTE_TIRO_TABLE_ID}/records/${id}`);
        const currentTest = testRes.data;
        const rawMilitarId = currentTest.militar?.Id || currentTest.militar?.id || currentTest._nc_m2m_teste_tiro_militares?.[0]?.militares_id;

        if (rawMilitarId) {
          const resMilitar = await api.get(`/api/v2/tables/${MILITAR_TABLE_ID}/records/${rawMilitarId}`);
          const militarObj = resMilitar.data;
          const nomeGuerra = militarObj.nome_guerra || militarObj.nome || 'Militar';
          payload.titulo = `${nomeGuerra} ${data.atividade}`;
        }
      }

      await api.patch(`/api/v2/tables/${TESTE_TIRO_TABLE_ID}/records`, payload);
    } catch (error: any) {
      console.error('[TiroService] Erro ao atualizar registro de Tiro:', error?.response?.data || error.message);
      throw new Error('Não foi possível atualizar o teste de tiro.');
    }
  }

  static async deleteTiroRecord(id: number) {
    try {
      await api.delete(`/api/v2/tables/${TESTE_TIRO_TABLE_ID}/records`, {
        data: { Id: id }
      });
    } catch (error: any) {
      console.error('[TiroService] Erro ao excluir registro de Tiro:', error?.response?.data || error.message);
      throw new Error('Não foi possível excluir o teste de tiro.');
    }
  }
}
