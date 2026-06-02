import jwt from 'jsonwebtoken';

export class AuthService {
  static async authenticate(usuario: string, senha: string, companhia: string) {
    // Mock de verificação no banco de dados
    if (usuario === 'admin' && senha === '123') {
      const token = jwt.sign({ usuario, companhia }, 'secret_key', { expiresIn: '1d' });
      return token;
    }
    throw new Error('Credenciais inválidas');
  }

  static async register(userData: any) {
    // Mock de criação de usuário no banco de dados
    console.log('Usuário registrado:', userData);
    return { usuario: userData.usuario, companhia: userData.companhia, pg: userData.pg };
  }
}
