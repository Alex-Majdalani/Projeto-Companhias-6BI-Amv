import { Router } from 'express';
import { MilitarController } from '../controllers/MilitarController';

const militarRoutes = Router();

militarRoutes.get('/companhias', MilitarController.listCompanhias);
militarRoutes.get('/pelotoes', MilitarController.listPelotoes);
militarRoutes.get('/', MilitarController.list);
militarRoutes.post('/', MilitarController.create);
// Comentário de organização: Rota para buscar o perfil completo de um militar pelo ID
militarRoutes.get('/:id', MilitarController.getById);
// Comentário de organização: Rota para atualizar dados de um militar
militarRoutes.put('/:id', MilitarController.update);
militarRoutes.patch('/:id', MilitarController.update);
// Comentário de organização: Rota para excluir um militar e seus dados relacionados
militarRoutes.delete('/:id', MilitarController.delete);

export { militarRoutes };
