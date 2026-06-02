import React from 'react';
import styles from '../../styles/pages.module.css';

export function Pernoite() {
  return (
    <div>
      <div className={styles['page-header']}>
        <p className={styles['page-header__eyebrow']}>Sargenteação</p>
        <h1>Pernoite</h1>
        <p>Registre as autorizações de pernoite fora da OM.</p>
      </div>
      <div className={styles['empty-page']}>
        <span className={styles['empty-page__icon']}>🌙</span>
        <h2>Em desenvolvimento</h2>
        <p>O formulário de Pernoite será implementado em breve.</p>
      </div>
    </div>
  );
}
