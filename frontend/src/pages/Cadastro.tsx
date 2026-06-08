import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/cadastro.module.css';
import armyImg from '../assets/icons8-army-64.png';

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
    // Lógica de cadastro virá aqui
    console.log({ usuario, senha, companhia, pg });
    navigate('/login');
  };

  return (
    <div className={styles.conteinercentro}>
      <div className={styles.containercentro__img}>
        <img src={armyImg} alt="imagem de cadastro" />
        <h1>Cadastro</h1>

        <form className={styles.login__form} onSubmit={handleCadastro}>
          <div className={styles.form__row}>
            <div>
              <label htmlFor="icompanhia">Companhia </label>
              <select 
                name="Companhia" 
                id="icompanhia"
                value={companhia}
                onChange={(e) => setCompanhia(e.target.value)}
              >
                <option value="inicio">--- Companhia ---</option>
                <option value="1cia">1ª Cia</option>
                <option value="2cia">2ª Cia</option>
                <option value="3cia">3ª Cia</option>
                <option value="ccap">CCAP</option>
                <option value="ciacmdo">Cia Cmdo</option>
                <option value="ciacom">Cia Com</option>
                <option value="ciaprec">Cia Prec Pqdt</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="ipg">P/G </label>
              <select 
                name="pg" 
                id="ipg"
                value={pg}
                onChange={(e) => setPg(e.target.value)}
              >
                <option value="inicio">--- P/G ---</option>
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

          <p>
            <label htmlFor="iusu">Usuário </label>
            <input 
              className={styles.login__label} 
              type="text" 
              name="usu" 
              id="iusu"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
          </p>

          <div className={styles.form__row}>
            <div>
              <label htmlFor="isenha">Senha</label>
              <input 
                className={styles.login__label} 
                type="password" 
                name="senha" 
                id="isenha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="isenha2">Confirme a senha </label>
              <input 
                className={styles.login__label} 
                type="password" 
                name="senha2" 
                id="isenha2"
                value={senha2}
                onChange={(e) => setSenha2(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.button__row}>
            <button className={styles.login} type="submit">Cadastrar</button>
            <button 
              className={styles.login} 
              type="button" 
              style={{ background: 'transparent', color: '#556b2f', border: '2px solid #556b2f' }}
              onClick={() => navigate('/login')}
            >
              Voltar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
