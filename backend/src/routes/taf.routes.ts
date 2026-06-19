import { Router } from 'express';
import { TafController } from '../controllers/TafController';

const tafRoutes = Router();

tafRoutes.get('/', TafController.list);
tafRoutes.post('/', TafController.create);
tafRoutes.patch('/:id', TafController.update);
tafRoutes.delete('/:id', TafController.delete);
tafRoutes.get('/atividades', TafController.listAtividades);
tafRoutes.post('/atividades', TafController.createAtividade);
tafRoutes.patch('/atividades', TafController.updateAtividade);
tafRoutes.delete('/atividades/:nome', TafController.deleteAtividade);

export { tafRoutes };
