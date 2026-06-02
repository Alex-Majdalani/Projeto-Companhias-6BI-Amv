import React from 'react';
import logoEb from '../../assets/ebicon.png';
import styles from '../../styles/style.module.css';

export function Header() {
  return (
    <header>
      <div className={styles.conteiner}>
        <div className={styles.titulo}>
          <img src={logoEb} alt="logoeb" />
          <h1>Sistema de Gerenciamento de Companhia <br /> (SisGCia)</h1>
        </div>
      </div>
    </header>
  );
}
