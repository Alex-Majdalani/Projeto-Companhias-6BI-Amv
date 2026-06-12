import React, { useState, useEffect, useCallback } from 'react';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Eye, Edit2, Trash2 } from 'lucide-react';
import { militaresMock } from './CadastroMilitares'; // Comentário de organização: Lista mock de militares para o datalist do formulário de plano
import { api } from '../../services/api'; // Comentário de organização: Importa a instância configurada do axios para a comunicação com a API

// Comentário de organização: Função utilitária para converter a data do input date (YYYY-MM-DD)
// para o formato estático amigável de string do projeto (ex: "10 mai 26")
function formatToMockDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const monthAbbr = months[parseInt(month) - 1];
  const shortYear = year.substring(2); // ex: '2026' -> '26'
  return `${parseInt(day)} ${monthAbbr} ${shortYear}`;
}

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
  const [periods, setPeriods] = useState<VacationPeriod[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Comentário de organização: Estado para exibição de mensagens de erro para o usuário
  const [periodError, setPeriodError] = useState<string | null>(null);

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

  // Comentário de organização: Busca a lista de períodos de férias cadastrados no banco de dados
  const fetchPeriodos = useCallback(async () => {
    try {
      const res = await api.get('/ferias/periodos');
      const mapped = res.data.map((p: any) => ({
        id: p.Id,
        nome: p.Nome_Periodo,
        dataInicio: p.data_inicio,
        dataFim: p.data_fim
      }));
      setPeriods(mapped);
    } catch (err: any) {
      console.error('Erro ao buscar periodos:', err);
      setPeriodError('Não foi possível carregar os períodos de férias do banco.');
    }
  }, []);

  useEffect(() => {
    fetchPeriodos();
  }, [fetchPeriodos]);

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

  // Comentário de organização: Envia o cadastro do novo período ao backend
  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação robusta de campos vazios antes do envio conforme solicitado
    if (!newPeriodNome.trim() || !newPeriodInicio || !newPeriodFim) {
      setPeriodError('Por favor, preencha todos os campos do período.');
      return;
    }

    try {
      setPeriodError(null);
      
      // Converte as datas selecionadas para o formato textual solicitado (ex: "10 mai 26")
      const formattedInicio = formatToMockDate(newPeriodInicio);
      const formattedFim = formatToMockDate(newPeriodFim);

      await api.post('/ferias/periodos', {
        Nome_Periodo: newPeriodNome.trim(),
        data_inicio: formattedInicio,
        data_fim: formattedFim
      });

      // Limpa os inputs e recarrega a listagem
      setNewPeriodNome('');
      setNewPeriodInicio('');
      setNewPeriodFim('');
      fetchPeriodos();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error || 'Erro ao salvar o período de férias no banco.';
      setPeriodError(msg);
    }
  };

  // Comentário de organização: Remove um período de férias no banco de dados e atualiza a UI
  const handleDeletePeriod = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este período?')) {
      try {
        setPeriodError(null);
        await api.delete(`/ferias/periodos/${id}`);
        fetchPeriodos();
      } catch (err: any) {
        console.error(err);
        setPeriodError('Não foi possível excluir o período de férias.');
      }
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
                  {/* Comentário de organização: Alterado para tipo date e associado ao datepicker nativo do HTML5 */}
                  <Input type="date" required value={newPeriodInicio} onChange={e => setNewPeriodInicio(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Data Fim</label>
                  {/* Comentário de organização: Alterado para tipo date e associado ao datepicker nativo do HTML5 */}
                  <Input type="date" required value={newPeriodFim} onChange={e => setNewPeriodFim(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" icon={<Plus size={16} />}>Adicionar</Button>
            </div>
          </form>

          {/* Comentário de organização: Mensagem de erro exibida ao usuário em caso de campos vazios ou falha de rede */}
          {periodError && (
            <div className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              ⚠️ {periodError}
            </div>
          )}

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
