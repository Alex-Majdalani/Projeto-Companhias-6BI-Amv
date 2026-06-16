import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─────────────────────────────────────────────────────────────────────────────
// Comentário de organização: Utilitário de geração de PDF para perfil do militar.
// Usa jsPDF + jspdf-autotable para gerar um documento formatado com estilo militar.
// ─────────────────────────────────────────────────────────────────────────────

// Comentário de organização: Cor verde militar principal usada como destaque no PDF
const COR_MILITAR_R = 22;
const COR_MILITAR_G = 101;
const COR_MILITAR_B = 52;

// Comentário de organização: Cor cinza escuro para textos secundários
const COR_TEXTO_LABEL = [120, 120, 120] as [number, number, number];
const COR_TEXTO_VALOR = [30, 30, 30] as [number, number, number];

/** Comentário de organização: Formata datas ISO para DD/MM/AAAA */
function formatarData(d: string): string {
  if (!d) return '—';
  const p = d.split('T')[0].split('-');
  if (p.length < 3) return d;
  return `${p[2]}/${p[1]}/${p[0]}`;
}

/** Comentário de organização: Formata altura com vírgula */
function formatarAltura(a: any): string {
  if (!a && a !== 0) return '—';
  return String(a).replace('.', ',') + ' m';
}

/** Comentário de organização: Calcula idade */
function calcularIdade(data: string): string {
  if (!data) return '—';
  const nasc = new Date(data);
  const hoje = new Date();
  let age = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) age--;
  return age >= 0 ? `${age} anos` : '—';
}

