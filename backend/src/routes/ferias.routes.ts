import { Router } from 'express';
import { FeriasController } from '../controllers/FeriasController';
import { authMiddleware } from '../middlewares/authMiddleware';

const feriasRoutes = Router();

// Comentários de organização: Vincula as rotas de gerenciamento de períodos de férias ao controller correspondente
// Rota para listar os períodos de férias
feriasRoutes.get('/periodos', authMiddleware, FeriasController.getPeriodos);

// Rota para criar um novo período de férias
feriasRoutes.post('/periodos', authMiddleware, FeriasController.createPeriodo);

// Rota para excluir um período de férias pelo ID
feriasRoutes.delete('/periodos/:id', authMiddleware, FeriasController.deletePeriodo);

export { feriasRoutes };
