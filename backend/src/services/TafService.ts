import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NOCODB_URL,
  headers: {
    'xc-token': process.env.NOCODB_TOKEN
  }
});

const TAF_TABLE_ID = 'm7wmzskh3j5famk';
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
  // Evitar problemas de timezone cortando a string de data no caractere 'T'
  const cleanDateStr = typeof birthDateStr === 'string' ? birthDateStr.split('T')[0] : '';
  if (!cleanDateStr) return 0;
  const parts = cleanDateStr.split(/[-/]/);
  if (parts.length < 3) return 0;

  const p0 = parts[0] || '0';
  const p1 = parts[1] || '0';
  const p2 = parts[2] || '0';

  const year = parseInt(p0, 10);
  const month = parseInt(p1, 10) - 1;
  const day = parseInt(p2, 10);

  const birthDate = new Date(year, month, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export class TafService {
  static async getTafRecords() {
    try {
      const [tafRes, militaresRes, civilRes] = await Promise.all([
        api.get(`/api/v2/tables/${TAF_TABLE_ID}/records`, {
          params: { limit: 1000 }
        }),
        api.get(`/api/v2/tables/${MILITAR_TABLE_ID}/records`, {
          params: { limit: 1000 }
        }),
        api.get(`/api/v2/tables/${CIVIL_TABLE_ID}/records`, {
          params: { limit: 1000 }
        })
      ]);

      const tafList = tafRes.data.list || [];
      const militaresList = militaresRes.data.list || [];
      const civilList = civilRes.data.list || [];

      // Mapear civis para busca rápida
      const civilMap = new Map();
      civilList.forEach((c: any) => {
        civilMap.set(c.Id || c.id, c);
      });

      // Mapear militares para busca rápida
      const militaresMap = new Map();
      militaresList.forEach((m: any) => {
        const civilId = m.dados_civil?.Id || m.dados_civil?.id || m.dados_civil;
        const civilObj = civilId ? civilMap.get(civilId) : null;
        
        militaresMap.set(m.Id || m.id, {
          id: m.Id || m.id,
          nomeGuerra: m.nome_guerra || '',
          posto: m.posto_graduacao || 'SD EP',
          pelotao: m.pelotao || 'Não informado',
          companhia: m.companhia || m.subunidade || 'Não informado',
          sexo: civilObj ? (civilObj.sexo || civilObj.clvz9v8k8jkivub || 'Não informado') : 'Não informado',
          dataNascimento: civilObj ? civilObj.data_nascimento : null
        });
      });

      return tafList
        .filter((t: any) => {
          const rawMilitarId = t.militar?.Id || t.militar?.id || t.militar;
          return !!rawMilitarId; // Filtrar placeholders sem militar vinculado
        })
        .map((t: any) => {
          // Obter militar vinculado
          const rawMilitarId = t.militar?.Id || t.militar?.id || t.militar;
          const mil = rawMilitarId ? militaresMap.get(rawMilitarId) : null;

          const rawPg = mil ? mil.posto : '';
          const formattedPg = PG_FORMAT_MAP[rawPg.toLowerCase()] || rawPg.toUpperCase();

          const idade = mil && mil.dataNascimento ? calculateAge(mil.dataNascimento) : 0;

          return {
            id: t.Id || t.id,
            atividade: t.atividade || 'Não informada',
            militarId: rawMilitarId || null,
            pgMilitar: formattedPg || 'N/A',
            nomeGuerraMilitar: mil ? mil.nomeGuerra : 'Militar não encontrado',
            pelotaoMilitar: mil ? mil.pelotao : 'Não informado',
            companhiaMilitar: mil ? mil.companhia : 'Não informado',
            idade: idade > 0 ? `${idade} anos` : 'Não informada',
            sexo: mil ? mil.sexo : 'Não informado',
            corrida: t.corrida !== null && t.corrida !== undefined ? Number(t.corrida) : null,
            flexao: t.flexao !== null && t.flexao !== undefined ? Number(t.flexao) : null,
            barra: t.barra !== null && t.barra !== undefined ? Number(t.barra) : null,
            abdominal: t.abdominal !== null && t.abdominal !== undefined ? Number(t.abdominal) : null,
            mencao: t.mencao || 'N/A',
            segundaChamada: t.segunda_chamada === 'Sim' || t.segunda_chamada === true || t.segunda_chamada === 1
          };
        });
    } catch (error: any) {
      console.error('[TafService] Erro ao buscar registros de TAF:', error?.response?.data || error.message);
      throw new Error('Não foi possível carregar a lista de testes de aptidão física.');
    }
  }

  static async getAtividades() {
    try {
      const res = await api.get(`/api/v2/tables/${TAF_TABLE_ID}/records`, {
        params: { limit: 1000 }
      });
      const list = res.data.list || [];
      const activities = Array.from(
        new Set(list.map((t: any) => t.atividade).filter(Boolean))
      ) as string[];
      // Ordenar alfabeticamente
      return activities.sort((a, b) => a.localeCompare(b));
    } catch (error: any) {
      console.error('[TafService] Erro ao buscar atividades:', error?.response?.data || error.message);
      throw new Error('Não foi possível carregar as atividades.');
    }
  }

  static async createAtividade(nome: string) {
    try {
      // Validar duplicidade
      const res = await api.get(`/api/v2/tables/${TAF_TABLE_ID}/records`, {
        params: { limit: 1000 }
      });
      const list = res.data.list || [];
      const exists = list.some((t: any) => t.atividade && t.atividade.toLowerCase() === nome.toLowerCase());
      if (exists) {
        throw new Error('Já existe uma atividade cadastrada com este nome.');
      }

      // Criar registro de espaço reservado
      const created = await api.post(`/api/v2/tables/${TAF_TABLE_ID}/records`, {
        atividade: nome,
        militar: null,
        corrida: null,
        flexao: null,
        barra: null,
        abdominal: null,
        mencao: null,
        segunda_chamada: nome.toLowerCase().includes('2ª chamada') || nome.toLowerCase().includes('2a chamada') ? 'Sim' : 'Não'
      });
      return created.data;
    } catch (error: any) {
      console.error('[TafService] Erro ao criar atividade:', error?.response?.data || error.message);
      throw new Error(error.message || 'Não foi possível cadastrar a atividade.');
    }
  }

  static async updateAtividade(nomeAntigo: string, novoNome: string) {
    try {
      // Validar duplicidade
      const res = await api.get(`/api/v2/tables/${TAF_TABLE_ID}/records`, {
        params: { limit: 1000 }
      });
      const list = res.data.list || [];
      const exists = list.some((t: any) => t.atividade && t.atividade.toLowerCase() === novoNome.toLowerCase() && t.atividade.toLowerCase() !== nomeAntigo.toLowerCase());
      if (exists) {
        throw new Error('Já existe uma atividade cadastrada com este nome.');
      }

      // Buscar todos os registros com o nome antigo e atualizá-los
      const recordsToUpdate = list.filter((t: any) => t.atividade && t.atividade.toLowerCase() === nomeAntigo.toLowerCase());
      const isSegunda = novoNome.toLowerCase().includes('2ª chamada') || novoNome.toLowerCase().includes('2a chamada') ? 'Sim' : 'Não';
      
      await Promise.all(
        recordsToUpdate.map((r: any) => 
          api.patch(`/api/v2/tables/${TAF_TABLE_ID}/records`, {
            Id: r.Id || r.id,
            atividade: novoNome,
            segunda_chamada: isSegunda
          })
        )
      );
    } catch (error: any) {
      console.error('[TafService] Erro ao atualizar atividade:', error?.response?.data || error.message);
      throw new Error(error.message || 'Não foi possível atualizar a atividade.');
    }
  }

  static async deleteAtividade(nome: string) {
    try {
      // Buscar todos os registros com a atividade correspondente e excluí-los
      const res = await api.get(`/api/v2/tables/${TAF_TABLE_ID}/records`, {
        params: { limit: 1000 }
      });
      const list = res.data.list || [];
      const recordsToDelete = list.filter((t: any) => t.atividade && t.atividade.toLowerCase() === nome.toLowerCase());
      
      if (recordsToDelete.length > 0) {
        await api.delete(`/api/v2/tables/${TAF_TABLE_ID}/records`, {
          data: recordsToDelete.map((r: any) => ({ Id: r.Id || r.id }))
        });
      }
    } catch (error: any) {
      console.error('[TafService] Erro ao excluir atividade:', error?.response?.data || error.message);
      throw new Error('Não foi possível excluir a atividade.');
    }
  }

  static async createTafRecord(data: { militarId: number; atividade: string; corrida?: number | null; flexao?: number | null; barra?: number | null; abdominal?: number | null; mencao?: string | null; segunda_chamada?: string | null }) {
    try {
      const created = await api.post(`/api/v2/tables/${TAF_TABLE_ID}/records`, {
        militar: data.militarId,
        atividade: data.atividade,
        corrida: data.corrida ?? null,
        flexao: data.flexao ?? null,
        barra: data.barra ?? null,
        abdominal: data.abdominal ?? null,
        mencao: data.mencao || null,
        segunda_chamada: data.segunda_chamada || (data.atividade.toLowerCase().includes('2ª chamada') || data.atividade.toLowerCase().includes('2a chamada') ? 'Sim' : 'Não')
      });
      return created.data;
    } catch (error: any) {
      console.error('[TafService] Erro ao criar registro de TAF:', error?.response?.data || error.message);
      throw new Error('Não foi possível cadastrar o teste.');
    }
  }

  static async updateTafRecord(id: number, data: { atividade?: string; corrida?: number | null; flexao?: number | null; barra?: number | null; abdominal?: number | null; mencao?: string | null; segunda_chamada?: string | null }) {
    try {
      const payload: any = {
        Id: id,
        corrida: data.corrida ?? null,
        flexao: data.flexao ?? null,
        barra: data.barra ?? null,
        abdominal: data.abdominal ?? null,
        mencao: data.mencao || null
      };
      if (data.atividade !== undefined) {
        payload.atividade = data.atividade;
      }
      if (data.segunda_chamada !== undefined) {
        payload.segunda_chamada = data.segunda_chamada;
      }
      await api.patch(`/api/v2/tables/${TAF_TABLE_ID}/records`, payload);
    } catch (error: any) {
      console.error('[TafService] Erro ao atualizar registro de TAF:', error?.response?.data || error.message);
      throw new Error('Não foi possível atualizar o teste.');
    }
  }

  static async deleteTafRecord(id: number) {
    try {
      await api.delete(`/api/v2/tables/${TAF_TABLE_ID}/records`, {
        data: { Id: id }
      });
    } catch (error: any) {
      console.error('[TafService] Erro ao excluir registro de TAF:', error?.response?.data || error.message);
      throw new Error('Não foi possível excluir o teste.');
    }
  }
}
