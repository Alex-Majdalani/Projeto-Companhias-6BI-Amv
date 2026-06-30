import type { Request, Response } from 'express';
import { TiroService } from '../services/TiroService';

export class TiroController {
  static async list(req: Request, res: Response) {
    try {
      const records = await TiroService.getTiroRecords();
      return res.status(200).json(records);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async listAtividades(req: Request, res: Response) {
    try {
      const activities = await TiroService.getAtividades();
      return res.status(200).json(activities);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createAtividade(req: Request, res: Response) {
    try {
      const { nome } = req.body;
      if (!nome || !nome.trim()) {
        return res.status(400).json({ error: 'O nome da atividade é obrigatório.' });
      }
      const created = await TiroService.createAtividade(nome.trim());
      return res.status(201).json({ message: 'Atividade cadastrada com sucesso!', data: created });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async updateAtividade(req: Request, res: Response) {
    try {
      const { nomeAntigo, novoNome } = req.body;
      if (!nomeAntigo || !novoNome || !novoNome.trim()) {
        return res.status(400).json({ error: 'Nomes antigo e novo são obrigatórios.' });
      }
      await TiroService.updateAtividade(nomeAntigo, novoNome.trim());
      return res.status(200).json({ message: 'Atividade atualizada com sucesso!' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async deleteAtividade(req: Request, res: Response) {
    try {
      const nome = String(req.params.nome);
      if (!nome || nome.trim() === 'undefined') {
        return res.status(400).json({ error: 'O nome da atividade é obrigatório.' });
      }
      await TiroService.deleteAtividade(nome);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { militarId, atividade, mencao } = req.body;
      if (!militarId || !atividade) {
        return res.status(400).json({ error: 'Militar e atividade são obrigatórios.' });
      }

      // Validar se o militar já possui teste para a atividade de tiro
      const existingRecords = await TiroService.getTiroRecords();
      const isDuplicate = existingRecords.some(
        (r: any) => r.militarId === Number(militarId) && r.atividade.toLowerCase() === atividade.toLowerCase()
      );
      if (isDuplicate) {
        return res.status(400).json({ error: 'Este militar já possui um teste registrado para esta atividade.' });
      }

      const record = await TiroService.createTiroRecord({
        militarId,
        atividade,
        mencao: mencao || null
      });
      return res.status(201).json({ message: 'Teste de Tiro registrado com sucesso!', data: record });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }
      const { atividade, mencao } = req.body;

      if (atividade) {
        const existingRecords = await TiroService.getTiroRecords();
        const currentRecord = existingRecords.find((r: any) => r.id === id);
        if (currentRecord && currentRecord.atividade.toLowerCase() !== atividade.toLowerCase()) {
          const isDuplicate = existingRecords.some(
            (r: any) => r.id !== id && r.militarId === currentRecord.militarId && r.atividade.toLowerCase() === atividade.toLowerCase()
          );
          if (isDuplicate) {
            return res.status(400).json({ error: 'Este militar já possui um teste registrado para esta atividade.' });
          }
        }
      }

      await TiroService.updateTiroRecord(id, {
        atividade,
        mencao: mencao || null,
        segunda_chamada: atividade ? (atividade.toLowerCase().includes('2ª chamada') || atividade.toLowerCase().includes('2a chamada') ? 'Sim' : 'Não') : undefined
      });
      return res.status(200).json({ message: 'Teste de Tiro atualizado com sucesso!' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }
      await TiroService.deleteTiroRecord(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
