import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  X,
  Check,
  Trash2,
  UserPlus,
  Users,
  Settings,
  ClipboardList,
  Calendar,
  FileText,
  FilePlus2,
  ToggleLeft,
  ToggleRight,
  Moon,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from '../../styles/escala.module.css';
import pageStyles from '../../styles/pages.module.css';
import { ModalAditamento } from './ModalAditamento';
import { ModalPernoite } from './ModalPernoite';

// ─────────────── Tipos ───────────────
interface MilitarEscala {
  id: string;
  nome: string;
  pg: string;
  origem: 'manual' | 'importado';
  tipoServico?: string; // e.g. G1, Reforço, Plantão
}

type EscalaDiaria = Record<string, { id: string; tipoServico?: string }[]>; // "YYYY-MM-DD" -> [{id, tipoServico}, ...]

interface TabState {
  militares: MilitarEscala[];
  escala: EscalaDiaria;
}

// ─────────────── Dados mock para importação ───────────────
const MOCK_CIA: MilitarEscala[] = [
  { id: 'c1', nome: 'Silva', pg: '1º Sgt', origem: 'importado' },
  { id: 'c2', nome: 'Souza', pg: '2º Sgt', origem: 'importado' },
  { id: 'c3', nome: 'Ferreira', pg: '3º Sgt', origem: 'importado' },
  { id: 'c4', nome: 'Almeida', pg: '1º Sgt', origem: 'importado' },
  { id: 'c5', nome: 'Costa', pg: 'Subten', origem: 'importado' },
  { id: 'c6', nome: 'Mendes', pg: '2º Sgt', origem: 'importado' },
  { id: 'c7', nome: 'Oliveira', pg: '3º Sgt', origem: 'importado' },
  { id: 'c8', nome: 'Lima', pg: 'Cb', origem: 'importado', tipoServico: 'G1' },
  { id: 'c9', nome: 'Santos', pg: 'Sd EP', origem: 'importado', tipoServico: 'Plantão' },
  { id: 'c10', nome: 'Rocha', pg: 'Sd EP', origem: 'importado', tipoServico: 'Reforço' },
  { id: 'c11', nome: 'Barbosa', pg: 'Cb', origem: 'importado', tipoServico: 'G2' },
  { id: 'c12', nome: 'Carvalho', pg: 'Sd EP', origem: 'importado', tipoServico: 'Cite' },
];

const SGT_PGS = ['Subten', '1º Sgt', '2º Sgt', '3º Sgt'];
const SD_PGS = ['Cb', 'Sd EP'];

// ─────────────── Mock pré-escalado para o mês atual ───────────────
function buildMockEscala(year: number, month: number): { sgt: TabState; sd: TabState } {
  const pad = (n: number) => String(n).padStart(2, '0');
  const key = (d: number) => `${year}-${pad(month + 1)}-${pad(d)}`;

  const sgtMilitares: MilitarEscala[] = [
    { id: 'c1', nome: 'Silva', pg: '1º Sgt', origem: 'importado' },
    { id: 'c2', nome: 'Souza', pg: '2º Sgt', origem: 'importado' },
    { id: 'c3', nome: 'Ferreira', pg: '3º Sgt', origem: 'importado' },
    { id: 'c4', nome: 'Almeida', pg: '1º Sgt', origem: 'importado' },
    { id: 'c5', nome: 'Costa', pg: 'Subten', origem: 'importado' },
  ];

  const sdMilitares: MilitarEscala[] = [
    { id: 'c8', nome: 'Lima', pg: 'Cb', origem: 'importado', tipoServico: 'G1' },
    { id: 'c9', nome: 'Santos', pg: 'Sd EP', origem: 'importado', tipoServico: 'Plantão' },
    { id: 'c10', nome: 'Rocha', pg: 'Sd EP', origem: 'importado', tipoServico: 'Reforço' },
    { id: 'c11', nome: 'Barbosa', pg: 'Cb', origem: 'importado', tipoServico: 'G2' },
    { id: 'c12', nome: 'Carvalho', pg: 'Sd EP', origem: 'importado', tipoServico: 'Cite' },
  ];

  // Escala Sgt — rotação a cada 2 dias por par
  const sgtEscala: EscalaDiaria = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const idx = (d - 1) % sgtMilitares.length;
    const next = (d) % sgtMilitares.length;
    sgtEscala[key(d)] = [{ id: sgtMilitares[idx].id }, { id: sgtMilitares[next].id }];
  }

  // Escala Sd — rotação diferente
  const sdEscala: EscalaDiaria = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const idx = (d - 1) % sdMilitares.length;
    const next2 = (d + 1) % sdMilitares.length;
    sdEscala[key(d)] = [
      { id: sdMilitares[idx].id, tipoServico: sdMilitares[idx].tipoServico },
      { id: sdMilitares[next2].id, tipoServico: sdMilitares[next2].tipoServico }
    ];
  }

  return {
    sgt: { militares: sgtMilitares, escala: sgtEscala },
    sd: { militares: sdMilitares, escala: sdEscala },
  };
}


