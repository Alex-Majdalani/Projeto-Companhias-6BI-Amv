import { useState, useEffect, useCallback } from 'react';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Calendar as CalendarIcon, List as ListIcon, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { api } from '../../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Tipagens vindas do backend/NocoDB
// ─────────────────────────────────────────────────────────────────────────────

/** Representa uma atividade normalizada para uso no componente */
interface Activity {
  id: number;
  title: string;
  date: Date;
  tipoId: number;
  tipoLabel: string; // Nome legível do tipo (ex: "rotina", "tfm")
  description: string;
}

/** Representa um tipo de atividade retornado pela API */
interface TipoAtividade {
  Id: number;
  tipos: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mapeamento de cores por tipo (baseado no nome do tipo cadastrado no NocoDB)
// Cores seguem um mapeamento genérico por índice de forma a abranger tipos dinâmicos
// ─────────────────────────────────────────────────────────────────────────────
const COLOR_PALETTE = [
  { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  { bg: 'bg-purple-50', text: 'text-purple-700',  dot: 'bg-purple-500' },
  { bg: 'bg-orange-50', text: 'text-orange-700',  dot: 'bg-orange-500' },
  { bg: 'bg-green-50',  text: 'text-green-700',   dot: 'bg-green-500'  },
  { bg: 'bg-red-50',    text: 'text-red-700',     dot: 'bg-red-500'    },
  { bg: 'bg-cyan-50',   text: 'text-cyan-700',    dot: 'bg-cyan-500'   },
];

/** Mapa dinâmico de cores por tipoId, construído ao carregar os tipos */
let colorMapById: Record<number, typeof COLOR_PALETTE[0]> = {};

/** Normaliza o registro retornado pela API para o formato interno do componente */
function normalizeAtividade(raw: any): Activity {
  // A data vem como 'YYYY-MM-DD' do NocoDB — parse sem conversão de timezone
  const [year, month, day] = (raw.data as string).split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);

  const tipoId    = raw.tipo?.Id    ?? 0;
  const tipoLabel = raw.tipo?.tipos ?? 'outros';

  return {
    id: raw.Id,
    title: raw.titulo_atividade,
    date: dateObj,
    tipoId,
    tipoLabel,
    description: raw.descricao || '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal: QuadroOrganizacoes
// ─────────────────────────────────────────────────────────────────────────────
export function QuadroOrganizacoes() {
  // ── Estado de visualização e data do calendário ──────────────────────────
  const [view, setView]               = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());

  // ── Estado de dados ───────────────────────────────────────────────────────
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tipos, setTipos]           = useState<TipoAtividade[]>([]);

  // ── Estado de UI ──────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [isLoading, setIsLoading]       = useState(true);
  const [isSaving, setIsSaving]         = useState(false);
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);

  // ── Estado do formulário de nova atividade ────────────────────────────────
  const [newTitle, setNewTitle] = useState('');
  const [newDate,  setNewDate]  = useState('');
  const [newTipoId, setNewTipoId] = useState<string>('');
  const [newDesc,  setNewDesc]  = useState('');

