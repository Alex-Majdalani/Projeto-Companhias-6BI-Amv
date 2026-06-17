import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─────────────────────────────────────────────────────────────────────────────
// Utilitário de geração de PDF para perfil do militar.
// Usa jsPDF + jspdf-autotable para gerar um documento formatado com estilo militar.
// ─────────────────────────────────────────────────────────────────────────────

const COR_MILITAR_R = 22;
const COR_MILITAR_G = 101;
const COR_MILITAR_B = 52;

const COR_TEXTO_LABEL = [120, 120, 120] as [number, number, number];
const COR_TEXTO_VALOR = [30, 30, 30] as [number, number, number];

function formatarData(d: string): string {
  if (!d) return '—';
  const p = d.split('T')[0].split('-');
  if (p.length < 3) return d;
  return `${p[2]}/${p[1]}/${p[0]}`;
}

function formatarAltura(a: any): string {
  if (!a && a !== 0) return '—';
  return String(a).replace('.', ',') + ' m';
}

function calcularIdade(data: string): string {
  if (!data) return '—';
  const nasc = new Date(data);
  const hoje = new Date();
  let age = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) age--;
  return age >= 0 ? `${age} anos` : '—';
}

async function getBase64ImageFromUrl(imageUrl: string): Promise<string | null> {
  if (!imageUrl) return null;
  try {
    const res = await fetch(imageUrl, { mode: 'cors' });
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Erro ao buscar imagem para PDF:', err);
    return null;
  }
}

