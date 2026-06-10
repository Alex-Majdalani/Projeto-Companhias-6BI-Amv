import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// Instância do Axios configurada para se comunicar com o NocoDB
// ─────────────────────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: process.env.NOCODB_URL,
  headers: {
    'xc-token': process.env.NOCODB_TOKEN // Token de autenticação NocoDB
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// IDs das tabelas no NocoDB (Sistema_sgte)
// ─────────────────────────────────────────────────────────────────────────────
const ATIVIDADES_TABLE_ID = 'mrkmcjg5oh6kv5y'; // Tabela: atividades_agenda
const TIPO_TABLE_ID       = 'maqtehufbvs1ogo'; // Tabela: tipo_atividade
const TIPO_LINK_COL_ID    = 'cfz0lh4tyen0hbg'; // Coluna LinkToAnotherRecord: tipo (Many-to-One)

// ─────────────────────────────────────────────────────────────────────────────
// Tipagens internas
// ─────────────────────────────────────────────────────────────────────────────

/** Representa um registro de atividade retornado pelo NocoDB */
export interface AtividadeRecord {
  Id: number;
  titulo_atividade: string;
  data: string;           // Formato 'YYYY-MM-DD'
  descricao: string | null;
  tipo: {
    Id: number;
    tipos: string;
  } | null;
}

/** Representa um tipo de atividade retornado pelo NocoDB */
export interface TipoRecord {
  Id: number;
  tipos: string;
}

/** Dados necessários para criar uma nova atividade */
export interface CreateAtividadeDto {
  titulo_atividade: string;
  data: string;           // Formato 'YYYY-MM-DD'
  descricao?: string;
  tipoId: number;         // ID do registro em tipo_atividade
}

// ─────────────────────────────────────────────────────────────────────────────
// AgendaService — operações CRUD para a agenda de atividades
// ─────────────────────────────────────────────────────────────────────────────
export class AgendaService {

  /**
   * Lista todas as atividades da tabela atividades_agenda.
   * O campo 'tipo' é retornado como objeto aninhado pelo NocoDB (LinkToAnotherRecord).
   */
  static async getAtividades(): Promise<AtividadeRecord[]> {
    try {
      const response = await api.get(`/api/v2/tables/${ATIVIDADES_TABLE_ID}/records`, {
        params: {
          limit: 1000, // Retorna até 1000 registros para cobrir todos os meses
          sort: 'data' // Ordena pela data crescente
        }
      });
      return response.data.list as AtividadeRecord[];
    } catch (error: any) {
      console.error('[AgendaService] Erro ao buscar atividades:', error?.response?.data || error.message);
      throw new Error('Não foi possível buscar as atividades.');
    }
  }

  /**
   * Lista todos os tipos de atividade cadastrados na tabela tipo_atividade.
   */
  static async getTipos(): Promise<TipoRecord[]> {
    try {
      const response = await api.get(`/api/v2/tables/${TIPO_TABLE_ID}/records`, {
        params: { limit: 100 }
      });
      return response.data.list as TipoRecord[];
    } catch (error: any) {
      console.error('[AgendaService] Erro ao buscar tipos:', error?.response?.data || error.message);
      throw new Error('Não foi possível buscar os tipos de atividade.');
    }
  }

  /**
   * Cria uma nova atividade na tabela atividades_agenda e linka ao tipo informado.
   * 
   * O relacionamento é do tipo Many-to-One (mo), portanto usamos a API de links
   * do NocoDB para associar o registro ao tipo_atividade pelo ID da coluna de link.
   */
  static async createAtividade(dto: CreateAtividadeDto): Promise<AtividadeRecord> {
    try {
      // 1. Cria o registro base na tabela atividades_agenda
      const createResponse = await api.post(`/api/v2/tables/${ATIVIDADES_TABLE_ID}/records`, {
        titulo_atividade: dto.titulo_atividade,
        data: dto.data,
        descricao: dto.descricao || ''
      });

      const novaAtividadeId: number = createResponse.data.Id;

      // 2. Vincula o tipo via LinkToAnotherRecord (campo 'tipo', ID da coluna: TIPO_LINK_COL_ID)
      await api.post(
        `/api/v2/tables/${ATIVIDADES_TABLE_ID}/links/${TIPO_LINK_COL_ID}/records/${novaAtividadeId}`,
        { Id: dto.tipoId }
      );

      // 3. Busca o registro recém-criado com o tipo já populado e retorna
      const fetchResponse = await api.get(
        `/api/v2/tables/${ATIVIDADES_TABLE_ID}/records/${novaAtividadeId}`
      );

      return fetchResponse.data as AtividadeRecord;
    } catch (error: any) {
      console.error('[AgendaService] Erro ao criar atividade:', error?.response?.data || error.message);
      throw new Error('Não foi possível criar a atividade.');
    }
  }

  /**
   * Exclui uma atividade pelo ID.
   * O NocoDB gerencia a remoção dos links automaticamente.
   */
  static async deleteAtividade(id: number): Promise<void> {
    try {
      await api.delete(`/api/v2/tables/${ATIVIDADES_TABLE_ID}/records`, {
        data: { Id: id }
      });
    } catch (error: any) {
      console.error('[AgendaService] Erro ao excluir atividade:', error?.response?.data || error.message);
      throw new Error('Não foi possível excluir a atividade.');
    }
  }
}
