import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  ArrowRightLeft,
  FileText,
  AlertOctagon,
  Scale,
  Activity,
  Dumbbell,
  GraduationCap,
  Stethoscope,
  HeartPulse,
  Settings,
  ChevronDown,
  User,
  ClipboardList,
  Plane,
  Briefcase,
  PhoneCall,
  ShieldCheck,
  Eye,
  Target,
  ClipboardCheck,
  TrendingUp,
  Bed,
  Ambulance,
  FileBarChart,
  BarChart2
} from 'lucide-react';
import logoEb from '../../assets/ebicon.png';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: '',
    items: [
      { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    ]
  },
  {
    title: 'GESTÃO DE PESSOAS',
    items: [
      { to: '/sgte/escala', label: 'Escala de Serviço', icon: <ClipboardList size={20} /> },
      { to: '/sgte/cadastro-militares', label: 'Cadastro de Militares', icon: <Users size={20} /> },
      { to: '/sgte/quadro-organizacoes', label: 'Quadro de Organizações', icon: <Building2 size={20} /> },
      { to: '/sgte/plano-ferias', label: 'Plano de Férias', icon: <Plane size={20} /> },
      { to: '/sgte/funcoes-cia', label: 'Funções Cia', icon: <Briefcase size={20} /> },
      { to: '/sgte/plano-chamada', label: 'Plano de Chamada', icon: <PhoneCall size={20} /> },
      { to: '/sgte/engajamento', label: 'Engajamento', icon: <ShieldCheck size={20} /> },
      { to: '/sgte/movimentacoes', label: 'Movimentações', icon: <ArrowRightLeft size={20} /> },
      { to: '/sgte/documentos', label: 'Documentos', icon: <FileText size={20} /> },
    ]
  },
  {
    title: 'DISCIPLINA',
    items: [
      { to: '/sgte/fatd', label: 'Ocorrências Disciplinares (FATD)', icon: <AlertOctagon size={20} /> },
      { to: '/sgte/punicoes', label: 'Punições', icon: <Scale size={20} /> },
      { to: '/sgte/fato-observado', label: 'Fato Observado', icon: <Eye size={20} /> },
    ]
  },
  {
    title: 'APTIDÃO E CAPACITAÇÃO',
    items: [
      { to: '/sgte/taf', label: 'Teste de Aptidão Física', icon: <Activity size={20} /> },
      { to: '/sgte/teste-tiro', label: 'Teste de Tiro', icon: <Target size={20} /> },
      { to: '/sgte/treinamento', label: 'Treinamento de Campo', icon: <Dumbbell size={20} /> },
      { to: '/sgte/cursos', label: 'Cursos e Estágios', icon: <GraduationCap size={20} /> },
      { to: '/sgte/avaliacoes', label: 'Avaliações', icon: <ClipboardCheck size={20} /> },
      { to: '/sgte/desempenho', label: 'Desempenho', icon: <TrendingUp size={20} /> },
    ]
  },
  {
    title: 'SAÚDE',
    items: [
      { to: '/sgte/atendimentos', label: 'Atendimentos', icon: <Stethoscope size={20} /> },
      { to: '/sgte/baixados', label: 'Baixados', icon: <Bed size={20} /> },
      { to: '/sgte/acompanhamento-saude', label: 'Acompanhamento de Saúde', icon: <HeartPulse size={20} /> },
      { to: '/sgte/parte-acidente', label: 'Parte de Acidente', icon: <Ambulance size={20} /> },
    ]
  },
  {
    title: 'ADMINISTRAÇÃO',
    items: [
      { to: '/sgte/relatorios', label: 'Relatórios Gerenciais', icon: <FileBarChart size={20} /> },
      { to: '/sgte/indicadores', label: 'Indicadores', icon: <BarChart2 size={20} /> },
      { to: '/sgte/configuracoes', label: 'Configurações', icon: <Settings size={20} /> },
    ]
  }
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-militar-dark text-white flex flex-col h-screen fixed left-0 top-0 overflow-y-auto overflow-x-hidden z-20">
      {/* Header Logo */}
      <div className="flex items-center gap-3 p-6 mb-4">
        <img src={logoEb} alt="Exército Brasileiro" className="w-12 h-14 object-contain" />
        <div className="flex flex-col">
          <span className="font-bold text-lg leading-tight uppercase">Exército<br />Brasileiro</span>
          <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Sistema de Gestão Integrada<br />SIGE-EB</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-6 space-y-6">
        {navGroups.map((group, idx) => (
          <div key={idx} className="flex flex-col">
            {group.title && (
              <span className="text-xs font-semibold text-gray-400 mb-3 px-2 uppercase tracking-wider">
                {group.title}
              </span>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium
                        ${isActive 
                          ? 'bg-militar-light text-white' 
                          : 'text-gray-300 hover:bg-militar-hover hover:text-white'
                        }`}
                    >
                      <span className={`${isActive ? 'text-white' : 'text-gray-400'}`}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 mt-auto">
        <div className="bg-militar-main rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-militar-hover transition-colors border border-militar-light/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-militar-light flex items-center justify-center border-2 border-white/10 text-white">
               <User size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white leading-tight">Maj QAO R/1 Silva</span>
              <span className="text-[11px] text-gray-300">Administrador</span>
            </div>
          </div>
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      </div>
    </aside>
  );
}
