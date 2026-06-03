import React from 'react';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Users, Scale, HeartPulse, Activity, Target, 
  Calendar, AlertTriangle, AlertOctagon,
  UserPlus, FileText, Dumbbell, Stethoscope, Cross, GraduationCap
} from 'lucide-react';

export function Home() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <Breadcrumb items={[{ label: 'Dashboard' }]} />
        </div>
        <div className="flex gap-4">
          <select className="bg-white border border-gray-300 rounded-lg py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-militar-light">
            <option>12º BATALHÃO DE INFANTARIA</option>
          </select>
          <div className="bg-white border border-gray-300 rounded-lg py-2 px-4 text-sm flex items-center gap-2">
            <Calendar size={16} className="text-gray-500" />
            <span>20/05/2024</span>
          </div>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Militares Cadastrados"
          value="1.248"
          icon={<Users size={24} />}
          trend={{ value: '32', isPositive: true }}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          title="Ocorrências Disciplinares"
          value="18"
          icon={<Scale size={24} />}
          trend={{ value: '12%', isPositive: false }}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
        <StatCard
          title="Atendimentos de Saúde"
          value="27"
          icon={<HeartPulse size={24} />}
          trend={{ value: '8%', isPositive: true }}
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
        />
        <StatCard
          title="Testes de Aptidão Física"
          value="356"
          icon={<Activity size={24} />}
          trend={{ value: '15%', isPositive: true }}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          title="Práticas de Tiro"
          value="312"
          icon={<Target size={24} />}
          trend={{ value: '10%', isPositive: true }}
          iconBgColor="bg-emerald-100"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Resumo Geral Mock */}
        <Card>
          <CardHeader className="flex justify-between items-center pb-2 border-none">
            <CardTitle>Resumo Geral</CardTitle>
            <select className="text-xs border-none bg-gray-50 text-gray-500 rounded p-1"><option>Este mês</option></select>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-48">
             {/* Mock visual of a pie chart */}
             <div className="relative w-32 h-32 rounded-full border-[16px] border-militar-main">
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-xl font-bold">1.248</span>
                  <span className="text-xs text-gray-500">Total</span>
                </div>
             </div>
             <div className="ml-6 space-y-2 text-sm">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-militar-main"></span> Praça <strong className="ml-auto">862</strong></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-militar-dark"></span> Oficial <strong className="ml-auto">286</strong></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Cadete <strong className="ml-auto">72</strong></div>
             </div>
          </CardContent>
        </Card>

        {/* TAF Mock */}
        <Card>
          <CardHeader className="flex justify-between items-center pb-2 border-none">
            <CardTitle>Testes de Aptidão Física</CardTitle>
            <select className="text-xs border-none bg-gray-50 text-gray-500 rounded p-1"><option>Este mês</option></select>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-48 gap-6">
             <div className="space-y-4 text-sm">
                <div><span className="text-2xl font-bold">356</span><br/><span className="text-gray-500">Realizados</span></div>
                <div><span className="text-green-600 font-bold">82%</span><br/><span className="text-gray-500">Taxa de Aptidão</span></div>
             </div>
             <div className="relative w-28 h-28 rounded-full border-[12px] border-green-500">
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-lg font-bold">82%</span>
                  <span className="text-xs text-gray-500">Aptos</span>
                </div>
             </div>
          </CardContent>
        </Card>

        {/* Próximas Atividades */}
        <Card>
          <CardHeader className="pb-2 border-none">
            <CardTitle>Próximas Atividades</CardTitle>
          </CardHeader>
          <CardContent>
             <ul className="space-y-4">
                <li className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-50 flex flex-col items-center justify-center text-green-700">
                    <span className="text-xs font-bold">25</span><span className="text-[10px] uppercase">Mai</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Treinamento de Campo</p>
                    <p className="text-xs text-gray-500">Cia Fuz C Mec</p>
                  </div>
                  <span className="text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded h-fit">Programado</span>
                </li>
                <li className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-50 flex flex-col items-center justify-center text-green-700">
                    <span className="text-xs font-bold">27</span><span className="text-[10px] uppercase">Mai</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Curso de Aperfeiçoamento...</p>
                    <p className="text-xs text-gray-500">EASA</p>
                  </div>
                </li>
             </ul>
             <a href="#" className="text-sm text-militar-main font-medium mt-4 inline-block hover:underline">Ver todas atividades &rarr;</a>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card>
          <CardHeader className="pb-2 border-none">
            <CardTitle>Alertas e Pendências</CardTitle>
          </CardHeader>
          <CardContent>
             <ul className="space-y-4">
               <li className="flex gap-3">
                 <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><AlertTriangle size={20} /></div>
                 <div>
                   <p className="text-sm font-semibold"><span className="text-lg mr-1">7</span> Exames de saúde vencidos</p>
                   <a href="#" className="text-xs text-militar-main hover:underline">Ver detalhes &rarr;</a>
                 </div>
               </li>
               <li className="flex gap-3">
                 <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertOctagon size={20} /></div>
                 <div>
                   <p className="text-sm font-semibold"><span className="text-lg mr-1">3</span> Ocorrências abertas</p>
                   <a href="#" className="text-xs text-militar-main hover:underline">Ver detalhes &rarr;</a>
                 </div>
               </li>
             </ul>
             <a href="#" className="text-sm text-militar-main font-medium mt-4 inline-block hover:underline">Ver todas pendências &rarr;</a>
          </CardContent>
        </Card>
      </div>

      {/* Acesso Rápido */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acesso Rápido</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          <Button variant="outline" className="bg-white rounded-xl py-6 px-6 shadow-sm border border-gray-200" icon={<UserPlus size={20} className="text-militar-main" />}>
             Novo Militar
          </Button>
          <Button variant="outline" className="bg-white rounded-xl py-6 px-6 shadow-sm border border-gray-200" icon={<AlertTriangle size={20} className="text-orange-500" />}>
             Nova Ocorrência
          </Button>
          <Button variant="outline" className="bg-white rounded-xl py-6 px-6 shadow-sm border border-gray-200" icon={<Activity size={20} className="text-green-600" />}>
             Lançar TAF
          </Button>
          <Button variant="outline" className="bg-white rounded-xl py-6 px-6 shadow-sm border border-gray-200" icon={<Stethoscope size={20} className="text-blue-500" />}>
             Novo Atendimento
          </Button>
          <Button variant="outline" className="bg-white rounded-xl py-6 px-6 shadow-sm border border-gray-200" icon={<Target size={20} className="text-emerald-600" />}>
             Nova Prática de Tiro
          </Button>
          <Button variant="outline" className="bg-white rounded-xl py-6 px-6 shadow-sm border border-gray-200" icon={<GraduationCap size={20} className="text-purple-600" />}>
             Novo Curso
          </Button>
        </div>
      </div>
    </div>
  );
}