  // ── ESTADO PARA O DETALHE DA ATIVIDADE SELECIONADA NO CALENDÁRIO ─────────
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Carregamento inicial: busca atividades e tipos em paralelo
  // ─────────────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [atividadesRes, tiposRes] = await Promise.all([
        api.get('/agenda/atividades'),
        api.get('/agenda/tipos'),
      ]);

      // Monta o mapa de cores por tipoId ao carregar os tipos
      const tiposList: TipoAtividade[] = tiposRes.data;
      colorMapById = {};
      tiposList.forEach((t, idx) => {
        colorMapById[t.Id] = COLOR_PALETTE[idx % COLOR_PALETTE.length];
      });

      setTipos(tiposList);
      setActivities((atividadesRes.data as any[]).map(normalizeAtividade));

      // Define o tipo padrão do formulário como o primeiro tipo disponível
      if (tiposList.length > 0 && !newTipoId) {
        setNewTipoId(String(tiposList[0].Id));
      }
    } catch (err: any) {
      console.error('[QuadroOrganizacoes] Erro ao carregar dados:', err);
      setErrorMsg('Não foi possível carregar as atividades. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─────────────────────────────────────────────────────────────────────────
  // Navegação do calendário
  // ─────────────────────────────────────────────────────────────────────────
  const daysInMonth    = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  /** Filtra as atividades pelo dia/mês/ano do calendário atual */
  const getActivitiesForDay = (day: number) =>
    activities.filter(
      (a) =>
        a.date.getDate()     === day &&
        a.date.getMonth()    === currentDate.getMonth() &&
        a.date.getFullYear() === currentDate.getFullYear()
    );

  // ─────────────────────────────────────────────────────────────────────────
  // Cadastrar nova atividade — POST para o backend
  // ─────────────────────────────────────────────────────────────────────────
  const handleAddActivity = async () => {
    if (!newTitle || !newDate || !newTipoId) return;

    setIsSaving(true);
    setErrorMsg(null);
    try {
      const response = await api.post('/agenda/atividades', {
        titulo_atividade: newTitle,
        data: newDate,         // Formato 'YYYY-MM-DD'
        descricao: newDesc,
        tipoId: Number(newTipoId),
      });

      // Adiciona a atividade retornada pelo backend à lista local
      setActivities((prev) => [...prev, normalizeAtividade(response.data)]);

      // Fecha o modal e limpa o formulário
      setNewTitle('');
      setNewDate('');
      setNewTipoId(tipos.length > 0 ? String(tipos[0].Id) : '');
      setNewDesc('');
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('[QuadroOrganizacoes] Erro ao criar atividade:', err);
      setErrorMsg('Não foi possível salvar a atividade. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Excluir atividade — DELETE para o backend
  // ─────────────────────────────────────────────────────────────────────────
  const handleDeleteActivity = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta atividade?')) return;

    try {
      await api.delete(`/agenda/atividades/${id}`);
      // Remove da lista local sem recarregar tudo
      setActivities((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      console.error('[QuadroOrganizacoes] Erro ao excluir atividade:', err);
      alert('Não foi possível excluir a atividade.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Helper: retorna as classes de cor para um dado tipoId
  // ─────────────────────────────────────────────────────────────────────────
  const getColor = (tipoId: number) =>
    colorMapById[tipoId] ?? COLOR_PALETTE[COLOR_PALETTE.length - 1];

  // ─────────────────────────────────────────────────────────────────────────
  // Renderização do Calendário
  // ─────────────────────────────────────────────────────────────────────────
  const renderCalendar = () => {
    const days      = [];
    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    // Espaços vazios antes do dia 1
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 border border-gray-100 bg-gray-50/50" />);
    }

    // Dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      const dayActivities = getActivitiesForDay(i);
      const isToday =
        new Date().getDate()     === i &&
        new Date().getMonth()    === currentDate.getMonth() &&
        new Date().getFullYear() === currentDate.getFullYear();

      days.push(
        <div
          key={i}
          className={`h-32 border border-gray-200 p-2 flex flex-col overflow-y-auto ${isToday ? 'bg-militar-light/5' : 'bg-white'}`}
        >
          <div className="flex justify-between items-center mb-1">
            <span
              className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${
                isToday ? 'bg-militar-main text-white' : 'text-gray-700'
              }`}
            >
              {i}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {dayActivities.map((act) => {
              const color = getColor(act.tipoId);
              return (
                <div
                  key={act.id}
                  // Ao clicar na atividade, abre o modal de visualização de detalhes
                  onClick={(e) => {
                    e.stopPropagation(); // Previne outros eventos de clique
                    setSelectedActivity(act);
                  }}
                  className={`text-xs px-2 py-1 rounded-md truncate cursor-pointer hover:opacity-80 transition-opacity font-medium ${color.bg} ${color.text}`}
                  title={act.description || act.title}
                >
                  {act.title}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Cabeçalho do calendário com navegação de meses */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800 capitalize">{monthName}</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={prevMonth} icon={<ChevronLeft size={18} />} />
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
            <Button variant="outline" size="sm" onClick={nextMonth} icon={<ChevronRight size={18} />} />
          </div>
        </div>
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 bg-gray-100 border-b border-gray-200">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-r last:border-r-0 border-gray-200">
              {d}
            </div>
          ))}
        </div>
        {/* Grade de dias */}
        <div className="grid grid-cols-7 bg-white">{days}</div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Renderização da Lista
  // ─────────────────────────────────────────────────────────────────────────
  const renderList = () => {
    const columns: Column<Activity>[] = [
      {
        header: 'Data',
        accessor: (row) => row.date.toLocaleDateString('pt-BR'),
      },
      {
        header: 'Atividade',
        accessor: 'title',
      },
      {
        header: 'Tipo',
        accessor: (row) => {
          const color = getColor(row.tipoId);
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${color.bg} ${color.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${color.dot}`} />
              {row.tipoLabel}
            </span>
          );
        },
      },
      {
        header: 'Descrição',
        accessor: 'description',
      },
      {
        header: 'Ações',
        accessor: (row) => (
          <button
            title="Excluir atividade"
            onClick={() => handleDeleteActivity(row.id)}
            className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
          >
            <Trash2 size={16} />
          </button>
        ),
      },
    ];

    return (
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={[...activities].sort((a, b) => a.date.getTime() - b.date.getTime())}
            keyExtractor={(row) => row.id}
          />
        </CardContent>
      </Card>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render principal
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Cabeçalho da página com título, breadcrumb e ações */}
      <div className="flex justify-between items-end">
        <div>
          <Breadcrumb
            items={[
              { label: 'Gestão de Pessoas' },
              { label: 'Quadro de Organizações' },
            ]}
          />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Agenda da Companhia</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quadro de organizações, atividades e eventos planejados.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Alternância entre visualização de calendário e lista */}
          <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === 'calendar' ? 'bg-white text-militar-main shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarIcon size={16} />
              Calendário
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === 'list' ? 'bg-white text-militar-main shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ListIcon size={16} />
              Lista
            </button>
          </div>
          {/* Botão para abrir o modal de nova atividade */}
          <Button icon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>
            Nova Atividade
          </Button>
        </div>
      </div>

      {/* Mensagem de erro global */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {errorMsg}
        </div>
      )}

      {/* Conteúdo principal: loading, calendário ou lista */}
      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            Carregando atividades...
          </div>
        ) : (
          view === 'calendar' ? renderCalendar() : renderList()
        )}
      </div>

      {/* Modal de cadastro de nova atividade */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setErrorMsg(null);
        }}
        title="Cadastrar Nova Atividade"
      >
        <div className="space-y-4">
          {/* Campo: título */}
          <Input
            label="Título da Atividade"
            placeholder="Ex: TFM Centralizado"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            {/* Campo: data */}
            <Input
              type="date"
              label="Data"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />

            {/* Campo: tipo — populado dinamicamente pelo banco */}
            <Select
              label="Tipo de Atividade"
              value={newTipoId}
              onChange={(e) => setNewTipoId(e.target.value)}
            >
              {tipos.map((t) => (
                <option key={t.Id} value={t.Id}>
                  {t.tipos.charAt(0).toUpperCase() + t.tipos.slice(1)}
                </option>
              ))}
            </Select>
          </div>

          {/* Campo: descrição */}
          <Input
            label="Descrição (Opcional)"
            placeholder="Detalhes adicionais da atividade"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />

          {/* Mensagem de erro inline do modal */}
          {errorMsg && (
            <p className="text-red-600 text-xs">{errorMsg}</p>
          )}

          {/* Ações do modal */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleAddActivity} disabled={isSaving || !newTitle || !newDate || !newTipoId}>
              {isSaving ? 'Salvando...' : 'Salvar Atividade'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL DE DETALHES DA ATIVIDADE SELECIONADA NO CALENDÁRIO ───────── */}
      {/* Visual melhorado com maior contraste e cores integradas ao tema verde militar */}
      <Modal
        isOpen={selectedActivity !== null}
        onClose={() => setSelectedActivity(null)}
        title="Detalhes da Atividade"
      >
        {selectedActivity && (
          <div className="space-y-5">
            {/* Header / Destaque do Título */}
            <div className="bg-militar-main/5 p-4 rounded-xl border border-militar-main/10">
              <label className="block text-xs font-bold text-militar-main uppercase tracking-wider">Título da Atividade</label>
              <p className="text-lg font-bold text-gray-900 mt-1">{selectedActivity.title}</p>
            </div>

            {/* Grid de Informações de Suporte */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-150">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Data do Evento</label>
                <p className="text-sm font-semibold text-gray-800 mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  {selectedActivity.date.toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Classificação / Tipo</label>
                <div className="mt-1">
                  {(() => {
                    const color = getColor(selectedActivity.tipoId);
                    return (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${color.bg} ${color.text} shadow-sm border border-current/10`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${color.dot} animate-pulse`} />
                        {selectedActivity.tipoLabel}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Descrição Detalhada */}
            <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-inner">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Descrição Detalhada</label>
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap leading-relaxed">
                {selectedActivity.description || 'Nenhuma descrição adicional informada para esta atividade.'}
              </p>
            </div>

            {/* Ações do Modal de Detalhes: Fechar (OK) e Excluir com lixeira */}
            <div className="flex justify-between items-center pt-5 border-t border-gray-100">
              <button
                title="Excluir atividade"
                onClick={async () => {
                  const idToDelete = selectedActivity.id;
                  setSelectedActivity(null); // Fecha o modal antes
                  await handleDeleteActivity(idToDelete);
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-all px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold border border-transparent hover:border-red-100 cursor-pointer"
              >
                <Trash2 size={16} />
                Excluir Registro
              </button>
              
              <Button 
                onClick={() => setSelectedActivity(null)}
                className="px-6 py-2 bg-militar-main hover:bg-militar-hover text-white font-semibold rounded-lg shadow-sm transition-all"
              >
                Entendido
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
