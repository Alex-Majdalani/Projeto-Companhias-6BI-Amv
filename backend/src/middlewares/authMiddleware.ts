import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Middleware de Autenticação JWT — authMiddleware
 *
 * Responsabilidade:
 *  - Intercepta requisições HTTP em rotas protegidas.
 *  - Extrai o Bearer Token JWT do cabeçalho Authorization.
 *  - Valida a assinatura e a expiração do token usando a chave secreta (JWT_SECRET).
 *  - Se válido: adiciona o payload decodificado em req.user e passa para o próximo handler.
 *  - Se inválido ou ausente: responde imediatamente com HTTP 401 Unauthorized.
 *
 * Uso nas rotas:
 *   router.get('/rota-protegida', authMiddleware, controller.handler)
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 1. Extrai o header Authorization da requisição
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticação não fornecido.' });
    return;
  }

  // 2. Separa o prefixo 'Bearer' do token em si
  // (noUncheckedIndexedAccess: split pode retornar undefined, por isso verificamos)
  const parts = authHeader.split(' ');
  const token = parts[1];

  if (!token) {
    res.status(401).json({ error: 'Token de autenticação malformado.' });
    return;
  }

  // 3. Garante que a chave secreta JWT está configurada no servidor
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'Chave secreta JWT não configurada no servidor.' });
    return;
  }

  try {
    // 4. Verifica a assinatura e a expiração do JWT usando a chave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    // 5. Adiciona o payload decodificado ao objeto de requisição para uso nos controllers
    (req as any).user = decoded;

    // 6. Passa o controle para o próximo middleware ou handler da rota
    next();
  } catch (error) {
    // Token inválido, expirado ou malformado → 401 Unauthorized
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}
