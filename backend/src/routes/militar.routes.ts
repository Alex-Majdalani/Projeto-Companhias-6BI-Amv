import { Router } from 'express';
import { MilitarController } from '../controllers/MilitarController';

const militarRoutes = Router();

militarRoutes.get('/companhias', MilitarController.listCompanhias);
militarRoutes.get('/pelotoes', MilitarController.listPelotoes);
militarRoutes.get('/', MilitarController.list);
militarRoutes.post('/', MilitarController.create);

export { militarRoutes };
