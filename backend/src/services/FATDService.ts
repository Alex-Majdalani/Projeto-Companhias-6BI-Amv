import axios from 'axios';
import FormData from 'form-data';

const api = axios.create({
  baseURL: process.env.NOCODB_URL,
  headers: {
    'xc-token': process.env.NOCODB_TOKEN
  }
});

const FATD_TABLE_ID = 'mhdr8z1rnvysh6u';

// Link column IDs in the fatd table
const LINK_ARROLADO = 'cllzw1xz04xd354';
const LINK_PARTICIPANTE = 'cco4dot8rll47ye';
const LINK_SARGENTEANTE = 'c509p8g9bqhdsw8';
const LINK_COMANDANTE = 'ce9o9uc5xsgvtb0';

export class FATDService {
  /**
   * Verifica se já existe um processo com o mesmo número.
   */
  static async checkProcessoExists(numeroProcesso: string): Promise<boolean> {
    try {
      const response = await api.get(`/api/v2/tables/${FATD_TABLE_ID}/records`, {
        params: {
          where: `(numero_processo,eq,${numeroProcesso})`,
          limit: 1
        }
      });
      const list = response.data.list || [];
      return list.length > 0;
    } catch (error: any) {
      console.error('[FATDService] Erro ao verificar duplicidade de processo:', error?.response?.data || error.message);
      throw new Error('Erro ao validar duplicidade do número de processo.');
    }
  }