async function renderPerfilPage(doc: any, perfil: any) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  let y = 0;

  // ── CABEÇALHO VERDE ────────────────────────────────────────────────────────
  doc.setFillColor(COR_MILITAR_R, COR_MILITAR_G, COR_MILITAR_B);
  doc.rect(0, 0, pw, 38, 'F');

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

  const nomeCompleto = perfil.dadosCivil?.nomeCompleto || perfil.nome || '—';
  const nomeGuerra = perfil.nomeGuerra || '';

  // Foto do Militar
  const fotoUrl = perfil.dadosCivil?.fotoUrl || perfil.fotoUrl;
  let textX = 14;

  if (fotoUrl) {
    const base64Img = await getBase64ImageFromUrl(fotoUrl);
    if (base64Img) {
      doc.addImage(base64Img, 'JPEG', 14, y, 25, 33);
      textX = 45;
    }
  }

  // ── IDENTIFICAÇÃO PRINCIPAL ────────────────────────────────────────────────
  doc.setTextColor(COR_MILITAR_R, COR_MILITAR_G, COR_MILITAR_B);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(nomeCompleto, textX, y + 4);
  
  doc.setTextColor(...COR_TEXTO_LABEL);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const subTitulo = [perfil.postoGraduacao || perfil.posto, nomeGuerra].filter(Boolean).join(' · ');
  doc.text(subTitulo, textX, y + 12);
  
  doc.setFontSize(9);
  doc.text(`Identidade Militar: ${perfil.idtMilitar || perfil.identidade || '—'}`, textX, y + 18);
  doc.text(`CPF: ${perfil.dadosCivil?.cpf || perfil.cpf || '—'}`, textX, y + 24);
  doc.text(`Situação: ${perfil.situacao || 'Ativo'}`, textX, y + 30);

  y = Math.max(y + 33, y + 38);

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
    columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 42 }, 3: { cellWidth: 'auto' } },
    body: [
      ['Nº Campo Básico', perfil.numeroCampoBasico || '—', 'Nº EBCA', perfil.numeroEbca || '—'],
      ['Prec-CP', perfil.precCP || '—', 'Data de Praça', formatarData(perfil.dataPraca)],
      ['Turma de Formação', perfil.turmaFormacao || '—', 'Tipo de Vínculo', perfil.tipoVinculo || '—'],
      ['Companhia', perfil.companhia || '—', 'Pelotão', perfil.pelotao || '—'],
    ],
    didParseCell: (data: any) => {
      if (data.row.index % 2 === 0) data.cell.styles.fillColor = [248, 250, 248];
      if (data.column.index === 0 || data.column.index === 2) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = COR_TEXTO_LABEL;
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
    bodyStyles: { textColor: COR_TEXTO_VALOR },
    columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 42 }, 3: { cellWidth: 'auto' } },
    body: [
      ['Nome do Pai', perfil.dadosCivil?.nomePai || '—', 'Nome da Mãe', perfil.dadosCivil?.nomeMae || '—'],
      ['Nascimento', formatarData(perfil.dadosCivil?.dataNascimento), 'Idade', calcularIdade(perfil.dadosCivil?.dataNascimento)],
      ['Identidade Civil', perfil.dadosCivil?.idtCivil || '—', 'CNH', perfil.dadosCivil?.cnhCategoria || '—'],
      ['Altura', formatarAltura(perfil.dadosCivil?.altura), 'Tipo Sanguíneo', `${perfil.dadosCivil?.tipoSanguineo || '—'} ${perfil.dadosCivil?.fatorRh || ''}`],
      ['Cutis', perfil.dadosCivil?.cutis || '—', 'Olhos', perfil.dadosCivil?.olhos || '—'],
      ['Cabelos', perfil.dadosCivil?.cabelos || '—', 'Escolaridade', perfil.dadosCivil?.escolaridade || '—'],
      ['Religião', perfil.dadosCivil?.religiao || '—', 'Estado Civil', perfil.dadosCivil?.estadoCivil || '—'],
    ],
    didParseCell: (data: any) => {
      if (data.row.index % 2 === 0) data.cell.styles.fillColor = [248, 250, 248];
      if (data.column.index === 0 || data.column.index === 2) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = COR_TEXTO_LABEL;
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
    bodyStyles: { textColor: COR_TEXTO_VALOR },
    columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 'auto' } },
    body: [
      ['Logradouro', `${perfil.endereco?.rua || '—'}, ${perfil.endereco?.numero || 'S/N'}${perfil.endereco?.complemento ? ' — ' + perfil.endereco.complemento : ''}`],
      ['Bairro', perfil.endereco?.bairro || '—'],
      ['Cidade / UF', `${perfil.endereco?.cidade || '—'} / ${perfil.endereco?.uf || '—'}`],
      ['CEP', perfil.endereco?.cep || '—'],
      ['Telefone', perfil.contato?.telefone || '—'],
      ['Emergência', `${perfil.contato?.nomeEmergencia || '—'} (${perfil.contato?.grauParentesco || '—'}) — ${perfil.contato?.telefoneEmergencia || '—'}`],
      ['Reside com', perfil.contato?.coabitacao || '—'],
    ],
    didParseCell: (data: any) => {
      if (data.row.index % 2 === 0) data.cell.styles.fillColor = [248, 250, 248];
      if (data.column.index === 0) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = COR_TEXTO_LABEL;
      }
    },
  });
}

function addFooters(doc: any) {
  const numPages = doc.getNumberOfPages();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
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
}

// ─────────────────────────────────────────────────────────────────────────────
export async function exportarPerfilPDF(perfil: any): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  await renderPerfilPage(doc, perfil);
  addFooters(doc);
  const nomeGuerra = perfil.nomeGuerra || perfil.nome || 'militar';
  const nomeArquivo = `${nomeGuerra.toLowerCase().replace(/\s+/g, '_')}.pdf`;
  doc.save(nomeArquivo);
}

export async function exportarLotePerfisPDF(perfis: any[]): Promise<void> {
  if (!perfis || perfis.length === 0) return;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  for (let i = 0; i < perfis.length; i++) {
    if (i > 0) doc.addPage();
    await renderPerfilPage(doc, perfis[i]);
  }
  addFooters(doc);
  doc.save('militares.pdf');
}

export async function exportarListaMilitaresPDF(militares: any[]): Promise<void> {
  if (!militares || militares.length === 0) return;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  // CABEÇALHO
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

  // TABELA PRINCIPAL
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
    didDrawCell: (data: any) => {
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

  doc.save('listagem_militares.pdf');
}
