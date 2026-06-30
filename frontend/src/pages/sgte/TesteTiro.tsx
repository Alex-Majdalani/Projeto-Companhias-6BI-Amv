import { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import type { Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Plus, Edit2, Trash2, Search, AlertCircle, XCircle, Filter, Award, Users, Target } from 'lucide-react';
import { api } from '../../services/api';

function normalizeText(text: string): string {
  if (!text) return '';
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function renderMilitarName(militar: any) {
  const nomeCompleto = militar.nome_completo || militar.nome || '';
  const nomeGuerra = militar.nomeGuerra || militar.nome_guerra || '';

  if (!nomeGuerra) {
    return <span className="font-medium text-gray-900">{nomeCompleto}</span>;
  }

  const words = nomeGuerra.split(/\s+/).filter((w: string) => w.trim().length > 0);
  if (words.length === 0) {
    return <span className="font-medium text-gray-900">{nomeCompleto}</span>;
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
          <span key={index} className="font-medium text-gray-600">
            {part}
          </span>
        )
      )}
    </span>
  );
}

interface TiroRecord {
  id: number;
  atividade: string;
  militarId: number | null;
  pgMilitar: string;
  nomeGuerraMilitar: string;
  pelotaoMilitar: string;
  companhiaMilitar?: string;
  idade: string;
  sexo: string;
  mencao: string;
  segundaChamada?: boolean;
}

function capitalizeFirstLetter(str: string): string {
  if (!str) return '';
  const match = str.match(/[a-zA-ZáàâãéèêíïóôõöúçÑñ]/);
  if (match && match.index !== undefined) {
    const idx = match.index;
    return str.substring(0, idx) + str[idx].toUpperCase() + str.substring(idx + 1);
  }
  return str;
}

