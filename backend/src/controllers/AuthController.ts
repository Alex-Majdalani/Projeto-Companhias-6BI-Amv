import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { usuario, senha, companhia } = req.body;
      
      if (!usuario || !senha) {
        return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
      }

      const token = await AuthService.authenticate(usuario, senha, companhia);
      return res.status(200).json({ token, message: 'Login realizado com sucesso.' });
    } catch (error: any) {
      return res.status(401).json({ error: error.message });
    }
  }

  static async register(req: Request, res: Response) {
    try {
      const { usuario, senha, companhia, pg } = req.body;
      
      const user = await AuthService.register({ usuario, senha, companhia, pg });
      return res.status(201).json({ message: 'Usuário criado com sucesso.', user });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
