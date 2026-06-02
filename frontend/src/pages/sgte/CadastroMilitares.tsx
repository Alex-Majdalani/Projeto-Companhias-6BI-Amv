import React from 'react';
import styles from '../../styles/pages.module.css';

export function CadastroMilitares() {
  return (
    <div>
      <div className={styles['page-header']}>
        <p className={styles['page-header__eyebrow']}>Sargenteação</p>
        <h1>Cadastro de Militares</h1>
        <p>Gerencie o cadastro dos militares da sua subunidade.</p>
      </div>
      <div className={styles['empty-page']}>
        <span className={styles['empty-page__icon']}>👤</span>
        <h2>Em desenvolvimento</h2>
        <p>O formulário de Cadastro de Militares será implementado em breve.</p>
      </div>
    </div>
  );
}
