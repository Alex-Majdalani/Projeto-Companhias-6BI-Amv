import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/style.module.css';
import iconImg from '../../assets/icon.png';

export function SargenteacaoDashboard() {
  const navigate = useNavigate();

  return (
    <div className={styles.conteinercentro}>
      <div className={styles.titulocentro}>
        <h1>Sargenteação</h1>
        <h2>Selecione abaixo o documento que deseja confeccionar.</h2>
      </div>
      <div className={styles['div-box']}>
        <div className={styles.box} onClick={() => navigate('/sgte/cadastro-militares')}>
          <img src={iconImg} alt="icon" />
          <h1 className={styles.box__cadastro}>Cadastro de Militares</h1>
        </div>
        <div className={styles.box} onClick={() => navigate('/sgte/aditamento')}>
          <img src={iconImg} alt="icon" />
          <h1>Aditamento</h1>
        </div>
        <div className={styles.box} onClick={() => navigate('/sgte/pernoite')}>
          <img src={iconImg} alt="icon" />
          <h1>Pernoite</h1>
        </div>
        <div className={styles.box} onClick={() => navigate('/sgte/parte-acidente')}>
          <img src={iconImg} alt="icon" />
          <h1>Parte de acidente</h1>
        </div>
        <div className={styles.box} onClick={() => navigate('/sgte/fatd')}>
          <img src={iconImg} alt="icon" />
          <h1>FATD</h1>
        </div>
        <div className={styles.box} onClick={() => navigate('/sgte/ficha-modelo-e')}>
          <img src={iconImg} alt="icon" />
          <h1>Ficha Modelo "E"</h1>
        </div>
      </div>
    </div>
  );
}
