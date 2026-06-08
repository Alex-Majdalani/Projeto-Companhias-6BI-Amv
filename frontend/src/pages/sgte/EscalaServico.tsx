import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import styles from '../../styles/escala.module.css';
import pageStyles from '../../styles/pages.module.css';

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
  { id: 'c1', nome: 'Silva',      pg: '1º Sgt',   origem: 'importado' },
  { id: 'c2', nome: 'Souza',      pg: '2º Sgt',   origem: 'importado' },
  { id: 'c3', nome: 'Ferreira',   pg: '3º Sgt',   origem: 'importado' },
  { id: 'c4', nome: 'Almeida',    pg: '1º Sgt',   origem: 'importado' },
  { id: 'c5', nome: 'Costa',      pg: 'Subten',   origem: 'importado' },
  { id: 'c6', nome: 'Mendes',     pg: '2º Sgt',   origem: 'importado' },
  { id: 'c7', nome: 'Oliveira',   pg: '3º Sgt',   origem: 'importado' },
  { id: 'c8', nome: 'Lima',       pg: 'Cb',        origem: 'importado', tipoServico: 'G1' },
  { id: 'c9', nome: 'Santos',     pg: 'Sd EP',     origem: 'importado', tipoServico: 'Plantão' },
  { id: 'c10',nome: 'Rocha',      pg: 'Sd EP',     origem: 'importado', tipoServico: 'Reforço' },
  { id: 'c11',nome: 'Barbosa',    pg: 'Cb',        origem: 'importado', tipoServico: 'G2' },
  { id: 'c12',nome: 'Carvalho',   pg: 'Sd EP',     origem: 'importado', tipoServico: 'Cite' },
];

const SGT_PGS  = ['Subten', '1º Sgt', '2º Sgt', '3º Sgt'];
const SD_PGS   = ['Cb', 'Sd EP'];

// ─────────────── Mock pré-escalado para o mês atual ───────────────
function buildMockEscala(year: number, month: number): { sgt: TabState; sd: TabState } {
  const pad = (n: number) => String(n).padStart(2, '0');
  const key = (d: number) => `${year}-${pad(month + 1)}-${pad(d)}`;

  const sgtMilitares: MilitarEscala[] = [
    { id: 'c1', nome: 'Silva',    pg: '1º Sgt', origem: 'importado' },
    { id: 'c2', nome: 'Souza',    pg: '2º Sgt', origem: 'importado' },
    { id: 'c3', nome: 'Ferreira', pg: '3º Sgt', origem: 'importado' },
    { id: 'c4', nome: 'Almeida',  pg: '1º Sgt', origem: 'importado' },
    { id: 'c5', nome: 'Costa',    pg: 'Subten', origem: 'importado' },
  ];

  const sdMilitares: MilitarEscala[] = [
    { id: 'c8',  nome: 'Lima',     pg: 'Cb',    origem: 'importado', tipoServico: 'G1' },
    { id: 'c9',  nome: 'Santos',   pg: 'Sd EP', origem: 'importado', tipoServico: 'Plantão' },
    { id: 'c10', nome: 'Rocha',    pg: 'Sd EP', origem: 'importado', tipoServico: 'Reforço' },
    { id: 'c11', nome: 'Barbosa',  pg: 'Cb',    origem: 'importado', tipoServico: 'G2' },
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
    sd:  { militares: sdMilitares,  escala: sdEscala  },
  };
}


// ─────────────── Helpers ───────────────
const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

function initials(nome: string) {
  return nome.slice(0, 2).toUpperCase();
}

