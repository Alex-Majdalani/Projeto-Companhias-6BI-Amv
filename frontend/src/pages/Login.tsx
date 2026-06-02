import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import styles from '../styles/auth.module.css';
import logoEb from '../assets/ebicon.png';

export function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [companhia, setCompanhia] = useState('inicio');
  const { signIn } = React.useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn({ usuario, senha, companhia });
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
          <span className={styles['auth-logo__sub']}>6º Batalhão de Infantaria Motorizado</span>
        </div>

        <form className={styles['auth-form']} onSubmit={handleLogin}>
          <div className={styles['auth-field']}>
            <label htmlFor="icompanhia">Companhia</label>
            <select
              className={styles['auth-select']}
              id="icompanhia"
              value={companhia}
              onChange={(e) => setCompanhia(e.target.value)}
            >
              <option value="inicio">— Selecione —</option>
              <option value="1cia">1ª Cia</option>
              <option value="2cia">2ª Cia</option>
              <option value="3cia">3ª Cia</option>
              <option value="ccap">CCAP</option>
              <option value="ciacmdo">Cia Cmdo</option>
              <option value="ciacom">Cia Com</option>
              <option value="ciaprec">Cia Prec Pqdt</option>
            </select>
          </div>

          <div className={styles['auth-field']}>
            <label htmlFor="iusu">Usuário</label>
            <input
              className={styles['auth-input']}
              type="text"
              id="iusu"
              placeholder="Seu nome de usuário"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
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
            />
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
