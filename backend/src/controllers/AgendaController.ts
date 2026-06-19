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
   * POST /api/agenda/tipos
   * Cria um novo tipo de atividade.
   */
  static async createTipo(req: Request, res: Response): Promise<void> {
    try {
      const { tipos } = req.body;
      if (!tipos) {
        res.status(400).json({ error: 'O nome do tipo é obrigatório.' });
        return;
      }
      const novoTipo = await AgendaService.createTipo(tipos);
      res.status(201).json(novoTipo);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro interno ao criar tipo.' });
    }
  }

  /**
   * PUT /api/agenda/tipos/:id
   * Atualiza o nome de um tipo de atividade pelo ID.
   */
  static async updateTipo(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { tipos } = req.body;
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID inválido.' });
        return;
      }
      if (!tipos) {
        res.status(400).json({ error: 'O nome do tipo é obrigatório.' });
        return;
      }
      const tipoAtualizado = await AgendaService.updateTipo(id, tipos);
      res.status(200).json(tipoAtualizado);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro interno ao atualizar tipo.' });
    }
  }

  /**
   * DELETE /api/agenda/tipos/:id
   * Remove um tipo de atividade pelo ID.
   */
  static async deleteTipo(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID inválido.' });
        return;
      }
      await AgendaService.deleteTipo(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro interno ao excluir tipo.' });
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
   * PUT/PATCH /api/agenda/atividades/:id
   * Atualiza uma atividade pelo ID.
   */
  static async updateAtividade(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { titulo_atividade, data, descricao, tipoId } = req.body;

      if (isNaN(id)) {
        res.status(400).json({ error: 'ID inválido.' });
        return;
      }

      const atividadeAtualizada = await AgendaService.updateAtividade(id, {
        titulo_atividade,
        data,
        descricao,
        tipoId: tipoId ? Number(tipoId) : undefined
      });

      res.status(200).json(atividadeAtualizada);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erro interno ao atualizar atividade.' });
    }
  }

  /**
   * DELETE /api/agenda/atividades/:id ou DELETE /api/agenda/atividades (com body: { ids: number[] })
   * Remove uma ou mais atividades pelo ID.
   */
  static async deleteAtividade(req: Request, res: Response): Promise<void> {
    try {
      // 1. Verifica se foi passado uma lista de IDs no body para exclusão em lote
      const { ids } = req.body;
      if (ids && Array.isArray(ids)) {
        const numericIds = ids.map(Number).filter((id) => !isNaN(id));
        if (numericIds.length === 0) {
          res.status(400).json({ error: 'Nenhum ID válido fornecido para exclusão em lote.' });
          return;
        }
        await AgendaService.deleteAtividade(numericIds);
        res.status(204).send();
        return;
      }

      // 2. Fallback para exclusão individual de ID fornecido na URL
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
