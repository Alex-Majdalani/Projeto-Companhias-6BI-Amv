import { Router } from 'express';
import { TiroController } from '../controllers/TiroController';

const tiroRoutes = Router();

tiroRoutes.get('/atividades', TiroController.listAtividades);
tiroRoutes.post('/atividades', TiroController.createAtividade);
tiroRoutes.patch('/atividades', TiroController.updateAtividade);
tiroRoutes.delete('/atividades/:nome', TiroController.deleteAtividade);

tiroRoutes.get('/', TiroController.list);
tiroRoutes.post('/', TiroController.create);
tiroRoutes.patch('/:id', TiroController.update);
tiroRoutes.delete('/:id', TiroController.delete);

export { tiroRoutes };
