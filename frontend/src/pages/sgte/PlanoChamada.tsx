import { useState } from 'react';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import { Download, Search, Printer } from 'lucide-react';

interface MilitarChamada {
  id: number;
  postoGraduacao: string;
  nomeGuerra: string;
  pelotao: string;
  telefone: string;
  endereco: string;
  contatoEmergenciaNome: string;
  contatoEmergenciaTelefone: string;
  grauParentesco: string;
}

const mockPlanoChamada: MilitarChamada[] = [
  {
    id: 1,
    postoGraduacao: 'Cap',
    nomeGuerra: 'SOUZA',
    pelotao: 'Cmt Cia',
    telefone: '(21) 98888-1111',
    endereco: 'Rua das Laranjeiras, 120, Apto 301, Laranjeiras, Rio de Janeiro - RJ',
    contatoEmergenciaNome: 'Marta Souza',
    contatoEmergenciaTelefone: '(21) 97777-1111',
    grauParentesco: 'Esposa'
  },
  {
    id: 2,
    postoGraduacao: '1º Ten',
    nomeGuerra: 'ALMEIDA',
    pelotao: '1º Pel Fuz',
    telefone: '(21) 98888-2222',
    endereco: 'Av. Brasil, 500, Bonsucesso, Rio de Janeiro - RJ',
    contatoEmergenciaNome: 'Carlos Almeida',
    contatoEmergenciaTelefone: '(21) 97777-2222',
    grauParentesco: 'Pai'
  },
  {
    id: 3,
    postoGraduacao: '1º Sgt',
    nomeGuerra: 'NOGUEIRA',
    pelotao: 'Sargenteação',
    telefone: '(21) 98888-3333',
    endereco: 'Rua São Clemente, 400, Botafogo, Rio de Janeiro - RJ',
    contatoEmergenciaNome: 'Ana Nogueira',
    contatoEmergenciaTelefone: '(21) 97777-3333',
    grauParentesco: 'Irmã'
  },
  {
    id: 4,
    postoGraduacao: 'Cb',
    nomeGuerra: 'LUCAS',
    pelotao: '2º Pel Fuz',
    telefone: '(21) 98888-4444',
    endereco: 'Rua Barata Ribeiro, 200, Copacabana, Rio de Janeiro - RJ',
    contatoEmergenciaNome: 'Teresa Lucas',
    contatoEmergenciaTelefone: '(21) 97777-4444',
    grauParentesco: 'Mãe'
  },
  {
    id: 5,
    postoGraduacao: 'Sd',
    nomeGuerra: 'SANTOS',
    pelotao: '3º Pel Fuz',
    telefone: '(21) 98888-5555',
    endereco: 'Estrada do Galeão, 1500, Ilha do Governador, Rio de Janeiro - RJ',
    contatoEmergenciaNome: 'Roberto Santos',
    contatoEmergenciaTelefone: '(21) 97777-5555',
    grauParentesco: 'Irmão'
  }
];

export function PlanoChamada() {
  const [searchTerm, setSearchTerm] = useState('');
  const [pelotaoFilter, setPelotaoFilter] = useState('Todos');

  const filteredData = mockPlanoChamada.filter(m => {
    const matchesSearch = m.nomeGuerra.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.postoGraduacao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPelotao = pelotaoFilter === 'Todos' || m.pelotao === pelotaoFilter;
    return matchesSearch && matchesPelotao;
  });

  const columns: any[] = [
    { header: 'P/G', accessor: 'postoGraduacao' },
    { 
      header: 'Nome de Guerra', 
      accessor: (row: MilitarChamada) => (
        <span className="font-semibold text-militar-main hover:underline decoration-militar-main/30 cursor-pointer">
          {row.nomeGuerra}
        </span>
      ) 
    },
    { header: 'Telefone', accessor: 'telefone' },
    { 
      header: 'Endereço', 
      accessor: (row: MilitarChamada) => (
        <span className="text-sm text-gray-600 truncate max-w-[300px] block" title={row.endereco}>
          {row.endereco}
        </span>
      )
    },
  ];

  const renderExpandedRow = (row: MilitarChamada) => (
    <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 bg-white rounded-lg shadow-inner border border-gray-100">
      <div>
        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pelotão / Seção</span>
        <span className="text-sm text-gray-900 font-medium">{row.pelotao}</span>
      </div>
      <div>
        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Contato de Emergência</span>
        <span className="text-sm text-gray-900">{row.contatoEmergenciaNome}</span>
      </div>
      <div>
        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Grau de Parentesco</span>
        <span className="text-sm text-gray-900">{row.grauParentesco}</span>
      </div>
      <div>
        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tel. Emergência</span>
        <span className="text-sm text-red-600 font-semibold">{row.contatoEmergenciaTelefone}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Plano de Chamada</h1>
          <Breadcrumb items={[{ label: 'Gestão de Pessoas' }, { label: 'Plano de Chamada' }]} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<Printer size={16} />}>
            Imprimir
          </Button>
          <Button icon={<Download size={16} />}>
            Exportar XLS
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Buscar</label>
            <Input 
              placeholder="Digite P/G ou Nome de Guerra..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-48">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Pelotão</label>
            <Select value={pelotaoFilter} onChange={(e) => setPelotaoFilter(e.target.value)}>
              <option value="Todos">Todos</option>
              <option value="Cmt Cia">Cmt Cia</option>
              <option value="Sargenteação">Sargenteação</option>
              <option value="1º Pel Fuz">1º Pel Fuz</option>
              <option value="2º Pel Fuz">2º Pel Fuz</option>
              <option value="3º Pel Fuz">3º Pel Fuz</option>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button icon={<Search size={16} />} size="md">Filtrar</Button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
           <span className="text-sm text-gray-600">
             Total de <strong className="text-gray-900">{filteredData.length}</strong> militares no plano de chamada
           </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <DataTable 
            columns={columns}
            data={filteredData}
            keyExtractor={(row) => row.id}
            renderExpandedRow={renderExpandedRow}
          />
        </div>
      </div>
    </div>
  );
}
