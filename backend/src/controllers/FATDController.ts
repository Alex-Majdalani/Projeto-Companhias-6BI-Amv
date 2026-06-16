import type { Request, Response } from 'express';
import { FATDService } from '../services/FATDService';

export class FATDController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        numeroProcesso,
        dataProcessoFato,
        fatoRelatado,
        funcaoParticipante,
        arroladoId,
        participanteId,
        sargenteanteId,
        comandanteId
      } = req.body;

      // 1. Validação de dados básicos
      if (!numeroProcesso || !dataProcessoFato) {
        res.status(400).json({ error: 'Número do processo e data do fato são obrigatórios.' });
        return;
      }

      // 2. Verificar se o arquivo PDF foi enviado
      if (!req.file) {
        res.status(400).json({ error: 'O documento PDF da FATD é obrigatório.' });
        return;
      }

      // 3. Validar se já existe o número de processo no banco
      const exists = await FATDService.checkProcessoExists(numeroProcesso);
      if (exists) {
        res.status(400).json({ error: `Já existe um processo com o número ${numeroProcesso}.` });
        return;
      }

      // 4. Fazer upload do documento para o NocoDB
      const documentMetadata = await FATDService.uploadDocumento(req.file);

      // 5. Criar registro e salvar vínculos de militares no NocoDB
      const newFatd = await FATDService.createFATD({
        numeroProcesso,
        dataProcessoFato,
        fatoRelatado: fatoRelatado || '',
        funcaoParticipante: funcaoParticipante || '',
        documento: documentMetadata,
        arroladoId: arroladoId ? Number(arroladoId) : undefined,
        participanteId: participanteId ? Number(participanteId) : undefined,
        sargenteanteId: sargenteanteId ? Number(sargenteanteId) : undefined,
        comandanteId: comandanteId ? Number(comandanteId) : undefined
      });

      res.status(201).json({
        message: 'FATD registrada e gerada com sucesso!',
        fatd: newFatd
      });
    } catch (error: any) {
      console.error('[FATDController] Erro ao criar FATD:', error);
      res.status(500).json({ error: error.message || 'Erro interno ao salvar FATD.' });
    }
  }

  static async verifyProcesso(req: Request, res: Response): Promise<void> {
    try {
      const { numeroProcesso } = req.query;
      if (!numeroProcesso) {
        res.status(400).json({ error: 'Número do processo é obrigatório para verificação.' });
        return;
      }

      const exists = await FATDService.checkProcessoExists(String(numeroProcesso));
      res.status(200).json({ exists });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao verificar processo.' });
    }
  }

  static async list(req: Request, res: Response): Promise<void> {
    try {
      const list = await FATDService.list();
      res.status(200).json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao listar FATDs.' });
    }
  }

  static async savePunicao(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID da FATD inválido.' });
        return;
      }

      const { bi_publicacao, tipo, dias } = req.body;
      await FATDService.savePunicao(id, {
        bi_publicacao: bi_publicacao || '',
        tipo: tipo || '',
        dias: dias ? Number(dias) : 0
      });

      res.status(200).json({ message: 'Punição vinculada com sucesso!' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao salvar a publicação da punição.' });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID da FATD inválido.' });
        return;
      }

      await FATDService.deleteFATD(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro ao excluir FATD.' });
    }
  }
}
