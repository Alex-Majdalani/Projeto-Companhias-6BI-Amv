import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileText,
  Moon,
  Users,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import styles from '../../styles/pages.module.css';
import escala from '../../styles/escala.module.css';
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

// Mock da Escala — em produção virá via prop/context
const MOCK_ESCALA: Record<string, MilitarEscalado[]> = {};

// Mock das Funções Cia — em produção virá via context/API
const MOCK_FUNCOES = {
  cmtCia:  '1º Ten SILVA',
  sgte:    '3º Sgt NOGUEIRA',
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
export function Pernoite() {
  const today = todayKey();

  // Dados do formulário
  const [diaRef, setDiaRef] = useState(today);
  const [ofDia, setOfDia] = useState('');
  const [sgtDia, setSgtDia] = useState('');
  const [cmtCia, setCmtCia] = useState(MOCK_FUNCOES.cmtCia);
  const [sgte, setSgte] = useState(MOCK_FUNCOES.sgte);

  // Pernoite: com ou sem alteração
  const [semAlteracao, setSemAlteracao] = useState(false);
  const [numLinhas, setNumLinhas] = useState(6);

  // Militares escalados no dia selecionado
  const militaresDoDia: MilitarEscalado[] = MOCK_ESCALA[diaRef] || [];

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
    <div>
      {/* ── Cabeçalho da página ── */}
      <div className={styles['page-header']}>
        <p className={styles['page-header__eyebrow']}>Sargenteação</p>
        <h1 style={{ color: 'var(--color-primary)' }}>Pernoite</h1>
        <p>Gere o documento de pernoite com os militares em serviço.</p>
      </div>

      {/* ── Formulário ── */}
      <div className={pern.container}>

        {/* Seção: Data */}
        <div className={pern.card}>
          <div className={pern.cardHeader}>
            <Moon size={18} className={pern.cardIcon} />
            <h2 className={pern.cardTitle}>Data de Referência</h2>
          </div>
          <div className={pern.cardBody}>
            <div className={pern.fieldGroup}>
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
        </div>

        {/* Seção: Militares em Serviço */}
        <div className={pern.card}>
          <div className={pern.cardHeader}>
            <Users size={18} className={pern.cardIcon} />
            <h2 className={pern.cardTitle}>Militares em Serviço</h2>
            <span className={pern.badge}>{militaresDoDia.length} escalados</span>
          </div>
          <div className={pern.cardBody}>
            {militaresDoDia.length === 0 ? (
              <div className={pern.emptyNotice}>
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
        </div>

        {/* Seção: Assinaturas */}
        <div className={pern.card}>
          <div className={pern.cardHeader}>
            <FileText size={18} className={pern.cardIcon} />
            <h2 className={pern.cardTitle}>Assinaturas</h2>
          </div>
          <div className={pern.cardBody}>
            <div className={pern.sigGrid}>

              {/* Of Dia */}
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

              {/* Sgt Dia */}
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

              {/* Sargenteante — puxado de Funções Cia */}
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

              {/* Cmt Cia — puxado de Funções Cia */}
              <div className={pern.fieldGroup}>
                <label className={pern.label}>
                  Cmt Cia
                  <span className={pern.labelBadge}>Funções Cia</span>
                </label>
                <input
                  className={pern.input}
                  value={cmtCia}
                  onChange={e => setCmtCia(e.target.value)}
                />
                <span className={pern.sigCargo}>Comandante da Cia</span>
              </div>

            </div>
          </div>
        </div>

        {/* Seção: Ocorrências do Pernoite */}
        <div className={pern.card}>
          <div className={pern.cardHeader}>
            <CheckSquare size={18} className={pern.cardIcon} />
            <h2 className={pern.cardTitle}>Ocorrências do Pernoite</h2>
          </div>
          <div className={pern.cardBody}>

            {/* Toggle sem alteração */}
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

            {/* Quantidade de linhas */}
            {!semAlteracao && (
              <div className={pern.linhasConfig}>
                <span className={pern.label}>Número de linhas para preenchimento manual:</span>
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

                {/* Preview das linhas */}
                <div className={pern.linhasPreview}>
                  {Array.from({ length: numLinhas }).map((_, i) => (
                    <div key={i} className={pern.linhaPreviewItem} />
                  ))}
                </div>
              </div>
            )}

            {semAlteracao && (
              <div className={pern.semAlteracaoDisplay}>
                ✓ O documento será gerado com "Sem alteração."
              </div>
            )}
          </div>
        </div>

        {/* Botão gerar PDF */}
        <div className={pern.actions}>
          <button
            className={`${escala.btn} ${escala['btn--primary']}`}
            style={{ padding: '12px 32px', fontSize: '0.95rem' }}
            onClick={gerarPDF}
          >
            <FileText size={18} /> Gerar Documento de Pernoite (PDF)
          </button>
        </div>

      </div>
    </div>
  );
}
