import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Plus, Download, Filter, Eye, Edit2, MoreHorizontal, Search } from 'lucide-react';

export const militaresMock = [
  { id: 1, posto: 'Maj', nome: 'JOÃO CARLOS DA SILVA', identidade: '123456789-0', cpf: '123.456.789-00', quadro: 'QAO', subunidade: '12º BI INF', situacao: 'Ativo', tipo: 'Carreira' },
  { id: 2, posto: 'Cap', nome: 'MARIA EDUARDA SOUZA', identidade: '987654321-1', cpf: '987.654.321-11', quadro: 'QEM', subunidade: '12º BI INF', situacao: 'Ativo', tipo: 'Carreira' },
  { id: 3, posto: '1º Ten', nome: 'PEDRO HENRIQUE ALMEIDA', identidade: '112233445-2', cpf: '112.233.445-22', quadro: 'QAO', subunidade: '12º BI INF', situacao: 'Ativo', tipo: 'Temporário' },
  { id: 4, posto: '2º Sgt', nome: 'LUCAS DE OLIVEIRA COSTA', identidade: '223344556-3', cpf: '223.344.556-33', quadro: 'QESA', subunidade: '12º BI INF', situacao: 'Ativo', tipo: 'Carreira' },
  { id: 5, posto: 'Cb', nome: 'GABRIEL FERREIRA LIMA', identidade: '334455667-4', cpf: '334.455.667-44', quadro: 'QE', subunidade: '12º BI INF', situacao: 'Ativo', tipo: 'Temporário' },
  { id: 6, posto: 'Sd', nome: 'MATHEUS ROCHA SANTOS', identidade: '445566778-5', cpf: '445.566.778-55', quadro: 'QE', subunidade: '12º BI INF', situacao: 'Ativo', tipo: 'Temporário' },
  { id: 7, posto: 'Maj', nome: 'FERNANDA CRISTINA MOURA', identidade: '556677889-6', cpf: '556.677.889-66', quadro: 'QAO', subunidade: '12º BI INF', situacao: 'Licença', tipo: 'Carreira' },
  { id: 8, posto: '1º Ten', nome: 'RAFAEL AZEVEDO MARTINS', identidade: '667788990-7', cpf: '667.788.990-77', quadro: 'QEM', subunidade: '12º BI INF', situacao: 'Afastado', tipo: 'Temporário' },
  { id: 9, posto: '2º Sgt', nome: 'THIAGO MENEZES PEREIRA', identidade: '778899001-8', cpf: '778.899.001-88', quadro: 'QESA', subunidade: '12º BI INF', situacao: 'Ativo', tipo: 'Carreira' },
  { id: 10, posto: 'Cb', nome: 'BRUNO GOMES RIBEIRO', identidade: '889900112-9', cpf: '889.900.112-99', quadro: 'QE', subunidade: '12º BI INF', situacao: 'Ativo', tipo: 'Temporário' },
];

export function CadastroMilitares() {
  const [activeTab, setActiveTab] = useState('lista');
  const navigate = useNavigate();

  const tabs = [
    { id: 'lista', label: 'Lista de Militares' },
    { id: 'dados', label: 'Dados Pessoais' },
    { id: 'situacao', label: 'Situação Funcional' },
    { id: 'documentos', label: 'Documentos' },
    { id: 'dependentes', label: 'Dependentes' },
    { id: 'historico', label: 'Histórico' },
  ];

  const columns: any[] = [
    {
      header: 'Posto/Grad.',
      accessor: (row: any) => (
        <div className="flex items-center gap-2 font-medium">
          {row.posto}
        </div>
      ),
    },
    { header: 'Nome', accessor: 'nome' },
    { header: 'Identidade', accessor: 'identidade' },
    { header: 'Quadro', accessor: 'quadro' },
    { header: 'Tipo', accessor: 'tipo' },
    { header: 'Subunidade', accessor: 'subunidade' },
    {
      header: 'Situação',
      accessor: (row: any) => {
        let variant: any = 'default';
        if (row.situacao === 'Ativo') variant = 'success';
        if (row.situacao === 'Licença') variant = 'warning';
        if (row.situacao === 'Afastado') variant = 'danger';
        return <Badge variant={variant}>{row.situacao}</Badge>;
      },
    },
    {
      header: 'Ações',
      accessor: () => (
        <div className="flex gap-2 text-gray-400">
          <button className="p-1 hover:text-militar-main transition-colors border border-gray-200 rounded"><Eye size={16} /></button>
          <button className="p-1 hover:text-militar-main transition-colors border border-gray-200 rounded"><Edit2 size={16} /></button>
          <button className="p-1 hover:text-militar-main transition-colors border border-gray-200 rounded"><MoreHorizontal size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cadastro de Militares</h1>
          <Breadcrumb items={[{ label: 'Gestão de Pessoas' }, { label: 'Cadastro de Militares' }]} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex px-6 border-b border-gray-200 gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px
                ${activeTab === tab.id 
                  ? 'border-militar-main text-militar-main' 
                  : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
            >
              {tab.label}
            </button>
          ))}
          
          <div className="ml-auto py-2 flex gap-2">
            <Button onClick={() => navigate('/sgte/cadastro-militares/novo')} icon={<Plus size={16} />} size="sm">Novo Militar</Button>
            <Button variant="outline" icon={<MoreHorizontal size={16} />} size="sm">Ações</Button>
          </div>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="flex flex-wrap items-end gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nome</label>
              <Input placeholder="Digite o nome" />
            </div>
            <div className="w-48">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Posto/Graduação</label>
              <Select><option>Todos</option></Select>
            </div>
            <div className="w-48">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Quadro</label>
              <Select><option>Todos</option></Select>
            </div>
            <div className="w-48">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Situação</label>
              <Select><option>Todas</option></Select>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" icon={<Filter size={16} />} size="md">Mais filtros</Button>
              <Button variant="outline" size="md">Limpar</Button>
              <Button icon={<Search size={16} />} size="md">Filtrar</Button>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
             <span className="text-sm text-gray-600">Total de <strong className="text-gray-900">1.248</strong> militares encontrados</span>
             <Button variant="outline" size="sm" icon={<Download size={16} />}>Exportar</Button>
          </div>

          {/* Table */}
          <DataTable 
            columns={columns}
            data={militaresMock}
            keyExtractor={(row) => row.id}
          />
        </div>
      </div>
    </div>
  );
}


