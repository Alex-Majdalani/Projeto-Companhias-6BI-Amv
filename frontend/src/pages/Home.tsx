import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/pages.module.css';

const modules = [
  { to: '/sgte',              label: 'Sargenteação',      icon: '🎖', desc: 'Gestão do Sargenteante' },
  { to: '#',                  label: 'Cmt Cia',           icon: '⭐', desc: 'Documentos do Comandante' },
  { to: '#',                  label: 'Enc Materiál',      icon: '📦', desc: 'Controle de materiais' },
  { to: '#',                  label: 'Furriel',           icon: '📂', desc: 'Módulo do Furriel' },
];

export function Home() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Stats */}
      <div className={styles['stats-row']}>
        <div className={styles['stat-card']}>
          <p className={styles['stat-card__label']}>Módulos Disponíveis</p>
          <p className={styles['stat-card__value']}>04</p>
          <p className={styles['stat-card__sub']}>1 ativo nesta sessão</p>
        </div>
        <div className={styles['stat-card']}>
          <p className={styles['stat-card__label']}>Companhia</p>
          <p className={styles['stat-card__value']}>—</p>
          <p className={styles['stat-card__sub']}>Faça o login para continuar</p>
        </div>
        <div className={styles['stat-card']}>
          <p className={styles['stat-card__label']}>Versão do Sistema</p>
          <p className={styles['stat-card__value']}>2.0</p>
          <p className={styles['stat-card__sub']}>React + Vite + TypeScript</p>
        </div>
      </div>

      {/* Page heading */}
      <div className={styles['page-header']}>
        <p className={styles['page-header__eyebrow']}>Dashboard</p>
        <h1>Selecione um módulo</h1>
        <p>Escolha abaixo a área que deseja acessar.</p>
      </div>

      {/* Module grid */}
      <div className={styles['module-grid']}>
        {modules.map((m) => (
          <div
            key={m.label}
            className={styles['module-card']}
            onClick={() => m.to !== '#' && navigate(m.to)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && m.to !== '#' && navigate(m.to)}
          >
            <div className={styles['module-card__icon']}>{m.icon}</div>
            <div>
              <p className={styles['module-card__title']}>{m.label}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{m.desc}</p>
            </div>
            <span className={styles['module-card__arrow']}>→</span>
          </div>
        ))}
      </div>
    </div>
  );
}
