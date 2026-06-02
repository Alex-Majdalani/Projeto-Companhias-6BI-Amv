import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { Footer } from '../components/layout/Footer';
import styles from '../styles/layout.module.css';

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <Header />
      <Sidebar onCollapse={setCollapsed} />
      <main className={`${styles['page-wrapper']} ${collapsed ? styles['page-wrapper--collapsed'] : ''}`}>
        <Outlet />
      </main>
      <Footer collapsed={collapsed} />
    </>
  );
}
