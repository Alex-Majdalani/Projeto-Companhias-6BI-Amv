import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileText,
  Moon,
  Users,
  CheckSquare,
  Square,
  X,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import styles from '../../styles/escala.module.css';
import adit from '../../styles/aditamento.module.css';
import pern from '../../styles/pernoite.module.css';

// ─── Constantes OM ───────────────────────────────────────
const FEDERAL   = 'MINISTÉRIO DA DEFESA';
const EXERCITO  = 'EXÉRCITO BRASILEIRO';
const REGIMENTO = 'REGIMENTO IPIRANGA';
const HISTORICO = 'BC PRO DO CE/1842';
const OM_NOME   = '6º BATALHÃO DE INFANTARIA AEROMÓVEL';
const OM_SIGLA  = '6º BI AMV';
const CIA_NOME  = '1ª COMPANHIA DE FUZILEIROS AEROMÓVEL';

const MESES = [
  'janeiro','fevereiro','março','abril','maio','junho',
  'julho','agosto','setembro','outubro','novembro','dezembro',
];

const DIAS_SEMANA = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];

// ─── Tipos ───────────────────────────────────────────────
interface MilitarEscalado {
  pg: string;
  nome: string;
  tipoServico?: string;
}

interface MilitarPunido {
  pg: string;
  nome: string;
}

interface Props {
  onClose: () => void;
  // Toda a escala disponível: dateKey -> lista de militares escalados
  escalaUnificada: Record<string, MilitarEscalado[]>;
  // Lista de Cmts para select (ou já string do Cmt)
  cmtsCia: string[];
}

// Mock das Funções Cia — em produção virá via context/API
const MOCK_FUNCOES = {
  sgte: '3º Sgt NOGUEIRA',
};

function formatDateBR(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return `${String(d).padStart(2,'0')} de ${MESES[m - 1]} de ${y} (${DIAS_SEMANA[dow]})`;
}

function todayKey(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
}

