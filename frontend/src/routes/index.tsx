import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { Home } from '../pages/Home';
import { Login } from '../pages/Login';
import { Cadastro } from '../pages/Cadastro';
import { SargenteacaoDashboard } from '../pages/sgte/SargenteacaoDashboard';
import { Aditamento } from '../pages/sgte/Aditamento';
import { CadastroMilitares } from '../pages/sgte/CadastroMilitares';
import { NovoMilitar } from '../pages/sgte/NovoMilitar';
import { QuadroOrganizacoes } from '../pages/sgte/QuadroOrganizacoes';
import { Pernoite } from '../pages/sgte/Pernoite';
import { ParteAcidente } from '../pages/sgte/ParteAcidente';
import { FATD } from '../pages/sgte/FATD';
import { FichaModeloE } from '../pages/sgte/FichaModeloE';

// force reload
export function AppRoutes() {
  return (
    <Routes>
      {/* Rotas de Autenticação */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
      </Route>

      {/* Rotas Principais */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        
        {/* Rotas de Sargenteação */}
        <Route path="/sgte" element={<SargenteacaoDashboard />} />
        <Route path="/sgte/aditamento" element={<Aditamento />} />
        <Route path="/sgte/cadastro-militares" element={<CadastroMilitares />} />
        <Route path="/sgte/cadastro-militares/novo" element={<NovoMilitar />} />
        <Route path="/sgte/quadro-organizacoes" element={<QuadroOrganizacoes />} />
        <Route path="/sgte/pernoite" element={<Pernoite />} />
        <Route path="/sgte/parte-acidente" element={<ParteAcidente />} />
        <Route path="/sgte/fatd" element={<FATD />} />
        <Route path="/sgte/ficha-modelo-e" element={<FichaModeloE />} />
      </Route>
    </Routes>
  );
}
