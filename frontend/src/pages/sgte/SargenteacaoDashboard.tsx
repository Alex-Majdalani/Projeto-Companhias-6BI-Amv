import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/pages.module.css';

const modules = [
  { to: '/sgte/cadastro-militares', label: 'Cadastro de Militares', icon: '👤' },
  { to: '/sgte/aditamento',         label: 'Aditamento',            icon: '📋' },
  { to: '/sgte/quadro-organizacoes',label: 'QO',                    icon: '🏢' },
  { to: '/sgte/parte-acidente',     label: 'Parte de Acidente',     icon: '⚠️' },
  { to: '/sgte/fatd',               label: 'FATD',                  icon: '📄' },
  { to: '/sgte/ficha-modelo-e',     label: 'Ficha Modelo "E"',      icon: '📝' },
];

export function SargenteacaoDashboard() {
  const navigate = useNavigate();

  return (
    <div>
      <div className={styles['page-header']}>
        <p className={styles['page-header__eyebrow']}>Módulo</p>
        <h1>Sargenteação</h1>
        <p>Selecione o documento ou registro que deseja confeccionar.</p>
      </div>

      <div className={styles['module-grid']}>
        {modules.map((m) => (
          <div
            key={m.to}
            className={styles['module-card']}
            onClick={() => navigate(m.to)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(m.to)}
          >
            <div className={styles['module-card__icon']}>{m.icon}</div>
            <p className={styles['module-card__title']}>{m.label}</p>
            <span className={styles['module-card__arrow']}>→</span>
          </div>
        ))}
      </div>
    </div>
  );
}
