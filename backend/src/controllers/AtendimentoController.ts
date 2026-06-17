import type { Request, Response } from 'express';
import { AtendimentoService } from '../services/AtendimentoService';

export class AtendimentoController {
  static async listMedicos(req: Request, res: Response) {
    try {
      const medicos = await AtendimentoService.getMedicos();
      return res.status(200).json(medicos);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createMedico(req: Request, res: Response) {
    try {
      const { nomeCompleto, crm } = req.body;
      if (!nomeCompleto || !crm) {
        return res.status(400).json({ error: 'Nome completo e CRM são obrigatórios.' });
      }
      const newMedico = await AtendimentoService.createMedico({ nomeCompleto, crm });
      return res.status(201).json({ message: 'Médico cadastrado com sucesso!', data: newMedico });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async listVisitas(req: Request, res: Response) {
    try {
      const visitas = await AtendimentoService.getVisitas();
      return res.status(200).json(visitas);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createVisita(req: Request, res: Response) {
    try {
      const {
        militarId,
        motivoVisita,
        dataVisita,
        medicoResponsavel,
        parecerMedico,
        obs,
        baixado,
        motivoBaixa,
        dataRetorno,
        csd
      } = req.body;

      if (!militarId || !motivoVisita || !dataVisita || !medicoResponsavel || !baixado) {
        return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
      }

      const newVisita = await AtendimentoService.createVisita({
        militarId: Number(militarId),
        motivoVisita,
        dataVisita,
        medicoResponsavel,
        parecerMedico: parecerMedico || '',
        obs: obs || '',
        baixado,
        motivoBaixa,
        dataRetorno,
        csd
      });

      return res.status(201).json({ message: 'Atendimento médico registrado com sucesso!', data: newVisita });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async deleteVisita(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }
      await AtendimentoService.deleteVisita(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
