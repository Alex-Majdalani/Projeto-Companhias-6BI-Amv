import { Request, Response } from 'express';
import { FuncaoService } from '../services/FuncaoService';

export class FuncaoController {
  static async list(req: Request, res: Response) {
    try {
      const data = await FuncaoService.list();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { funcao } = req.body;
      if (!funcao || !funcao.trim()) {
        res.status(400).json({ error: 'O nome da função é obrigatório.' });
        return;
      }
      const newFuncao = await FuncaoService.create(funcao.trim());
      res.status(210).json(newFuncao);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await FuncaoService.delete(Number(id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { funcao } = req.body;
      if (!funcao || !funcao.trim()) {
        res.status(400).json({ error: 'O nome da função é obrigatório.' });
        return;
      }
      const updatedFuncao = await FuncaoService.update(Number(id), funcao.trim());
      res.json(updatedFuncao);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async assign(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { efetivoId, substitutoId } = req.body;
      
      // As IDs podem vir como null se o militar não foi designado
      await FuncaoService.assign(Number(id), efetivoId ? Number(efetivoId) : null, substitutoId ? Number(substitutoId) : null);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
