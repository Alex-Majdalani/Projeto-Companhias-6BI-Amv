import React from 'react';
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <Outlet />
    </main>
  );
}