// ─── Componente ──────────────────────────────────────────
export function ModalPernoite({ onClose, escalaUnificada, cmtsCia }: Props) {
  const today = todayKey();

  // Dados do formulário
  const [diaRef, setDiaRef] = useState(today);
  const [ofDia, setOfDia] = useState('');
  const [sgtDia, setSgtDia] = useState('');
  const [cmtCia, setCmtCia] = useState(cmtsCia[0] || '');
  const [sgte, setSgte] = useState(MOCK_FUNCOES.sgte);

  // Militares punidos (adicionados manualmente)
  const [punidos, setPunidos] = useState<MilitarPunido[]>([]);

  // Militares escalados no dia selecionado
  const militaresDoDia: MilitarEscalado[] = escalaUnificada[diaRef] || [];

  // ── Handlers Punidos ──
  const addPunido = () => setPunidos([...punidos, { pg: '', nome: '' }]);
  const removePunido = (idx: number) => setPunidos(punidos.filter((_, i) => i !== idx));
  const updatePunido = (idx: number, field: keyof MilitarPunido, val: string) => {
    setPunidos(punidos.map((p, i) => (i === idx ? { ...p, [field]: val } : p)));
  };

  // ── Seções Colapsáveis ──
  const [expandedSections, setExpandedSections] = useState({
    dataRef: true,
    militares: true,
    punidos: true,
    assinaturas: true,
    ocorrencias: true,
  });

  const toggleSection = (s: keyof typeof expandedSections) => {
    setExpandedSections(p => ({ ...p, [s]: !p[s] }));
  };

  const SectionHeader = ({ label, section, num }: { label: string, section: keyof typeof expandedSections, num: string }) => (
    <div className={adit.sectionHeader} onClick={() => toggleSection(section)}>
      <span className={adit.sectionNum}>{num}</span>
      <span className={adit.sectionLabel}>{label}</span>
      {expandedSections[section] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </div>
  );

  // ── Gerador de PDF ──────────────────────────────────────
  const gerarPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 18;

    // ── Cabeçalho hierárquico ──
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(FEDERAL, pageW / 2, y, { align: 'center' });
    y += 4.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(EXERCITO, pageW / 2, y, { align: 'center' });
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(REGIMENTO, pageW / 2, y, { align: 'center' });
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`"${HISTORICO}"`, pageW / 2, y, { align: 'center' });
    y += 4.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(OM_NOME, pageW / 2, y, { align: 'center' });
    y += 4.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(CIA_NOME, pageW / 2, y, { align: 'center' });
    y += 6;

    // Dupla linha separadora
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageW - margin, y);
    y += 1;
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageW - margin, y);
    y += 7;

    // ── Título ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('DOCUMENTO DE PERNOITE', pageW / 2, y, { align: 'center' });
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(formatDateBR(diaRef), pageW / 2, y, { align: 'center' });
    y += 5;

    doc.setLineWidth(0.2);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    // ── Militares em Serviço ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('MILITARES EM SERVIÇO', margin, y);
    y += 5;

    if (militaresDoDia.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('Nenhum militar escalado para este dia.', margin + 4, y);
      y += 8;
    } else {
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Posto/Graduação', 'Nome de Guerra', 'Tipo de Serviço']],
        body: militaresDoDia.map(m => [m.pg, m.nome, m.tipoServico || 'Geral']),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [30, 80, 30], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 250, 245] },
      });
      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    }

    // ── Militares Punidos ──
    if (punidos.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('MILITARES PUNIDOS', margin, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Posto/Graduação', 'Nome de Guerra']],
        body: punidos.map(p => [p.pg, p.nome]),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [139, 0, 0], textColor: 255, fontStyle: 'bold' }, // Vermelho escuro para punidos
        alternateRowStyles: { fillColor: [255, 245, 245] },
      });
      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    }

    // ── Pernoite com/sem alteração ──
    if (y > 240) { doc.addPage(); y = 20; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('OCORRÊNCIAS DO PERNOITE', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (semAlteracao) {
      doc.text('Sem alteração.', margin + 4, y);
      y += 8;
    } else {
      // Linhas em branco para preenchimento manual
      const linhaLargura = pageW - margin * 2;
      for (let i = 0; i < numLinhas; i++) {
        doc.line(margin, y, margin + linhaLargura, y);
        y += 8;
      }
    }

    // ── Bloco de Assinaturas ──
    if (y > 220) { doc.addPage(); y = 20; }
    y += 10;

    const colW = (pageW - margin * 2) / 4;
    const assinaturas = [
      { cargo: 'Of Dia', nome: ofDia || '________________________' },
      { cargo: 'Sgt Dia', nome: sgtDia || '________________________' },
      { cargo: 'Sargenteante', nome: sgte || '________________________' },
      { cargo: `Cmt ${CIA_NOME.split(' ')[0]} Cia`, nome: cmtCia || '________________________' },
    ];

    // Linha de assinatura
    assinaturas.forEach((a, i) => {
      const x = margin + i * colW + colW / 2;
      doc.line(x - colW * 0.38, y, x + colW * 0.38, y);
    });
    y += 4;

    // Nome
    assinaturas.forEach((a, i) => {
      const x = margin + i * colW + colW / 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      const nomeLinhas = doc.splitTextToSize(a.nome, colW - 4);
      doc.text(nomeLinhas, x, y, { align: 'center' });
    });
    y += 5;

    // Cargo
    assinaturas.forEach((a, i) => {
      const x = margin + i * colW + colW / 2;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(a.cargo, x, y, { align: 'center' });
    });

    // Rodapé
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150);
      doc.text(`${OM_SIGLA} — Documento de Pernoite — ${formatDateBR(diaRef)} — Pág. ${p}/${totalPages}`, pageW / 2, 290, { align: 'center' });
      doc.setTextColor(0);
    }

    doc.save(`pernoite_${diaRef}.pdf`);
  };

  return (
    <div className={styles['modal-overlay']} onClick={onClose}>
      <div
        className={adit.aditModal}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Cabeçalho do Modal ── */}
        <div className={adit.aditHeader}>
          <div className={adit.aditHeaderLeft}>
            <Moon size={20} className={adit.aditHeaderIcon} />
            <div>
              <h2 className={adit.aditTitle}>Gerar Pernoite</h2>
              <p className={adit.aditSubtitle}>Documento de Pernoite — {CIA_NOME}</p>
            </div>
          </div>
          <button className={styles['drawer-close']} onClick={onClose}><X size={16} /></button>
        </div>

        {/* ── Corpo com scroll ── */}
        <div className={adit.aditBody} style={{ gap: '16px' }}>

          {/* ══ 1. Data de Referência ══ */}
          <SectionHeader label="Data de Referência" section="dataRef" num="1" />
          {expandedSections.dataRef && (
            <div className={adit.sectionBody}>
              <div className={pern.fieldGroup} style={{ maxWidth: 200 }}>
                <label className={pern.label}>Data do Pernoite</label>
                <input
                  type="date"
                  className={pern.input}
                  value={diaRef}
                  onChange={e => setDiaRef(e.target.value)}
                />
                {diaRef && (
                  <span className={pern.dateFmt}>{formatDateBR(diaRef)}</span>
                )}
              </div>
            </div>
          )}

          {/* ══ 2. Militares em Serviço ══ */}
          <SectionHeader label={`Militares em Serviço (${militaresDoDia.length})`} section="militares" num="2" />
          {expandedSections.militares && (
            <div className={adit.sectionBody}>
              {militaresDoDia.length === 0 ? (
                <div className={adit.emptyNotice}>
                  <AlertCircle size={14} />
                  Nenhum militar encontrado na escala para esta data. Verifique a Escala de Serviço.
                </div>
              ) : (
                <div className={adit.servicoTable}>
                  <div className={adit.servicoTableHead}>
                    <span>Posto/Grad.</span>
                    <span>Nome</span>
                    <span>Tipo de Serviço</span>
                  </div>
                  {militaresDoDia.map((m, i) => (
                    <div key={i} className={adit.servicoTableRow}>
                      <span className={adit.servicoPg}>{m.pg}</span>
                      <span className={adit.servicoNome}>{m.nome}</span>
                      <span className={adit.servicoTipo}>{m.tipoServico || 'Geral'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ 3. Militares Punidos ══ */}
          <SectionHeader label={`Militares Punidos (${punidos.length})`} section="punidos" num="3" />
          {expandedSections.punidos && (
            <div className={adit.sectionBody}>
              <div className={adit.atividadesHeader}>
                <span className={adit.fieldLabel}>Militares Punidos no Pernoite</span>
                <button
                  type="button"
                  className={`${styles.btn} ${styles['btn--outline']}`}
                  style={{ fontSize: '0.75rem', padding: '4px 10px', color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={addPunido}
                >
                  + Adicionar Militar
                </button>
              </div>

              {punidos.length === 0 ? (
                <div className={adit.emptyNotice} style={{ background: '#f9fafb', borderColor: '#e5e7eb', color: '#6b7280' }}>
                  Nenhum militar punido adicionado.
                </div>
              ) : (
                <div className={adit.atividadesTable}>
                  <div className={adit.atividadesTableHead} style={{ gridTemplateColumns: '120px 1fr 36px', background: 'linear-gradient(135deg, #7f1d1d, #b91c1c)' }}>
                    <span>Posto/Grad.</span>
                    <span>Nome</span>
                    <span></span>
                  </div>
                  {punidos.map((p, idx) => (
                    <div key={idx} className={adit.atividadesTableRow} style={{ gridTemplateColumns: '120px 1fr 36px' }}>
                      <input
                        className={adit.atividadeInput}
                        placeholder="Ex: Sd"
                        value={p.pg}
                        onChange={e => updatePunido(idx, 'pg', e.target.value)}
                      />
                      <input
                        className={adit.atividadeInput}
                        placeholder="Ex: SILVA"
                        value={p.nome}
                        onChange={e => updatePunido(idx, 'nome', e.target.value)}
                      />
                      <button
                        type="button"
                        className={`${styles.btn} ${styles['btn--ghost']}`}
                        style={{ padding: '4px', color: '#ef4444' }}
                        onClick={() => removePunido(idx)}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ 4. Assinaturas ══ */}
          <SectionHeader label="Assinaturas" section="assinaturas" num="4" />
          {expandedSections.assinaturas && (
            <div className={adit.sectionBody}>
              <div className={pern.sigGrid}>

                <div className={pern.fieldGroup}>
                  <label className={pern.label}>Of Dia</label>
                  <input
                    className={pern.input}
                    placeholder="Ex: 2º Ten SILVA"
                    value={ofDia}
                    onChange={e => setOfDia(e.target.value)}
                  />
                  <span className={pern.sigCargo}>Oficial do Dia</span>
                </div>

                <div className={pern.fieldGroup}>
                  <label className={pern.label}>Sgt Dia</label>
                  <input
                    className={pern.input}
                    placeholder="Ex: 3º Sgt FERREIRA"
                    value={sgtDia}
                    onChange={e => setSgtDia(e.target.value)}
                  />
                  <span className={pern.sigCargo}>Sargento do Dia</span>
                </div>

                <div className={pern.fieldGroup}>
                  <label className={pern.label}>
                    Sargenteante
                    <span className={pern.labelBadge}>Funções Cia</span>
                  </label>
                  <input
                    className={pern.input}
                    value={sgte}
                    onChange={e => setSgte(e.target.value)}
                  />
                  <span className={pern.sigCargo}>Sargenteante</span>
                </div>

                <div className={pern.fieldGroup}>
                  <label className={pern.label}>
                    Cmt Cia
                    <span className={pern.labelBadge}>Funções Cia</span>
                  </label>
                  {cmtsCia.length > 0 ? (
                    <select
                      className={pern.input}
                      value={cmtCia}
                      onChange={e => setCmtCia(e.target.value)}
                    >
                      <option value="">— Selecione o Cmt —</option>
                      {cmtsCia.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={pern.input}
                      value={cmtCia}
                      onChange={e => setCmtCia(e.target.value)}
                    />
                  )}
                  <span className={pern.sigCargo}>Comandante da Cia</span>
                </div>

              </div>
            </div>
          )}

          {/* ══ 5. Ocorrências do Pernoite ══ */}
          <SectionHeader label="Ocorrências do Pernoite" section="ocorrencias" num="5" />
          {expandedSections.ocorrencias && (
            <div className={adit.sectionBody}>
              <div className={pern.toggleRow}>
                <button
                  type="button"
                  className={`${pern.toggleBtn} ${semAlteracao ? pern.toggleBtnActive : ''}`}
                  onClick={() => setSemAlteracao(true)}
                >
                  {semAlteracao ? <CheckSquare size={16} /> : <Square size={16} />}
                  Sem Alteração
                </button>
                <button
                  type="button"
                  className={`${pern.toggleBtn} ${!semAlteracao ? pern.toggleBtnActive : ''}`}
                  onClick={() => setSemAlteracao(false)}
                >
                  {!semAlteracao ? <CheckSquare size={16} /> : <Square size={16} />}
                  Com Ocorrências
                </button>
              </div>

              {!semAlteracao && (
                <div className={pern.linhasConfig} style={{ marginTop: 12 }}>
                  <span className={pern.label}>Número de linhas para preenchimento manual no PDF:</span>
                  <div className={pern.linhasControls}>
                    <button
                      type="button"
                      className={pern.linhaBtn}
                      onClick={() => setNumLinhas(n => Math.max(1, n - 1))}
                    >−</button>
                    <span className={pern.linhasNum}>{numLinhas}</span>
                    <button
                      type="button"
                      className={pern.linhaBtn}
                      onClick={() => setNumLinhas(n => Math.min(20, n + 1))}
                    >+</button>
                  </div>
                  <div className={pern.linhasPreview}>
                    {Array.from({ length: numLinhas }).map((_, i) => (
                      <div key={i} className={pern.linhaPreviewItem} />
                    ))}
                  </div>
                </div>
              )}

              {semAlteracao && (
                <div className={pern.semAlteracaoDisplay} style={{ marginTop: 12 }}>
                  ✓ O documento será gerado com "Sem alteração."
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── Rodapé com ações ── */}
        <div className={adit.aditFooter}>
          <button
            className={`${styles.btn} ${styles['btn--outline']}`}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className={`${styles.btn} ${styles['btn--primary']}`}
            onClick={gerarPDF}
          >
            <FileText size={15} /> Gerar Documento de Pernoite
          </button>
        </div>
      </div>
    </div>
  );
}
