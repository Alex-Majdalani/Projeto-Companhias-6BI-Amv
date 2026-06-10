import { Router } from 'express';
import { AgendaController } from '../controllers/AgendaController';
import { authMiddleware } from '../middlewares/authMiddleware';

// ─────────────────────────────────────────────────────────────────────────────
// Rotas da Agenda de Atividades — todas protegidas por JWT (authMiddleware)
// ─────────────────────────────────────────────────────────────────────────────
const agendaRoutes = Router();

// GET /api/agenda/tipos — Lista todos os tipos de atividade cadastrados
agendaRoutes.get('/tipos', authMiddleware, AgendaController.getTipos);

// GET /api/agenda/atividades — Lista todas as atividades da agenda
agendaRoutes.get('/atividades', authMiddleware, AgendaController.getAtividades);

// POST /api/agenda/atividades — Cria uma nova atividade e vincula ao tipo
agendaRoutes.post('/atividades', authMiddleware, AgendaController.createAtividade);

// DELETE /api/agenda/atividades/:id — Remove uma atividade pelo ID
agendaRoutes.delete('/atividades/:id', authMiddleware, AgendaController.deleteAtividade);

export { agendaRoutes };
