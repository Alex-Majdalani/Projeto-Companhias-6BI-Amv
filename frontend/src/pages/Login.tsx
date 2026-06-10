import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import styles from '../styles/auth.module.css';
import logoEb from '../assets/ebicon.png';

export function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  
  // ── ESTADO DE LOADING PARA EVITAR CLIQUES DUPLOS NO LOGIN ──────────────────
  const [isLoading, setIsLoading] = useState(false);

  // ── ESTADO PARA EXIBIÇÃO DE MENSAGEM DE ERRO NA TELA ───────────────────────
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { signIn } = React.useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (isLoading) return;

    setIsLoading(true);
    try {
      await signIn({ usuario: email, senha });
      navigate('/');
    } catch (err: any) {
      // Coleta a mensagem de erro específica vinda da resposta da API
      const apiError = err.response?.data?.error || 'Erro ao fazer login. Verifique suas credenciais.';
      setErrorMsg(apiError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles['auth-screen']}>
      <div className={styles['auth-card']}>
        <div className={styles['auth-logo']}>
          <img src={logoEb} alt="Brasão EB" />
          <span className={styles['auth-logo__title']}>SisGCia</span>
          <span className={styles['auth-logo__sub']}>6º Batalhão de Infantaria Aeromóvel</span>
        </div>

        {/* Exibe mensagem de erro caso ocorra falha no login */}
        {errorMsg && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200 mb-4 text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form className={styles['auth-form']} onSubmit={handleLogin}>
          <div className={styles['auth-field']}>
            <label htmlFor="email">Email</label>
            <input
              className={styles['auth-input']}
              type="email"
              id="email"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles['auth-field']}>
            <label htmlFor="isenha">Senha</label>
            <input
              className={styles['auth-input']}
              type="password"
              id="isenha"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <div className={styles['auth-links']}>
            <a href="#" className={styles['auth-link']} onClick={(e) => { e.preventDefault(); alert('Funcionalidade de recuperação de senha em desenvolvimento.'); }}>Esqueci a senha</a>
          </div>

          <div className={styles['auth-divider']} />

          {/* Botão de envio desabilitado durante o login para evitar duplicidade */}
          <button 
            className={`${styles['auth-btn']} ${styles['auth-btn--primary']}`} 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>

          <button
            className={`${styles['auth-btn']} ${styles['auth-btn--secondary']}`}
            type="button"
            onClick={() => navigate('/cadastro')}
          >
            Criar conta
          </button>
        </form>
      </div>
    </div>
  );
}
