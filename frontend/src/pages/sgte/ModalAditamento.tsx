import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { X, FileText, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import styles from '../../styles/escala.module.css';
import adit from '../../styles/aditamento.module.css';

// ─── Tipos ───────────────────────────────────────────────
interface MilitarEscalado {
  pg: string;
  nome: string;
  tipoServico?: string;
}

interface AtividadeGA {
  atividade: string;
  horario: string;
  uniforme: string;
}

interface AditamentoForm {
  numBI: string;
  dataBI: string;

  // 1ª Parte — Serviços Diários (puxado da escala, somente leitura + dia selecionável)
  diaServico: string;

  // 2ª Parte — Instrução
  instrucaoSemAlteracao: boolean;
  instrucaoTexto: string;

  // 3ª Parte — Assuntos Gerais
  assuntosSemAlteracao: boolean;
  assuntosTexto: string;
  atividades: AtividadeGA[];

  // 4ª Parte — Justiça e Disciplina
  justicaSemAlteracao: boolean;
  justicaTexto: string;

  // Assinatura
  cmtCia: string;
}

interface Props {
  onClose: () => void;
  // Toda a escala disponível: dateKey -> lista de militares escalados
  escalaUnificada: Record<string, MilitarEscalado[]>;
  // Lista de Cmts para select
  cmtsCia: string[];
}

const MESES = [
  'janeiro','fevereiro','março','abril','maio','junho',
  'julho','agosto','setembro','outubro','novembro','dezembro',
];

const FEDERAL = 'MINISTÉRIO DA DEFESA';
const EXERCITO = 'EXÉRCITO BRASILEIRO';
const REGIMENTO = 'REGIMENTO IPIRANGA';
const HISTORICO = 'BC PRO DO CE/1842';
const OM_NOME   = '6º BATALHÃO DE INFANTARIA AEROMÓVEL';
const OM_SIGLA  = '6º BI AMV';
const CIA_NOME  = '1ª COMPANHIA DE FUZILEIROS AEROMÓVEL';

function formatDateBR(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d} de ${MESES[parseInt(m) - 1]} de ${y}`;
}

export function ModalAditamento({ onClose, escalaUnificada, cmtsCia }: Props) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const [form, setForm] = useState<AditamentoForm>({
    numBI: '',
    dataBI: todayKey,
    diaServico: todayKey,
    instrucaoSemAlteracao: false,
    instrucaoTexto: '',
    assuntosSemAlteracao: false,
    assuntosTexto: '',
    atividades: [{ atividade: '', horario: '', uniforme: '' }],
    justicaSemAlteracao: false,
    justicaTexto: '',
    cmtCia: cmtsCia[0] || '',
  });

  const [expandedSections, setExpandedSections] = useState({
    parte1: true,
    parte2: true,
    parte3: true,
    parte4: true,
  });

  const toggleSection = (sec: keyof typeof expandedSections) =>
    setExpandedSections(p => ({ ...p, [sec]: !p[sec] }));

  const set = (field: keyof AditamentoForm, value: unknown) =>
    setForm(p => ({ ...p, [field]: value }));

  // Militares escalados no dia selecionado
  const militaresDoDia = escalaUnificada[form.diaServico] || [];

  // Atividades GA
  const addAtividade = () =>
    set('atividades', [...form.atividades, { atividade: '', horario: '', uniforme: '' }]);

  const removeAtividade = (idx: number) =>
    set('atividades', form.atividades.filter((_, i) => i !== idx));

  const updateAtividade = (idx: number, field: keyof AtividadeGA, val: string) => {
    const updated = form.atividades.map((a, i) => i === idx ? { ...a, [field]: val } : a);
    set('atividades', updated);
  };

  // ── Geração do PDF ──────────────────────────────────────
  const gerarPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 18;

    // ── Cabeçalho hierárquico (padrão documento oficial EB) ──
    // Linha 1 — Ministério
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(FEDERAL, pageW / 2, y, { align: 'center' });
    y += 4.5;

    // Linha 2 — Exército Brasileiro
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(EXERCITO, pageW / 2, y, { align: 'center' });
    y += 5;

    // Linha 3 — Regimento
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(REGIMENTO, pageW / 2, y, { align: 'center' });
    y += 4.5;

    // Linha 4 — Histórico
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`"${HISTORICO}"`, pageW / 2, y, { align: 'center' });
    y += 4.5;

    // Linha 5 — OM
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(OM_NOME, pageW / 2, y, { align: 'center' });
    y += 4.5;

    // Linha 6 — Cia
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(CIA_NOME, pageW / 2, y, { align: 'center' });
    y += 6;

    doc.setLineWidth(0.6);
    doc.line(margin, y, pageW - margin, y);
    y += 1;
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageW - margin, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ADITAMENTO AO BOLETIM INTERNO', pageW / 2, y, { align: 'center' });
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nº ${form.numBI || '____'} — ${formatDateBR(form.dataBI) || '____'}`, pageW / 2, y, { align: 'center' });
    y += 5;
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    // ── 1ª Parte: Serviços Diários ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('1ª PARTE — SERVIÇOS DIÁRIOS', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Data de referência: ${formatDateBR(form.diaServico)}`, margin, y);
    y += 4;

    if (militaresDoDia.length === 0) {
      doc.text('Nenhum militar escalado para este dia.', margin + 4, y);
      y += 6;
    } else {
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Posto/Grad.', 'Nome', 'Tipo de Serviço']],
        body: militaresDoDia.map(m => [m.pg, m.nome, m.tipoServico || 'Geral']),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 80, 30], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 250, 245] },
      });
      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
    }

    // ── 2ª Parte: Instrução ──
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('2ª PARTE — INSTRUÇÃO', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (form.instrucaoSemAlteracao) {
      doc.text('Sem alteração.', margin + 4, y);
      y += 6;
    } else {
      const linhas = doc.splitTextToSize(form.instrucaoTexto || 'Sem alteração.', pageW - margin * 2 - 4);
      doc.text(linhas, margin + 4, y);
      y += linhas.length * 4.5 + 4;
    }

    // ── 3ª Parte: Assuntos Gerais ──
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('3ª PARTE — ASSUNTOS GERAIS E ADMINISTRATIVOS', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (form.assuntosSemAlteracao) {
      doc.text('Sem alteração.', margin + 4, y);
      y += 6;
    } else {
      if (form.assuntosTexto) {
        const linhas = doc.splitTextToSize(form.assuntosTexto, pageW - margin * 2 - 4);
        doc.text(linhas, margin + 4, y);
        y += linhas.length * 4.5 + 4;
      }
      const atvs = form.atividades.filter(a => a.atividade);
      if (atvs.length > 0) {
        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          head: [['Atividade', 'Horário', 'Uniforme']],
          body: atvs.map(a => [a.atividade, a.horario, a.uniforme]),
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [30, 80, 30], textColor: 255, fontStyle: 'bold' },
        });
        y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
      }
    }

    // ── 4ª Parte: Justiça e Disciplina ──
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('4ª PARTE — JUSTIÇA E DISCIPLINA', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (form.justicaSemAlteracao) {
      doc.text('Sem alteração.', margin + 4, y);
      y += 6;
    } else {
      const linhas = doc.splitTextToSize(form.justicaTexto || 'Sem alteração.', pageW - margin * 2 - 4);
      doc.text(linhas, margin + 4, y);
      y += linhas.length * 4.5 + 4;
    }

    // ── Assinatura ──
    if (y > 240) { doc.addPage(); y = 20; }
    y += 10;
    doc.line(pageW / 2 - 40, y, pageW / 2 + 40, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(form.cmtCia || '________________________________', pageW / 2, y, { align: 'center' });
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.text(`Cmt ${CIA_NOME}`, pageW / 2, y, { align: 'center' });

    // Rodapé
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150);
      doc.text(`${OM_SIGLA} — Aditamento ao BI Nº ${form.numBI || '___'} — Pág. ${p}/${totalPages}`, pageW / 2, 290, { align: 'center' });
      doc.setTextColor(0);
    }

    doc.save(`aditamento_bi_${form.numBI || 'rascunho'}.pdf`);
  };

  const SectionHeader = ({
    label, section, num,
  }: { label: string; section: keyof typeof expandedSections; num: string }) => (
    <button
      className={adit.sectionHeader}
      onClick={() => toggleSection(section)}
      type="button"
    >
      <span className={adit.sectionNum}>{num}</span>
      <span className={adit.sectionLabel}>{label}</span>
      {expandedSections[section] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </button>
  );

  const SemAlteracaoToggle = ({
    checked, onChange, label,
  }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className={adit.semAlteracaoLabel}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className={adit.semAlteracaoCheck}
      />
      <span>{label}</span>
    </label>
  );

  return (
    <div className={styles['modal-overlay']} onClick={onClose}>
      <div
        className={adit.aditModal}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Cabeçalho do Modal ── */}
        <div className={adit.aditHeader}>
          <div className={adit.aditHeaderLeft}>
            <FileText size={20} className={adit.aditHeaderIcon} />
            <div>
              <h2 className={adit.aditTitle}>Gerar Aditamento</h2>
              <p className={adit.aditSubtitle}>Aditamento ao Boletim Interno — {CIA_NOME}</p>
            </div>
          </div>
          <button className={styles['drawer-close']} onClick={onClose}><X size={16} /></button>
        </div>

        {/* ── Corpo com scroll ── */}
        <div className={adit.aditBody}>

          {/* ─ Dados do BI ─ */}
          <div className={adit.biRow}>
            <div className={styles['modal-field']} style={{ flex: 1 }}>
              <label className={adit.fieldLabel}>Nº do Boletim Interno</label>
              <input
                className={styles['modal-input']}
                placeholder="Ex: 001/2025"
                value={form.numBI}
                onChange={e => set('numBI', e.target.value)}
                autoFocus
              />
            </div>
            <div className={styles['modal-field']} style={{ flex: 1 }}>
              <label className={adit.fieldLabel}>Data do Boletim Interno</label>
              <input
                type="date"
                className={styles['modal-input']}
                value={form.dataBI}
                onChange={e => set('dataBI', e.target.value)}
              />
            </div>
          </div>

          {/* ══ 1ª PARTE: Serviços Diários ══ */}
          <SectionHeader label="Serviços Diários" section="parte1" num="1ª Parte" />
          {expandedSections.parte1 && (
            <div className={adit.sectionBody}>
              <div className={styles['modal-field']}>
                <label className={adit.fieldLabel}>Data de referência do serviço</label>
                <input
                  type="date"
                  className={styles['modal-input']}
                  value={form.diaServico}
                  onChange={e => set('diaServico', e.target.value)}
                />
              </div>
              {militaresDoDia.length === 0 ? (
                <div className={adit.emptyNotice}>
                  <AlertCircle size={14} />
                  Nenhum militar escalado para esta data. Selecione outro dia ou adicione militares à escala.
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

          {/* ══ 2ª PARTE: Instrução ══ */}
          <SectionHeader label="Instrução" section="parte2" num="2ª Parte" />
          {expandedSections.parte2 && (
            <div className={adit.sectionBody}>
              <SemAlteracaoToggle
                checked={form.instrucaoSemAlteracao}
                onChange={v => set('instrucaoSemAlteracao', v)}
                label="Sem alteração"
              />
              {!form.instrucaoSemAlteracao && (
                <div className={styles['modal-field']} style={{ marginTop: 10 }}>
                  <label className={adit.fieldLabel}>Conteúdo</label>
                  <textarea
                    className={adit.aditTextarea}
                    placeholder="Descreva as instruções do período..."
                    value={form.instrucaoTexto}
                    onChange={e => set('instrucaoTexto', e.target.value)}
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}

          {/* ══ 3ª PARTE: Assuntos Gerais ══ */}
          <SectionHeader label="Assuntos Gerais e Administrativos" section="parte3" num="3ª Parte" />
          {expandedSections.parte3 && (
            <div className={adit.sectionBody}>
              <SemAlteracaoToggle
                checked={form.assuntosSemAlteracao}
                onChange={v => set('assuntosSemAlteracao', v)}
                label="Sem alteração"
              />
              {!form.assuntosSemAlteracao && (
                <>
                  <div className={styles['modal-field']} style={{ marginTop: 10 }}>
                    <label className={adit.fieldLabel}>Texto adicional (opcional)</label>
                    <textarea
                      className={adit.aditTextarea}
                      placeholder="Descreva assuntos administrativos gerais..."
                      value={form.assuntosTexto}
                      onChange={e => set('assuntosTexto', e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Tabela de atividades */}
                  <div className={adit.atividadesHeader}>
                    <span className={adit.fieldLabel}>Atividades Programadas</span>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles['btn--outline']}`}
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                      onClick={addAtividade}
                    >
                      + Adicionar linha
                    </button>
                  </div>
                  <div className={adit.atividadesTable}>
                    <div className={adit.atividadesTableHead}>
                      <span>Atividade</span>
                      <span>Horário</span>
                      <span>Uniforme</span>
                      <span></span>
                    </div>
                    {form.atividades.map((a, idx) => (
                      <div key={idx} className={adit.atividadesTableRow}>
                        <input
                          className={adit.atividadeInput}
                          placeholder="Ex: Instrução de tiro"
                          value={a.atividade}
                          onChange={e => updateAtividade(idx, 'atividade', e.target.value)}
                        />
                        <input
                          className={adit.atividadeInput}
                          placeholder="Ex: 08h00 - 10h00"
                          value={a.horario}
                          onChange={e => updateAtividade(idx, 'horario', e.target.value)}
                        />
                        <input
                          className={adit.atividadeInput}
                          placeholder="Ex: Combate"
                          value={a.uniforme}
                          onChange={e => updateAtividade(idx, 'uniforme', e.target.value)}
                        />
                        <button
                          type="button"
                          className={`${styles.btn} ${styles['btn--ghost']}`}
                          style={{ padding: '4px', color: '#ef4444' }}
                          onClick={() => removeAtividade(idx)}
                          disabled={form.atividades.length === 1}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══ 4ª PARTE: Justiça e Disciplina ══ */}
          <SectionHeader label="Justiça e Disciplina" section="parte4" num="4ª Parte" />
          {expandedSections.parte4 && (
            <div className={adit.sectionBody}>
              <SemAlteracaoToggle
                checked={form.justicaSemAlteracao}
                onChange={v => set('justicaSemAlteracao', v)}
                label="Sem alteração"
              />
              {!form.justicaSemAlteracao && (
                <div className={styles['modal-field']} style={{ marginTop: 10 }}>
                  <label className={adit.fieldLabel}>Conteúdo</label>
                  <textarea
                    className={adit.aditTextarea}
                    placeholder="Descreva ocorrências, punições ou absolvições..."
                    value={form.justicaTexto}
                    onChange={e => set('justicaTexto', e.target.value)}
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Assinatura ── */}
          <div className={adit.assinaturaSection}>
            <span className={adit.fieldLabel}>Comandante da Companhia (assinatura)</span>
            {cmtsCia.length > 0 ? (
              <select
                className={styles['modal-select']}
                value={form.cmtCia}
                onChange={e => set('cmtCia', e.target.value)}
              >
                <option value="">— Selecione o Cmt —</option>
                {cmtsCia.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : (
              <input
                className={styles['modal-input']}
                placeholder="Nome e posto do Cmt Cia"
                value={form.cmtCia}
                onChange={e => set('cmtCia', e.target.value)}
              />
            )}
          </div>
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
            <FileText size={15} /> Gerar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
