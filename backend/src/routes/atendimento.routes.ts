import { Router } from 'express';
import { AtendimentoController } from '../controllers/AtendimentoController';

const atendimentoRoutes = Router();

atendimentoRoutes.get('/medicos', AtendimentoController.listMedicos);
atendimentoRoutes.post('/medicos', AtendimentoController.createMedico);
atendimentoRoutes.get('/visitas', AtendimentoController.listVisitas);
atendimentoRoutes.post('/visitas', AtendimentoController.createVisita);
atendimentoRoutes.delete('/visitas/:id', AtendimentoController.deleteVisita);

export { atendimentoRoutes };
