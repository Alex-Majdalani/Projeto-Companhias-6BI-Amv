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

  // ── ESTADO PARA CONTROLE DE EDIÇÃO DE ATIVIDADE EXISTENTE ─────────────────
  const [editingActivityId, setEditingActivityId] = useState<number | null>(null);

  // ── ESTADO DE SELEÇÃO DE CHECKBOXES DO DATATABLE PARA AÇÕES EM LOTE ───────
  const [parentSelectedRows, setParentSelectedRows] = useState<Set<string | number>>(new Set());

  // ── MODAL DE CONFIRMAÇÃO DE EXCLUSÃO (substitui o confirm() nativo bloqueado) ─
  const [deleteTarget, setDeleteTarget] = useState<number | number[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── MODAL DE NOVO TIPO (substitui o prompt() nativo bloqueado) ────────────
  const [isNovoTipoOpen, setIsNovoTipoOpen] = useState(false);
  const [novoTipoNome, setNovoTipoNome] = useState('');
  const [novoTipoSaving, setNovoTipoSaving] = useState(false);
  const [novoTipoError, setNovoTipoError] = useState<string | null>(null);

  // ── MENSAGEM DE ERRO PARA OPERAÇÃO DE EXCLUSÃO ───────────────────────
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ── MENSAGEM DE ERRO DE VALIDAÇÃO DO FORMULÁRIO DE NOVA ATIVIDADE ────
  // Separada do errorMsg global para não interferir com erros de rede
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  // ── FILTRO DA LISTA: todas | pendentes (futuras) | realizadas (passadas) ───
  const [listFilter, setListFilter] = useState<'all' | 'pending' | 'done'>('all');

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
  // Cadastrar ou Editar atividade — POST/PUT para o backend
  // ─────────────────────────────────────────────────────────────────────────
  const handleAddActivity = async () => {
    // Valida campos obrigatórios antes de enviar ao backend
    if (!newTitle.trim()) {
      setFormValidationError('Preencha o título da atividade.');
      return;
    }
    if (!newDate) {
      setFormValidationError('Selecione a data da atividade.');
      return;
    }
    if (!newTipoId) {
      setFormValidationError('Selecione o tipo de atividade.');
      return;
    }

    // Limpa erros de validação antes de prosseguir
    setFormValidationError(null);
    setIsSaving(true);
    setErrorMsg(null);
    try {
      if (editingActivityId !== null) {
        // Modo Edição: faz requisição PUT
        const response = await api.put(`/agenda/atividades/${editingActivityId}`, {
          titulo_atividade: newTitle,
          data: newDate,
          descricao: newDesc,
          tipoId: Number(newTipoId),
        });

        const updatedNormalized = normalizeAtividade(response.data);
        setActivities((prev) =>
          prev.map((a) => (a.id === editingActivityId ? updatedNormalized : a))
        );
      } else {
        // Modo Criação: faz requisição POST
        const response = await api.post('/agenda/atividades', {
          titulo_atividade: newTitle,
          data: newDate,         // Formato 'YYYY-MM-DD'
          descricao: newDesc,
          tipoId: Number(newTipoId),
        });

        // Adiciona a atividade retornada pelo backend à lista local
        setActivities((prev) => [...prev, normalizeAtividade(response.data)]);
      }

      // Limpa o formulário, erros de validação e fecha o modal
      setNewTitle('');
      setNewDate('');
      setNewTipoId(tipos.length > 0 ? String(tipos[0].Id) : '');
      setNewDesc('');
      setEditingActivityId(null);
      setFormValidationError(null);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('[QuadroOrganizacoes] Erro ao salvar atividade:', err);
      setErrorMsg('Não foi possível salvar a atividade. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Novo Tipo: abre o modal interno (sem usar prompt() nativo)
  // ─────────────────────────────────────────────────────────────────────────
  const handleAddTipo = () => {
    setNovoTipoNome('');
    setIsNovoTipoOpen(true);
  };

  /** Confirma a criação do novo tipo via modal */
  const handleConfirmNovoTipo = async () => {
    // Valida se o nome foi preenchido antes de enviar
    if (!novoTipoNome.trim()) {
      setNovoTipoError('Informe o nome do novo tipo de atividade.');
      return;
    }
    setNovoTipoSaving(true);
    setNovoTipoError(null);
    try {
      const res = await api.post('/agenda/tipos', { tipos: novoTipoNome.trim() });
      const newTipo = res.data;
      setTipos((prev) => {
        const novosTipos = [...prev, newTipo];
        // Atualiza a cor deste novo tipo na paleta dinâmica
        colorMapById[newTipo.Id] = COLOR_PALETTE[(novosTipos.length - 1) % COLOR_PALETTE.length];
        return novosTipos;
      });
      setIsNovoTipoOpen(false);
    } catch (err: any) {
      console.error('[QuadroOrganizacoes] Erro ao criar tipo:', err);
      // Exibe mensagem de erro dentro do modal de novo tipo
      const msg = err.response?.data?.error || 'Não foi possível criar o tipo. Tente novamente.';
      setNovoTipoError(msg);
    } finally {
      setNovoTipoSaving(false);
    }
  };

  /** Abre o formulário em modo de edição, preenchendo todos os campos */
  const handleOpenEditModal = (act: Activity) => {
    // Converte a data do Date local para formato YYYY-MM-DD aceito pelo input tipo date
    const yyyy = act.date.getFullYear();
    const mm = String(act.date.getMonth() + 1).padStart(2, '0');
    const dd = String(act.date.getDate()).padStart(2, '0');
    setNewTitle(act.title);
    setNewDate(`${yyyy}-${mm}-${dd}`);
    setNewTipoId(String(act.tipoId));
    setNewDesc(act.description || '');
    setEditingActivityId(act.id);
    setIsModalOpen(true);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Excluir atividade — abre modal de confirmação (sem usar confirm() nativo)
  // ─────────────────────────────────────────────────────────────────────────
  const handleDeleteActivity = (idOrIds: number | number[]) => {
    // Armazena o alvo e abre o modal de confirmação
    setDeleteTarget(idOrIds);
  };

  /** Executa a exclusão após confirmação no modal */
  const handleConfirmDelete = async () => {
    if (deleteTarget === null) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
      // Sempre envia como array de objetos conforme NocoDB V2 exige
      await api.delete('/agenda/atividades', { data: { ids } });

      if (Array.isArray(deleteTarget)) {
        setActivities((prev) => prev.filter((a) => !(deleteTarget as number[]).includes(a.id)));
        setParentSelectedRows(new Set());
      } else {
        setActivities((prev) => prev.filter((a) => a.id !== deleteTarget));
        const newSelected = new Set(parentSelectedRows);
        newSelected.delete(deleteTarget);
        setParentSelectedRows(newSelected);
        // Fecha também o modal de detalhes do calendário, se estiver aberto
        if (selectedActivity?.id === deleteTarget) setSelectedActivity(null);
      }
      setDeleteTarget(null); // Fecha o modal de confirmação só em caso de sucesso
    } catch (err: any) {
      console.error('[QuadroOrganizacoes] Erro ao excluir atividade:', err);
      // Exibe mensagem de erro dentro do modal de confirmação
      const msg = err.response?.data?.error || 'Não foi possível excluir a(s) atividade(s). Tente novamente.';
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  /** Prepara a exclusão de todas as atividades marcadas nos checkboxes */
  const handleDeleteSelectedActivities = () => {
    if (parentSelectedRows.size === 0) return;
    const selectedIds = Array.from(parentSelectedRows).map(Number);
    handleDeleteActivity(selectedIds);
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
    // Data de hoje (sem horário) para comparar com as atividades
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Aplica o filtro selecionado
    const filteredActivities = [...activities]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .filter((a) => {
        if (listFilter === 'pending') return a.date >= today; // Atividades pendentes: hoje ou futuro
        if (listFilter === 'done')    return a.date < today;  // Atividades realizadas: antes de hoje
        return true; // 'all': todas
      });
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
          <div className="flex gap-2">
            {/* Botão para Editar a atividade correspondente */}
            <button
              title="Alterar atividade"
              onClick={() => handleOpenEditModal(row)}
              className="text-gray-400 hover:text-militar-main transition-colors p-1 rounded cursor-pointer"
            >
              {/* Ícone de edição simples corrigido sem atributo inválido size */}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button
              title="Excluir atividade"
              onClick={() => handleDeleteActivity(row.id)}
              className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded cursor-pointer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ];

    return (
      <Card>
        <CardContent className="p-0">
          {/* ─ Barra de filtro de status ─────────────────────────────────── */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">Filtrar:</span>
            {([
              { key: 'all',     label: 'Todas',      count: activities.length },
              { key: 'pending', label: 'Pendentes',  count: activities.filter(a => { const t = new Date(); t.setHours(0,0,0,0); return a.date >= t; }).length },
              { key: 'done',    label: 'Realizadas', count: activities.filter(a => { const t = new Date(); t.setHours(0,0,0,0); return a.date < t;  }).length },
            ] as const).map(({ key, label, count }) => (
              <button
                key={key}
                type="button"
                onClick={() => setListFilter(key)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  listFilter === key
                    // Comentário de organização: Cores ativas personalizadas por tipo de filtro conforme solicitado:
                    // Todas (all)       → Preto
                    // Pendentes (pending) → Vermelho
                    // Realizadas (done)   → Verde
                    ? key === 'done'
                      ? 'bg-green-600 text-white shadow-sm'
                      : key === 'pending'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-black text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-200'
                }`}
              >
                {label}
                <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                  listFilter === key ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Exibe o botão de exclusão em lote apenas quando houver registros selecionados */}
          {parentSelectedRows.size > 0 && (
            <div className="flex justify-between items-center px-4 py-2.5 bg-red-50/50 border-b border-gray-200">
              <span className="text-sm font-semibold text-red-700">
                {parentSelectedRows.size} atividade(s) selecionada(s)
              </span>
              <button
                type="button"
                onClick={handleDeleteSelectedActivities}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
                Excluir Selecionadas
              </button>
            </div>
          )}

          <DataTable
            columns={columns}
            data={filteredActivities}
            keyExtractor={(row) => row.id}
            selectedRows={parentSelectedRows}
            onSelectedRowsChange={setParentSelectedRows}
          />

          {/* Mensagem quando não há atividades no filtro atual */}
          {filteredActivities.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
              {listFilter === 'pending' && 'Nenhuma atividade pendente.'}
              {listFilter === 'done'    && 'Nenhuma atividade realizada ainda.'}
              {listFilter === 'all'     && 'Nenhuma atividade cadastrada.'}
            </div>
          )}
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
          {/* Botão para criar um novo tipo de atividade */}
          <Button 
            variant="outline"
            icon={<Plus size={16} />} 
            onClick={handleAddTipo}
            disabled={isLoading}
          >
            Novo Tipo
          </Button>
          {/* Botão para abrir o modal de nova atividade limpando estados de edição */}
          <Button 
            icon={<Plus size={16} />} 
            onClick={() => {
              setNewTitle('');
              setNewDate('');
              setNewTipoId(tipos.length > 0 ? String(tipos[0].Id) : '');
              setNewDesc('');
              setEditingActivityId(null);
              setIsModalOpen(true);
            }}
          >
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
        title={editingActivityId !== null ? "Alterar Atividade" : "Cadastrar Nova Atividade"}
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
                  {/* Comentário de organização: Adicionado tratamento seguro com fallback ('') caso t.tipos seja indefinido ou nulo, prevenindo quebras na renderização */}
                  {((t.tipos || '').charAt(0).toUpperCase() + (t.tipos || '').slice(1))}
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

          {/* Mensagem de erro de validação do formulário (campos obrigatórios) */}
          {formValidationError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-medium">
              <span className="text-red-500">⚠️</span>
              {formValidationError}
            </div>
          )}

          {/* Mensagem de erro de rede/servidor ao salvar */}
          {errorMsg && (
            <p className="text-red-600 text-xs">{errorMsg}</p>
          )}

          {/* Ações do modal */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => { setIsModalOpen(false); setFormValidationError(null); }} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleAddActivity} disabled={isSaving}>
              {isSaving ? 'Salvando...' : (editingActivityId !== null ? 'Salvar Alterações' : 'Salvar Atividade')}
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

            {/* Ações do Modal de Detalhes: Excluir, Alterar e Fechar */}
            <div className="flex justify-between items-center pt-5 border-t border-gray-100">
              {/* Botao excluir — abre modal de confirmação */}
              <button
                title="Excluir atividade"
                onClick={() => {
                  const idToDelete = selectedActivity.id;
                  setSelectedActivity(null); // Fecha o modal de detalhes antes
                  handleDeleteActivity(idToDelete); // Abre o modal de confirmação
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-all px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold border border-transparent hover:border-red-100 cursor-pointer"
              >
                <Trash2 size={16} />
                Excluir
              </button>

              <div className="flex items-center gap-2">
                {/* Botão alterar — abre o modal de edição preenchido */}
                <button
                  title="Alterar atividade"
                  onClick={() => {
                    const actToEdit = selectedActivity;
                    setSelectedActivity(null); // Fecha o card de detalhes
                    handleOpenEditModal(actToEdit); // Abre o modal de edição
                  }}
                  className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold border border-militar-main/30 text-militar-main hover:bg-militar-main/5 transition-all cursor-pointer"
                >
                  {/* Ícone de lápis (edição) */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Alterar
                </button>

                <Button
                  onClick={() => setSelectedActivity(null)}
                  className="px-6 py-2 bg-militar-main hover:bg-militar-hover text-white font-semibold rounded-lg shadow-sm transition-all"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL DE CONFIRMAÇÃO DE EXCLUSÃO ──────────────────────────────────── */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <Trash2 size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800 font-medium">
              {Array.isArray(deleteTarget)
                ? `Tem certeza que deseja excluir as ${deleteTarget.length} atividade(s) selecionada(s)? Esta ação não pode ser desfeita.`
                : 'Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.'}
            </p>
          </div>

          {/* Mensagem de erro caso a exclusão falhe */}
          {deleteError && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              ⚠️ {deleteError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteError(null); }} disabled={isDeleting}>
              Cancelar
            </Button>
            <button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL DE CRIAÇÃO DE NOVO TIPO ─────────────────────────────────────── */}
      <Modal
        isOpen={isNovoTipoOpen}
        onClose={() => !novoTipoSaving && setIsNovoTipoOpen(false)}
        title="Novo Tipo de Atividade"
      >
        <div className="space-y-4">
          <Input
            label="Nome do Tipo"
            placeholder="Ex: Instrução, Exercício, Reunião..."
            value={novoTipoNome}
            onChange={(e) => setNovoTipoNome(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirmNovoTipo()}
            autoFocus
          />

          {/* Mensagem de erro caso a criação do tipo falhe */}
          {novoTipoError && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              ⚠️ {novoTipoError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setIsNovoTipoOpen(false); setNovoTipoError(null); }} disabled={novoTipoSaving}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmNovoTipo} disabled={novoTipoSaving || !novoTipoNome.trim()}>
              {novoTipoSaving ? 'Salvando...' : 'Criar Tipo'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