  /**
   * Faz o upload do PDF para o NocoDB e retorna os dados do attachment.
   */
  static async uploadDocumento(file: Express.Multer.File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype
      });

      const response = await api.post('/api/v2/storage/upload', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      return response.data; // Retorna o array de attachment do NocoDB
    } catch (error: any) {
      console.error('[FATDService] Erro ao carregar PDF no NocoDB:', error?.response?.data || error.message);
      throw new Error('Falha no upload do documento de FATD para o banco de dados.');
    }
  }

  /**
   * Salva a FATD e realiza os vínculos de militares.
   */
  static async createFATD(data: {
    numeroProcesso: string;
    dataProcessoFato: string;
    fatoRelatado: string;
    funcaoParticipante: string;
    documento: any;
    arroladoId?: number;
    participanteId?: number;
    sargenteanteId?: number;
    comandanteId?: number;
  }) {
    try {
      // 1. Criar o registro na tabela fatd
      const createBody = {
        numero_processo: data.numeroProcesso,
        data_processo_fato: data.dataProcessoFato,
        fato_relatado: data.fatoRelatado,
        funcao_participante: data.funcaoParticipante,
        documento_fatd: data.documento
      };

      const response = await api.post(`/api/v2/tables/${FATD_TABLE_ID}/records`, createBody);
      const newFatdId = response.data.Id || response.data.id;

      // 2. Vincular Militar Arrolado
      if (data.arroladoId) {
        await api.post(`/api/v2/tables/${FATD_TABLE_ID}/links/${LINK_ARROLADO}/records/${newFatdId}`, {
          Id: data.arroladoId
        });
      }

      // 3. Vincular Militar Participante
      if (data.participanteId) {
        await api.post(`/api/v2/tables/${FATD_TABLE_ID}/links/${LINK_PARTICIPANTE}/records/${newFatdId}`, {
          Id: data.participanteId
        });
      }

      // 4. Vincular Sargenteante
      if (data.sargenteanteId) {
        await api.post(`/api/v2/tables/${FATD_TABLE_ID}/links/${LINK_SARGENTEANTE}/records/${newFatdId}`, {
          Id: data.sargenteanteId
        });
      }

      // 5. Vincular Comandante
      if (data.comandanteId) {
        await api.post(`/api/v2/tables/${FATD_TABLE_ID}/links/${LINK_COMANDANTE}/records/${newFatdId}`, {
          Id: data.comandanteId
        });
      }

      return response.data;
    } catch (error: any) {
      console.error('[FATDService] Erro ao criar registro de FATD:', error?.response?.data || error.message);
      throw new Error('Não foi possível salvar o registro de FATD.');
    }
  }

  /**
   * Retorna a lista de todas as FATDs e suas punições vinculadas.
   */
  static async list(): Promise<any[]> {
    try {
      const response = await api.get(`/api/v2/tables/${FATD_TABLE_ID}/records`, {
        params: { limit: 1000 }
      });
      const records = response.data.list || [];

      // Buscar todas as punições para fazer o link local
      const PUNICOES_TABLE_ID = 'mxdic5ej7eigds1';
      const punRes = await api.get(`/api/v2/tables/${PUNICOES_TABLE_ID}/records`, {
        params: { limit: 1000 }
      });
      const punicoes = punRes.data.list || [];

      return records.map((r: any) => {
        const transgressorArr = Array.isArray(r.militar_transgressor) 
          ? r.militar_transgressor 
          : (r.militar_transgressor ? [r.militar_transgressor] : []);
        const transgressor = transgressorArr[0];

        const participanteArr = Array.isArray(r.militar_participante) 
          ? r.militar_participante 
          : (r.militar_participante ? [r.militar_participante] : []);
        const participante = participanteArr[0];

        const fatdId = r.Id || r.id;
        const punicao = punicoes.find((p: any) => p.fatd_id === fatdId);

        return {
          id: fatdId,
          numeroProcesso: r.numero_processo || '',
          dataProcessoFato: r.data_processo_fato || '',
          fatoRelatado: r.fato_relatado || '',
          funcaoParticipante: r.funcao_participante || '',
          documentoFatdUrl: Array.isArray(r.documento_fatd) && r.documento_fatd[0]?.path 
            ? `${process.env.NOCODB_URL}/${r.documento_fatd[0].path}`
            : '',

          arroladoId: transgressor?.Id || transgressor?.id || null,
          pgArrolado: transgressor?.posto_graduacao || transgressor?.posto || '',
          nomeArrolado: transgressor?.nome_guerra || '',

          participanteId: participante?.Id || participante?.id || null,
          pgParticipante: participante?.posto_graduacao || participante?.posto || '',
          nomeParticipante: participante?.nome_guerra || '',

          punicao: punicao ? {
            id: punicao.Id || punicao.id,
            bi_publicacao: punicao.bi_publicacao || '',
            tipo: punicao.tipo || '',
            dias: punicao.dias || 0
          } : null
        };
      });
    } catch (error: any) {
      console.error('[FATDService] Erro ao listar FATDs:', error?.response?.data || error.message);
      throw new Error('Não foi possível listar os registros de FATD.');
    }
  }

  /**
   * Cria ou atualiza uma punição associada a uma FATD específica.
   */
  static async savePunicao(fatdId: number, data: { bi_publicacao: string; tipo: string; dias: number }): Promise<void> {
    try {
      const PUNICOES_TABLE_ID = 'mxdic5ej7eigds1';
      const LINK_PUNICAO_FATD = 'ccm7b1wnmyicgjf';
      const LINK_MILITAR = 'ccoo3k941ztli1o';

      // 1. Obter o ID do militar transgressor da FATD
      const fatdResponse = await api.get(`/api/v2/tables/${FATD_TABLE_ID}/records/${fatdId}`);
      const militarPunidoId = fatdResponse.data.militar_transgressor?.Id || fatdResponse.data.militar_transgressor?.id || null;

      // 2. Verificar se já existe punição vinculada a essa FATD usando fatd_id
      const response = await api.get(`/api/v2/tables/${PUNICOES_TABLE_ID}/records`, {
        params: {
          where: `(fatd_id,eq,${fatdId})`
        }
      });
      const list = response.data.list || [];
      const existingPunicao = list[0];
      let punicaoId = existingPunicao ? (existingPunicao.Id || existingPunicao.id) : null;

      if (existingPunicao) {
        await api.patch(`/api/v2/tables/${PUNICOES_TABLE_ID}/records`, {
          Id: punicaoId,
          bi_publicacao: data.bi_publicacao,
          tipo: data.tipo,
          dias: data.dias ? Number(data.dias) : null
        });
      } else {
        const createRes = await api.post(`/api/v2/tables/${PUNICOES_TABLE_ID}/records`, {
          bi_publicacao: data.bi_publicacao,
          tipo: data.tipo,
          dias: data.dias ? Number(data.dias) : null
        });
        punicaoId = createRes.data.Id || createRes.data.id;
        
        await api.post(`/api/v2/tables/${PUNICOES_TABLE_ID}/links/${LINK_PUNICAO_FATD}/records/${punicaoId}`, {
          Id: fatdId
        });
      }

      // 3. Vincular o militar punido/transgresso à punição
      if (militarPunidoId && punicaoId) {
        try {
          await api.post(`/api/v2/tables/${PUNICOES_TABLE_ID}/links/${LINK_MILITAR}/records/${punicaoId}`, {
            Id: militarPunidoId
          });
        } catch (linkErr: any) {
          console.error('[FATDService] Erro ao vincular militar_punido:', linkErr?.response?.data || linkErr.message);
        }
      }
    } catch (error: any) {
      console.error('[FATDService] Erro ao salvar punição:', error?.response?.data || error.message);
      throw new Error('Não foi possível salvar os dados de publicação da punição.');
    }
  }

  /**
   * Remove a FATD e suas punições vinculadas.
   */
  static async deleteFATD(id: number): Promise<void> {
    try {
      const response = await api.get(`/api/v2/tables/${FATD_TABLE_ID}/records/${id}`);
      const fatd = response.data;
      const punicoesArr = Array.isArray(fatd.punicoes) 
        ? fatd.punicoes 
        : (fatd.punicoes ? [fatd.punicoes] : []);

      const PUNICOES_TABLE_ID = 'mxdic5ej7eigds1';

      for (const p of punicoesArr) {
        const pId = p.Id || p.id;
        try {
          await api.delete(`/api/v2/tables/${PUNICOES_TABLE_ID}/records`, {
            data: [{ Id: pId }]
          });
        } catch (e) {
          console.error(`[FATDService] Falha ao deletar punição vinculada ${pId}:`, e);
        }
      }

      await api.delete(`/api/v2/tables/${FATD_TABLE_ID}/records`, {
        data: [{ Id: id }]
      });
    } catch (error: any) {
      console.error('[FATDService] Erro ao excluir FATD:', error?.response?.data || error.message);
      throw new Error('Não foi possível excluir a FATD do banco de dados.');
    }
  }
}
