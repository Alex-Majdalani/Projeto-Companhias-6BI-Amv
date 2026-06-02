import React from 'react';
import styles from '../../styles/layout.module.css';

interface FooterProps {
  collapsed?: boolean;
}

export function Footer({ collapsed = false }: FooterProps) {
  return (
    <footer className={`${styles.footer} ${collapsed ? styles['footer--collapsed'] : ''}`}>
      <span className={styles['footer__left']}>
        Exército Brasileiro — Braço Forte, Mão Amiga.
      </span>
      <span className={styles['footer__right']}>
        Desenvolvedor: 2º Sgt Majdalani · 6º BI Amv
      </span>
    </footer>
  );
}
