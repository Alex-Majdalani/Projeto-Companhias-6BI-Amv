import type { Request, Response } from 'express';
import { FeriasService } from '../services/FeriasService';

export class FeriasController {
  /**
   * GET /api/ferias/periodos
   * Retorna todos os períodos de férias cadastrados.
   * Comentário de organização: Método responsável por listar períodos de férias.
   */
  static async getPeriodos(req: Request, res: Response): Promise<void> {
    try {
      const periodos = await FeriasService.getPeriodos();
      res.json(periodos);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro interno ao buscar períodos de férias.' });
    }
  }

  /**
   * POST /api/ferias/periodos
   * Cria um novo período de férias.
   * Comentário de organização: Método responsável por validar e criar um novo período de férias.
   */
  static async createPeriodo(req: Request, res: Response): Promise<void> {
    try {
      const { Nome_Periodo, data_inicio, data_fim } = req.body;
      
      // Validação de campos vazios antes de enviar para o banco
      if (!Nome_Periodo || !data_inicio || !data_fim) {
        res.status(400).json({ error: 'Todos os campos (Nome_Periodo, data_inicio, data_fim) são obrigatórios.' });
        return;
      }

      const novoPeriodo = await FeriasService.createPeriodo(Nome_Periodo, data_inicio, data_fim);
      res.status(201).json(novoPeriodo);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro interno ao criar período de férias.' });
    }
  }

  /**
   * DELETE /api/ferias/periodos/:id
   * Exclui um período de férias.
   * Comentário de organização: Método responsável por excluir um período de férias pelo ID.
   */
  static async deletePeriodo(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID do período inválido.' });
        return;
      }

      await FeriasService.deletePeriodo(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro interno ao excluir período de férias.' });
    }
  }

  /**
   * GET /api/ferias/planos
   * Retorna todos os planos de férias.
   */
  static async getPlanos(req: Request, res: Response): Promise<void> {
    try {
      const planos = await FeriasService.getPlanos();
      res.json(planos);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro interno ao buscar planos de férias.' });
    }
  }

  /**
   * POST /api/ferias/planos
   * Cria um novo plano de férias.
   */
  static async createPlano(req: Request, res: Response): Promise<void> {
    try {
      const { militarId, periodoIds, parcelas, status, obs, anoReferencia } = req.body;
      if (!militarId || !Array.isArray(periodoIds) || !parcelas) {
        res.status(400).json({ error: 'Os campos militarId, periodoIds (array) e parcelas são obrigatórios.' });
        return;
      }

      const novoPlano = await FeriasService.createPlano(
        Number(militarId),
        periodoIds.map(Number),
        Number(parcelas),
        String(status || 'Pendente'),
        String(obs || ''),
        Number(anoReferencia || new Date().getFullYear())
      );
      res.status(201).json(novoPlano);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro interno ao criar plano de férias.' });
    }
  }

  /**
   * PUT /api/ferias/planos/:id
   * Atualiza um plano de férias existente.
   */
  static async updatePlano(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID do plano inválido.' });
        return;
      }

      const { militarId, periodoIds, parcelas, status, obs, anoReferencia } = req.body;
      if (!militarId || !Array.isArray(periodoIds) || !parcelas) {
        res.status(400).json({ error: 'Os campos militarId, periodoIds (array) e parcelas são obrigatórios.' });
        return;
      }

      const planoAtualizado = await FeriasService.updatePlano(
        id,
        Number(militarId),
        periodoIds.map(Number),
        Number(parcelas),
        String(status || 'Pendente'),
        String(obs || ''),
        Number(anoReferencia || new Date().getFullYear())
      );
      res.status(200).json(planoAtualizado);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro interno ao atualizar plano de férias.' });
    }
  }

  /**
   * DELETE /api/ferias/planos/:id
   * Exclui um plano de férias.
   */
  static async deletePlano(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID do plano inválido.' });
        return;
      }

      await FeriasService.deletePlano(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro interno ao excluir plano de férias.' });
    }
  }
}
