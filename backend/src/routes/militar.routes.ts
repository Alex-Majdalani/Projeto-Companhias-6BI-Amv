import { Router } from 'express';
import { MilitarController } from '../controllers/MilitarController';
import { authMiddleware } from '../middlewares/authMiddleware';

const militarRoutes = Router();

militarRoutes.get('/companhias', MilitarController.listCompanhias);
militarRoutes.get('/pelotoes', MilitarController.listPelotoes);
militarRoutes.get('/funcoes', MilitarController.listFuncoes);
militarRoutes.get('/', MilitarController.list);
militarRoutes.post('/', authMiddleware, MilitarController.create);
// Comentário de organização: Rota para buscar o perfil completo de um militar pelo ID
militarRoutes.get('/:id', MilitarController.getById);
// Comentário de organização: Rota para atualizar dados de um militar
militarRoutes.put('/:id', authMiddleware, MilitarController.update);
militarRoutes.patch('/:id', authMiddleware, MilitarController.update);
// Comentário de organização: Rota para excluir um militar e seus dados relacionados
militarRoutes.delete('/:id', authMiddleware, MilitarController.delete);

export { militarRoutes };
