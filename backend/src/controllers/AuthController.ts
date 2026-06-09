import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

/**
 * Controller de Autenticação
 * Intermedeia as requisições HTTP do frontend e aciona a camada de serviços (AuthService).
 * Gerencia o retorno de dados e códigos de status HTTP apropriados.
 */
export class AuthController {
  
  /**
   * Endpoint de login (POST /api/auth/login)
   * Recebe email/usuario, senha e companhia, delega a validação ao AuthService e, 
   * se bem-sucedido, retorna o Access Token JWT e o Refresh Token UUID.
   */
  static async login(req: Request, res: Response) {
    try {
      const { usuario, senha, companhia } = req.body;

      // Validação básica de campos obrigatórios
      if (!usuario || !senha) {
        return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
      }

      // Aciona o serviço para verificar credenciais, salvar o refresh token e obter ambos
      const { token, refreshToken } = await AuthService.authenticate(usuario, senha, companhia);
      return res.status(200).json({ token, refreshToken, message: 'Login realizado com sucesso.' });
    } catch (error: any) {
      // 401 Unauthorized em caso de credenciais inválidas ou erros de autenticação
      return res.status(401).json({ error: error.message });
    }
  }

  /**
   * Endpoint de renovação do Access Token (POST /api/auth/refresh)
   * Recebe um refresh token ativo no corpo da requisição, valida-o no NocoDB
   * e retorna um novo Access Token JWT válido.
   */
  static async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'O refresh token é obrigatório.' });
      }

      const token = await AuthService.refresh(refreshToken);
      return res.status(200).json({ token });
    } catch (error: any) {
      // Retorna 401 Unauthorized se o refresh token for inválido, expirado ou revogado
      return res.status(401).json({ error: error.message });
    }
  }

  /**
   * Endpoint de encerramento de sessão (POST /api/auth/logout)
   * Recebe o refresh token ativo do cliente e invalida-o (revoga) no NocoDB.
   */
  static async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      return res.status(200).json({ message: 'Logout realizado com sucesso.' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Endpoint de registro (POST /api/auth/register)
   * Recebe nome, email, senha, companhia e posto/graduação do formulário de cadastro,
   * cria os registros devidos no NocoDB e retorna o usuário criado.
   */
  static async register(req: Request, res: Response) {
    try {
      // Coleta todos os campos submetidos pelo formulário de Cadastro do frontend
      const { nome, email, senha, companhia, pg } = req.body;

      // Chama a camada de serviço para efetuar o cadastro
      const user = await AuthService.register({ nome, email, senha, companhia, pg });
      return res.status(201).json({ message: 'Usuário criado com sucesso.', user });
    } catch (error: any) {
      // 400 Bad Request se houver problemas de validação (ex: usuário já existe)
      return res.status(400).json({ error: error.message });
    }
  }

  /**
   * Endpoint de metadados auxiliares (GET /api/auth/metadata)
   * Usado para preencher os seletores (dropdowns) de Companhias e Postos/Graduações 
   * dinamicamente durante a renderização do formulário de cadastro no frontend.
   */
  static async getMetadata(req: Request, res: Response) {
    try {
      const data = await AuthService.getMetadata();
      return res.status(200).json(data);
    } catch (error: any) {
      // 500 Internal Server Error se houver falha de rede ou conexão com o NocoDB
      return res.status(500).json({ error: error.message });
    }
  }
}
