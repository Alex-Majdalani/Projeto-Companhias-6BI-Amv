import React from 'react';
import { Outlet } from 'react-router-dom';

// AuthLayout apenas renderiza o <Outlet>
// O visual de fundo está definido dentro de Login.tsx e Cadastro.tsx
export function AuthLayout() {
  return <Outlet />;
}
