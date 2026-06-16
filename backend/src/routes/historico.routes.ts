import { Router } from 'express';
import { HistoricoController } from '../controllers/HistoricoController';
import { authMiddleware } from '../middlewares/authMiddleware';

// ─────────────────────────────────────────────────────────────────────────────
// Rotas do módulo de histórico de alterações — protegidas por JWT
// ─────────────────────────────────────────────────────────────────────────────
const historicoRoutes = Router();

// GET /api/historico — Lista todos os registros de alterações (com filtros opcionais)
historicoRoutes.get('/', authMiddleware, HistoricoController.list);

// POST /api/historico — Registra uma nova entrada no histórico
historicoRoutes.post('/', authMiddleware, HistoricoController.create);

export { historicoRoutes };
