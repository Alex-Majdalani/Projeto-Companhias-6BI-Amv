import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

/**
 * PrivateRoute — Componente de proteção de rota.
 *
 * Como funciona:
 *  - Verifica se existe um token JWT válido no localStorage E se o usuário
 *    está autenticado no contexto (AuthContext.signed).
 *  - Se estiver autenticado → renderiza o <Outlet /> (conteúdo protegido).
 *  - Se NÃO estiver autenticado → redireciona automaticamente para /login.
 *
 * Isso impede que qualquer usuário acesse rotas internas do sistema sem
 * ter passado pelo fluxo de autenticação.
 */
export function PrivateRoute() {
  const { signed } = useContext(AuthContext);

  // Verifica também o token no localStorage como camada extra de segurança
  const token = localStorage.getItem('@SisGAdm:token');

  if (!signed || !token) {
    // Usuário não autenticado → redireciona para login
    return <Navigate to="/login" replace />;
  }

  // Usuário autenticado → renderiza o conteúdo da rota
  return <Outlet />;
}
