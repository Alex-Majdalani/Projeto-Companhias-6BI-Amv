import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { PrivateRoute } from '../components/auth/PrivateRoute';
import { MainLayout } from '../layouts/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { Home } from '../pages/Home';
import { Login } from '../pages/Login';
import { Cadastro } from '../pages/Cadastro';
import { SargenteacaoDashboard } from '../pages/sgte/SargenteacaoDashboard';
import { Aditamento } from '../pages/sgte/Aditamento';
import { CadastroMilitares } from '../pages/sgte/CadastroMilitares';
import { NovoMilitar } from '../pages/sgte/NovoMilitar';
import { QuadroOrganizacoes } from '../pages/sgte/QuadroOrganizacoes';
import { Pernoite } from '../pages/sgte/Pernoite';
import { ParteAcidente } from '../pages/sgte/ParteAcidente';
import { FATD } from '../pages/sgte/FATD';
import { FichaModeloE } from '../pages/sgte/FichaModeloE';
import { PlanoFerias } from '../pages/sgte/PlanoFerias';
import { FuncoesCia } from '../pages/sgte/FuncoesCia';
import { PlanoChamada } from '../pages/sgte/PlanoChamada';
import { Engajamento } from '../pages/sgte/Engajamento';
import { EscalaServico } from '../pages/sgte/EscalaServico';

/**
 * AppRoutes — Configuração central de rotas da aplicação.
 *
 * Estrutura:
 *  - Rotas públicas (/login, /cadastro): Acessíveis sem autenticação.
 *    Se o usuário JÁ estiver autenticado e tentar acessar /login,
 *    é redirecionado para / (Home).
 *
 *  - Rotas privadas (/ e todas as subrotas /sgte/*): Protegidas pelo
 *    componente <PrivateRoute />, que redireciona para /login se o usuário
 *    não estiver autenticado ou o token JWT for inválido/expirado.
 *
 * Durante o carregamento inicial (enquanto o AuthContext verifica o token
 * no localStorage), exibe uma tela de carregamento simples para evitar
 * o "flash" de conteúdo redirecionando incorretamente para /login.
 */
export function AppRoutes() {
  const { signed, loading } = useContext(AuthContext);

  // Enquanto o AuthContext verifica o token salvo, exibe tela de carregamento
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0f172a',
        color: '#94a3b8',
        fontSize: '1rem',
        fontFamily: 'Inter, sans-serif',
        gap: '12px'
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          border: '2px solid #334155',
          borderTop: '2px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <span>Verificando autenticação...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <Routes>
      {/* Rotas de Autenticação (públicas) */}
      <Route element={<AuthLayout />}>
        {/* Se já estiver autenticado e tentar acessar /login ou /cadastro, redireciona para Home */}
        <Route
          path="/login"
          element={signed ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/cadastro"
          element={signed ? <Navigate to="/" replace /> : <Cadastro />}
        />
      </Route>

      {/* Rotas Privadas — protegidas pelo PrivateRoute (exige JWT válido) */}
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />

          {/* Rotas de Sargenteação */}
          <Route path="/sgte" element={<SargenteacaoDashboard />} />
          <Route path="/sgte/aditamento" element={<Aditamento />} />
          <Route path="/sgte/cadastro-militares" element={<CadastroMilitares />} />
          <Route path="/sgte/cadastro-militares/novo" element={<NovoMilitar />} />
          <Route path="/sgte/quadro-organizacoes" element={<QuadroOrganizacoes />} />
          <Route path="/sgte/pernoite" element={<Pernoite />} />
          <Route path="/sgte/parte-acidente" element={<ParteAcidente />} />
          <Route path="/sgte/fatd" element={<FATD />} />
          <Route path="/sgte/ficha-modelo-e" element={<FichaModeloE />} />
          <Route path="/sgte/plano-ferias" element={<PlanoFerias />} />
          <Route path="/sgte/funcoes-cia" element={<FuncoesCia />} />
          <Route path="/sgte/plano-chamada" element={<PlanoChamada />} />
          <Route path="/sgte/engajamento" element={<Engajamento />} />
          <Route path="/sgte/escala" element={<EscalaServico />} />
        </Route>
      </Route>

      {/* Rota padrão para caminhos não encontrados → redireciona para Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