function calculateAge(birthDateStr: string): number {
  if (!birthDateStr) return 0;
  const cleanDateStr = typeof birthDateStr === 'string' ? birthDateStr.split('T')[0] : '';
  const parts = cleanDateStr.split(/[-/]/);
  if (parts.length < 3) return 0;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const birthDate = new Date(year, month, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function getBaseActivityName(name: string): string {
  if (!name) return '';
  const norm = name.trim();
  if (norm.toLowerCase().startsWith('2ª chamada ')) {
    return norm.substring(11).trim();
  }
  if (norm.toLowerCase().startsWith('2a chamada ')) {
    return norm.substring(11).trim();
  }
  return norm;
}

function getCycleInfo(activityName: string) {
  if (!activityName) return { cycle: 0, isSecondCall: false };
  const norm = activityName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  let cycle = 0;
  if (norm.includes('1º') || norm.includes('1o') || norm.includes('1a') || norm.includes('1ª') || norm.includes('1 tiro') || norm.includes('1tiro')) {
    cycle = 1;
  } else if (norm.includes('2º') || norm.includes('2o') || norm.includes('2a') || norm.includes('2ª') || norm.includes('2 tiro') || norm.includes('2tiro')) {
    cycle = 2;
  } else if (norm.includes('3º') || norm.includes('3o') || norm.includes('3a') || norm.includes('3ª') || norm.includes('3 tiro') || norm.includes('3tiro')) {
    cycle = 3;
  }
  const isSecondCall = norm.includes('2ª chamada') || norm.includes('2a chamada') || norm.includes('segunda chamada') || norm.includes('2 chamada') || norm.includes('2ªch') || norm.includes('2ach');
  return { cycle, isSecondCall };
}

export function TesteTiro() {
  const [records, setRecords] = useState<TiroRecord[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [subTab, setSubTab] = useState<'realizaram' | 'nao_realizaram'>('realizaram');

  // Controle de Atividades
  const [isAtividadesModalOpen, setIsAtividadesModalOpen] = useState(false);
  const [atividadesList, setAtividadesList] = useState<string[]>([]);
  const [atividadeNome, setAtividadeNome] = useState('');
  const [isSavingAtividade, setIsSavingAtividade] = useState(false);
  const [editingAtividadeName, setEditingAtividadeName] = useState<string | null>(null);
  const [cadastrarModo, setCadastrarModo] = useState<'nova' | 'segunda'>('nova');
  const [segundaBaseAtividade, setSegundaBaseAtividade] = useState('');

  // Controle de Testes
  const [militares, setMilitares] = useState<any[]>([]);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [militarId, setMilitarId] = useState<number | null>(null);
  const [searchMilitar, setSearchMilitar] = useState('');
  const [selectedPG, setSelectedPG] = useState('');
  const [showMilitarSuggestions, setShowMilitarSuggestions] = useState(false);
  const [showPGScroll, setShowPGScroll] = useState(false);
  const [mencao, setMencao] = useState('');
  const [selectedAtividade, setSelectedAtividade] = useState('');
  const [isSavingTest, setIsSavingTest] = useState(false);
  const [editingTestId, setEditingTestId] = useState<number | null>(null);

  // States de Filtros
  const [showFiltersCard, setShowFiltersCard] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterPg, setFilterPg] = useState('Todos');
  const [filterCompanhia, setFilterCompanhia] = useState('Todos');
  const [filterPelotao, setFilterPelotao] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterMencao, setFilterMencao] = useState('Todos');

  const PG_ORDER = [
    'CEL', 'TC', 'MAJ', 'CAP', '1º TEN', '2º TEN', 'ASP',
    'ST', '1º SGT', '2º SGT', '3º SGT', 'CB', 'SD EP', 'SD EV'
  ];

  const pgOptions = Array.from(new Set(militares.map(m => m.posto).filter(Boolean)))
    .sort((a, b) => {
      const idxA = PG_ORDER.indexOf(a);
      const idxB = PG_ORDER.indexOf(b);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });

  const loadData = async () => {
    try {
      const [tiroRes, milRes] = await Promise.all([
        api.get('/tiro'),
        api.get('/militares')
      ]);
      setRecords(tiroRes.data || []);
      setMilitares(milRes.data || []);
    } catch (err) {
      console.error('Erro ao carregar registros de Tiro:', err);
    }
  };

  const loadAtividades = async () => {
    try {
      const res = await api.get('/tiro/atividades');
      const list = res.data || [];
      setAtividadesList(list);
      if (list.length > 0 && !activeTab) {
        setActiveTab(list[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar atividades:', err);
    }
  };

  useEffect(() => {
    loadData();
    loadAtividades();

    const handleFocus = () => {
      loadData();
      loadAtividades();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    if (isTestModalOpen) {
      loadData();
    }
  }, [isTestModalOpen]);

  const handleMilitarSearchChange = (val: string) => {
    setSearchMilitar(val);
    const normalizedVal = normalizeText(val);
    const found = militares.find(m => 
      normalizeText(`${m.posto} ${m.nome}`) === normalizedVal || 
      normalizeText(m.nome) === normalizedVal ||
      normalizeText(`${m.posto} ${m.nome_guerra || ''}`) === normalizedVal ||
      (m.nome_guerra && normalizeText(m.nome_guerra) === normalizedVal)
    );
    if (found) {
      setMilitarId(found.id);
      setSelectedPG(found.posto);
    } else {
      setMilitarId(null);
    }
  };

  const handlePGChange = (pg: string) => {
    setSelectedPG(pg);
    if (militarId) {
      const selectedMilitar = militares.find(m => m.id === militarId);
      if (selectedMilitar && selectedMilitar.posto !== pg) {
        setMilitarId(null);
        setSearchMilitar('');
      }
    }
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!militarId) {
      alert('Selecione um militar válido.');
      return;
    }

    const isDuplicate = records.some(
      r => r.id !== editingTestId && r.militarId === militarId && r.atividade.toLowerCase() === selectedAtividade.toLowerCase()
    );
    if (isDuplicate) {
      alert('Este militar já possui um teste registrado para esta atividade.');
      return;
    }

    setIsSavingTest(true);
    try {
      const payload = {
        militarId,
        atividade: selectedAtividade,
        mencao
      };

      if (editingTestId) {
        await api.patch(`/tiro/${editingTestId}`, payload);
        alert('Teste de Tiro atualizado com sucesso!');
      } else {
        await api.post('/tiro', payload);
        alert('Teste de Tiro registrado com sucesso!');
      }
      setIsTestModalOpen(false);
      resetTestForm();
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Erro ao registrar teste de Tiro.');
    } finally {
      setIsSavingTest(false);
    }
  };

  const resetTestForm = () => {
    setMilitarId(null);
    setSearchMilitar('');
    setSelectedPG('');
    setMencao('');
    setSelectedAtividade(activeTab || (atividadesList.length > 0 ? atividadesList[0] : ''));
    setEditingTestId(null);
  };

  const handleStartEditTest = (row: TiroRecord) => {
    setEditingTestId(row.id);
    setMilitarId(row.militarId);
    const mil = militares.find(m => m.id === row.militarId);
    if (mil) {
      setSearchMilitar(`${mil.posto} ${mil.nome_guerra || mil.nome}`);
      setSelectedPG(mil.posto);
    } else {
      setSearchMilitar(row.nomeGuerraMilitar);
      setSelectedPG(row.pgMilitar);
    }
    setMencao(row.mencao === 'N/A' ? '' : row.mencao);
    setSelectedAtividade(row.atividade);
    setIsTestModalOpen(true);
  };

  const handleDeleteTest = async (id: number) => {
    if (!confirm('Deseja realmente excluir este teste de Tiro?')) {
      return;
    }
    try {
      await api.delete(`/tiro/${id}`);
      alert('Teste excluído com sucesso!');
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Erro ao excluir teste.');
    }
  };

  const defaultTabs = ['1º Teste de Tiro', '2º Teste de Tiro', '2ª Chamada 1º Teste de Tiro'];
  const tabs = atividadesList.length > 0 ? atividadesList : defaultTabs;

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some(t => t.toLowerCase() === activeTab.toLowerCase())) {
      setActiveTab(tabs[0]);
    }
  }, [atividadesList]);

  useEffect(() => {
    setSubTab('realizaram');
  }, [activeTab]);

  const pelotaoOptions = Array.from(new Set(militares.map(m => m.pelotao).filter(Boolean))).sort() as string[];

  const companhiaOptions = Array.from(
    new Set(
      militares.map(m => {
        const raw = m.companhia || m.subunidade;
        if (!raw) return '';
        if (typeof raw === 'string') return raw;
        return raw.Companhia || raw.companhia || raw.Subunidade || raw.subunidade || raw.nome || '';
      }).filter(Boolean)
    )
  ).sort() as string[];

  const handleClearFilters = () => {
    setFilterSearch('');
    setFilterPg('Todos');
    setFilterCompanhia('Todos');
    setFilterPelotao('Todos');
    setFilterStatus('Todos');
    setFilterMencao('Todos');
  };

  const hasActiveFilters = 
    filterSearch !== '' ||
    filterPg !== 'Todos' ||
    filterCompanhia !== 'Todos' ||
    filterPelotao !== 'Todos' ||
    filterStatus !== 'Todos' ||
    filterMencao !== 'Todos';

  const getAgeNumber = (idadeStr: string): number => {
    const match = String(idadeStr).match(/\d+/);
    return match ? Number(match[0]) : 0;
  };

  const filteredRecords = records.filter(r => {
    const rowBase = getBaseActivityName(r.atividade);
    const activeBase = getBaseActivityName(activeTab);

    if (rowBase.toLowerCase() !== activeBase.toLowerCase()) return false;

    const activeIsSecond = activeTab.toLowerCase().startsWith('2ª chamada ') || activeTab.toLowerCase().startsWith('2a chamada ');
    const rowIsSecond = r.segundaChamada || r.atividade.toLowerCase().startsWith('2ª chamada ') || r.atividade.toLowerCase().startsWith('2a chamada ');

    if (activeIsSecond) {
      if (!rowIsSecond) return false;
    } else {
      if (rowIsSecond) {
        const militarFezPrimeira = records.some(x => {
          const xBase = getBaseActivityName(x.atividade);
          const xIsSecond = x.segundaChamada || x.atividade.toLowerCase().startsWith('2ª chamada ') || x.atividade.toLowerCase().startsWith('2a chamada ');
          return x.militarId === r.militarId && xBase.toLowerCase() === activeBase.toLowerCase() && !xIsSecond;
        });
        if (militarFezPrimeira) return false;
      }
    }

    if (filterSearch.trim()) {
      const term = normalizeText(filterSearch);
      const matchesSearch = 
        normalizeText(r.nomeGuerraMilitar).includes(term) ||
        normalizeText(r.pgMilitar).includes(term) ||
        normalizeText(r.pelotaoMilitar).includes(term);
      if (!matchesSearch) return false;
    }

    if (filterPg !== 'Todos' && r.pgMilitar !== filterPg) return false;
    if (filterCompanhia !== 'Todos' && r.companhiaMilitar !== filterCompanhia) return false;
    if (filterPelotao !== 'Todos' && r.pelotaoMilitar !== filterPelotao) return false;

    const isPendente = !r.mencao || r.mencao === 'N/A' || r.mencao === '';
    if (filterStatus === 'Concluido' && isPendente) return false;
    if (filterStatus === 'Pendente' && !isPendente) return false;

    if (filterMencao !== 'Todos') {
      if (filterMencao === 'Pendente') {
        const hasMencao = r.mencao && r.mencao !== 'N/A' && r.mencao !== '';
        if (hasMencao) return false;
      } else {
        if (r.mencao !== filterMencao) return false;
      }
    }

    return true;
  });

  const filteredNaoRealizaram = militares.filter(m => {
    const activeBase = getBaseActivityName(activeTab);
    const activeIsSecond = activeTab.toLowerCase().startsWith('2ª chamada ') || activeTab.toLowerCase().startsWith('2a chamada ');

    if (activeIsSecond) {
      const temSegunda = records.some(r => {
        const rowBase = getBaseActivityName(r.atividade);
        const rowIsSecond = r.segundaChamada || r.atividade.toLowerCase().startsWith('2ª chamada ') || r.atividade.toLowerCase().startsWith('2a chamada ');
        return r.militarId === m.id && rowBase.toLowerCase() === activeBase.toLowerCase() && rowIsSecond;
      });
      if (temSegunda) return false;

      const temPrimeira = records.some(r => {
        const rowBase = getBaseActivityName(r.atividade);
        const rowIsSecond = r.segundaChamada || r.atividade.toLowerCase().startsWith('2ª chamada ') || r.atividade.toLowerCase().startsWith('2a chamada ');
        return r.militarId === m.id && rowBase.toLowerCase() === activeBase.toLowerCase() && !rowIsSecond;
      });
      if (temPrimeira) return false;
    } else {
      const temQualquerRegistroNoCiclo = records.some(r => {
        const rowBase = getBaseActivityName(r.atividade);
        return rowBase.toLowerCase() === activeBase.toLowerCase() && r.militarId === m.id;
      });
      if (temQualquerRegistroNoCiclo) return false;
    }

    if (filterSearch.trim()) {
      const term = normalizeText(filterSearch);
      const matchesSearch = 
        normalizeText(m.nome || '').includes(term) ||
        normalizeText(m.nome_guerra || '').includes(term) ||
        normalizeText(m.posto || '').includes(term) ||
        normalizeText(m.pelotao || '').includes(term);
      if (!matchesSearch) return false;
    }

    if (filterPg !== 'Todos' && m.posto !== filterPg) return false;

    const militarCia = typeof m.companhia === 'object' ? (m.companhia.Companhia || m.companhia.companhia || m.companhia.Subunidade || m.companhia.subunidade || m.companhia.nome || '') : (m.companhia || m.subunidade || '');
    if (filterCompanhia !== 'Todos' && militarCia !== filterCompanhia) return false;

    if (filterPelotao !== 'Todos' && m.pelotao !== filterPelotao) return false;

    if (filterStatus === 'Concluido') return false;
    if (filterMencao !== 'Todos' && filterMencao !== 'Pendente') return false;

    return true;
  });

  const stats = (() => {
    const total = filteredRecords.length;
    const contagemMencoes: Record<string, number> = { E: 0, MB: 0, B: 0, R: 0, I: 0 };
    let concluidos = 0;

    filteredRecords.forEach(r => {
      const isTestPendente = !r.mencao || r.mencao === 'N/A' || r.mencao === '';
      if (!isTestPendente) {
        concluidos++;
      }
      if (r.mencao && r.mencao !== 'N/A' && r.mencao !== '') {
        const m = r.mencao.toUpperCase();
        if (contagemMencoes[m] !== undefined) {
          contagemMencoes[m]++;
        }
      }
    });

    const pendentes = total - concluidos;
    
    return {
      total,
      concluidos,
      pendentes,
      contagemMencoes
    };
  })();

  const handleSaveAtividade = async (e: React.FormEvent) => {
    e.preventDefault();

    let targetNome = '';
    if (editingAtividadeName) {
      targetNome = capitalizeFirstLetter(atividadeNome.trim());
    } else {
      if (cadastrarModo === 'nova') {
        targetNome = capitalizeFirstLetter(atividadeNome.trim());
      } else {
        if (!segundaBaseAtividade) {
          alert('Selecione uma atividade base.');
          return;
        }
        targetNome = `2ª Chamada ${segundaBaseAtividade}`;
      }
    }

    if (!targetNome) {
      alert('O nome da atividade é obrigatório.');
      return;
    }

    const exists = atividadesList.some(
      a => a.toLowerCase() === targetNome.toLowerCase() && 
      (editingAtividadeName === null || a.toLowerCase() !== editingAtividadeName.toLowerCase())
    );
    if (exists) {
      alert('Já existe uma atividade cadastrada com este nome.');
      return;
    }

    setIsSavingAtividade(true);
    try {
      if (editingAtividadeName) {
        await api.patch('/tiro/atividades', {
          nomeAntigo: editingAtividadeName,
          novoNome: targetNome
        });
        alert('Atividade atualizada com sucesso!');
      } else {
        await api.post('/tiro/atividades', {
          nome: targetNome
        });
        alert('Atividade cadastrada com sucesso!');
      }
      setAtividadeNome('');
      setSegundaBaseAtividade('');
      setCadastrarModo('nova');
      setEditingAtividadeName(null);
      await loadAtividades();
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Erro ao salvar atividade.');
    } finally {
      setIsSavingAtividade(false);
    }
  };

  const handleStartEditAtividade = (nome: string) => {
    setEditingAtividadeName(nome);
    setAtividadeNome(nome);
  };

  const handleCancelEditAtividade = () => {
    setEditingAtividadeName(null);
    setAtividadeNome('');
  };

  const handleDeleteAtividade = async (nome: string) => {
    if (!confirm(`Deseja realmente excluir a atividade "${nome}"? Todos os testes vinculados a ela (e a sua 2ª chamada) serão deletados permanentemente.`)) {
      return;
    }

    try {
      await api.delete(`/tiro/atividades/${encodeURIComponent(nome)}`);
      alert('Atividade excluída com sucesso!');
      await loadAtividades();
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Erro ao excluir atividade.');
    }
  };

  const columns: Column<TiroRecord>[] = [
    {
      header: 'P/G NOME DE GUERRA',
      accessor: (row: TiroRecord) => {
        const temVazio = !row.mencao || row.mencao === 'N/A' || row.mencao === '';
        const rowBase = getBaseActivityName(row.atividade);
        const rowIsSecond = row.segundaChamada || row.atividade.toLowerCase().startsWith('2ª chamada ') || row.atividade.toLowerCase().startsWith('2a chamada ');
        
        const activeIsSecond = activeTab.toLowerCase().startsWith('2ª chamada ') || activeTab.toLowerCase().startsWith('2a chamada ');

        const fezSegunda = !activeIsSecond && !rowIsSecond && records.some(x => {
          const xBase = getBaseActivityName(x.atividade);
          const xIsSecond = x.segundaChamada || x.atividade.toLowerCase().startsWith('2ª chamada ') || x.atividade.toLowerCase().startsWith('2a chamada ');
          return x.militarId === row.militarId && xBase.toLowerCase() === rowBase.toLowerCase() && xIsSecond;
        });

        const fezPrimeira = activeIsSecond && rowIsSecond && records.some(x => {
          const xBase = getBaseActivityName(x.atividade);
          const xIsSecond = x.segundaChamada || x.atividade.toLowerCase().startsWith('2ª chamada ') || x.atividade.toLowerCase().startsWith('2a chamada ');
          return x.militarId === row.militarId && xBase.toLowerCase() === rowBase.toLowerCase() && !xIsSecond;
        });

        const mostrarFeitoSegunda = !activeIsSecond && rowIsSecond;

        return (
          <span className="font-semibold text-gray-900 flex items-center gap-2">
            {row.pgMilitar} {row.nomeGuerraMilitar}
            {temVazio && (
              <Badge variant="warning" className="flex items-center gap-1 text-[10px] py-0 px-1.5 font-bold">
                <AlertCircle size={10} /> Pendente
              </Badge>
            )}
            {mostrarFeitoSegunda && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                Feito na 2ª Chamada
              </span>
            )}
            {fezSegunda && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                Realizou a 2ª Chamada
              </span>
            )}
            {fezPrimeira && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                Realizou a 1ª Chamada
              </span>
            )}
          </span>
        );
      }
    },
    {
      header: 'Companhia',
      accessor: (row: TiroRecord) => row.companhiaMilitar || 'Não informado'
    },
    {
      header: 'Pelotão',
      accessor: (row: TiroRecord) => row.pelotaoMilitar
    },
    {
      header: 'Menção Total',
      accessor: (row: TiroRecord) => {
        if (!row.mencao || row.mencao === 'N/A' || row.mencao === '') {
          return (
            <Badge variant="warning" className="flex items-center gap-1 text-[10px] font-bold">
              Pendente
            </Badge>
          );
        }
        return (
          <Badge variant={row.mencao === 'I' || row.mencao === 'R' ? 'danger' : row.mencao === 'B' ? 'info' : 'success'}>
            {row.mencao}
          </Badge>
        );
      }
    },
    {
      header: 'Ações',
      accessor: (row: TiroRecord) => (
        <div className="flex gap-2 text-gray-400" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => handleStartEditTest(row)}
            className="p-1 hover:text-militar-main transition-colors border border-gray-200 rounded"
            title="Editar Teste"
          >
            <Edit2 size={15} />
          </button>
          <button 
            onClick={() => handleDeleteTest(row.id)}
            className="p-1 hover:text-red-500 transition-colors border border-gray-200 rounded"
            title="Excluir Teste"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )
    }
  ];

  const handleStartNewTestForMilitar = (mil: any) => {
    resetTestForm();
    setMilitarId(mil.id);
    setSearchMilitar(`${mil.posto} ${mil.nome_guerra || mil.nome}`);
    setSelectedPG(mil.posto);
    setIsTestModalOpen(true);
  };

  const naoRealizaramColumns: Column<any>[] = [
    {
      header: 'P/G NOME DE GUERRA',
      accessor: (row: any) => (
        <span className="font-semibold text-gray-900 flex items-center gap-2">
          {row.posto} {row.nome_guerra || row.nome}
          <Badge variant="danger" className="flex items-center gap-1 text-[10px] py-0 px-1.5 font-bold">
            <XCircle size={10} /> Não Realizou
          </Badge>
        </span>
      )
    },
    {
      header: 'Idade',
      accessor: (row: any) => {
        const age = row.data_nascimento ? calculateAge(row.data_nascimento) : 0;
        return age > 0 ? `${age} anos` : 'Não informada';
      }
    },
    {
      header: 'Sexo',
      accessor: (row: any) => row.sexo || 'Não informado'
    },
    {
      header: 'Pelotão',
      accessor: (row: any) => row.pelotao || 'Não informado'
    },
    {
      header: 'Ações',
      accessor: (row: any) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button 
            onClick={() => handleStartNewTestForMilitar(row)}
            className="flex items-center gap-1.5 py-1 px-3 text-xs bg-militar-main hover:bg-militar-dark text-white rounded font-bold shadow-sm"
          >
            <Plus size={13} />
            Iniciar Teste
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Teste de Tiro</h1>
          <Breadcrumb items={[{ label: 'Aptidão e Capacitação' }, { label: 'Teste de Tiro' }]} />
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowFiltersCard(!showFiltersCard)} 
            variant="outline" 
            className={`flex items-center gap-2 ${showFiltersCard ? 'bg-gray-100/80 border-gray-300 font-bold' : ''}`}
          >
            <Filter size={16} />
            {showFiltersCard ? 'Ocultar Filtros' : 'Filtrar'}
          </Button>

          <Button 
            onClick={() => { setIsAtividadesModalOpen(true); }} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Target size={16} />
            Cadastrar Atividade
          </Button>

          <Button onClick={() => { resetTestForm(); setIsTestModalOpen(true); }} className="flex items-center gap-2">
            <Plus size={16} />
            Novo Teste
          </Button>
        </div>
      </div>

      {/* Seção de Filtros */}
      {showFiltersCard && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h2 className="text-sm font-semibold text-gray-800">Filtros de Pesquisa</h2>
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 py-1.5 px-3 border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 hover:bg-red-50/50 text-xs"
              >
                <XCircle size={14} />
                Limpar Filtros
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Militar</label>
              <Input 
                placeholder="Nome ou P/G..." 
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                icon={<Search size={14} />}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Posto / Graduação</label>
              <Select value={filterPg} onChange={(e) => setFilterPg(e.target.value)}>
                <option value="Todos">Todos</option>
                {pgOptions.map(pg => (
                  <option key={pg} value={pg}>{pg}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Companhia</label>
              <Select value={filterCompanhia} onChange={(e) => setFilterCompanhia(e.target.value)}>
                <option value="Todos">Todos</option>
                {companhiaOptions.map(cia => (
                  <option key={cia} value={cia}>{cia}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Pelotão</label>
              <Select value={filterPelotao} onChange={(e) => setFilterPelotao(e.target.value)}>
                <option value="Todos">Todos</option>
                {pelotaoOptions.map(pel => (
                  <option key={pel} value={pel}>{pel}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status do Teste</label>
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="Todos">Todos</option>
                <option value="Concluido">Concluído</option>
                <option value="Pendente">Pendente</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Menção</label>
              <Select value={filterMencao} onChange={(e) => setFilterMencao(e.target.value)}>
                <option value="Todos">Todos</option>
                <option value="E">Excelente (E)</option>
                <option value="MB">Muito Bom (MB)</option>
                <option value="B">Bom (B)</option>
                <option value="R">Regular (R)</option>
                <option value="I">Insuficiente (I)</option>
                <option value="Pendente">Pendente / Vazio</option>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard de Métricas de Tiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Resumo do Tiro */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-6">
          <div className="p-4 rounded-xl bg-blue-50 text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <span className="block text-sm font-semibold text-gray-400 uppercase tracking-wider">Militar Atirador</span>
            <span className="text-3xl font-extrabold text-gray-800 mt-1 block">{stats.total}</span>
            <span className="block text-xs text-gray-500 font-medium mt-1">
              {stats.concluidos} concluídos / {stats.pendentes} pendentes
            </span>
          </div>
        </div>

        {/* Card 2: Distribuição de Menções */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-6">
          <div className="p-4 rounded-xl bg-purple-50 text-purple-600 flex-shrink-0">
            <Award size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Total por Menção</span>
            <div className="grid grid-cols-5 gap-2">
              <div className="bg-green-50 rounded-lg p-2 text-center border border-green-100">
                <span className="block text-xs text-green-700 font-bold">E</span>
                <span className="text-lg font-extrabold text-green-950 mt-1 block">{stats.contagemMencoes.E}</span>
              </div>
              <div className="bg-emerald-50 rounded-lg p-2 text-center border border-emerald-100">
                <span className="block text-xs text-emerald-700 font-bold">MB</span>
                <span className="text-lg font-extrabold text-emerald-950 mt-1 block">{stats.contagemMencoes.MB}</span>
              </div>
              <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-100">
                <span className="block text-xs text-blue-700 font-bold">B</span>
                <span className="text-lg font-extrabold text-blue-950 mt-1 block">{stats.contagemMencoes.B}</span>
              </div>
              <div className="bg-amber-50 rounded-lg p-2 text-center border border-amber-100">
                <span className="block text-xs text-amber-700 font-bold">R</span>
                <span className="text-lg font-extrabold text-amber-950 mt-1 block">{stats.contagemMencoes.R}</span>
              </div>
              <div className="bg-red-50 rounded-lg p-2 text-center border border-red-100">
                <span className="block text-xs text-red-700 font-bold">I</span>
                <span className="text-lg font-extrabold text-red-950 mt-1 block">{stats.contagemMencoes.I}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Abas de Atividades de Tiro */}
        <div className="flex border-b border-gray-200 bg-gray-50/50 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab.toLowerCase() === tab.toLowerCase();
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-militar-main text-militar-main bg-white shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Sub-abas de Realizados vs Não Realizados */}
          <div className="flex border-b border-gray-100 mb-6 gap-6">
            <button
              onClick={() => setSubTab('realizaram')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all relative ${
                subTab === 'realizaram'
                  ? 'border-militar-main text-militar-main'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Realizaram o Tiro
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                subTab === 'realizaram' ? 'bg-militar-main text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {filteredRecords.length}
              </span>
            </button>
            <button
              onClick={() => setSubTab('nao_realizaram')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all relative ${
                subTab === 'nao_realizaram'
                  ? 'border-militar-main text-militar-main'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Não Realizaram (Sem Registro)
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                subTab === 'nao_realizaram' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600'
              }`}>
                {filteredNaoRealizaram.length}
              </span>
            </button>
          </div>

          {subTab === 'realizaram' ? (
            <DataTable
              columns={columns}
              data={filteredRecords}
              keyExtractor={(row) => row.id}
            />
          ) : (
            <DataTable
              columns={naoRealizaramColumns}
              data={filteredNaoRealizaram}
              keyExtractor={(row) => row.id}
            />
          )}
        </div>
      </div>

      {/* Modal: Cadastrar Atividades */}
      <Modal isOpen={isAtividadesModalOpen} onClose={() => { setIsAtividadesModalOpen(false); handleCancelEditAtividade(); }} title={editingAtividadeName ? "Editar Atividade" : "Cadastrar Atividade de Tiro"} size="md">
        <form onSubmit={handleSaveAtividade} className="space-y-4">
          {!editingAtividadeName && (
            <div className="flex gap-4 border-b border-gray-100 pb-3 mb-3">
              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="modoAtividade"
                  checked={cadastrarModo === 'nova'}
                  onChange={() => setCadastrarModo('nova')}
                />
                Nova Atividade
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="modoAtividade"
                  checked={cadastrarModo === 'segunda'}
                  onChange={() => setCadastrarModo('segunda')}
                />
                Criar Segunda Chamada
              </label>
            </div>
          )}

          {!editingAtividadeName && cadastrarModo === 'segunda' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Atividade Base
              </label>
              <Select
                value={segundaBaseAtividade}
                onChange={(e) => setSegundaBaseAtividade(e.target.value)}
                disabled={isSavingAtividade}
                required
              >
                <option value="">Selecione a atividade...</option>
                {atividadesList.filter(act => 
                  !act.toLowerCase().includes('2ª chamada') && 
                  !act.toLowerCase().includes('2a chamada') && 
                  !atividadesList.some(x => x.toLowerCase() === `2ª chamada ${act}`.toLowerCase())
                ).map(act => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </Select>
            </div>
          ) : (
            <Input 
              label="Nome da Atividade" 
              placeholder="Ex: 1º Teste de Tiro, 2º Teste de Tiro..." 
              value={atividadeNome} 
              onChange={(e) => setAtividadeNome(e.target.value)} 
              disabled={isSavingAtividade}
              required
            />
          )}
          <div className="flex justify-end gap-2 pt-2">
            {editingAtividadeName ? (
              <>
                <Button type="button" variant="outline" onClick={handleCancelEditAtividade} disabled={isSavingAtividade}>
                  Cancelar Edição
                </Button>
                <Button type="submit" disabled={isSavingAtividade}>
                  {isSavingAtividade ? 'Salvando...' : 'Atualizar Atividade'}
                </Button>
              </>
            ) : (
              <Button type="submit" disabled={isSavingAtividade || (cadastrarModo === 'nova' ? !atividadeNome.trim() : !segundaBaseAtividade)}>
                {isSavingAtividade ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
            )}
          </div>
          
          {/* Lista de Atividades Existentes */}
          <div className="pt-4 border-t border-gray-200 mt-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Atividades de Tiro Cadastradas</h3>
            <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
              {atividadesList.length === 0 ? (
                <div className="p-3 text-center text-xs text-gray-500">Nenhuma atividade cadastrada.</div>
              ) : (
                atividadesList.map(item => (
                  <div key={item} className="p-3 flex justify-between items-center text-sm hover:bg-gray-50">
                    <span className="font-medium text-gray-900">{item}</span>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => handleStartEditAtividade(item)}
                        className="p-1 text-gray-400 hover:text-militar-main transition-colors border border-gray-100 rounded hover:border-gray-200"
                        title="Editar"
                        disabled={isSavingAtividade}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDeleteAtividade(item)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors border border-gray-100 rounded hover:border-gray-200"
                        title="Excluir"
                        disabled={isSavingAtividade}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Novo Teste / Editar Teste */}
      <Modal isOpen={isTestModalOpen} onClose={() => !isSavingTest && setIsTestModalOpen(false)} title={editingTestId ? "Editar Teste de Tiro" : "Registrar Novo Teste de Tiro"} size="lg">
        <form onSubmit={handleSaveTest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Atividade de Tiro / Teste
            </label>
            <Select value={selectedAtividade} onChange={(e) => setSelectedAtividade(e.target.value)} disabled={isSavingTest} required>
              {tabs.map((tab) => (
                <option key={tab} value={tab}>{tab}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Combobox de P/G */}
            <div className="col-span-1 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                P/G
              </label>
              <div className="relative">
                <Input
                  readOnly
                  value={selectedPG || 'Todos'}
                  onClick={() => !isSavingTest && setShowPGScroll(!showPGScroll)}
                  onFocus={() => {
                    setShowMilitarSuggestions(false);
                    setShowPGScroll(true);
                  }}
                  className="cursor-pointer pr-10 interactive-select"
                  disabled={isSavingTest}
                />
                <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs transition-transform duration-200 ${showPGScroll ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </div>
              {!isSavingTest && showPGScroll && (
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

            {/* Autocomplete de Militar */}
            <div className="col-span-2 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Militar
              </label>
              <Input 
                required
                placeholder="Digite para buscar..."
                value={searchMilitar}
                onChange={(e) => {
                  handleMilitarSearchChange(e.target.value);
                  setShowMilitarSuggestions(true);
                }}
                onFocus={() => {
                  setShowPGScroll(false);
                  setShowMilitarSuggestions(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowMilitarSuggestions(false), 250);
                }}
                disabled={isSavingTest}
              />
              {!isSavingTest && showMilitarSuggestions && (
                <div className="absolute z-[1000] w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                  {militares
                    .filter(m => {
                      if (selectedPG && m.posto !== selectedPG) return false;
                      const search = normalizeText(searchMilitar);
                      return normalizeText(`${m.posto} ${m.nome}`).includes(search) ||
                        (m.nome_completo && normalizeText(m.nome_completo).includes(search)) ||
                        (m.nome_guerra && normalizeText(m.nome_guerra).includes(search));
                    })
                    .map(m => (
                      <div
                        key={m.id}
                        onMouseDown={() => {
                          setMilitarId(m.id);
                          setSearchMilitar(`${m.posto} ${m.nome_guerra || m.nome}`);
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Menção Total</label>
            <Select value={mencao} onChange={(e) => setMencao(e.target.value)} disabled={isSavingTest} required>
              <option value="">Selecione a Menção</option>
              <option value="E">Excelente (E)</option>
              <option value="MB">Muito Bom (MB)</option>
              <option value="B">Bom (B)</option>
              <option value="R">Regular (R)</option>
              <option value="I">Insuficiente (I)</option>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setIsTestModalOpen(false)} disabled={isSavingTest}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSavingTest}>
              {isSavingTest ? 'Salvando...' : (editingTestId ? 'Atualizar Teste' : 'Salvar Teste')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
