import React from 'react';
import logoEb from '../../assets/ebicon.png';
import styles from '../../styles/layout.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <img src={logoEb} alt="Brasão EB" className={styles.header__logo} />

      <div className={styles.header__brand}>
        <span className={styles['header__brand-name']}>SisGCia</span>
        <span className={styles['header__brand-sub']}>Sistema de Gerenciamento de Companhia · 6º BI Amv</span>
      </div>

      <div className={styles.header__divider} />

      <div className={styles.header__badge}>
        <span className={styles['header__badge-dot']} />
        Online
      </div>
    </header>
  );
}
