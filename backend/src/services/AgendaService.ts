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

/** Dados necessários para atualizar uma atividade */
export interface UpdateAtividadeDto {
  titulo_atividade?: string;
  data?: string;           // Formato 'YYYY-MM-DD'
  descricao?: string;
  tipoId?: number;         // Novo ID do tipo para vincular, se necessário
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
   * Cria um novo tipo de atividade na tabela tipo_atividade.
   * Modificado para retornar o objeto completo com o nome do tipo (campo 'tipos')
   * para evitar erros de renderização no frontend devido ao retorno resumido do NocoDB.
   */
  static async createTipo(tipos: string): Promise<TipoRecord> {
    try {
      const response = await api.post(`/api/v2/tables/${TIPO_TABLE_ID}/records`, {
        tipos
      });
      // Retorna o registro completo contendo o Id gerado e a string de tipos enviada
      return {
        Id: response.data.Id,
        tipos: tipos
      };
    } catch (error: any) {
      console.error('[AgendaService] Erro ao criar tipo:', error?.response?.data || error.message);
      throw new Error('Não foi possível criar o tipo de atividade.');
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
   * Atualiza as informações de uma atividade e seu tipo correspondente no NocoDB.
   */
  static async updateAtividade(id: number, dto: UpdateAtividadeDto): Promise<AtividadeRecord> {
    try {
      // 1. Atualiza as informações textuais básicas da atividade
      await api.patch(`/api/v2/tables/${ATIVIDADES_TABLE_ID}/records`, {
        Id: id,
        titulo_atividade: dto.titulo_atividade,
        data: dto.data,
        descricao: dto.descricao
      });

      // 2. Caso um novo tipoId tenha sido informado, gerencia a atualização do relacionamento
      if (dto.tipoId) {
        // Busca a atividade atual para conferir se ela já tinha algum tipo vinculado
        const currentRes = await api.get(`/api/v2/tables/${ATIVIDADES_TABLE_ID}/records/${id}`);
        const currentTipo = currentRes.data.tipo;

        // Se já possuía um tipo vinculado, remove o link existente no NocoDB para evitar duplicidade
        if (currentTipo && currentTipo.Id) {
          try {
            await api.delete(`/api/v2/tables/${ATIVIDADES_TABLE_ID}/links/${TIPO_LINK_COL_ID}/records/${id}`, {
              data: { Id: currentTipo.Id }
            });
          } catch (delLinkErr) {
            // Ignora se o link não for encontrado
          }
        }

        // Adiciona o novo relacionamento via tabela de junção/link do NocoDB
        await api.post(
          `/api/v2/tables/${ATIVIDADES_TABLE_ID}/links/${TIPO_LINK_COL_ID}/records/${id}`,
          { Id: dto.tipoId }
        );
      }

      // 3. Busca e retorna o registro atualizado finalizado
      const fetchResponse = await api.get(
        `/api/v2/tables/${ATIVIDADES_TABLE_ID}/records/${id}`
      );

      return fetchResponse.data as AtividadeRecord;
    } catch (error: any) {
      console.error('[AgendaService] Erro ao atualizar atividade:', error?.response?.data || error.message);
      throw new Error('Não foi possível atualizar a atividade.');
    }
  }

  /**
   * Exclui uma ou mais atividades pelo(s) ID(s).
   * O NocoDB gerencia a remoção dos links automaticamente.
   * Suporta exclusão individual (passando um número) ou em lote (passando array de IDs).
   */
  static async deleteAtividade(ids: number | number[]): Promise<void> {
    try {
      if (Array.isArray(ids)) {
        // Exclusão em lote no NocoDB: enviar como array de objetos
        await api.delete(`/api/v2/tables/${ATIVIDADES_TABLE_ID}/records`, {
          data: ids.map((id) => ({ Id: id }))
        });
      } else {
        // Exclusão de registro único: o NocoDB V2 também espera array de objetos!
        await api.delete(`/api/v2/tables/${ATIVIDADES_TABLE_ID}/records`, {
          data: [{ Id: ids }]
        });
      }
    } catch (error: any) {
      console.error('[AgendaService] Erro ao excluir atividade:', error?.response?.data || error.message);
      throw new Error('Não foi possível excluir a(s) atividade(s).');
    }
  }
}
