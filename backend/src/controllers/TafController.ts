import type { Request, Response } from 'express';
import { TafService } from '../services/TafService';

export class TafController {
  static async list(req: Request, res: Response) {
    try {
      const records = await TafService.getTafRecords();
      return res.status(200).json(records);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async listAtividades(req: Request, res: Response) {
    try {
      const activities = await TafService.getAtividades();
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
      const created = await TafService.createAtividade(nome.trim());
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
      await TafService.updateAtividade(nomeAntigo, novoNome.trim());
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
      await TafService.deleteAtividade(nome);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { militarId, atividade, corrida, flexao, barra, abdominal, mencao } = req.body;
      if (!militarId || !atividade) {
        return res.status(400).json({ error: 'Militar e atividade são obrigatórios.' });
      }
      const record = await TafService.createTafRecord({
        militarId,
        atividade,
        corrida: corrida !== undefined && corrida !== null && corrida !== '' ? Number(corrida) : null,
        flexao: flexao !== undefined && flexao !== null && flexao !== '' ? Number(flexao) : null,
        barra: barra !== undefined && barra !== null && barra !== '' ? Number(barra) : null,
        abdominal: abdominal !== undefined && abdominal !== null && abdominal !== '' ? Number(abdominal) : null,
        mencao: mencao || null
      });
      return res.status(201).json({ message: 'Teste de TAF registrado com sucesso!', data: record });
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
      const { corrida, flexao, barra, abdominal, mencao } = req.body;
      await TafService.updateTafRecord(id, {
        corrida: corrida !== undefined && corrida !== null && corrida !== '' ? Number(corrida) : null,
        flexao: flexao !== undefined && flexao !== null && flexao !== '' ? Number(flexao) : null,
        barra: barra !== undefined && barra !== null && barra !== '' ? Number(barra) : null,
        abdominal: abdominal !== undefined && abdominal !== null && abdominal !== '' ? Number(abdominal) : null,
        mencao: mencao || null
      });
      return res.status(200).json({ message: 'Teste de TAF atualizado com sucesso!' });
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
      await TafService.deleteTafRecord(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
