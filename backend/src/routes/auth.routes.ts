import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const authRoutes = Router();

// Rota HTTP POST para autenticação de usuários (Login)
authRoutes.post('/login', AuthController.login);

// Rota HTTP POST para registro e criação de novos usuários/militares (Cadastro)
authRoutes.post('/register', AuthController.register);

// Rota HTTP GET para carregar metadados dinâmicos (dropdowns de Postos/Graduações e Companhias)
authRoutes.get('/metadata', AuthController.getMetadata);

// Rota HTTP POST para renovar o Access Token (JWT) usando um Refresh Token válido
authRoutes.post('/refresh', AuthController.refresh);

// Rota HTTP POST para encerrar sessão e revogar o Refresh Token
authRoutes.post('/logout', AuthController.logout);

export { authRoutes };
