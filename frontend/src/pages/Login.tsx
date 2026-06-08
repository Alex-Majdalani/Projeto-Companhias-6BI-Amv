import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import styles from '../styles/auth.module.css';
import logoEb from '../assets/ebicon.png';

export function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const { signIn } = React.useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn({ usuario: email, senha });
      navigate('/');
    } catch {
      alert('Erro ao fazer login. Verifique suas credenciais.');
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

          <button className={`${styles['auth-btn']} ${styles['auth-btn--primary']}`} type="submit">
            Entrar
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
