import React, { useState } from 'react';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Eye, Edit2, Trash2 } from 'lucide-react';
import { militaresMock } from './CadastroMilitares';

interface VacationPlan {
  id: number;
  nomeMilitar: string;
  periodo: string;
  dias: string;
  status: string;
  obs: string;
}

interface VacationPeriod {
  id: number;
  nome: string;
  dataInicio: string;
  dataFim: string;
}

const initialPeriodsMock: VacationPeriod[] = [
  { id: 1, nome: '1º Período', dataInicio: '10 mar 26', dataFim: '09 abr 26' },
  { id: 2, nome: '2º Período', dataInicio: '12 jan 26', dataFim: '10 fev 26' },
];

const initialMockData: VacationPlan[] = [
  {
    id: 1,
    nomeMilitar: 'Sgt João Silva',
    periodo: '1º Período (10 mar 26 a 09 abr 26)',
    dias: '30',
    status: 'Pendente',
    obs: 'Aguardando aprovação do comandante',
  },
  {
    id: 2,
    nomeMilitar: 'Cb Lucas Santos',
    periodo: '2º Período (12 jan 26 a 10 fev 26)',
    dias: '15',
    status: '1ª Parcela ok',
    obs: '',
  },
];

export function PlanoFerias() {
  const [plans, setPlans] = useState<VacationPlan[]>(initialMockData);
  const [periods, setPeriods] = useState<VacationPeriod[]>(initialPeriodsMock);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State - Novo Plano
  const [nomeMilitar, setNomeMilitar] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [dias, setDias] = useState('30');
  const [status, setStatus] = useState('Pendente');
  const [obs, setObs] = useState('');

  // Form State - Novo Período
  const [newPeriodNome, setNewPeriodNome] = useState('');
  const [newPeriodInicio, setNewPeriodInicio] = useState('');
  const [newPeriodFim, setNewPeriodFim] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newPlan: VacationPlan = {
      id: plans.length > 0 ? Math.max(...plans.map((p) => p.id)) + 1 : 1,
      nomeMilitar,
      periodo,
      dias,
      status,
      obs,
    };
    setPlans([...plans, newPlan]);
    setIsModalOpen(false);
    
    // Reset form
    setNomeMilitar('');
    setPeriodo('');
    setDias('30');
    setStatus('Pendente');
    setObs('');
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este plano de férias?')) {
      setPlans(plans.filter(p => p.id !== id));
    }
  };

  const handleSavePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    const newPeriod: VacationPeriod = {
      id: periods.length > 0 ? Math.max(...periods.map((p) => p.id)) + 1 : 1,
      nome: newPeriodNome,
      dataInicio: newPeriodInicio,
      dataFim: newPeriodFim,
    };
    setPeriods([...periods, newPeriod]);
    setNewPeriodNome('');
    setNewPeriodInicio('');
    setNewPeriodFim('');
  };

  const handleDeletePeriod = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este período?')) {
      setPeriods(periods.filter(p => p.id !== id));
    }
  };

  const filteredPlans = plans.filter(p => 
    p.nomeMilitar.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: any[] = [
    { header: 'Nome do Militar', accessor: 'nomeMilitar' },
    { header: 'Período', accessor: 'periodo' },
    { header: 'Dias', accessor: 'dias' },
    {
      header: 'Status',
      accessor: (row: VacationPlan) => {
        let variant: any = 'default';
        if (row.status === 'Ok' || row.status.includes('ok')) variant = 'success';
        if (row.status === 'Pendente') variant = 'warning';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    { header: 'Obs', accessor: 'obs' },
    {
      header: 'Ações',
      accessor: (row: VacationPlan) => (
        <div className="flex gap-2 text-gray-400">
          <button className="p-1 hover:text-militar-main transition-colors border border-gray-200 rounded">
            <Eye size={16} />
          </button>
          <button className="p-1 hover:text-militar-main transition-colors border border-gray-200 rounded">
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => handleDelete(row.id)}
            className="p-1 hover:text-red-500 transition-colors border border-gray-200 rounded"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Plano de Férias</h1>
          <Breadcrumb items={[{ label: 'Gestão de Pessoas' }, { label: 'Plano de Férias' }]} />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsConfigModalOpen(true)} variant="outline" icon={<Edit2 size={16} />}>
            Configurar Períodos
          </Button>
          <Button onClick={() => {
            // Set first period as default if none selected
            if (!periodo && periods.length > 0) {
              setPeriodo(`${periods[0].nome} (${periods[0].dataInicio} a ${periods[0].dataFim})`);
            }
            setIsModalOpen(true);
          }} icon={<Plus size={16} />}>
            Novo Plano
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Buscar Militar</label>
            <Input 
              placeholder="Digite o nome..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-48">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
            <Select>
              <option>Todos</option>
              <option>Pendente</option>
              <option>Ok</option>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button icon={<Search size={16} />} size="md">Filtrar</Button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
           <span className="text-sm text-gray-600">Total de <strong className="text-gray-900">{filteredPlans.length}</strong> planos encontrados</span>
        </div>

        {/* Table */}
        <DataTable 
          columns={columns}
          data={filteredPlans}
          keyExtractor={(row) => row.id}
        />
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Cadastrar Plano de Férias"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Militar
            </label>
            <Input 
              required
              list="militares-list"
              placeholder="Digite para buscar..."
              value={nomeMilitar}
              onChange={(e) => setNomeMilitar(e.target.value)}
            />
            <datalist id="militares-list">
              {militaresMock.map(m => (
                <option key={m.id} value={`${m.posto} ${m.nome}`} />
              ))}
            </datalist>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período de Férias
            </label>
            <Select 
              required
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
            >
              <option value="" disabled>Selecione um período</option>
              {periods.map(p => {
                const periodString = `${p.nome} (${p.dataInicio} a ${p.dataFim})`;
                return (
                  <option key={p.id} value={periodString}>
                    {periodString}
                  </option>
                );
              })}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Qtde de dias
              </label>
              <Select value={dias} onChange={(e) => setDias(e.target.value)}>
                <option value="10">10 dias</option>
                <option value="15">15 dias</option>
                <option value="30">30 dias</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Pendente">Pendente</option>
                <option value="Ok">Ok</option>
                <option value="1ª Parcela ok">1ª Parcela ok</option>
                <option value="2ª Parcela ok">2ª Parcela ok</option>
                <option value="3ª Parcela ok">3ª Parcela ok</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações (Obs)
            </label>
            <Input 
              placeholder="Alguma observação importante?" 
              value={obs}
              onChange={(e) => setObs(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Plano
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Configuração de Períodos */}
      <Modal 
        isOpen={isConfigModalOpen} 
        onClose={() => setIsConfigModalOpen(false)} 
        title="Configurar Períodos de Férias"
      >
        <div className="space-y-6">
          {/* Adicionar Novo Período */}
          <form onSubmit={handleSavePeriod} className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800">Adicionar Novo Período</h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome do Período</label>
                <Input required placeholder="Ex: 3º Período" value={newPeriodNome} onChange={e => setNewPeriodNome(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Data Início</label>
                  <Input required placeholder="Ex: 10 mai 26" value={newPeriodInicio} onChange={e => setNewPeriodInicio(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Data Fim</label>
                  <Input required placeholder="Ex: 09 jun 26" value={newPeriodFim} onChange={e => setNewPeriodFim(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" icon={<Plus size={16} />}>Adicionar</Button>
            </div>
          </form>

          {/* Listar Períodos Existentes */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Períodos Cadastrados</h3>
            {periods.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum período cadastrado.</p>
            ) : (
              <ul className="space-y-2">
                {periods.map(p => (
                  <li key={p.id} className="flex justify-between items-center bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                    <div>
                      <span className="block text-sm font-medium text-gray-900">{p.nome}</span>
                      <span className="block text-xs text-gray-500">{p.dataInicio} a {p.dataFim}</span>
                    </div>
                    <button 
                      onClick={() => handleDeletePeriod(p.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button onClick={() => setIsConfigModalOpen(false)}>
              Concluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
