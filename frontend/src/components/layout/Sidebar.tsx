import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from '../../styles/layout.module.css';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { to: '/',                    label: 'Início',              icon: '⌂' },
  { to: '/sgte',                label: 'Sargenteação',        icon: '🎖' },
  { to: '/sgte/aditamento',     label: 'Aditamento',          icon: '📋' },
  { to: '#',                    label: 'Cmt Cia',             icon: '⭐' },
  { to: '#',                    label: 'Enc Materiál',        icon: '📦' },
  { to: '#',                    label: 'Furriel',             icon: '📂' },
];

interface SidebarProps {
  onCollapse?: (collapsed: boolean) => void;
}

export function Sidebar({ onCollapse }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapse?.(next);
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles['sidebar--collapsed'] : ''}`}>
      <span className={styles['sidebar__section-label']}>Menu</span>

      {navItems.map((item) => {
        const isActive = item.to !== '#' && location.pathname === item.to;
        return (
          <Link
            key={item.to + item.label}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={`${styles['sidebar__link']} ${isActive ? styles['sidebar__link--active'] : ''}`}
          >
            <span className={styles['sidebar__icon']}>{item.icon}</span>
            <span className={styles['sidebar__label']}>{item.label}</span>
          </Link>
        );
      })}

      <div className={styles['sidebar__toggle']}>
        <Link
          to="/login"
          title={collapsed ? 'Login' : undefined}
          className={styles['sidebar__link']}
          style={{ color: 'var(--color-danger)' }}
        >
          <span className={styles['sidebar__icon']}>→</span>
          <span className={styles['sidebar__label']}>Login / Sair</span>
        </Link>

        <button onClick={toggle} title={collapsed ? 'Expandir' : 'Recolher'}>
          <span className={styles['sidebar__icon']}>{collapsed ? '▶' : '◀'}</span>
          <span className={styles['sidebar__label']}>Recolher</span>
        </button>
      </div>
    </aside>
  );
}