// ─────────────── Helpers ───────────────
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function initials(nome: string) {
  return nome.slice(0, 2).toUpperCase();
}

// ─────────────── Componente Principal ───────────────
export function EscalaServico() {
  const today = new Date();
  const [activeTab, setActiveTab] = useState<'sgt' | 'sd'>('sgt');
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [tabs, setTabs] = useState<{ sgt: TabState; sd: TabState }>(
    () => buildMockEscala(today.getFullYear(), today.getMonth())
  );

  // Modais / Drawer
  const [drawerDay, setDrawerDay] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEfetivoModal, setShowEfetivoModal] = useState(false);
  const [showPrevisaoModal, setShowPrevisaoModal] = useState(false);
  const [showAditamentoModal, setShowAditamentoModal] = useState(false);
  const [showPernoiteModal, setShowPernoiteModal] = useState(false);
  const [importSelected, setImportSelected] = useState<string[]>([]);
  const [selectingTipoFor, setSelectingTipoFor] = useState<{ day: string, id: string } | null>(null);

  // Form novo militar
  const [newNome, setNewNome] = useState('');
  const [newPg, setNewPg] = useState('');
  const [newTipo, setNewTipo] = useState('');

  // Gerenciamento de Tipos de Serviço (separado por aba)
  const [tiposServicoSgt, setTiposServicoSgt] = useState(['Cmt Gda', 'Sgt Dia', 'Sgt Nt', 'Adjunto', 'Of Dia', 'Plantão']);
  const [tiposServicoSd, setTiposServicoSd] = useState(['G1', 'G2', 'Reforço', 'Plantão', 'Cite', 'Permanência', 'Pte', 'Auxiliar']);
  const [showTiposModal, setShowTiposModal] = useState(false);
  const [novoTipoInput, setNovoTipoInput] = useState('');

  // Alias conveniente: tipos da aba ativa
  const tiposServico = activeTab === 'sgt' ? tiposServicoSgt : tiposServicoSd;
  const setTiposServico = activeTab === 'sgt' ? setTiposServicoSgt : setTiposServicoSd;

  // Dias com tipo de escala alterado manualmente (preta -> vermelha ou vice-versa)
  // Record<dateKey, 'preta' | 'vermelha'> — only stores overrides
  const [diasTipoOverride, setDiasTipoOverride] = useState<Record<string, 'preta' | 'vermelha'>>({});

  // Helper: determina se um dia é "Vermelha" (final de semana ou override manual)
  const isVermelha = (dateStr: string): boolean => {
    if (diasTipoOverride[dateStr]) return diasTipoOverride[dateStr] === 'vermelha';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dow = new Date(y, m - 1, d).getDay();
    return dow === 0 || dow === 6;
  };

  const toggleDiaTipo = (dateStr: string) => {
    setDiasTipoOverride(prev => {
      const current = isVermelha(dateStr) ? 'vermelha' : 'preta';
      const [y, m, d] = dateStr.split('-').map(Number);
      const dow = new Date(y, m - 1, d).getDay();
      const naturalVermelha = dow === 0 || dow === 6;
      // Se o toggle resultar no estado natural, remove o override
      const toggled: 'preta' | 'vermelha' = current === 'vermelha' ? 'preta' : 'vermelha';
      if ((toggled === 'vermelha') === naturalVermelha) {
        const next = { ...prev };
        delete next[dateStr];
        return next;
      }
      return { ...prev, [dateStr]: toggled };
    });
  };

  // ── Dados da aba ativa ──
  const tab = tabs[activeTab];
  const setTab = (update: (prev: TabState) => TabState) =>
    setTabs(prev => ({ ...prev, [activeTab]: update(prev[activeTab]) }));

  // ── Calendário ──
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const militaresNodia = (day: number): (MilitarEscala & { tipoServicoDesignado?: string })[] => {
    const key = dateKey(year, month, day);
    const entries = tab.escala[key] || [];
    return entries.map(entry => {
      const m = tab.militares.find(m => m.id === entry.id);
      if (!m) return null;
      return { ...m, tipoServicoDesignado: entry.tipoServico || m.tipoServico };
    }).filter(Boolean) as (MilitarEscala & { tipoServicoDesignado?: string })[];
  };

  const toggleDayMilitar = (day: string, id: string, tipo?: string) => {
    setTab(prev => {
      const cur = prev.escala[day] || [];
      const exists = cur.find(x => x.id === id);
      let updated;
      if (exists) {
        updated = cur.filter(x => x.id !== id);
      } else {
        // Se já tiver um tipo predefinido no cadastro, e não foi passado um novo, usa ele
        const m = prev.militares.find(x => x.id === id);
        updated = [...cur, { id, tipoServico: tipo || m?.tipoServico }];
      }
      return { ...prev, escala: { ...prev.escala, [day]: updated } };
    });
  };

  // ── Adicionar militar manual ──
  const handleAddMilitar = () => {
    if (!newNome.trim() || !newPg) return;
    const novo: MilitarEscala = {
      id: `m-${Date.now()}`,
      nome: newNome.trim(),
      pg: newPg,
      origem: 'manual',
      tipoServico: activeTab === 'sd' ? newTipo : undefined,
    };
    setTab(prev => ({ ...prev, militares: [...prev.militares, novo] }));
    setNewNome(''); setNewPg(''); setNewTipo('');
    setShowAddModal(false);
  };

  // ── Importar da Cia ──
  const pgFiltro = activeTab === 'sgt' ? SGT_PGS : SD_PGS;
  const mockFiltrado = MOCK_CIA.filter(m => pgFiltro.includes(m.pg));
  const jaImportadosIds = tab.militares.map(m => m.id);

  const handleImport = () => {
    const novos = mockFiltrado.filter(
      m => importSelected.includes(m.id) && !jaImportadosIds.includes(m.id)
    );
    setTab(prev => ({ ...prev, militares: [...prev.militares, ...novos] }));
    setImportSelected([]);
    setShowImportModal(false);
  };

  // ── Gerenciar Tipos de Serviço ──
  const handleAddTipo = () => {
    if (!novoTipoInput.trim()) return;
    if (!tiposServico.includes(novoTipoInput.trim())) {
      setTiposServico(prev => [...prev, novoTipoInput.trim()]);
    }
    setNovoTipoInput('');
  };

  const removeTipo = (tipo: string) => {
    setTiposServico(prev => prev.filter(t => t !== tipo));
  };

  const removeMilitar = (id: string) => {
    setTab(prev => ({
      ...prev,
      militares: prev.militares.filter(m => m.id !== id),
      escala: Object.fromEntries(
        Object.entries(prev.escala).map(([k, arr]) => [k, arr.filter(i => i.id !== id)])
      ),
    }));
  };

  // ── Cálculo de Folgas (Preta e Vermelha) ──
  const calcularFolgas = (id: string, targetDay: string) => {
    let folgaPreta = 0;
    let folgaVermelha = 0;

    const [y, m, d] = targetDay.split('-').map(Number);
    const currDate = new Date(y, m - 1, d);
    currDate.setDate(currDate.getDate() - 1); // começa a contar do dia anterior

    let foundPreta = false;
    let foundVermelha = false;
    let limit = 90; // limite de busca retroativa para não travar

    while (limit > 0 && (!foundPreta || !foundVermelha)) {
      const key = dateKey(currDate.getFullYear(), currDate.getMonth(), currDate.getDate());
      const onDuty = (tab.escala[key] || []).some(x => x.id === id);
      const isDayVermelha = isVermelha(key);

      if (isDayVermelha) {
        if (!foundVermelha) {
          if (onDuty) foundVermelha = true;
          else folgaVermelha++;
        }
      } else {
        if (!foundPreta) {
          if (onDuty) foundPreta = true;
          else folgaPreta++;
        }
      }

      currDate.setDate(currDate.getDate() - 1);
      limit--;
    }

    return { folgaPreta, folgaVermelha };
  };

  // ── Status de um militar num dia ──
  const getStatus = (id: string, day: string): 'servico' | 'livre' => {
    const entries = tab.escala[day] || [];
    if (entries.some(x => x.id === id)) return 'servico';
    return 'livre';
  };

  // ── Parse do drawerDay para exibição ──
  const drawerDate = useMemo(() => {
    if (!drawerDay) return null;
    const [y, m, d] = drawerDay.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [drawerDay]);

  // ── Previsão da Semana ──
  const previsaoSemana = useMemo(() => {
    let baseDate = new Date(year, month, 1);
    if (year === today.getFullYear() && month === today.getMonth()) {
      baseDate = today;
    }

    const dayOfWeek = baseDate.getDay();
    const distToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(baseDate);
    monday.setDate(monday.getDate() - distToMonday);

    const days: Date[] = [];
    for (let i = 0; i <= 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }

    const previsao = [];
    for (const d of days) {
      const dKey = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
      const escalados = tab.escala[dKey] || [];
      for (const esc of escalados) {
        const m = tab.militares.find(x => x.id === esc.id);
        if (m) {
          previsao.push({
            militar: m,
            dataStr: dKey,
            diaDoMes: d.getDate(),
            diaDaSemana: DIAS_SEMANA[d.getDay()],
            tipoServico: esc.tipoServico || m.tipoServico || 'Geral'
          });
        }
      }
    }
    return previsao;
  }, [year, month, tab]);

  const exportarPrevisaoPDF = () => {
    const doc = new jsPDF();
    const abaNome = activeTab === 'sgt' ? 'Sgt / Subten' : 'Sd / Cb';
    doc.text(`Previsao de Escala de Servico - ${abaNome}`, 14, 15);

    const tableData = previsaoSemana.map(p => [
      `${p.militar.pg} ${p.militar.nome}`,
      `${String(p.diaDoMes).padStart(2, '0')}/${String(parseInt(p.dataStr.split('-')[1])).padStart(2, '0')}`,
      p.diaDaSemana,
      p.tipoServico
    ]);

    autoTable(doc, {
      startY: 25,
      head: [['Militar', 'Dia', 'Semana', 'Servico']],
      body: tableData,
    });

    doc.save(`previsao_escala_${activeTab}.pdf`);
  };

  const pgOptions = activeTab === 'sgt'
    ? ['Subten', '1º Sgt', '2º Sgt', '3º Sgt']
    : ['Cb', 'Sd EP'];

  // ── Escala Unificada (Sgt + Sd) para o Aditamento ──
  const escalaUnificada = useMemo(() => {
    const allDays = new Set([
      ...Object.keys(tabs.sgt.escala),
      ...Object.keys(tabs.sd.escala),
    ]);
    const result: Record<string, { pg: string; nome: string; tipoServico?: string }[]> = {};
    for (const day of allDays) {
      const sgtEntries = (tabs.sgt.escala[day] || []).map(e => {
        const m = tabs.sgt.militares.find(x => x.id === e.id);
        if (!m) return null;
        return { pg: m.pg, nome: m.nome, tipoServico: e.tipoServico || m.tipoServico };
      }).filter(Boolean) as { pg: string; nome: string; tipoServico?: string }[];

      const sdEntries = (tabs.sd.escala[day] || []).map(e => {
        const m = tabs.sd.militares.find(x => x.id === e.id);
        if (!m) return null;
        return { pg: m.pg, nome: m.nome, tipoServico: e.tipoServico || m.tipoServico };
      }).filter(Boolean) as { pg: string; nome: string; tipoServico?: string }[];

      result[day] = [...sgtEntries, ...sdEntries];
    }
    return result;
  }, [tabs]);

  // ── Cmts da Cia (mock — será substituído pela API) ──
  const cmtsCiaMock = [
    '1º Ten SILVA (Cmt Cia)',
    '1º Ten SOUZA (Cmt Cia)',
    '2º Ten FERREIRA (Adj Cia)',
  ];

  return (
    <>
      {/* ── Cabeçalho ── */}
      <div className={pageStyles['page-header']}>
        <p className={pageStyles['page-header__eyebrow']}>Gestão de Pessoas</p>
        <h1 style={{ color: 'var(--color-primary)' }}>Escala de Serviço</h1>
        <p>Monte a escala mensal da companhia por função.</p>
      </div>

      {/* ── Subabas ── */}
      <div className={styles.tabs}>
        <button
          className={`${styles['tab-btn']} ${activeTab === 'sgt' ? styles['tab-btn--active'] : ''}`}
          onClick={() => setActiveTab('sgt')}
        >
          Sgt / Subten
        </button>
        <button
          className={`${styles['tab-btn']} ${activeTab === 'sd' ? styles['tab-btn--active'] : ''}`}
          onClick={() => setActiveTab('sd')}
        >
          Sd / Cb
        </button>
      </div>

      {/* ── Barra de Ações ── */}
      <div className={styles['actions-bar']}>
        <button className={`${styles.btn} ${styles['btn--primary']}`} onClick={() => setShowAddModal(true)}>
          <UserPlus size={15} /> Adicionar Militar
        </button>
        <button className={`${styles.btn} ${styles['btn--outline']}`} onClick={() => setShowImportModal(true)}>
          <Users size={15} /> Importar da Cia
        </button>
        <button className={`${styles.btn} ${styles['btn--outline']}`} onClick={() => setShowEfetivoModal(true)}>
          <ClipboardList size={15} /> Efetivo
        </button>
        <button className={`${styles.btn} ${styles['btn--outline']}`} onClick={() => setShowPrevisaoModal(true)}>
          <Calendar size={15} /> Previsão
        </button>

        <button className={`${styles.btn} ${styles['btn--outline']}`} onClick={() => setShowTiposModal(true)}>
          <Settings size={15} /> Tipos de Serviço
        </button>
        <button
          className={`${styles.btn} ${styles['btn--primary']}`}
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 12px rgba(124,58,237,0.35)' }}
          onClick={() => setShowPernoiteModal(true)}
        >
          <Moon size={15} /> Gerar Pernoite
        </button>
        <button
          className={`${styles.btn} ${styles['btn--primary']}`}
          style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', boxShadow: '0 4px 12px rgba(37,99,235,0.35)' }}
          onClick={() => setShowAditamentoModal(true)}
        >
          <FilePlus2 size={15} /> Gerar Aditamento
        </button>
      </div>

      {/* ── Navegação do Calendário ── */}
      <div className={styles['cal-nav']}>
        <button className={styles['nav-arrow']} onClick={prevMonth}><ChevronLeft size={16} /></button>
        <span className={styles['cal-nav__title']}>{MESES[month]} {year}</span>
        <button className={styles['nav-arrow']} onClick={nextMonth}><ChevronRight size={16} /></button>
      </div>

      {/* ── Grid ── */}
      <div className={styles.calendar}>
        {DIAS_SEMANA.map(d => (
          <div key={d} className={styles['cal-header']}>{d}</div>
        ))}
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className={`${styles['cal-cell']} ${styles['cal-cell--empty']}`} />;
          const key = dateKey(year, month, day);
          const escalados = militaresNodia(day);
          const visivel = escalados.slice(0, 3);
          const extra = escalados.length - 3;
          const isDayVermelha = isVermelha(key);
          const hasOverride = diasTipoOverride[key] !== undefined;
          return (
            <div
              key={key}
              className={`${styles['cal-cell']} ${isToday(day) ? styles['cal-cell--today'] : ''} ${isDayVermelha ? styles['cal-cell--vermelha'] : ''}`}
              onClick={() => setDrawerDay(key)}
            >
              <div className={styles['cal-day-num']}>
                {day}
                {hasOverride && (
                  <span
                    title={isDayVermelha ? 'Escala Vermelha (alterado manualmente)' : 'Escala Preta (alterado manualmente)'}
                    style={{ marginLeft: 4, fontSize: '0.55rem', verticalAlign: 'middle', color: isDayVermelha ? '#ef4444' : '#374151', fontWeight: 700 }}
                  >
                    {isDayVermelha ? '● V' : '● P'}
                  </span>
                )}
              </div>
              <div className={styles['cal-badges']}>
                {visivel.map(m => (
                  <div key={m.id} className={styles['cal-badge']} title={m.tipoServicoDesignado ? `Serviço: ${m.tipoServicoDesignado}` : ''}>
                    {m.tipoServicoDesignado ? <strong>[{m.tipoServicoDesignado}] </strong> : ''}{m.pg} {m.nome}
                  </div>
                ))}
                {extra > 0 && <div className={`${styles['cal-badge']} ${styles['cal-badge--more']}`}>+{extra} militares</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* ══════════ DRAWER ══════════ */}
      {drawerDay && (
        <div className={styles['drawer-overlay']} onClick={() => setDrawerDay(null)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <div className={styles['drawer-header']}>
              <div>
                <h2>
                  📅 {drawerDate && `${drawerDate.getDate()} de ${MESES[drawerDate.getMonth()]} de ${drawerDate.getFullYear()}`}
                </h2>
                <p>Aba: <strong>{activeTab === 'sgt' ? 'Sgt / Subten' : 'Sd / Cb'}</strong> — clique no ícone para alternar o serviço</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                {/* Toggle Preta / Vermelha */}
                {drawerDay && (() => {
                  const dVermelha = isVermelha(drawerDay);
                  const hasOvr = diasTipoOverride[drawerDay] !== undefined;
                  return (
                    <button
                      onClick={() => toggleDiaTipo(drawerDay)}
                      title={dVermelha ? 'Clique para tornar Preta' : 'Clique para tornar Vermelha'}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '4px 10px', borderRadius: 999, fontSize: '0.72rem',
                        fontWeight: 700, cursor: 'pointer', border: 'none',
                        background: dVermelha ? 'rgba(239,68,68,0.12)' : 'rgba(55,65,81,0.10)',
                        color: dVermelha ? '#ef4444' : '#374151',
                        boxShadow: hasOvr ? '0 0 0 2px ' + (dVermelha ? '#ef4444' : '#374151') : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      {dVermelha ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      {dVermelha ? 'Escala Vermelha' : 'Escala Preta'}
                      {hasOvr && <span style={{ fontSize: '0.6rem', marginLeft: 2 }}>(manual)</span>}
                    </button>
                  );
                })()}
                <button className={styles['drawer-close']} onClick={() => setDrawerDay(null)}>✕</button>
              </div>
            </div>
            <div className={styles['drawer-body']}>
              {(() => {
                if (tab.militares.length === 0) {
                  return (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', marginTop: 32 }}>
                      Nenhum militar na lista ainda. Adicione militares para escalonar.
                    </p>
                  );
                }

                const [y, monthStr, d] = drawerDay!.split('-').map(Number);
                const targetDate = new Date(y, monthStr - 1, d);
                const isTargetWeekend = isVermelha(drawerDay!);

                const militaresSorted = tab.militares.map(m => {
                  const status = getStatus(m.id, drawerDay!);
                  const folgas = status === 'livre' ? calcularFolgas(m.id, drawerDay!) : { folgaPreta: 0, folgaVermelha: 0 };
                  return {
                    ...m,
                    status,
                    folgaPreta: folgas.folgaPreta,
                    folgaVermelha: folgas.folgaVermelha,
                    relevantFolga: isTargetWeekend ? folgas.folgaVermelha : folgas.folgaPreta
                  };
                }).sort((a, b) => {
                  if (a.status === 'servico' && b.status !== 'servico') return -1;
                  if (a.status !== 'servico' && b.status === 'servico') return 1;
                  if (a.status === 'livre' && b.status === 'livre') {
                    if (b.relevantFolga !== a.relevantFolga) {
                      return b.relevantFolga - a.relevantFolga;
                    }
                  }
                  return 0;
                });

                return militaresSorted.map(m => {
                  const isSelecting = selectingTipoFor?.day === drawerDay && selectingTipoFor?.id === m.id;
                  const entry = (tab.escala[drawerDay!] || []).find(x => x.id === m.id);
                  const tipoAtual = entry?.tipoServico || m.tipoServico;

                  return (
                    <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div className={styles['status-row']}>
                        <div className={styles['status-avatar']}>{initials(m.nome)}</div>
                        <div className={styles['status-info']}>
                          <div className={styles['status-name']}>
                            {m.pg} {m.nome} {tipoAtual && m.status === 'servico' && <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginLeft: 4 }}>({tipoAtual})</span>}
                          </div>
                          <div className={styles['status-pg']}>{m.origem === 'importado' ? 'Importado da Cia' : 'Cadastro manual'}</div>
                        </div>

                        {!isSelecting && m.status === 'servico' ? (
                          <span className={`${styles['status-badge']} ${styles['status-badge--servico']}`}>
                            ● Serviço
                          </span>
                        ) : !isSelecting && m.status === 'livre' ? (
                          <span className={`${styles['status-badge']} ${styles['status-badge--livre']}`} style={{ display: 'flex', gap: '8px', padding: '4px 10px' }}>
                            <span title="Folgas Preta (Segunda a Sexta)" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ width: 8, height: 8, background: '#374151', borderRadius: '2px' }}></span> {m.folgaPreta}
                            </span>
                            <span style={{ color: '#d1d5db' }}>|</span>
                            <span title="Folgas Vermelha (Sábado e Domingo)" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '2px' }}></span> {m.folgaVermelha}
                            </span>
                          </span>
                        ) : null}

                        {!isSelecting && (
                          <button
                            className={styles['status-toggle']}
                            title={m.status === 'servico' ? 'Remover do serviço' : 'Colocar em serviço'}
                            onClick={() => {
                              if (m.status === 'servico') {
                                toggleDayMilitar(drawerDay!, m.id);
                              } else {
                                if (tiposServico.length > 0) {
                                  setSelectingTipoFor({ day: drawerDay!, id: m.id });
                                } else {
                                  toggleDayMilitar(drawerDay!, m.id);
                                }
                              }
                            }}
                          >
                            {m.status === 'servico' ? <X size={14} /> : <Check size={14} />}
                          </button>
                        )}
                      </div>

                      {/* Seção de seleção de serviço */}
                      {isSelecting && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', marginLeft: '42px' }}>
                          <span style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 600 }}>Tipo de Serviço:</span>
                          <select
                            autoFocus
                            className={styles['modal-select']}
                            style={{ padding: '4px 8px', fontSize: '0.8rem', flex: 1 }}
                            onChange={(e) => {
                              toggleDayMilitar(drawerDay!, m.id, e.target.value);
                              setSelectingTipoFor(null);
                            }}
                            onBlur={() => setSelectingTipoFor(null)}
                          >
                            <option value="">Selecione para escalar...</option>
                            {tiposServico.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <button
                            className={`${styles.btn} ${styles['btn--ghost']}`}
                            onClick={() => setSelectingTipoFor(null)}
                            title="Cancelar"
                            style={{ padding: '4px' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL — Adicionar Militar ══════════ */}
      {showAddModal && (
        <div className={styles['modal-overlay']} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3><UserPlus size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              Adicionar Militar
            </h3>
            <div className={styles['modal-field']}>
              <label>Nome (sobrenome ou nome de guerra)</label>
              <input
                className={styles['modal-input']}
                placeholder="Ex: Silva, Pereira..."
                value={newNome}
                onChange={e => setNewNome(e.target.value)}
                autoFocus
              />
            </div>
            <div className={styles['modal-field']}>
              <label>Posto / Graduação</label>
              <select
                className={styles['modal-select']}
                value={newPg}
                onChange={e => setNewPg(e.target.value)}
              >
                <option value="">— Selecione —</option>
                {pgOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {activeTab === 'sd' && (
              <div className={styles['modal-field']}>
                <label>Tipo de Serviço (Opcional)</label>
                <select
                  className={styles['modal-select']}
                  value={newTipo}
                  onChange={e => setNewTipo(e.target.value)}
                >
                  <option value="">— Sem tipo fixo —</option>
                  {tiposServico.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}

            <div className={styles['modal-actions']}>
              <button className={`${styles.btn} ${styles['btn--outline']}`} onClick={() => setShowAddModal(false)}>
                Cancelar
              </button>
              <button className={`${styles.btn} ${styles['btn--primary']}`} onClick={handleAddMilitar}>
                <Plus size={14} /> Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL — Importar da Cia ══════════ */}
      {showImportModal && (
        <div className={styles['modal-overlay']} onClick={() => setShowImportModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3><Download size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              Importar da Cia — {activeTab === 'sgt' ? 'Sgt / Subten' : 'Sd / Cb'}
            </h3>
            {mockFiltrado.length === 0
              ? <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Nenhum militar cadastrado com esse perfil.</p>
              : mockFiltrado.map(m => {
                const jaAdicionado = jaImportadosIds.includes(m.id);
                return (
                  <label key={m.id} className={styles['import-item']} style={jaAdicionado ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
                    <input
                      type="checkbox"
                      disabled={jaAdicionado}
                      checked={importSelected.includes(m.id) || jaAdicionado}
                      onChange={e => {
                        setImportSelected(prev =>
                          e.target.checked ? [...prev, m.id] : prev.filter(x => x !== m.id)
                        );
                      }}
                    />
                    <span className={styles['import-label']}>{m.nome}</span>
                    <span className={styles['import-pg']}>
                      {m.pg} {m.tipoServico ? `(${m.tipoServico})` : ''}
                      {jaAdicionado ? ' · já adicionado' : ''}
                    </span>
                  </label>
                );
              })
            }
            <div className={styles['modal-actions']}>
              <button className={`${styles.btn} ${styles['btn--outline']}`} onClick={() => { setShowImportModal(false); setImportSelected([]); }}>
                Cancelar
              </button>
              <button className={`${styles.btn} ${styles['btn--primary']}`} onClick={handleImport} disabled={importSelected.length === 0}>
                <Download size={14} /> Importar {importSelected.length > 0 ? `(${importSelected.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL — Tipos de Serviço ══════════ */}
      {showTiposModal && (
        <div className={styles['modal-overlay']} onClick={() => setShowTiposModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3><Settings size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              Tipos de Serviço — {activeTab === 'sgt' ? 'Sgt / Subten' : 'Sd / Cb'}
            </h3>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                className={styles['modal-input']}
                placeholder="Novo tipo (ex: Guarda)"
                value={novoTipoInput}
                onChange={e => setNovoTipoInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTipo()}
              />
              <button className={`${styles.btn} ${styles['btn--primary']}`} onClick={handleAddTipo}>
                Adicionar
              </button>
            </div>

            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px' }}>
              {tiposServico.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: '#6b7280', textAlign: 'center', padding: '10px' }}>Nenhum tipo cadastrado.</p>
              ) : (
                tiposServico.map(t => (
                  <div key={t} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ fontSize: '0.85rem', color: '#111827', fontWeight: 500 }}>{t}</span>
                    <button className={`${styles.btn} ${styles['btn--ghost']}`} style={{ padding: '4px' }} onClick={() => removeTipo(t)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className={styles['modal-actions']}>
              <button className={`${styles.btn} ${styles['btn--outline']}`} onClick={() => setShowTiposModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL — Efetivo ══════════ */}
      {showEfetivoModal && (
        <div className={styles['modal-overlay']} onClick={() => setShowEfetivoModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3><ClipboardList size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              Efetivo — {activeTab === 'sgt' ? 'Sgt / Subten' : 'Sd / Cb'}
            </h3>

            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px', marginTop: '16px' }}>
              {(() => {
                if (tab.militares.length === 0) {
                  return (
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', textAlign: 'center', padding: '10px' }}>Nenhum militar no efetivo.</p>
                  );
                }

                const dataAtual = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
                const isTodayWeekend = today.getDay() === 0 || today.getDay() === 6;

                const militaresEfetivo = tab.militares.map(m => {
                  const status = getStatus(m.id, dataAtual);
                  const folgas = status === 'livre' ? calcularFolgas(m.id, dataAtual) : { folgaPreta: 0, folgaVermelha: 0 };

                  return {
                    ...m,
                    status,
                    folgaPreta: folgas.folgaPreta,
                    folgaVermelha: folgas.folgaVermelha,
                    relevantFolga: isTodayWeekend ? folgas.folgaVermelha : folgas.folgaPreta
                  };
                }).sort((a, b) => {
                  if (a.status === 'servico' && b.status !== 'servico') return -1;
                  if (a.status !== 'servico' && b.status === 'servico') return 1;
                  if (a.status === 'livre' && b.status === 'livre') {
                    if (b.relevantFolga !== a.relevantFolga) {
                      return b.relevantFolga - a.relevantFolga;
                    }
                  }
                  return 0;
                });

                return militaresEfetivo.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f3f4f6' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: '#111827', fontWeight: 600 }}>{m.pg} {m.nome}</span>
                      {m.tipoServico && <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginLeft: 4 }}>({m.tipoServico})</span>}
                      {m.status === 'servico' && <span style={{ fontSize: '0.7rem', color: '#4ade80', marginLeft: 6, fontWeight: 700 }}>● Serviço Hoje</span>}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className={`${styles['status-badge']} ${styles['status-badge--livre']}`} style={{ display: 'flex', gap: '8px', padding: '4px 10px' }}>
                        <span title="Folga Preta (Segunda a Sexta)" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: 8, height: 8, background: '#374151', borderRadius: '2px' }}></span> {m.folgaPreta}
                        </span>
                        <span style={{ color: '#d1d5db' }}>|</span>
                        <span title="Folga Vermelha (Sábado e Domingo)" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '2px' }}></span> {m.folgaVermelha}
                        </span>
                      </span>

                      <button className={`${styles.btn} ${styles['btn--ghost']}`} style={{ padding: '4px' }} onClick={() => removeMilitar(m.id)} title="Remover do efetivo">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div className={styles['modal-actions']}>
              <button className={`${styles.btn} ${styles['btn--outline']}`} onClick={() => setShowEfetivoModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL — Previsão ══════════ */}
      {showPrevisaoModal && (
        <div className={styles['modal-overlay']} onClick={() => setShowPrevisaoModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3><Calendar size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                Previsão da Semana — {activeTab === 'sgt' ? 'Sgt / Subten' : 'Sd / Cb'}
              </h3>
              <button className={`${styles.btn} ${styles['btn--outline']}`} onClick={exportarPrevisaoPDF} title="Exportar para PDF" style={{ color: '#dc2626', borderColor: '#fca5a5' }}>
                <FileText size={15} /> Exportar PDF
              </button>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px', marginTop: '16px' }}>
              {previsaoSemana.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: '#6b7280', textAlign: 'center', padding: '10px' }}>Nenhum militar escalado na janela selecionada.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left', color: '#374151' }}>
                      <th style={{ padding: '8px' }}>Militar</th>
                      <th style={{ padding: '8px' }}>Dia</th>
                      <th style={{ padding: '8px' }}>Semana</th>
                      <th style={{ padding: '8px' }}>Serviço</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previsaoSemana.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '8px', fontWeight: 500, color: '#111827' }}>{p.militar.pg} {p.militar.nome}</td>
                        <td style={{ padding: '8px' }}>{String(p.diaDoMes).padStart(2, '0')}/{String(parseInt(p.dataStr.split('-')[1])).padStart(2, '0')}</td>
                        <td style={{ padding: '8px' }}>{p.diaDaSemana}</td>
                        <td style={{ padding: '8px' }}>
                          <span className={`${styles['status-badge']} ${styles['status-badge--servico']}`}>
                            {p.tipoServico}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className={styles['modal-actions']}>
              <button className={`${styles.btn} ${styles['btn--outline']}`} onClick={() => setShowPrevisaoModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL — Aditamento ao BI ══════════ */}
      {showAditamentoModal && (
        <ModalAditamento
          onClose={() => setShowAditamentoModal(false)}
          escalaUnificada={escalaUnificada}
          cmtsCia={cmtsCiaMock}
        />
      )}

      {/* ══════════ MODAL — Documento de Pernoite ══════════ */}
      {showPernoiteModal && (
        <ModalPernoite
          onClose={() => setShowPernoiteModal(false)}
          escalaUnificada={escalaUnificada}
          cmtsCia={cmtsCiaMock}
        />
      )}
    </>
  );
}
