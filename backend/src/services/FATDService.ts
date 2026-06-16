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
}
