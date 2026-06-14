import { Router } from 'express';
import { FuncaoController } from '../controllers/FuncaoController';
import { authMiddleware } from '../middlewares/authMiddleware';

const funcaoRoutes = Router();

funcaoRoutes.get('/', authMiddleware, FuncaoController.list);
funcaoRoutes.post('/', authMiddleware, FuncaoController.create);
funcaoRoutes.delete('/:id', authMiddleware, FuncaoController.delete);
funcaoRoutes.put('/:id', authMiddleware, FuncaoController.update);
funcaoRoutes.put('/:id/designar', authMiddleware, FuncaoController.assign);

export { funcaoRoutes };
