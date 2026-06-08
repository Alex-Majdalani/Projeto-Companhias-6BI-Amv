import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/auth.module.css';
import logoEb from '../assets/ebicon.png';

export function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [companhia, setCompanhia] = useState('');
  const [pg, setPg] = useState('');
  const navigate = useNavigate();

  const handleCadastro = (e: React.FormEvent) => {
    e.preventDefault();
    if (senha !== senha2) {
      alert('As senhas não coincidem!');
      return;
    }
    console.log({ nome, email, senha, companhia, pg });
    navigate('/login');
  };

  return (
    <div className={styles['auth-screen']}>
      <div className={styles['auth-card']} style={{ maxWidth: '480px' }}>
        <div className={styles['auth-logo']}>
          <img src={logoEb} alt="Brasão EB" />
          <span className={styles['auth-logo__title']}>Crie sua Conta</span>
          <span className={styles['auth-logo__sub']}>Preencha seus dados institucionais abaixo</span>
        </div>

        <form className={styles['auth-form']} onSubmit={handleCadastro}>
          <div className={styles['auth-field']}>
            <label htmlFor="inome">Nome Completo</label>
            <input
              className={styles['auth-input']}
              type="text"
              id="inome"
              placeholder="Digite seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className={styles['auth-field']}>
            <label htmlFor="iemail">Email</label>
            <input
              className={styles['auth-input']}
              type="email"
              id="iemail"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles['auth-form__row']}>
            <div className={styles['auth-field']}>
              <label htmlFor="ipg">Posto / Graduação</label>
              <select
                className={styles['auth-select']}
                id="ipg"
                value={pg}
                onChange={(e) => setPg(e.target.value)}
                required
              >
                <option value="" disabled>— Selecione —</option>
                <option value="cap">Capitão</option>
                <option value="1ten">1º Tenente</option>
                <option value="2ten">2º Tenente</option>
                <option value="asp">Aspirante</option>
                <option value="sten">Subtenente</option>
                <option value="1sgt">1º Sargento</option>
                <option value="2sgt">2º Sargento</option>
                <option value="3sgt">3º Sargento</option>
                <option value="cb">Cabo</option>
                <option value="sdep">Soldado EP</option>
              </select>
            </div>

            <div className={styles['auth-field']}>
              <label htmlFor="icompanhia">Companhia</label>
              <select
                className={styles['auth-select']}
                id="icompanhia"
                value={companhia}
                onChange={(e) => setCompanhia(e.target.value)}
                required
              >
                <option value="" disabled>— Selecione —</option>
                <option value="1cia">1ª Cia</option>
                <option value="2cia">2ª Cia</option>
                <option value="3cia">3ª Cia</option>
                <option value="ccap">CCAP</option>
                <option value="ciacmdo">Cia Cmdo</option>
                <option value="ciacom">Cia Com</option>
                <option value="ciaprec">Cia Prec Pqdt</option>
              </select>
            </div>
          </div>

          <div className={styles['auth-form__row']}>
            <div className={styles['auth-field']}>
              <label htmlFor="isenha">Senha</label>
              <input
                className={styles['auth-input']}
                type="password"
                id="isenha"
                placeholder="Crie uma senha forte"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className={styles['auth-field']}>
              <label htmlFor="isenha2">Confirmar Senha</label>
              <input
                className={styles['auth-input']}
                type="password"
                id="isenha2"
                placeholder="Repita a senha"
                value={senha2}
                onChange={(e) => setSenha2(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <div className={styles['auth-divider']} style={{ margin: '12px 0' }} />

          <button className={`${styles['auth-btn']} ${styles['auth-btn--primary']}`} type="submit">
            Finalizar Cadastro
          </button>

          <button
            className={`${styles['auth-btn']} ${styles['auth-btn--secondary']}`}
            type="button"
            onClick={() => navigate('/login')}
          >
            Já tenho uma conta (Login)
          </button>
        </form>
      </div>
    </div>
  );
}

