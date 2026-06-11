import React, { createContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface AuthContextData {
  signed: boolean;
  user: any | null;
  loading: boolean;
  signIn: (data: any) => Promise<void>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

/**
 * AuthProvider — Provedor de contexto de autenticação.
 *
 * Responsabilidades:
 *  1. Ao inicializar: Verifica se existe um token JWT salvo no localStorage.
 *     - Decodifica o payload do token (sem verificar assinatura no frontend —
 *       isso é responsabilidade do backend) para checar se não expirou.
 *     - Se válido, restaura a sessão do usuário sem precisar de novo login.
 *     - Se expirado, limpa o localStorage e força o redirecionamento para /login.
 *  2. signIn: Faz a requisição de login, salva o Access Token e o Refresh Token
 *     no localStorage, e armazena os dados do usuário no estado.
 *  3. signOut: Chama a rota de logout no backend (para revogar o Refresh Token
 *     no NocoDB) e limpa os dados do localStorage e do estado local.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true); // Evita flash de conteúdo protegido enquanto valida o token

  useEffect(() => {
    function restoreSession() {
      const storagedToken = localStorage.getItem('@SisGAdm:token');

      if (!storagedToken) {
        setLoading(false);
        return;
      }

      try {
        // Decodifica o payload do JWT (Base64) sem validar a assinatura
        // A assinatura é validada pelo backend em cada requisição autenticada
        const payloadBase64 = storagedToken.split('.')[1];
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);

        // Verifica se o token expirou (exp é em segundos Unix)
        const agora = Date.now() / 1000;
        if (payload.exp && payload.exp < agora) {
          // Token expirado → limpa a sessão e força novo login
          console.warn('[AuthContext] Token JWT expirado. Redirecionando para login.');
          localStorage.removeItem('@SisGAdm:token');
          localStorage.removeItem('@SisGAdm:refreshToken');
          setLoading(false);
          return;
        }

        // Token ainda válido → restaura o usuário no contexto
        setUser({
          id: payload.id,
          email: payload.email,
          nivel_acesso: payload.nivel_acesso,
          companhia: payload.companhia
        });
      } catch {
        // Token malformado → limpa a sessão
        console.warn('[AuthContext] Token JWT inválido. Removendo sessão.');
        localStorage.removeItem('@SisGAdm:token');
        localStorage.removeItem('@SisGAdm:refreshToken');
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  /**
   * signIn — Realiza o login do usuário.
   * Chama o backend com email/senha, recebe o Access Token (JWT) e o Refresh Token,
   * salva ambos no localStorage e armazena os dados do usuário no estado.
   */
  async function signIn({ usuario, senha, companhia }: any) {
    const response = await api.post('/auth/login', { usuario, senha, companhia });

    const { token, refreshToken } = response.data;

    // Decodifica o payload do JWT para extrair os dados do usuário
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(atob(payloadBase64));

    // Armazena os tokens de forma segura no localStorage
    localStorage.setItem('@SisGAdm:token', token);
    if (refreshToken) {
      localStorage.setItem('@SisGAdm:refreshToken', refreshToken);
    }

    // Atualiza o estado com os dados reais do usuário vindos do payload JWT
    setUser({
      id: payload.id,
      email: payload.email,
      nivel_acesso: payload.nivel_acesso,
      companhia: payload.companhia
    });
  }

  /**
   * signOut — Encerra a sessão do usuário.
   * Chama o backend para revogar o Refresh Token no banco de dados NocoDB,
   * e limpa todos os dados de sessão do localStorage.
   */
  function signOut() {
    const refreshToken = localStorage.getItem('@SisGAdm:refreshToken');

    // Revoga o refresh token no backend (não bloqueante — não esperamos a resposta)
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch((err) => {
        console.warn('[AuthContext] Erro ao revogar refresh token:', err.message);
      });
    }

    // Limpa o estado local e o localStorage
    localStorage.removeItem('@SisGAdm:token');
    localStorage.removeItem('@SisGAdm:refreshToken');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