// ─────────────────────────────────────────────────────────────────────────────
// Função principal: gera e faz download do PDF do perfil do militar
// ─────────────────────────────────────────────────────────────────────────────
export function exportarPerfilPDF(perfil: any): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();  // 210mm
  const ph = doc.internal.pageSize.getHeight(); // 297mm
  let y = 0;

  // ── CABEÇALHO VERDE ────────────────────────────────────────────────────────
  doc.setFillColor(COR_MILITAR_R, COR_MILITAR_G, COR_MILITAR_B);
  doc.rect(0, 0, pw, 38, 'F');

  // Título do documento
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('6º BATALHÃO DE INFANTARIA', pw / 2, 10, { align: 'center' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FICHA DE PERFIL DO MILITAR', pw / 2, 20, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, pw / 2, 28, { align: 'center' });

  y = 45;

  // ── IDENTIFICAÇÃO PRINCIPAL ────────────────────────────────────────────────
  // Nome completo em destaque
  const nomeCompleto = perfil.dadosCivil?.nomeCompleto || perfil.nomeGuerra || '—';
  const nomeGuerra = perfil.nomeGuerra || '';

  doc.setTextColor(COR_MILITAR_R, COR_MILITAR_G, COR_MILITAR_B);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(nomeCompleto, 14, y);
  y += 6;

  doc.setTextColor(...COR_TEXTO_LABEL);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const subTitulo = [perfil.postoGraduacao, nomeGuerra].filter(Boolean).join(' · ');
  doc.text(subTitulo, 14, y);
  y += 8;

  // Linha divisória
  doc.setDrawColor(COR_MILITAR_R, COR_MILITAR_G, COR_MILITAR_B);
  doc.setLineWidth(0.5);
  doc.line(14, y, pw - 14, y);
  y += 6;

  // ── SEÇÃO 1: DADOS MILITARES ───────────────────────────────────────────────
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COR_MILITAR_R, COR_MILITAR_G, COR_MILITAR_B);
  doc.text('DADOS MILITARES', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    tableWidth: pw - 28,
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [248, 250, 248], textColor: COR_TEXTO_LABEL, fontStyle: 'bold', fontSize: 7.5, halign: 'left' },
    bodyStyles: { textColor: COR_TEXTO_VALOR },
    columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 'auto' } },
    body: [
      ['Posto/Graduação', perfil.postoGraduacao || '—'],
      ['Nome de Guerra', perfil.nomeGuerra || '—'],
      ['Identidade Militar (IDT)', perfil.idtMilitar || '—'],
      ['Nº Campo Básico', perfil.numeroCampoBasico || '—'],
      ['Nº EBCA', perfil.numeroEbca || '—'],
      ['Data de Praça', formatarData(perfil.dataPraca)],
      ['Turma de Formação', perfil.turmaFormacao || '—'],
      ['Tipo de Vínculo', perfil.tipoVinculo || '—'],
      ['Companhia', perfil.companhia || '—'],
      ['Pelotão', perfil.pelotao || '—'],
    ],
    // Comentário de organização: Zebra listrada para melhor leitura
    didParseCell: (data) => {
      if (data.row.index % 2 === 0) {
        data.cell.styles.fillColor = [248, 250, 248];
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── SEÇÃO 2: DADOS PESSOAIS ────────────────────────────────────────────────
  if (y > ph - 60) { doc.addPage(); y = 20; }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COR_MILITAR_R, COR_MILITAR_G, COR_MILITAR_B);
  doc.text('DADOS PESSOAIS', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    tableWidth: pw - 28,
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [248, 250, 248], textColor: COR_TEXTO_LABEL, fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { textColor: COR_TEXTO_VALOR },
    columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 'auto' } },
    body: [
      ['Nome Completo', perfil.dadosCivil?.nomeCompleto || '—'],
      ['Data de Nascimento', formatarData(perfil.dadosCivil?.dataNascimento)],
      ['Idade', calcularIdade(perfil.dadosCivil?.dataNascimento)],
      ['CPF', perfil.dadosCivil?.cpf || '—'],
      ['Identidade Civil', perfil.dadosCivil?.idtCivil || '—'],
      ['Altura', formatarAltura(perfil.dadosCivil?.altura)],
      ['Tipo Sanguíneo / Fator RH', `${perfil.dadosCivil?.tipoSanguineo || '—'} ${perfil.dadosCivil?.fatorRh || ''}`],
      ['Cutis', perfil.dadosCivil?.cutis || '—'],
      ['Olhos', perfil.dadosCivil?.olhos || '—'],
      ['Cabelos', perfil.dadosCivil?.cabelos || '—'],
      ['Religião', perfil.dadosCivil?.religiao || '—'],
      ['Escolaridade', perfil.dadosCivil?.escolaridade || '—'],
    ],
    didParseCell: (data) => {
      if (data.row.index % 2 === 0) {
        data.cell.styles.fillColor = [248, 250, 248];
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── SEÇÃO 3: ENDEREÇO E CONTATO ────────────────────────────────────────────
  if (y > ph - 60) { doc.addPage(); y = 20; }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COR_MILITAR_R, COR_MILITAR_G, COR_MILITAR_B);
  doc.text('ENDEREÇO E CONTATO', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    tableWidth: pw - 28,
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [248, 250, 248], textColor: COR_TEXTO_LABEL, fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { textColor: COR_TEXTO_VALOR },
    columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 'auto' } },
    body: [
      ['CEP', perfil.endereco?.cep || '—'],
      ['Logradouro', `${perfil.endereco?.rua || '—'}, ${perfil.endereco?.numero || 'S/N'}${perfil.endereco?.complemento ? ' — ' + perfil.endereco.complemento : ''}`],
      ['Bairro', perfil.endereco?.bairro || '—'],
      ['Cidade / UF', `${perfil.endereco?.cidade || '—'} / ${perfil.endereco?.uf || '—'}`],
      ['Telefone', perfil.contato?.telefone || '—'],
      ['Contato de Emergência', `${perfil.contato?.nomeEmergencia || '—'} (${perfil.contato?.grauParentesco || '—'}) — ${perfil.contato?.telefoneEmergencia || '—'}`],
      ['Reside com', perfil.contato?.coabitacao || '—'],
    ],
    didParseCell: (data) => {
      if (data.row.index % 2 === 0) {
        data.cell.styles.fillColor = [248, 250, 248];
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── SEÇÃO 4: REDES SOCIAIS ─────────────────────────────────────────────────
  const temRedeSocial = Object.values(perfil.redesSociais || {}).some(v => v);
  if (temRedeSocial) {
    if (y > ph - 40) { doc.addPage(); y = 20; }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COR_MILITAR_R, COR_MILITAR_G, COR_MILITAR_B);
    doc.text('REDES SOCIAIS', 14, y);
    y += 4;

    const redesBody = [
      ['Instagram', perfil.redesSociais?.instagram || '—'],
      ['Facebook', perfil.redesSociais?.facebook || '—'],
      ['TikTok', perfil.redesSociais?.tiktok || '—'],
      ['Twitter / X', perfil.redesSociais?.twitter || '—'],
    ].filter(r => r[1] !== '—');

    if (redesBody.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: { left: 14, right: 14 },
        tableWidth: pw - 28,
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        bodyStyles: { textColor: COR_TEXTO_VALOR },
        columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 'auto' } },
        body: redesBody,
        didParseCell: (data) => {
          if (data.row.index % 2 === 0) {
            data.cell.styles.fillColor = [248, 250, 248];
          }
        },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // ── RODAPÉ em todas as páginas ──────────────────────────────────────────────
  const numPages = doc.getNumberOfPages();
  for (let i = 1; i <= numPages; i++) {
    doc.setPage(i);
    doc.setFillColor(COR_MILITAR_R, COR_MILITAR_G, COR_MILITAR_B);
    doc.rect(0, ph - 10, pw, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('6º BI INF — Sistema de Gestão de Tropas (SGTE)', 14, ph - 4);
    doc.text(`Página ${i} de ${numPages}`, pw - 14, ph - 4, { align: 'right' });
  }

  // Comentário de organização: Faz o download com nome baseado no nome de guerra do militar
  const nomeArquivo = `perfil_${(perfil.nomeGuerra || 'militar').toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(nomeArquivo);
}

// ─────────────────────────────────────────────────────────────────────────────
// Comentário de organização: Gera um PDF resumido de múltiplos militares
// para exportação em lote a partir da listagem de militares.
// ─────────────────────────────────────────────────────────────────────────────
export function exportarListaMilitaresPDF(militares: any[]): void {
  if (!militares || militares.length === 0) return;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();  // 297mm
  const ph = doc.internal.pageSize.getHeight(); // 210mm

  // ── CABEÇALHO ──────────────────────────────────────────────────────────────
  doc.setFillColor(COR_MILITAR_R, COR_MILITAR_G, COR_MILITAR_B);
  doc.rect(0, 0, pw, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('6º BATALHÃO DE INFANTARIA', pw / 2, 9, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('LISTAGEM DE MILITARES', pw / 2, 19, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} — Total: ${militares.length} militar(es)`, pw / 2, 27, { align: 'center' });

  // ── TABELA PRINCIPAL ───────────────────────────────────────────────────────
  autoTable(doc, {
    startY: 38,
    margin: { left: 10, right: 10 },
    tableWidth: pw - 20,
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: {
      fillColor: [COR_MILITAR_R, COR_MILITAR_G, COR_MILITAR_B],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    bodyStyles: { textColor: COR_TEXTO_VALOR },
    alternateRowStyles: { fillColor: [248, 250, 248] },
    head: [['Nº', 'POSTO/GRAD.', 'NOME DE GUERRA', 'CPF', 'IDENTIDADE MIL.', 'SUBUNIDADE', 'PELOTÃO', 'VÍNCULO', 'SITUAÇÃO']],
    body: militares.map((m, idx) => [
      String(idx + 1),
      m.posto || '—',
      m.nomeGuerra || m.nome || '—',
      m.cpf || '—',
      m.identidade || '—',
      m.subunidade || m.companhia || '—',
      m.pelotao || '—',
      m.tipoVinculo || '—',
      m.situacao || 'Ativo',
    ]),
    didDrawCell: (data) => {
      // Comentário de organização: Colorir célula de situação conforme status
      if (data.section === 'body' && data.column.index === 8) {
        const val = String(data.cell.raw || '');
        if (val === 'Ativo') {
          doc.setFillColor(220, 252, 231);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          doc.setTextColor(22, 101, 52);
          doc.setFontSize(8);
          doc.text(val, data.cell.x + 2, data.cell.y + data.cell.height / 2 + 1.5);
        }
      }
    },
  });

  // ── RODAPÉ ─────────────────────────────────────────────────────────────────
  const numPages = doc.getNumberOfPages();
  for (let i = 1; i <= numPages; i++) {
    doc.setPage(i);
    doc.setFillColor(COR_MILITAR_R, COR_MILITAR_G, COR_MILITAR_B);
    doc.rect(0, ph - 10, pw, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('6º BI INF — Sistema de Gestão de Tropas (SGTE)', 12, ph - 4);
    doc.text(`Página ${i} de ${numPages}`, pw - 12, ph - 4, { align: 'right' });
  }

  const nomeArquivo = `listagem_militares_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(nomeArquivo);
}
