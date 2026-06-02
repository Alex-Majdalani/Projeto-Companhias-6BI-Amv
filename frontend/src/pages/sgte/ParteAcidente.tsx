import React from 'react';
import styles from '../../styles/pages.module.css';

export function ParteAcidente() {
  return (
    <div>
      <div className={styles['page-header']}>
        <p className={styles['page-header__eyebrow']}>Sargenteação</p>
        <h1>Parte de Acidente</h1>
        <p>Registre e documente acidentes ocorridos na subunidade.</p>
      </div>
      <div className={styles['empty-page']}>
        <span className={styles['empty-page__icon']}>⚠️</span>
        <h2>Em desenvolvimento</h2>
        <p>O formulário de Parte de Acidente será implementado em breve.</p>
      </div>
    </div>
  );
}
