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
}
