import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import styles from '../styles/cadastro.module.css';
import loginImg from '../assets/login.png';

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
    } catch (error) {
      alert('Erro ao fazer login. Verifique suas credenciais.');
    }
  };

  return (
    <div className={styles.conteinercentro}>
      <div className={styles.containercentro__img}>
        <img src={loginImg} alt="imagem de login" />
        <h1>Login</h1>

        <form className={styles.login__form} onSubmit={handleLogin}>
          <label htmlFor="icompanhia">Companhia </label>
          <select 
            name="Companhia" 
            id="icompanhia"
            value={companhia}
            onChange={(e) => setCompanhia(e.target.value)}
          >
            <option value="inicio">------Companhia------</option>
            <option value="1cia">1ª Cia</option>
            <option value="2cia">2ª Cia</option>
            <option value="3cia">3ª Cia</option>
            <option value="ccap">CCAP</option>
            <option value="ciacmdo">Cia Cmdo</option>
            <option value="ciacom">Cia Com</option>
            <option value="ciaprec">Cia Prec Pqdt</option>
          </select>  
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
          <p>
            <label htmlFor="isenha">Senha</label>
            <input 
              className={styles.login__label} 
              type="password" 
              name="senha" 
              id="isenha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </p>
          <p>
            <button className={styles.login} type="submit">Entrar</button>
          </p>
          <p>
            <button 
              className={styles.login} 
              type="button" 
              onClick={() => navigate('/cadastro')}
            >
              Cadastrar
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
