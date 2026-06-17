import React, { useState, useEffect, useCallback } from 'react';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { api } from '../../services/api';

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

// Função utilitária para remover acentos e converter para minúscula (busca insensível a acentos e caixa)
function normalizeText(text: string): string {
  if (!text) return '';
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Função utilitária para renderizar o nome completo do militar destacando em negrito e com sublinhado apenas as palavras do Nome de Guerra
function renderMilitarName(militar: any) {
  const nomeCompleto = militar.nome_completo || militar.nome || '';
  const nomeGuerra = militar.nome_guerra || '';

  if (!nomeGuerra) {
    return <span className="font-bold text-gray-900">{nomeCompleto}</span>;
  }

  // Divide o nome de guerra em palavras individuais e escapa caracteres especiais
  const words = nomeGuerra.split(/\s+/).filter((w: string) => w.trim().length > 0);
  if (words.length === 0) {
    return <span className="font-bold text-gray-900">{nomeCompleto}</span>;
  }

  const escapedWords = words.map((w: string) => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
  const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
  const parts = nomeCompleto.split(regex);

  return (
    <span>
      {parts.map((part: string, index: number) => 
        regex.test(part) ? (
          <strong key={index} className="font-bold text-militar-main underline decoration-2 decoration-militar-light">
            {part}
          </strong>
        ) : (
          <span key={index} className="font-bold text-gray-500">
            {part}
          </span>
        )
      )}
    </span>
  );
}

interface VacationPlan {
  id: number;
  militarId?: number | null;
  nomeMilitar: string;
  periodoId?: number | null;
  periodoIdList?: number[];
  periodo: string;
  dias: string;
  status: string;
  obs: string;
  parcelas?: number;
  anoReferencia?: number;
}

interface VacationPeriod {
  id: number;
  nome: string;
  dataInicio: string;
  dataFim: string;
}

const PG_ORDER = [
  'CEL', 'TC', 'MAJ', 'CAP', '1º TEN', '2º TEN', 'ASP',
  'ST', '1º SGT', '2º SGT', '3º SGT', 'CB', 'SD EP', 'SD EV'
];

export function PlanoFerias() {
  const [plans, setPlans] = useState<VacationPlan[]>([]);
  const [periods, setPeriods] = useState<VacationPeriod[]>([]);
  const [militares, setMilitares] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Estado para controle de exclusão via Modais de Confirmação
  const [deletePlanTarget, setDeletePlanTarget] = useState<number | null>(null);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);
  const [deletePlanError, setDeletePlanError] = useState<string | null>(null);

  const [deletePeriodTarget, setDeletePeriodTarget] = useState<number | null>(null);
  const [isDeletingPeriod, setIsDeletingPeriod] = useState(false);
  const [deletePeriodError, setDeletePeriodError] = useState<string | null>(null);

  // Estado para controle de salvamento concorrente
  const [isSavingPeriod, setIsSavingPeriod] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [showFiltersCard, setShowFiltersCard] = useState(false);
  const [pgFilter, setPgFilter] = useState('Todos');
  const [yearFilter, setYearFilter] = useState('Todos');
  const [parcelasFilter, setParcelasFilter] = useState('Todos');
  const [periodFilter, setPeriodFilter] = useState('Todos');
  const [sortOption, setSortOption] = useState<string>('pg-asc');

  // Estados de rolagem/exibição para estilo 1 de seleção nos filtros e ordenação
  const [showPgFilterScroll, setShowPgFilterScroll] = useState(false);
  const [showStatusFilterScroll, setShowStatusFilterScroll] = useState(false);
  const [showYearFilterScroll, setShowYearFilterScroll] = useState(false);
  const [showParcelasFilterScroll, setShowParcelasFilterScroll] = useState(false);
  const [showPeriodFilterScroll, setShowPeriodFilterScroll] = useState(false);
  const [showSortOptionScroll, setShowSortOptionScroll] = useState(false);
  
  // Comentário de organização: Estado para exibição de mensagens de erro para o usuário
  const [periodError, setPeriodError] = useState<string | null>(null);

  // Form State - Novo / Edit Plano
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [nomeMilitar, setNomeMilitar] = useState('');
  const [militarId, setMilitarId] = useState<number | null>(null);
  const [selectedPG, setSelectedPG] = useState('');
  const [showMilitarSuggestions, setShowMilitarSuggestions] = useState(false);
  const [status, setStatus] = useState('Pendente');
  const [obs, setObs] = useState('');
  const [numParcelas, setNumParcelas] = useState(1);
  const [parcelaPeriodos, setParcelaPeriodos] = useState<string[]>(['']);
  const [anoReferencia, setAnoReferencia] = useState(String(new Date().getFullYear()));
  const [showYearScroll, setShowYearScroll] = useState(false);
  const [showStatusScroll, setShowStatusScroll] = useState(false);
  const [showPGScroll, setShowPGScroll] = useState(false);
  const [showParcelasScroll, setShowParcelasScroll] = useState(false);
  const [showPeriodScrollIndex, setShowPeriodScrollIndex] = useState<number | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);

  const closeAllSelectsExcept = useCallback((except?: string, index?: number) => {
    if (except !== 'year') setShowYearScroll(false);
    if (except !== 'status') setShowStatusScroll(false);
    if (except !== 'pg') setShowPGScroll(false);
    if (except !== 'parcelas') setShowParcelasScroll(false);
    if (except !== 'period' || index === undefined) setShowPeriodScrollIndex(null);
    if (except !== 'militar') setShowMilitarSuggestions(false);

    // Filtros
    if (except !== 'pgFilter') setShowPgFilterScroll(false);
    if (except !== 'statusFilter') setShowStatusFilterScroll(false);
    if (except !== 'yearFilter') setShowYearFilterScroll(false);
    if (except !== 'parcelasFilter') setShowParcelasFilterScroll(false);
    if (except !== 'periodFilter') setShowPeriodFilterScroll(false);
    if (except !== 'sortOption') setShowSortOptionScroll(false);
  }, []);

  // Form State - Novo Período
  const [newPeriodNome, setNewPeriodNome] = useState('');
  const [newPeriodInicio, setNewPeriodInicio] = useState('');
  const [newPeriodFim, setNewPeriodFim] = useState('');

  // Busca a listagem de militares da API
  const fetchMilitares = useCallback(async () => {
    try {
      const res = await api.get('/militares');
      setMilitares(res.data);
    } catch (err) {
      console.error('Erro ao buscar militares:', err);
    }
  }, []);

  // Busca os planos de férias da API
  const fetchPlanos = useCallback(async () => {
    try {
      const res = await api.get('/ferias/planos');
      setPlans(res.data);
    } catch (err) {
      console.error('Erro ao buscar planos de férias:', err);
    }
  }, []);

  // Comentário de organização: Busca a lista de períodos de férias cadastrados no banco de dados e ordena do mais novo para o mais velho
  const fetchPeriodos = useCallback(async () => {
    try {
      const res = await api.get('/ferias/periodos');
      const mapped = res.data.map((p: any) => ({
        id: p.Id,
        nome: p.Nome_Periodo,
        dataInicio: p.data_inicio,
        dataFim: p.data_fim
      }));
      // Ordenar por data de início decrescente
      mapped.sort((a: any, b: any) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime());
      setPeriods(mapped);
    } catch (err: any) {
      console.error('Erro ao buscar periodos:', err);
      setPeriodError('Não foi possível carregar os períodos de férias do banco.');
    }
  }, []);

  // Opções de P/G ordenadas hierarquicamente
  const pgOptions = Array.from(new Set(militares.map(m => m.posto).filter(Boolean)))
    .sort((a, b) => {
      const idxA = PG_ORDER.indexOf(a);
      const idxB = PG_ORDER.indexOf(b);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });

  // Opções de P/G filtradas para exibição no filtro (apenas postos/graduações que possuem plano cadastrado)
  const pgOptionsFilter = React.useMemo(() => {
    const pgs = new Set<string>();
    plans.forEach(p => {
      const mil = militares.find(m => m.id === p.militarId);
      if (mil && mil.posto) {
        pgs.add(mil.posto);
      }
    });
    return Array.from(pgs).sort((a, b) => {
      const idxA = PG_ORDER.indexOf(a);
      const idxB = PG_ORDER.indexOf(b);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
  }, [plans, militares]);

  // Opções de Períodos existentes no banco de dados para exibição no filtro
  const periodsFilterOptions = React.useMemo(() => {
    return periods;
  }, [periods]);

  // Lista filtrada de militares com base no P/G selecionado
  const filteredMilitaresForSelect = selectedPG
    ? militares.filter(m => m.posto === selectedPG)
    : militares;

  useEffect(() => {
    fetchPeriodos();
    fetchMilitares();
    fetchPlanos();
  }, [fetchPeriodos, fetchMilitares, fetchPlanos]);

  // Gerencia alteração no autocomplete de militar para setar o ID correto e preenchimento automático do P/G
  const handleMilitarChange = (val: string) => {
    setNomeMilitar(val);
    const normalizedVal = normalizeText(val);
    const found = militares.find(m => 
      normalizeText(`${m.posto} ${m.nome}`) === normalizedVal || 
      normalizeText(m.nome) === normalizedVal
    );
    if (found) {
      setMilitarId(found.id);
      if (!selectedPG || selectedPG !== found.posto) {
        setSelectedPG(found.posto);
      }
    } else {
      setMilitarId(null);
    }
  };

  // Gerencia alteração no dropdown de P/G
  const handlePGChange = (pg: string) => {
    setSelectedPG(pg);
    if (militarId) {
      const selectedMilitar = militares.find(m => m.id === militarId);
      if (selectedMilitar && selectedMilitar.posto !== pg) {
        setMilitarId(null);
        setNomeMilitar('');
      }
    }
  };

  // Reseta todos os estados do formulário do plano
  const resetForm = useCallback(() => {
    setEditingPlanId(null);
    setNomeMilitar('');
    setMilitarId(null);
    setStatus('Pendente');
    setObs('');
    setSelectedPG('');
    setShowMilitarSuggestions(false);
    setNumParcelas(1);
    setParcelaPeriodos(['']);
    setAnoReferencia(String(new Date().getFullYear()));
    setShowYearScroll(false);
    setShowStatusScroll(false);
    setShowPGScroll(false);
    setShowParcelasScroll(false);
    setShowPeriodScrollIndex(null);
    setSavingPlan(false);
  }, []);

  // Altera a quantidade de parcelas redimensionando a lista de períodos selecionados
  const handleNumParcelasChange = (n: number) => {
    setNumParcelas(n);
    const newPeriodos = [...parcelaPeriodos];
    if (newPeriodos.length < n) {
      while (newPeriodos.length < n) newPeriodos.push('');
    } else if (newPeriodos.length > n) {
      newPeriodos.splice(n);
    }
    setParcelaPeriodos(newPeriodos);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingPlan) return;
    
    if (!militarId) {
      alert('Por favor, selecione um militar válido da lista de sugestões.');
      return;
    }

    if (parcelaPeriodos.some(p => !p)) {
      alert('Por favor, selecione os períodos para todas as parcelas.');
      return;
    }

    // 1. Um militar não pode ter dois planos de férias com o mesmo ano de referência
    const anoRefNum = Number(anoReferencia);
    const jaPossuiPlanoNoAno = plans.some(
      p => p.militarId === militarId && p.id !== editingPlanId && Number(p.anoReferencia) === anoRefNum
    );
    if (jaPossuiPlanoNoAno) {
      alert(`Erro: Este militar já possui um plano de férias cadastrado para o ano ${anoReferencia}.`);
      return;
    }

    // 2. Se o militar colocou um período em um plano, ele não pode selecionar para outros planos
    const selectedPeriodIds = parcelaPeriodos.map(Number);
    const planosDoMesmoMilitar = plans.filter(p => p.militarId === militarId && p.id !== editingPlanId);
    
    const periodosUsados: number[] = [];
    planosDoMesmoMilitar.forEach(p => {
      if (Array.isArray(p.periodoIdList)) {
        p.periodoIdList.forEach(id => {
          if (id) periodosUsados.push(Number(id));
        });
      } else if (p.periodoId) {
        periodosUsados.push(Number(p.periodoId));
      }
    });

    const periodoDuplicado = selectedPeriodIds.find(id => periodosUsados.includes(id));
    if (periodoDuplicado) {
      const periodName = periods.find(pr => pr.id === periodoDuplicado)?.nome || `ID ${periodoDuplicado}`;
      alert(`Erro: O período "${periodName}" já foi selecionado em outro plano de férias deste militar.`);
      return;
    }

    try {
      setSavingPlan(true);
      const payload = {
        militarId,
        periodoIds: selectedPeriodIds,
        parcelas: numParcelas,
        status,
        obs,
        anoReferencia: anoRefNum
      };

      if (editingPlanId) {
        await api.put(`/ferias/planos/${editingPlanId}`, payload);
      } else {
        await api.post('/ferias/planos', payload);
      }

      setIsModalOpen(false);
      fetchPlanos();
      resetForm();
    } catch (err: any) {
      console.error('Erro ao salvar plano de férias:', err);
      alert('Não foi possível salvar o plano de férias.');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleEdit = (row: any) => {
    setEditingPlanId(row.id);
    setMilitarId(row.militarId);
    
    const foundMilitar = militares.find(m => m.id === row.militarId);
    if (foundMilitar) {
      setNomeMilitar(`${foundMilitar.posto} ${foundMilitar.nome}`);
      setSelectedPG(foundMilitar.posto);
    } else {
      setNomeMilitar(row.nomeMilitar);
      setSelectedPG('');
    }

    const currentParcelas = Number(row.parcelas || row.periodoIdList?.length || 1);
    setNumParcelas(currentParcelas);

    const currentPeriodIds = row.periodoIdList?.map(String) || [];
    while (currentPeriodIds.length < currentParcelas) {
      currentPeriodIds.push('');
    }
    setParcelaPeriodos(currentPeriodIds);

    setStatus(row.status);
    setObs(row.obs);
    setAnoReferencia(String(row.anoReferencia || new Date().getFullYear()));
    setShowYearScroll(false);
    setShowStatusScroll(false);
    setShowPGScroll(false);
    setShowParcelasScroll(false);
    setShowPeriodScrollIndex(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeletePlanError(null);
    setDeletePlanTarget(id);
  };

  const handleConfirmDeletePlan = async () => {
    if (deletePlanTarget === null) return;
    setIsDeletingPlan(true);
    setDeletePlanError(null);
    try {
      await api.delete(`/ferias/planos/${deletePlanTarget}`);
      fetchPlanos();
      setDeletePlanTarget(null);
    } catch (err: any) {
      console.error('Erro ao excluir plano:', err);
      setDeletePlanError(err.response?.data?.error || 'Não foi possível excluir o plano de férias.');
    } finally {
      setIsDeletingPlan(false);
    }
  };

  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingPeriod) return;

    const missingFields: string[] = [];
    if (!newPeriodNome.trim()) missingFields.push('Nome do Período');
    if (!newPeriodInicio) missingFields.push('Data de Início');
    if (!newPeriodFim) missingFields.push('Data Fim');

    if (missingFields.length > 0) {
      setPeriodError(`Preencha todos os campos obrigatórios: ${missingFields.join(', ')}.`);
      return;
    }

    const trimmedNome = newPeriodNome.trim();
    let finalNome = trimmedNome;
    const match = trimmedNome.match(/[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/);
    if (match && match.index !== undefined) {
      const idx = match.index;
      finalNome = trimmedNome.slice(0, idx) + trimmedNome.charAt(idx).toUpperCase() + trimmedNome.slice(idx + 1);
    }

    // Validação de unicidade no frontend
    const exists = periods.some(p => normalizeText(p.nome) === normalizeText(finalNome));
    if (exists) {
      setPeriodError('Já existe um período cadastrado com este nome.');
      return;
    }

    try {
      setIsSavingPeriod(true);
      setPeriodError(null);

      await api.post('/ferias/periodos', {
        Nome_Periodo: finalNome,
        data_inicio: newPeriodInicio,
        data_fim: newPeriodFim
      });

      setNewPeriodNome('');
      setNewPeriodInicio('');
      setNewPeriodFim('');
      fetchPeriodos();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error || 'Erro ao salvar o período de férias no banco.';
      setPeriodError(msg);
    } finally {
      setIsSavingPeriod(false);
    }
  };

  const handleDeletePeriod = (id: number) => {
    setDeletePeriodError(null);
    setDeletePeriodTarget(id);
  };

  const handleConfirmDeletePeriod = async () => {
    if (deletePeriodTarget === null) return;

    // Validação local: impede exclusão se o período estiver em uso por algum plano
    const isPeriodUsed = plans.some(p => p.periodoIdList?.includes(deletePeriodTarget) || p.periodoId === deletePeriodTarget);
    if (isPeriodUsed) {
      setDeletePeriodError('Este período não pode ser excluído pois está associado a um ou mais planos de férias ativos.');
      return;
    }

    setIsDeletingPeriod(true);
    setDeletePeriodError(null);
    try {
      await api.delete(`/ferias/periodos/${deletePeriodTarget}`);
      fetchPeriodos();
      setDeletePeriodTarget(null);
    } catch (err: any) {
      console.error(err);
      setDeletePeriodError(err.response?.data?.error || 'Não foi possível excluir o período de férias.');
    } finally {
      setIsDeletingPeriod(false);
    }
  };

  const sortOptionsList = React.useMemo(() => [
    { val: 'pg-asc', label: 'P/G (Hierarquia)' },
    { val: 'nome-asc', label: 'Nome (A-Z)' },
    { val: 'nome-desc', label: 'Nome (Z-A)' },
    { val: 'ano-desc', label: 'Ano Ref. (Recente)' },
    { val: 'ano-asc', label: 'Ano Ref. (Antigo)' },
    { val: 'periodo-asc', label: 'Data Período (Próximo)' },
    { val: 'status-asc', label: 'Status (A-Z)' }
  ], []);

  // Extrai dinamicamente todos os status únicos presentes na lista vinda do banco
  const uniqueStatuses = React.useMemo(() => {
    const statuses = new Set<string>();
    plans.forEach(p => {
      if (p.status) statuses.add(p.status);
    });
    return ['Todos', ...Array.from(statuses)];
  }, [plans]);

  // Extrai dinamicamente todos os anos de referência presentes na lista vinda do banco
  const uniqueYears = React.useMemo(() => {
    const years = new Set<string>();
    plans.forEach(p => {
      if (p.anoReferencia) years.add(String(p.anoReferencia));
    });
    return ['Todos', ...Array.from(years).sort((a, b) => Number(b) - Number(a))];
  }, [plans]);

  const filteredPlans = plans.filter(p => {
    // Primeiro filtra por status se selecionado
    if (statusFilter !== 'Todos' && p.status !== statusFilter) {
      return false;
    }

    // Filtro por P/G (Posto/Graduação)
    if (pgFilter !== 'Todos') {
      const mil = militares.find(m => m.id === p.militarId);
      if (!mil || mil.posto !== pgFilter) return false;
    }

    // Filtro por Ano de Referência
    if (yearFilter !== 'Todos' && String(p.anoReferencia) !== yearFilter) {
      return false;
    }

    // Filtro por Quantidade de Parcelas
    if (parcelasFilter !== 'Todos' && String(p.parcelas) !== parcelasFilter) {
      return false;
    }

    // Filtro por Período
    if (periodFilter !== 'Todos' && (!p.periodoIdList || !p.periodoIdList.includes(Number(periodFilter)))) {
      return false;
    }

    if (!searchTerm.trim()) return true;

    const term = normalizeText(searchTerm);

    // Busca o militar correspondente no estado local
    const mil = militares.find(m => m.id === p.militarId);

    // Verifica o nomeMilitar do plano (nome de guerra associado)
    if (normalizeText(p.nomeMilitar).includes(term)) return true;

    // Se encontrou o militar, pesquisa pelos seus outros campos detalhados
    if (mil) {
      if (mil.nome && normalizeText(mil.nome).includes(term)) return true;
      if (mil.nome_completo && normalizeText(mil.nome_completo).includes(term)) return true;
      if (mil.nome_guerra && normalizeText(mil.nome_guerra).includes(term)) return true;
      if (mil.posto && normalizeText(mil.posto).includes(term)) return true;
      
      const combined = normalizeText(`${mil.posto} ${mil.nome}`);
      if (combined.includes(term)) return true;
    }

    return false;
  });

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('Todos');
    setPgFilter('Todos');
    setYearFilter('Todos');
    setParcelasFilter('Todos');
    setPeriodFilter('Todos');
  };

  const activeFiltersCount = 
    (statusFilter !== 'Todos' ? 1 : 0) +
    (pgFilter !== 'Todos' ? 1 : 0) +
    (yearFilter !== 'Todos' ? 1 : 0) +
    (parcelasFilter !== 'Todos' ? 1 : 0) +
    (periodFilter !== 'Todos' ? 1 : 0);

  // Ordena os planos de férias de acordo com a opção selecionada
  const sortedPlans = React.useMemo(() => {
    const plansCopy = [...filteredPlans];
    
    plansCopy.sort((a, b) => {
      const milA = militares.find(m => m.id === a.militarId);
      const milB = militares.find(m => m.id === b.militarId);
      
      switch (sortOption) {
        case 'pg-asc': {
          const idxA = milA ? PG_ORDER.indexOf(milA.posto) : 999;
          const idxB = milB ? PG_ORDER.indexOf(milB.posto) : 999;
          return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
        }
        case 'nome-asc': {
          const nameA = milA?.nome || a.nomeMilitar;
          const nameB = milB?.nome || b.nomeMilitar;
          return nameA.localeCompare(nameB);
        }
        case 'nome-desc': {
          const nameA = milA?.nome || a.nomeMilitar;
          const nameB = milB?.nome || b.nomeMilitar;
          return nameB.localeCompare(nameA);
        }
        case 'ano-desc': {
          return (b.anoReferencia || 0) - (a.anoReferencia || 0);
        }
        case 'ano-asc': {
          return (a.anoReferencia || 0) - (b.anoReferencia || 0);
        }
        case 'periodo-asc': {
          const getEarliestDate = (row: VacationPlan) => {
            if (!row.periodoIdList || row.periodoIdList.length === 0) return Infinity;
            const dates = row.periodoIdList
              .map(id => periods.find(p => p.id === id))
              .filter((p): p is VacationPeriod => !!p)
              .map(p => new Date(p.dataInicio).getTime());
            return dates.length > 0 ? Math.min(...dates) : Infinity;
          };
          return getEarliestDate(a) - getEarliestDate(b);
        }
        case 'status-asc': {
          return a.status.localeCompare(b.status);
        }
        default:
          return 0;
      }
    });

    return plansCopy;
  }, [filteredPlans, sortOption, militares, periods]);

  // Função para retornar o período inteligente conforme regra de negócio:
  // Mostra o mais próximo que ainda não acabou. Se todos já aconteceram, mostra o último ocorrido.
  const getDisplayPeriod = (row: VacationPlan): string => {
    if (!row.periodoIdList || row.periodoIdList.length === 0) {
      return 'Sem período';
    }

    const planPeriods = row.periodoIdList
      .map(id => periods.find(p => p.id === id))
      .filter((p): p is VacationPeriod => !!p);

    if (planPeriods.length === 0) {
      return 'Sem período';
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Filtra períodos futuros ou em andamento (dataFim >= hoje)
    const upcomingPeriods = planPeriods.filter(p => {
      const dataFim = new Date(p.dataFim);
      dataFim.setHours(23, 59, 59, 999);
      return dataFim >= hoje;
    });

    if (upcomingPeriods.length > 0) {
      // Ordena de forma crescente pela dataInicio (mais próximo do presente)
      upcomingPeriods.sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());
      const closest = upcomingPeriods[0];
      return `${closest.nome} (${formatToMockDate(closest.dataInicio)} a ${formatToMockDate(closest.dataFim)})`;
    }

    // Se todos já passaram, ordena de forma decrescente e pega o mais recente no passado
    planPeriods.sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime());
    const last = planPeriods[0];
    return `${last.nome} (${formatToMockDate(last.dataInicio)} a ${formatToMockDate(last.dataFim)})`;
  };

  // Renderizador para a linha expandida de detalhes adicionais das parcelas e observação (estética premium)
  const renderExpandedRow = (row: VacationPlan) => {
    const planPeriods = (row.periodoIdList || [])
      .map(id => periods.find(p => p.id === id))
      .filter((p): p is VacationPeriod => !!p);

    return (
      <div className="p-4 bg-gray-50/60 rounded-xl border border-gray-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Detalhamento dos Períodos</h4>
            {planPeriods.length === 0 ? (
              <span className="text-sm text-gray-500">Nenhum período vinculado</span>
            ) : (
              <div className="space-y-2">
                {planPeriods.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-militar-light/10 text-militar-main font-bold text-xs">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="block text-sm font-semibold text-gray-800">{p.nome}</span>
                        <span className="block text-xs text-gray-500 font-medium">
                          {formatToMockDate(p.dataInicio)} até {formatToMockDate(p.dataFim)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {row.parcelas === 1 ? '30 dias' : row.parcelas === 2 ? '15 dias' : '10 dias'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Informações Adicionais</h4>
              <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-medium">Quantidade de Parcelas:</span>
                  <strong className="text-gray-900">{row.parcelas} {row.parcelas === 1 ? 'parcela' : 'parcelas'}</strong>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-medium">Ano de Referência:</span>
                  <strong className="text-gray-900">{row.anoReferencia || '-'}</strong>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Observações (Obs)</h4>
              <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm min-h-[60px]">
                <p className="text-sm text-gray-700 whitespace-pre-line">{row.obs || 'Nenhuma observação cadastrada.'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const columns: any[] = [
    { 
      header: 'P/G Nome de guerra', 
      accessor: (row: VacationPlan) => {
        const mil = militares.find(m => m.id === row.militarId);
        if (mil) {
          return `${mil.posto} ${mil.nome_guerra || mil.nome}`;
        }
        return row.nomeMilitar;
      }
    },
    { 
      header: 'Período', 
      accessor: (row: VacationPlan) => getDisplayPeriod(row)
    },
    {
      header: 'Ano Ref.',
      accessor: (row: VacationPlan) => row.anoReferencia || '-'
    },
    {
      header: 'Status',
      accessor: (row: VacationPlan) => {
        let variant: any = 'default';
        if (row.status === 'Ok' || row.status.includes('ok') || row.status === 'OK' || row.status.includes('OK') || row.status.includes('Parcela OK')) variant = 'success';
        if (row.status === 'Pendente') variant = 'warning';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      header: 'Ações',
      accessor: (row: VacationPlan) => (
        <div className="flex gap-2 text-gray-400" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => handleEdit(row)}
            className="p-1 hover:text-militar-main transition-colors border border-gray-200 rounded"
          >
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
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-filters {
          animation: fadeIn 0.12s ease-in-out forwards;
          overflow: visible;
        }
        .hover-scale {
          transition: opacity 0.15s ease;
        }
        .hover-scale:hover {
          opacity: 0.9;
        }
        .hover-scale:active {
          opacity: 0.8;
        }
        .interactive-select {
          transition: all 0.15s ease;
        }
        .interactive-select:hover {
          border-color: #1F7A45;
        }
      `}} />
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Plano de Férias</h1>
          <Breadcrumb items={[{ label: 'Gestão de Pessoas' }, { label: 'Plano de Férias' }]} />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsConfigModalOpen(true)} variant="outline" icon={<Edit2 size={16} />} className="hover-scale">
            Configurar Períodos
          </Button>
          <Button onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }} icon={<Plus size={16} />} className="hover-scale">
            Novo Plano
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
        {/* Main Search Bar */}
        <div className="flex gap-4 items-center mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Buscar militar por nome, posto ou nome de guerra..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-72 flex items-center gap-2 relative">
            <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">Ordenar por:</label>
            <div className="relative flex-1">
              <Input
                readOnly
                value={sortOptionsList.find(o => o.val === sortOption)?.label || ''}
                onClick={() => {
                  const nextState = !showSortOptionScroll;
                  closeAllSelectsExcept(nextState ? 'sortOption' : undefined);
                  setShowSortOptionScroll(nextState);
                }}
                onFocus={() => {
                  closeAllSelectsExcept('sortOption');
                  setShowSortOptionScroll(true);
                }}
                className="cursor-pointer pr-8 py-1.5 text-sm interactive-select"
              />
              <div className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-[10px] transition-transform duration-200 ${showSortOptionScroll ? 'rotate-180' : ''}`}>
                ▼
              </div>
            </div>
            {showSortOptionScroll && (
              <>
                <div className="fixed inset-0 z-[900]" onClick={() => setShowSortOptionScroll(false)} />
                <div className="absolute top-[100%] right-0 z-[1000] w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                  {sortOptionsList.map((item) => {
                    const isSelected = sortOption === item.val;
                    return (
                      <div
                        key={item.val}
                        onClick={() => {
                          setSortOption(item.val);
                          setShowSortOptionScroll(false);
                        }}
                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                          isSelected ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                        }`}
                      >
                        <span>{item.label}</span>
                        {isSelected && <span className="text-militar-main text-xs">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          <Button 
            onClick={() => setShowFiltersCard(!showFiltersCard)} 
            variant={showFiltersCard || activeFiltersCount > 0 ? "primary" : "outline"} 
            icon={<Search size={16} />}
            className="hover-scale"
          >
            Filtrar {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>
          {activeFiltersCount > 0 && (
            <Button onClick={handleClearFilters} variant="ghost" size="sm" className="text-gray-500 hover:text-red-500 font-semibold hover-scale">
              Limpar Filtros
            </Button>
          )}
        </div>

        {/* Expandable Filter Card */}
        {showFiltersCard && (
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 mb-6 animate-filters">
            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">P/G (Posto/Graduação)</label>
              <div className="relative">
                <Input
                  readOnly
                  value={pgFilter}
                  onClick={() => {
                    const nextState = !showPgFilterScroll;
                    closeAllSelectsExcept(nextState ? 'pgFilter' : undefined);
                    setShowPgFilterScroll(nextState);
                  }}
                  onFocus={() => {
                    closeAllSelectsExcept('pgFilter');
                    setShowPgFilterScroll(true);
                  }}
                  className="cursor-pointer pr-8 text-sm interactive-select"
                />
                <div className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-[10px] transition-transform duration-200 ${showPgFilterScroll ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </div>
              {showPgFilterScroll && (
                <>
                  <div className="fixed inset-0 z-[900]" onClick={() => setShowPgFilterScroll(false)} />
                  <div className="absolute z-[1000] w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div
                      onClick={() => {
                        setPgFilter('Todos');
                        setShowPgFilterScroll(false);
                      }}
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                        pgFilter === 'Todos' ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                      }`}
                    >
                      <span>Todos</span>
                      {pgFilter === 'Todos' && <span className="text-militar-main text-xs">✓</span>}
                    </div>
                    {pgOptionsFilter.map((pg) => {
                      const isSelected = pgFilter === pg;
                      return (
                        <div
                          key={pg}
                          onClick={() => {
                            setPgFilter(pg);
                            setShowPgFilterScroll(false);
                          }}
                          className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                            isSelected ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                          }`}
                        >
                          <span>{pg}</span>
                          {isSelected && <span className="text-militar-main text-xs">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            
            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
              <div className="relative">
                <Input
                  readOnly
                  value={statusFilter}
                  onClick={() => {
                    const nextState = !showStatusFilterScroll;
                    closeAllSelectsExcept(nextState ? 'statusFilter' : undefined);
                    setShowStatusFilterScroll(nextState);
                  }}
                  onFocus={() => {
                    closeAllSelectsExcept('statusFilter');
                    setShowStatusFilterScroll(true);
                  }}
                  className="cursor-pointer pr-8 text-sm interactive-select"
                />
                <div className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-[10px] transition-transform duration-200 ${showStatusFilterScroll ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </div>
              {showStatusFilterScroll && (
                <>
                  <div className="fixed inset-0 z-[900]" onClick={() => setShowStatusFilterScroll(false)} />
                  <div className="absolute z-[1000] w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                    {uniqueStatuses.map((st) => {
                      const isSelected = statusFilter === st;
                      return (
                        <div
                          key={st}
                          onClick={() => {
                            setStatusFilter(st);
                            setShowStatusFilterScroll(false);
                          }}
                          className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                            isSelected ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                          }`}
                        >
                          <span>{st}</span>
                          {isSelected && <span className="text-militar-main text-xs">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Ano Referência</label>
              <div className="relative">
                <Input
                  readOnly
                  value={yearFilter}
                  onClick={() => {
                    const nextState = !showYearFilterScroll;
                    closeAllSelectsExcept(nextState ? 'yearFilter' : undefined);
                    setShowYearFilterScroll(nextState);
                  }}
                  onFocus={() => {
                    closeAllSelectsExcept('yearFilter');
                    setShowYearFilterScroll(true);
                  }}
                  className="cursor-pointer pr-8 text-sm interactive-select"
                />
                <div className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-[10px] transition-transform duration-200 ${showYearFilterScroll ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </div>
              {showYearFilterScroll && (
                <>
                  <div className="fixed inset-0 z-[900]" onClick={() => setShowYearFilterScroll(false)} />
                  <div className="absolute z-[1000] w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                    {uniqueYears.map((yr) => {
                      const isSelected = yearFilter === yr;
                      return (
                        <div
                          key={yr}
                          onClick={() => {
                            setYearFilter(yr);
                            setShowYearFilterScroll(false);
                          }}
                          className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                            isSelected ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                          }`}
                        >
                          <span>{yr}</span>
                          {isSelected && <span className="text-militar-main text-xs">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Parcelas</label>
              <div className="relative">
                <Input
                  readOnly
                  value={
                    parcelasFilter === 'Todos' ? 'Todos' :
                    parcelasFilter === '1' ? '1 parcela (30 dias)' :
                    parcelasFilter === '2' ? '2 parcelas (15 dias)' :
                    '3 parcelas (10 dias)'
                  }
                  onClick={() => {
                    const nextState = !showParcelasFilterScroll;
                    closeAllSelectsExcept(nextState ? 'parcelasFilter' : undefined);
                    setShowParcelasFilterScroll(nextState);
                  }}
                  onFocus={() => {
                    closeAllSelectsExcept('parcelasFilter');
                    setShowParcelasFilterScroll(true);
                  }}
                  className="cursor-pointer pr-8 text-sm interactive-select"
                />
                <div className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-[10px] transition-transform duration-200 ${showParcelasFilterScroll ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </div>
              {showParcelasFilterScroll && (
                <>
                  <div className="fixed inset-0 z-[900]" onClick={() => setShowParcelasFilterScroll(false)} />
                  <div className="absolute z-[1000] w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                    {[
                      { val: 'Todos', label: 'Todos' },
                      { val: '1', label: '1 parcela (30 dias)' },
                      { val: '2', label: '2 parcelas (15 dias)' },
                      { val: '3', label: '3 parcelas (10 dias)' }
                    ].map((item) => {
                      const isSelected = parcelasFilter === item.val;
                      return (
                        <div
                          key={item.val}
                          onClick={() => {
                            setParcelasFilter(item.val);
                            setShowParcelasFilterScroll(false);
                          }}
                          className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                            isSelected ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                          }`}
                        >
                          <span>{item.label}</span>
                          {isSelected && <span className="text-militar-main text-xs">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Período de Férias</label>
              <div className="relative">
                <Input
                  readOnly
                  value={
                    periodFilter === 'Todos' ? 'Todos' :
                    (() => {
                      const found = periodsFilterOptions.find(p => String(p.id) === periodFilter);
                      return found ? `${found.nome} (${formatToMockDate(found.dataInicio)})` : 'Todos';
                    })()
                  }
                  onClick={() => {
                    const nextState = !showPeriodFilterScroll;
                    closeAllSelectsExcept(nextState ? 'periodFilter' : undefined);
                    setShowPeriodFilterScroll(nextState);
                  }}
                  onFocus={() => {
                    closeAllSelectsExcept('periodFilter');
                    setShowPeriodFilterScroll(true);
                  }}
                  className="cursor-pointer pr-8 text-sm interactive-select"
                />
                <div className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-[10px] transition-transform duration-200 ${showPeriodFilterScroll ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </div>
              {showPeriodFilterScroll && (
                <>
                  <div className="fixed inset-0 z-[900]" onClick={() => setShowPeriodFilterScroll(false)} />
                  <div className="absolute z-[1000] w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div
                      onClick={() => {
                        setPeriodFilter('Todos');
                        setShowPeriodFilterScroll(false);
                      }}
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                        periodFilter === 'Todos' ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                      }`}
                    >
                      <span>Todos</span>
                      {periodFilter === 'Todos' && <span className="text-militar-main text-xs">✓</span>}
                    </div>
                    {periodsFilterOptions.map((p) => {
                      const isSelected = periodFilter === String(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setPeriodFilter(String(p.id));
                            setShowPeriodFilterScroll(false);
                          }}
                          className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                            isSelected ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                          }`}
                        >
                          <span>{p.nome} ({formatToMockDate(p.dataInicio)})</span>
                          {isSelected && <span className="text-militar-main text-xs">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
           <span className="text-sm text-gray-600">Total de <strong className="text-gray-900">{filteredPlans.length}</strong> planos encontrados</span>
        </div>

        {/* Table */}
        <DataTable 
          columns={columns}
          data={sortedPlans}
          keyExtractor={(row) => row.id}
          renderExpandedRow={renderExpandedRow}
        />
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingPlanId ? "Editar Plano de Férias" : "Cadastrar Plano de Férias"}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                P/G
              </label>
              <div className="relative">
                <Input
                  readOnly
                  value={selectedPG || 'Todos'}
                  onClick={() => {
                    const nextState = !showPGScroll;
                    closeAllSelectsExcept(nextState ? 'pg' : undefined);
                    setShowPGScroll(nextState);
                  }}
                  onFocus={() => {
                    closeAllSelectsExcept('pg');
                    setShowPGScroll(true);
                  }}
                  className="cursor-pointer pr-10 interactive-select"
                />
                <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs transition-transform duration-200 ${showPGScroll ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </div>
              {showPGScroll && (
                <>
                  <div className="fixed inset-0 z-[900]" onClick={() => setShowPGScroll(false)} />
                  <div className="absolute z-[1000] w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div
                      onClick={() => {
                        handlePGChange('');
                        setShowPGScroll(false);
                      }}
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                        selectedPG === '' ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                      }`}
                    >
                      <span>Todos</span>
                      {selectedPG === '' && <span className="text-militar-main text-xs">✓</span>}
                    </div>
                    {pgOptions.map((pg) => {
                      const isSelected = selectedPG === pg;
                      return (
                        <div
                          key={pg}
                          onClick={() => {
                            handlePGChange(pg);
                            setShowPGScroll(false);
                          }}
                          className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                            isSelected ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                          }`}
                        >
                          <span>{pg}</span>
                          {isSelected && <span className="text-militar-main text-xs">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            
            <div className="col-span-2 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Militar
              </label>
              <Input 
                required
                placeholder="Digite para buscar..."
                value={nomeMilitar}
                onChange={(e) => {
                  handleMilitarChange(e.target.value);
                  setShowMilitarSuggestions(true);
                }}
                onFocus={() => {
                  closeAllSelectsExcept('militar');
                  setShowMilitarSuggestions(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowMilitarSuggestions(false), 250);
                }}
              />
              {showMilitarSuggestions && (
                <div className="absolute z-[1000] w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                  {filteredMilitaresForSelect
                    .filter(m => {
                      const search = normalizeText(nomeMilitar);
                      return normalizeText(`${m.posto} ${m.nome}`).includes(search) ||
                        (m.nome_completo && normalizeText(m.nome_completo).includes(search)) ||
                        (m.nome_guerra && normalizeText(m.nome_guerra).includes(search));
                    })
                    .map(m => (
                      <div
                        key={m.id}
                        onMouseDown={() => {
                          handleMilitarChange(`${m.posto} ${m.nome}`);
                          setMilitarId(m.id);
                          setSelectedPG(m.posto);
                          setShowMilitarSuggestions(false);
                        }}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center"
                      >
                        <span>
                          <span className="text-gray-400 mr-2 text-xs font-semibold uppercase">{m.posto}</span>
                          {renderMilitarName(m)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parcelas
            </label>
            <div className="relative">
              <Input
                readOnly
                value={numParcelas === 1 ? '1 Parcela (30 dias)' : numParcelas === 2 ? '2 Parcelas (15 + 15 dias)' : '3 Parcelas (10 + 10 + 10 dias)'}
                onClick={() => {
                  const nextState = !showParcelasScroll;
                  closeAllSelectsExcept(nextState ? 'parcelas' : undefined);
                  setShowParcelasScroll(nextState);
                }}
                onFocus={() => {
                  closeAllSelectsExcept('parcelas');
                  setShowParcelasScroll(true);
                }}
                className="cursor-pointer pr-10 interactive-select"
              />
              <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs transition-transform duration-200 ${showParcelasScroll ? 'rotate-180' : ''}`}>
                ▼
              </div>
            </div>
            {showParcelasScroll && (
              <>
                <div className="fixed inset-0 z-[900]" onClick={() => setShowParcelasScroll(false)} />
                <div className="absolute z-[1000] w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                  {[
                    { val: 1, label: '1 Parcela (30 dias)' },
                    { val: 2, label: '2 Parcelas (15 + 15 dias)' },
                    { val: 3, label: '3 Parcelas (10 + 10 + 10 dias)' }
                  ].map((item) => {
                    const isSelected = numParcelas === item.val;
                    return (
                      <div
                        key={item.val}
                        onClick={() => {
                          handleNumParcelasChange(item.val);
                          setShowParcelasScroll(false);
                        }}
                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                          isSelected ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                        }`}
                      >
                        <span>{item.label}</span>
                        {isSelected && <span className="text-militar-main text-xs">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
            {parcelaPeriodos.map((pId, index) => {
              const diasPorParcela = numParcelas === 1 ? 30 : numParcelas === 2 ? 15 : 10;
              const suffix = index === 0 ? '1ª' : index === 1 ? '2ª' : '3ª';
              
              // Filtra os períodos impedindo selecionar o mesmo em inputs diferentes
              const availablePeriods = periods.filter(p => {
                return pId === String(p.id) || !parcelaPeriodos.includes(String(p.id));
              });

              return (
                <div key={index} className="grid grid-cols-4 gap-4 items-end">
                  <div className="col-span-3 relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Período {suffix} Parcela
                    </label>
                    <div className="relative">
                      <Input
                        readOnly
                        value={pId ? (() => {
                          const found = periods.find(p => String(p.id) === pId);
                          return found ? `${found.nome} (${formatToMockDate(found.dataInicio)} a ${formatToMockDate(found.dataFim)})` : 'Selecione um período';
                        })() : 'Selecione um período'}
                        onClick={() => {
                          const nextState = showPeriodScrollIndex !== index;
                          closeAllSelectsExcept(nextState ? 'period' : undefined, nextState ? index : undefined);
                          setShowPeriodScrollIndex(nextState ? index : null);
                        }}
                        onFocus={() => {
                          closeAllSelectsExcept('period', index);
                          setShowPeriodScrollIndex(index);
                        }}
                        className="cursor-pointer pr-10 interactive-select"
                        required
                      />
                      <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs transition-transform duration-200 ${showPeriodScrollIndex === index ? 'rotate-180' : ''}`}>
                        ▼
                      </div>
                    </div>
                    {showPeriodScrollIndex === index && (
                      <>
                        <div className="fixed inset-0 z-[900]" onClick={() => setShowPeriodScrollIndex(null)} />
                        <div className="absolute z-[1000] w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                          {availablePeriods.map(p => {
                            const periodString = `${p.nome} (${formatToMockDate(p.dataInicio)} a ${formatToMockDate(p.dataFim)})`;
                            const isSelected = pId === String(p.id);
                            return (
                              <div
                                key={p.id}
                                onClick={() => {
                                  const updated = [...parcelaPeriodos];
                                  updated[index] = String(p.id);
                                  setParcelaPeriodos(updated);
                                  setShowPeriodScrollIndex(null);
                                }}
                                className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                                  isSelected ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                                }`}
                              >
                                <span>{periodString}</span>
                                {isSelected && <span className="text-militar-main text-xs">✓</span>}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dias
                    </label>
                    <Input
                      readOnly
                      value={`${diasPorParcela} dias`}
                      className="bg-gray-100 font-semibold text-center text-gray-700"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ano de Referência
              </label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="Ex: 2026"
                  value={anoReferencia}
                  onChange={(e) => setAnoReferencia(e.target.value)}
                  onFocus={() => {
                    closeAllSelectsExcept('year');
                    setShowYearScroll(true);
                  }}
                  className="pr-10 interactive-select"
                  required
                />
                <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs transition-transform duration-200 ${showYearScroll ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </div>
              {showYearScroll && (
                <>
                  <div className="fixed inset-0 z-[900]" onClick={() => setShowYearScroll(false)} />
                  <div className="absolute top-[100%] left-0 z-[1000] w-[180%] mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                    <div 
                      onWheel={(e) => {
                        if (e.deltaY !== 0) {
                          e.currentTarget.scrollLeft += e.deltaY;
                        }
                      }}
                      className="flex overflow-x-auto gap-2 py-2 px-2 bg-gray-50 rounded-md max-w-full scrollbar-thin scrollbar-thumb-gray-300"
                    >
                      {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i).map((y) => {
                        const isSelected = anoReferencia === String(y);
                        return (
                          <button
                            key={y}
                            type="button"
                            onClick={() => {
                              setAnoReferencia(String(y));
                              setShowYearScroll(false);
                            }}
                            className={`flex-shrink-0 px-4 py-1 text-base font-bold rounded-full transition-all border ${
                              isSelected
                                ? 'bg-militar-main text-white border-militar-main shadow-sm scale-105'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {y}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className="relative">
                <Input
                  readOnly
                  value={status}
                  onClick={() => {
                    const nextState = !showStatusScroll;
                    closeAllSelectsExcept(nextState ? 'status' : undefined);
                    setShowStatusScroll(nextState);
                  }}
                  onFocus={() => {
                    closeAllSelectsExcept('status');
                    setShowStatusScroll(true);
                  }}
                  className="cursor-pointer pr-10 interactive-select"
                />
                <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs transition-transform duration-200 ${showStatusScroll ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </div>

              {showStatusScroll && (
                <>
                  <div className="fixed inset-0 z-[900]" onClick={() => setShowStatusScroll(false)} />
                  <div className="absolute top-[100%] right-0 z-[1000] w-[180%] mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                    <div 
                      onWheel={(e) => {
                        if (e.deltaY !== 0) {
                          e.currentTarget.scrollLeft += e.deltaY;
                        }
                      }}
                      className="flex overflow-x-auto gap-2 py-2 px-2 bg-gray-50 rounded-md max-w-full scrollbar-thin scrollbar-thumb-gray-300"
                    >
                      {[
                        { val: 'Pendente', label: 'Pendente', activeClass: 'bg-amber-500 text-white border-amber-500 scale-105 shadow-sm', inactiveClass: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
                        { val: '1ª Parcela OK', label: '1ª Parcela OK', activeClass: 'bg-emerald-200 text-emerald-800 border-emerald-300 scale-105 shadow-sm', inactiveClass: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' },
                        { val: '2ª Parcela OK', label: '2ª Parcela OK', activeClass: 'bg-emerald-400 text-white border-emerald-400 scale-105 shadow-sm', inactiveClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
                        { val: '3ª Parcela OK', label: '3ª Parcela OK', activeClass: 'bg-emerald-600 text-white border-emerald-600 scale-105 shadow-sm', inactiveClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' },
                        { val: 'OK', label: 'OK', activeClass: 'bg-emerald-800 text-white border-emerald-800 scale-105 shadow-sm', inactiveClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200' },
                      ].map((item) => {
                        const isSelected = status === item.val;
                        return (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => {
                              setStatus(item.val);
                              setShowStatusScroll(false);
                            }}
                            className={`flex-shrink-0 px-4 py-1 text-sm font-bold rounded-full transition-all border ${
                              isSelected ? item.activeClass : item.inactiveClass
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
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
            <Button type="submit" disabled={savingPlan}>
              {savingPlan ? 'Salvando...' : 'Salvar Plano'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Configuração de Períodos */}
      <Modal 
        isOpen={isConfigModalOpen} 
        onClose={() => setIsConfigModalOpen(false)} 
        title="Configurar Períodos de Férias"
        size="lg"
      >
        <div className="space-y-6">
          {/* Alerta de Erro no Topo da Tela/Modal */}
          {periodError && (
            <div className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              ⚠️ {periodError}
            </div>
          )}

          {/* Adicionar Novo Período */}
          <form onSubmit={handleSavePeriod} className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800">Adicionar Novo Período</h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome do Período</label>
                <Input 
                  required 
                  placeholder="Ex: 3º Período" 
                  value={newPeriodNome} 
                  onChange={e => setNewPeriodNome(e.target.value)}
                  onBlur={e => {
                    const val = e.target.value;
                    const match = val.match(/[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/);
                    if (match && match.index !== undefined) {
                      const idx = match.index;
                      const transformed = val.slice(0, idx) + val.charAt(idx).toUpperCase() + val.slice(idx + 1);
                      setNewPeriodNome(transformed);
                    }
                  }}
                  disabled={isSavingPeriod}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Data Início</label>
                  <Input type="date" required value={newPeriodInicio} onChange={e => setNewPeriodInicio(e.target.value)} disabled={isSavingPeriod} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Data Fim</label>
                  <Input type="date" required value={newPeriodFim} onChange={e => setNewPeriodFim(e.target.value)} disabled={isSavingPeriod} />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" icon={<Plus size={16} />} className="hover-scale" disabled={isSavingPeriod}>
                {isSavingPeriod ? 'Salvando...' : 'Adicionar'}
              </Button>
            </div>
          </form>

          {/* Listar Períodos Existentes */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Períodos Cadastrados</h3>
            {periods.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum período cadastrado.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto pr-2">
                <ul className="space-y-2">
                  {periods.map(p => (
                    <li key={p.id} className="flex justify-between items-center bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                      <div>
                        <span className="block text-sm font-bold text-gray-900 mb-0.5">{p.nome}</span>
                        <span className="block text-xs text-gray-500 font-medium">{formatToMockDate(p.dataInicio)} até {formatToMockDate(p.dataFim)}</span>
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
              </div>
            )}
          </div>
          
          {/* Alerta de Erro na Base da Tela/Modal */}
          {periodError && (
            <div className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              ⚠️ {periodError}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button onClick={() => setIsConfigModalOpen(false)}>
              Concluir
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação para Excluir Plano de Férias */}
      <Modal
        isOpen={deletePlanTarget !== null}
        onClose={() => !isDeletingPlan && setDeletePlanTarget(null)}
        title="Confirmar Exclusão de Plano"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <Trash2 size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800 font-medium">
              Tem certeza que deseja excluir este plano de férias permanentemente? Esta ação não pode ser desfeita.
            </p>
          </div>

          {deletePlanError && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              ⚠️ {deletePlanError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setDeletePlanTarget(null); setDeletePlanError(null); }} disabled={isDeletingPlan}>
              Cancelar
            </Button>
            <button
              onClick={handleConfirmDeletePlan}
              disabled={isDeletingPlan}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              {isDeletingPlan ? 'Excluindo...' : 'Sim, Excluir'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação para Excluir Período de Férias */}
      <Modal
        isOpen={deletePeriodTarget !== null}
        onClose={() => !isDeletingPeriod && setDeletePeriodTarget(null)}
        title="Confirmar Exclusão de Período"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <Trash2 size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800 font-medium">
              Tem certeza que deseja excluir este período de férias? Qualquer plano que use apenas este período poderá ficar inconsistente ou precisar de reconfiguração.
            </p>
          </div>

          {deletePeriodError && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              ⚠️ {deletePeriodError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setDeletePeriodTarget(null); setDeletePeriodError(null); }} disabled={isDeletingPeriod}>
              Cancelar
            </Button>
            <button
              onClick={handleConfirmDeletePeriod}
              disabled={isDeletingPeriod}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              {isDeletingPeriod ? 'Excluindo...' : 'Sim, Excluir'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
