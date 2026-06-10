import type { Request, Response } from 'express';
import { AgendaService } from '../services/AgendaService';

// ─────────────────────────────────────────────────────────────────────────────
// AgendaController — expõe os métodos do AgendaService como endpoints HTTP REST
// ─────────────────────────────────────────────────────────────────────────────
export class AgendaController {

  /**
   * GET /api/agenda/atividades
   * Retorna todas as atividades da agenda com o tipo aninhado.
   */
  static async getAtividades(req: Request, res: Response): Promise<void> {
    try {
      const atividades = await AgendaService.getAtividades();
      res.json(atividades);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro interno ao buscar atividades.' });
    }
  }

  /**
   * GET /api/agenda/tipos
   * Retorna todos os tipos de atividade cadastrados.
   */
  static async getTipos(req: Request, res: Response): Promise<void> {
    try {
      const tipos = await AgendaService.getTipos();
      res.json(tipos);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro interno ao buscar tipos.' });
    }
  }

  /**
   * POST /api/agenda/atividades
   * Cria uma nova atividade e a vincula ao tipo informado.
   * Body esperado: { titulo_atividade, data, descricao?, tipoId }
   */
  static async createAtividade(req: Request, res: Response): Promise<void> {
    try {
      const { titulo_atividade, data, descricao, tipoId } = req.body;

      // Validação básica dos campos obrigatórios
      if (!titulo_atividade || !data || !tipoId) {
        res.status(400).json({ error: 'Campos obrigatórios: titulo_atividade, data, tipoId.' });
        return;
      }

      const novaAtividade = await AgendaService.createAtividade({
        titulo_atividade,
        data,
        descricao,
        tipoId: Number(tipoId)
      });

      res.status(201).json(novaAtividade);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro interno ao criar atividade.' });
    }
  }

  /**
   * DELETE /api/agenda/atividades/:id
   * Remove uma atividade pelo ID.
   */
  static async deleteAtividade(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'ID inválido.' });
        return;
      }

      await AgendaService.deleteAtividade(id);
      res.status(204).send(); // 204 No Content — exclusão bem-sucedida
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro interno ao excluir atividade.' });
    }
  }
}
