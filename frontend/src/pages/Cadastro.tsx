import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/auth.module.css';
import logoEb from '../assets/ebicon.png';

export function Cadastro() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [companhia, setCompanhia] = useState('inicio');
  const [pg, setPg] = useState('inicio');
  const navigate = useNavigate();

  const handleCadastro = (e: React.FormEvent) => {
    e.preventDefault();
    if (senha !== senha2) {
      alert('As senhas não coincidem!');
      return;
    }
    console.log({ usuario, senha, companhia, pg });
    navigate('/login');
  };

  return (
    <div className={styles['auth-screen']}>
      <div className={styles['auth-card']}>
        <div className={styles['auth-logo']}>
          <img src={logoEb} alt="Brasão EB" />
          <span className={styles['auth-logo__title']}>Cadastro</span>
          <span className={styles['auth-logo__sub']}>Preencha os dados para criar sua conta</span>
        </div>

        <form className={styles['auth-form']} onSubmit={handleCadastro}>
          <div className={styles['auth-form__row']}>
            <div className={styles['auth-field']}>
              <label htmlFor="icompanhia">Companhia</label>
              <select
                className={styles['auth-select']}
                id="icompanhia"
                value={companhia}
                onChange={(e) => setCompanhia(e.target.value)}
              >
                <option value="inicio">— Cia —</option>
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
              <label htmlFor="ipg">Posto / Grad.</label>
              <select
                className={styles['auth-select']}
                id="ipg"
                value={pg}
                onChange={(e) => setPg(e.target.value)}
              >
                <option value="inicio">— P/G —</option>
                <option value="cap">Cap</option>
                <option value="1ten">1º Ten</option>
                <option value="2ten">2º Ten</option>
                <option value="asp">Asp</option>
                <option value="sten">ST</option>
                <option value="1sgt">1º Sgt</option>
                <option value="2sgt">2º Sgt</option>
                <option value="3sgt">3º Sgt</option>
                <option value="cb">Cb</option>
                <option value="sdep">Sd EP</option>
              </select>
            </div>
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

          <div className={styles['auth-form__row']}>
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

            <div className={styles['auth-field']}>
              <label htmlFor="isenha2">Confirmar</label>
              <input
                className={styles['auth-input']}
                type="password"
                id="isenha2"
                placeholder="••••••••"
                value={senha2}
                onChange={(e) => setSenha2(e.target.value)}
              />
            </div>
          </div>

          <div className={styles['auth-divider']} />

          <button className={`${styles['auth-btn']} ${styles['auth-btn--primary']}`} type="submit">
            Criar conta
          </button>

          <button
            className={`${styles['auth-btn']} ${styles['auth-btn--secondary']}`}
            type="button"
            onClick={() => navigate('/login')}
          >
            Voltar ao login
          </button>
        </form>
      </div>
    </div>
  );
}
