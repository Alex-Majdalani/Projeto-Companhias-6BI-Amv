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

      // Normaliza o nome completo para que todas as palavras comecem com letra maiúscula
      const normalizedNome = nomeCompleto
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Valida se o CRM possui exatamente 6 dígitos numéricos
      const cleanedCrm = crm.trim();
      const crmRegex = /^\d{6}$/;
      if (!crmRegex.test(cleanedCrm)) {
        return res.status(400).json({ error: 'O CRM deve conter exatamente 6 números.' });
      }

      const newMedico = await AtendimentoService.createMedico({ nomeCompleto: normalizedNome, crm: cleanedCrm });
      return res.status(201).json({ message: 'Médico cadastrado com sucesso!', data: newMedico });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateMedico(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

      const { nomeCompleto, crm } = req.body;
      if (!nomeCompleto || !crm) {
        return res.status(400).json({ error: 'Nome completo e CRM são obrigatórios.' });
      }

      // Normaliza o nome completo para que todas as palavras comecem com letra maiúscula
      const normalizedNome = nomeCompleto
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Valida se o CRM possui exatamente 6 dígitos numéricos
      const cleanedCrm = crm.trim();
      const crmRegex = /^\d{6}$/;
      if (!crmRegex.test(cleanedCrm)) {
        return res.status(400).json({ error: 'O CRM deve conter exatamente 6 números.' });
      }

      const updated = await AtendimentoService.updateMedico(id, { nomeCompleto: normalizedNome, crm: cleanedCrm });
      return res.status(200).json({ message: 'Médico atualizado com sucesso!', data: updated });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async deleteMedico(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }
      await AtendimentoService.deleteMedico(id);
      return res.status(204).send();
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
        csd,
        outroCsd
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
        csd,
        outroCsd
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

  static async updateVisita(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido.' });
      }

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
        csd,
        outroCsd
      } = req.body;

      if (!militarId || !motivoVisita || !dataVisita || !medicoResponsavel || !baixado) {
        return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
      }

      const updated = await AtendimentoService.updateVisita(id, {
        militarId: Number(militarId),
        motivoVisita,
        dataVisita,
        medicoResponsavel,
        parecerMedico: parecerMedico || '',
        obs: obs || '',
        baixado,
        motivoBaixa,
        dataRetorno,
        csd,
        outroCsd
      });

      return res.status(200).json({ message: 'Atendimento médico atualizado com sucesso!', data: updated });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