// ─────────────── Componente Principal ───────────────
export function EscalaServico() {
  const today = new Date();
  const [activeTab, setActiveTab] = useState<'sgt' | 'sd'>('sgt');
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [tabs, setTabs] = useState<{ sgt: TabState; sd: TabState }>(
    () => buildMockEscala(today.getFullYear(), today.getMonth())
  );

  // Modais / Drawer
  const [drawerDay, setDrawerDay] = useState<string | null>(null);
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEfetivoModal, setShowEfetivoModal] = useState(false);
  const [importSelected,  setImportSelected]  = useState<string[]>([]);
  const [selectingTipoFor, setSelectingTipoFor] = useState<{ day: string, id: string } | null>(null);

  // Form novo militar
  const [newNome, setNewNome] = useState('');
  const [newPg,   setNewPg]   = useState('');
  const [newTipo, setNewTipo] = useState('');

  // Gerenciamento de Tipos de Serviço
  const [tiposServico, setTiposServico] = useState(['G1', 'G2', 'Reforço', 'Plantão', 'Cite', 'Permanência', 'Pte', 'Auxiliar']);
  const [showTiposModal, setShowTiposModal] = useState(false);
  const [novoTipoInput, setNovoTipoInput] = useState('');

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
      const isWeekend = currDate.getDay() === 0 || currDate.getDay() === 6;
      const key = dateKey(currDate.getFullYear(), currDate.getMonth(), currDate.getDate());
      const onDuty = (tab.escala[key] || []).some(x => x.id === id);

      if (isWeekend) {
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

  const pgOptions = activeTab === 'sgt'
    ? ['Subten', '1º Sgt', '2º Sgt', '3º Sgt']
    : ['Cb', 'Sd EP'];

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
        
        {activeTab === 'sd' && (
          <button className={`${styles.btn} ${styles['btn--outline']}`} onClick={() => setShowTiposModal(true)}>
            <Settings size={15} /> Tipos de Serviço
          </button>
        )}
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
          const extra   = escalados.length - 3;
          return (
            <div
              key={key}
              className={`${styles['cal-cell']} ${isToday(day) ? styles['cal-cell--today'] : ''}`}
              onClick={() => setDrawerDay(key)}
            >
              <div className={styles['cal-day-num']}>{day}</div>
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
              <button className={styles['drawer-close']} onClick={() => setDrawerDay(null)}>✕</button>
            </div>
            <div className={styles['drawer-body']}>
              {tab.militares.length === 0 && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', marginTop: 32 }}>
                  Nenhum militar na lista ainda. Adicione militares para escalonar.
                </p>
              )}
              {tab.militares.map(m => {
                const status = getStatus(m.id, drawerDay);
                const { folgaPreta, folgaVermelha } = status === 'livre' ? calcularFolgas(m.id, drawerDay) : { folgaPreta: 0, folgaVermelha: 0 };
                const isSelecting = selectingTipoFor?.day === drawerDay && selectingTipoFor?.id === m.id;
                
                // Tipo de serviço designado para este dia especificamente
                const entry = (tab.escala[drawerDay] || []).find(x => x.id === m.id);
                const tipoAtual = entry?.tipoServico || m.tipoServico;

                return (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div className={styles['status-row']}>
                      <div className={styles['status-avatar']}>{initials(m.nome)}</div>
                      <div className={styles['status-info']}>
                        <div className={styles['status-name']}>
                          {m.pg} {m.nome} {tipoAtual && status === 'servico' && <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginLeft: 4 }}>({tipoAtual})</span>}
                        </div>
                        <div className={styles['status-pg']}>{m.origem === 'importado' ? 'Importado da Cia' : 'Cadastro manual'}</div>
                      </div>
                      
                      {!isSelecting && status === 'servico' ? (
                        <span className={`${styles['status-badge']} ${styles['status-badge--servico']}`}>
                          ● Serviço
                        </span>
                      ) : !isSelecting && status === 'livre' ? (
                        <span className={`${styles['status-badge']} ${styles['status-badge--livre']}`} style={{ display: 'flex', gap: '8px', padding: '4px 10px' }}>
                          <span title="Folgas Preta (Segunda a Sexta)" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: 8, height: 8, background: '#374151', borderRadius: '2px' }}></span> {folgaPreta}
                          </span>
                          <span style={{ color: '#d1d5db' }}>|</span>
                          <span title="Folgas Vermelha (Sábado e Domingo)" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '2px' }}></span> {folgaVermelha}
                          </span>
                        </span>
                      ) : null}
                      
                      {!isSelecting && (
                        <button
                          className={styles['status-toggle']}
                          title={status === 'servico' ? 'Remover do serviço' : 'Colocar em serviço'}
                          onClick={() => {
                            if (status === 'servico') {
                              toggleDayMilitar(drawerDay, m.id);
                            } else {
                              if (activeTab === 'sd' && tiposServico.length > 0) {
                                setSelectingTipoFor({ day: drawerDay, id: m.id });
                              } else {
                                toggleDayMilitar(drawerDay, m.id);
                              }
                            }
                          }}
                        >
                          {status === 'servico' ? <X size={14} /> : <Check size={14} />}
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
                            toggleDayMilitar(drawerDay, m.id, e.target.value);
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
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL — Adicionar Militar ══════════ */}
      {showAddModal && (
        <div className={styles['modal-overlay']} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3><UserPlus size={18} style={{ display:'inline', marginRight: 8, verticalAlign:'middle' }} />
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
            <h3><Download size={18} style={{ display:'inline', marginRight: 8, verticalAlign:'middle' }} />
              Importar da Cia — {activeTab === 'sgt' ? 'Sgt / Subten' : 'Sd / Cb'}
            </h3>
            {mockFiltrado.length === 0
              ? <p style={{ color:'var(--color-text-muted)', fontSize:'0.85rem' }}>Nenhum militar cadastrado com esse perfil.</p>
              : mockFiltrado.map(m => {
                  const jaAdicionado = jaImportadosIds.includes(m.id);
                  return (
                    <label key={m.id} className={styles['import-item']} style={jaAdicionado ? { opacity: 0.4, cursor:'not-allowed' } : {}}>
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
            <h3><Settings size={18} style={{ display:'inline', marginRight: 8, verticalAlign:'middle' }} />
              Gerenciar Tipos de Serviço
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
            <h3><ClipboardList size={18} style={{ display:'inline', marginRight: 8, verticalAlign:'middle' }} />
              Efetivo — {activeTab === 'sgt' ? 'Sgt / Subten' : 'Sd / Cb'}
            </h3>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px', marginTop: '16px' }}>
              {tab.militares.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: '#6b7280', textAlign: 'center', padding: '10px' }}>Nenhum militar no efetivo.</p>
              ) : (
                tab.militares.map(m => {
                  const dataAtual = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
                  const { folgaPreta, folgaVermelha } = calcularFolgas(m.id, dataAtual);
                  
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f3f4f6' }}>
                      <div>
                        <span style={{ fontSize: '0.85rem', color: '#111827', fontWeight: 600 }}>{m.pg} {m.nome}</span>
                        {m.tipoServico && <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginLeft: 4 }}>({m.tipoServico})</span>}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className={`${styles['status-badge']} ${styles['status-badge--livre']}`} style={{ display: 'flex', gap: '8px', padding: '4px 10px' }}>
                          <span title="Folga Preta (Segunda a Sexta)" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: 8, height: 8, background: '#374151', borderRadius: '2px' }}></span> {folgaPreta}
                          </span>
                          <span style={{ color: '#d1d5db' }}>|</span>
                          <span title="Folga Vermelha (Sábado e Domingo)" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '2px' }}></span> {folgaVermelha}
                          </span>
                        </span>
                        
                        <button className={`${styles.btn} ${styles['btn--ghost']}`} style={{ padding: '4px' }} onClick={() => removeMilitar(m.id)} title="Remover do efetivo">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className={styles['modal-actions']}>
              <button className={`${styles.btn} ${styles['btn--outline']}`} onClick={() => setShowEfetivoModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
