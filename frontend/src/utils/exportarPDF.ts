import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─────────────────────────────────────────────────────────────────────────────
// Utilitário de geração de PDF para perfil completo do militar.
// Inclui foto, dados militares, pessoais, saúde, TAF, tiro, ferias, punicoes e visitas medicas.
// IMPORTANTE: jsPDF nao suporta emoji - usar apenas texto ASCII/Latin
// ─────────────────────────────────────────────────────────────────────────────

const COR_R = 22;
const COR_G = 101;
const COR_B = 52;
const COR_TEXTO: [number, number, number] = [30, 30, 30];
const COR_LABEL: [number, number, number] = [80, 100, 80];
const COR_BG_HEADER: [number, number, number] = [240, 247, 240];

// ─── Helpers de formatação ────────────────────────────────────────────────────
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

// ─── Busca imagem como base64 ─────────────────────────────────────────────────
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
  } catch {
    return null;
  }
}

// ─── Titulo de secao com fundo verde e texto branco ──────────────────────────
function secaoTitulo(doc: any, titulo: string, y: number): void {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(COR_R, COR_G, COR_B);
  doc.rect(14, y - 3.5, pw - 28, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo.toUpperCase(), 17, y + 1.5);
  doc.setTextColor(...COR_TEXTO);
}

// ─── Grafico de barras horizontal ────────────────────────────────────────────
function desenharGraficoBarras(
  doc: any,
  dados: { label: string; valor: number; max: number; cor?: [number, number, number] }[],
  x: number,
  y: number,
  largura: number,
  alturaLinha = 6
): number {
  const barWidth = largura - 52;
  dados.forEach((d, i) => {
    const yLinha = y + i * (alturaLinha + 3);
    const pct = Math.min(d.valor / (d.max || 1), 1);
    const corBarra: [number, number, number] =
      d.cor || (pct >= 0.7 ? [22, 101, 52] : pct >= 0.4 ? [202, 138, 4] : [185, 28, 28]);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COR_LABEL);
    doc.text(d.label, x, yLinha + alturaLinha - 1);

    doc.setFillColor(220, 230, 220);
    doc.roundedRect(x + 40, yLinha, barWidth, alturaLinha, 1, 1, 'F');

    if (pct > 0) {
      doc.setFillColor(...corBarra);
      doc.roundedRect(x + 40, yLinha, Math.max(barWidth * pct, 2), alturaLinha, 1, 1, 'F');
    }

    doc.setFontSize(7);
    doc.setTextColor(...COR_TEXTO);
    doc.text(`${d.valor}/${d.max}`, x + 40 + barWidth + 2, yLinha + alturaLinha - 1);
  });
  return y + dados.length * (alturaLinha + 3) + 4;
}

// ─── Indicador circular de desempenho ────────────────────────────────────────
function desenharCirculo(
  doc: any,
  cx: number,
  cy: number,
  raio: number,
  pct: number,
  cor: [number, number, number],
  label: string
): void {
  doc.setDrawColor(210, 225, 210);
  doc.setLineWidth(2.5);
  doc.circle(cx, cy, raio, 'S');

  const steps = Math.max(1, Math.floor(48 * pct));
  doc.setDrawColor(...cor);
  doc.setLineWidth(2.5);
  for (let i = 0; i < steps; i++) {
    const a1 = -Math.PI / 2 + (2 * Math.PI * pct * i) / steps;
    const a2 = -Math.PI / 2 + (2 * Math.PI * pct * (i + 1)) / steps;
    doc.line(
      cx + raio * Math.cos(a1),
      cy + raio * Math.sin(a1),
      cx + raio * Math.cos(a2),
      cy + raio * Math.sin(a2)
    );
  }

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...cor);
  doc.text(`${Math.round(pct * 100)}%`, cx, cy + 2, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COR_LABEL);
  doc.text(label, cx, cy + raio + 5, { align: 'center' });
}

// ─── Renderiza uma pagina de perfil ──────────────────────────────────────────
async function renderPerfilPage(doc: any, perfil: any): Promise<void> {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  let y = 0;

  // ── CABECALHO ────────────────────────────────────────────────────────────────
  doc.setFillColor(COR_R, COR_G, COR_B);
  doc.rect(0, 0, pw, 8, 'F');
  doc.setFillColor(180, 150, 0);
  doc.rect(0, 8, pw, 2, 'F');
  doc.setFillColor(COR_R, COR_G, COR_B);
  doc.rect(0, 10, pw, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('6 BATALHAO DE INFANTARIA  -  EXERCITO BRASILEIRO', pw / 2, 17, { align: 'center' });
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('FICHA DE PERFIL DO MILITAR', pw / 2, 25, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Gerado em: ${new Date().toLocaleDateString('pt-BR')} as ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    pw / 2, 31, { align: 'center' }
  );

  y = 43;

  // ── BLOCO DE IDENTIFICACAO ────────────────────────────────────────────────────
  const FOTO_W = 46;
  const FOTO_H = 56;

  // Foto do militar
  let fotoCarregada = false;
  const fotoUrl = perfil.dadosCivil?.fotoUrl || perfil.fotoUrl;
  if (fotoUrl) {
    const b64 = await getBase64ImageFromUrl(fotoUrl);
    if (b64) {
      doc.setDrawColor(COR_R, COR_G, COR_B);
      doc.setLineWidth(0.7);
      doc.rect(14, y, FOTO_W, FOTO_H);
      doc.addImage(b64, 'JPEG', 14.5, y + 0.5, FOTO_W - 1, FOTO_H - 1);
      fotoCarregada = true;
    }
  }
  if (!fotoCarregada) {
    doc.setFillColor(240, 246, 240);
    doc.rect(14, y, FOTO_W, FOTO_H, 'F');
    doc.setDrawColor(COR_R, COR_G, COR_B);
    doc.setLineWidth(0.7);
    doc.rect(14, y, FOTO_W, FOTO_H);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(COR_R, COR_G, COR_B);
    doc.text('SEM FOTO', 14 + FOTO_W / 2, y + FOTO_H / 2, { align: 'center' });
  }

  // Dados ao lado da foto
  const textX = 14 + FOTO_W + 6;
  const maxW = pw - textX - 14;
  const situacao = perfil.situacao || 'Ativo';

  // Badge situacao
  const corSit: [number, number, number] =
    situacao === 'Ativo' ? [22, 101, 52] : situacao === 'Baixado' ? [185, 28, 28] : [161, 98, 7];
  const bgSit: [number, number, number] =
    situacao === 'Ativo' ? [220, 252, 231] : situacao === 'Baixado' ? [254, 226, 226] : [254, 243, 199];

  doc.setFillColor(...bgSit);
  doc.roundedRect(textX, y, 30, 7, 1.5, 1.5, 'F');
  doc.setTextColor(...corSit);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(situacao.toUpperCase(), textX + 15, y + 4.8, { align: 'center' });

  // Nome completo
  const nomeCompleto = perfil.dadosCivil?.nomeCompleto || perfil.nome || '—';
  const nomeGuerra = perfil.nomeGuerra || '—';
  const posto = perfil.postoGraduacao || perfil.posto || '';

  doc.setTextColor(COR_R, COR_G, COR_B);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const nomeLines = doc.splitTextToSize(nomeCompleto, maxW);
  doc.text(nomeLines, textX, y + 14);

  doc.setTextColor(...COR_LABEL);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${posto} - ${nomeGuerra}`, textX, y + 14 + nomeLines.length * 5.5 + 3);

  // Grade de identificacao
  const infoY = y + 14 + nomeLines.length * 5.5 + 11;
  const campos = [
    ['Idt. Militar', perfil.idtMilitar || '—'],
    ['CPF', perfil.dadosCivil?.cpf || '—'],
    ['Data de Praca', formatarData(perfil.dataPraca)],
    ['Companhia', perfil.companhia || '—'],
    ['Pelotao', perfil.pelotao || '—'],
    ['Prec-CP', perfil.precCP || '—'],
    ['N. Campo Basico', String(perfil.numeroCampoBasico || '—')],
    ['N. EBCA', String(perfil.numeroEbca || '—')],
  ];

  const colW = maxW / 2;
  campos.forEach((c, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = textX + col * colW;
    const cy = infoY + row * 9;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COR_LABEL);
    doc.text(c[0], cx, cy);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COR_TEXTO);
    doc.text(String(c[1]), cx, cy + 4.5);
  });

  y = Math.max(y + FOTO_H + 6, infoY + Math.ceil(campos.length / 2) * 9 + 6);

  // ── DADOS MILITARES ──────────────────────────────────────────────────────────
  if (y > ph - 60) { doc.addPage(); y = 20; }
  secaoTitulo(doc, 'Dados Militares', y);
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    tableWidth: pw - 28,
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    bodyStyles: { textColor: COR_TEXTO as any },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: 'bold', textColor: COR_LABEL as any, fillColor: COR_BG_HEADER as any },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 38, fontStyle: 'bold', textColor: COR_LABEL as any, fillColor: COR_BG_HEADER as any },
      3: { cellWidth: 'auto' },
    },
    alternateRowStyles: { fillColor: [248, 252, 248] as any },
    body: [
      ['Posto/Graduacao', perfil.postoGraduacao || '—', 'Nome de Guerra', perfil.nomeGuerra || '—'],
      ['Tipo de Vinculo', perfil.tipoVinculo || '—', 'Situacao', situacao],
      ['Companhia', perfil.companhia || '—', 'Pelotao', perfil.pelotao || '—'],
      ['Turma de Formacao', String(perfil.turmaFormacao || '—'), 'Periodo Obrigatorio', perfil.periodoObrigatorio || '—'],
      ['N. Campo Basico', String(perfil.numeroCampoBasico || '—'), 'N. EBCA', String(perfil.numeroEbca || '—')],
      ['Prec-CP', perfil.precCP || '—', 'Data de Praca', formatarData(perfil.dataPraca)],
    ],
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ── DADOS PESSOAIS ──────────────────────────────────────────────────────────
  if (y > ph - 70) { doc.addPage(); y = 20; }
  secaoTitulo(doc, 'Dados Pessoais', y);
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    tableWidth: pw - 28,
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    bodyStyles: { textColor: COR_TEXTO as any },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: 'bold', textColor: COR_LABEL as any, fillColor: COR_BG_HEADER as any },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 38, fontStyle: 'bold', textColor: COR_LABEL as any, fillColor: COR_BG_HEADER as any },
      3: { cellWidth: 'auto' },
    },
    alternateRowStyles: { fillColor: [248, 252, 248] as any },
    body: [
      ['Nome Completo', { content: perfil.dadosCivil?.nomeCompleto || '—', colSpan: 3 }],
      ['Nome do Pai', perfil.dadosCivil?.nomePai || '—', 'Nome da Mae', perfil.dadosCivil?.nomeMae || '—'],
      ['Data de Nascimento', formatarData(perfil.dadosCivil?.dataNascimento), 'Idade', calcularIdade(perfil.dadosCivil?.dataNascimento)],
      ['CPF', perfil.dadosCivil?.cpf || '—', 'Identidade Civil', perfil.dadosCivil?.idtCivil || '—'],
      ['Escolaridade', perfil.dadosCivil?.escolaridade || '—', 'Religiao', perfil.dadosCivil?.religiao || '—'],
      ['CNH', (Array.isArray(perfil.dadosCivil?.cnhCategoria) ? perfil.dadosCivil.cnhCategoria.join(', ') : (perfil.dadosCivil?.cnhCategoria || '—')), 'Estado Civil', perfil.dadosCivil?.estadoCivil || '—'],
    ],
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ── SAUDE E FISICO ──────────────────────────────────────────────────────────
  if (y > ph - 55) { doc.addPage(); y = 20; }
  secaoTitulo(doc, 'Saude e Caracteristicas Fisicas', y);
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    tableWidth: pw - 28,
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    bodyStyles: { textColor: COR_TEXTO as any },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: 'bold', textColor: COR_LABEL as any, fillColor: COR_BG_HEADER as any },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 38, fontStyle: 'bold', textColor: COR_LABEL as any, fillColor: COR_BG_HEADER as any },
      3: { cellWidth: 'auto' },
    },
    alternateRowStyles: { fillColor: [248, 252, 248] as any },
    body: [
      ['Altura', formatarAltura(perfil.dadosCivil?.altura), 'Tipo Sanguineo', `${perfil.dadosCivil?.tipoSanguineo || '—'} ${perfil.dadosCivil?.fatorRh || ''}`],
      ['Cutis', perfil.dadosCivil?.cutis || '—', 'Olhos', perfil.dadosCivil?.olhos || '—'],
      ['Cabelos', perfil.dadosCivil?.cabelos || '—', 'Fator RH', perfil.dadosCivil?.fatorRh || '—'],
    ],
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ── ENDERECO E CONTATO ────────────────────────────────────────────────────────
  if (y > ph - 55) { doc.addPage(); y = 20; }
  secaoTitulo(doc, 'Endereco e Contato', y);
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    tableWidth: pw - 28,
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    bodyStyles: { textColor: COR_TEXTO as any },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: 'bold', textColor: COR_LABEL as any, fillColor: COR_BG_HEADER as any },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 38, fontStyle: 'bold', textColor: COR_LABEL as any, fillColor: COR_BG_HEADER as any },
      3: { cellWidth: 'auto' },
    },
    alternateRowStyles: { fillColor: [248, 252, 248] as any },
    body: [
      ['Logradouro', `${perfil.endereco?.rua || '—'}, ${perfil.endereco?.numero || 'S/N'}`, 'Bairro', perfil.endereco?.bairro || '—'],
      ['Cidade / UF', `${perfil.endereco?.cidade || '—'} / ${perfil.endereco?.uf || '—'}`, 'CEP', perfil.endereco?.cep || '—'],
      ['Telefone', perfil.contato?.telefone || '—', 'Reside com', perfil.contato?.coabitacao || '—'],
      ['Emergencia', `${perfil.contato?.nomeEmergencia || '—'} (${perfil.contato?.grauParentesco || '—'})`, 'Tel. Emergencia', perfil.contato?.telefoneEmergencia || '—'],
    ],
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ── TAF ─────────────────────────────────────────────────────────────────────
  const tafs = Array.isArray(perfil.taf) ? perfil.taf : [];
  if (y > ph - 70) { doc.addPage(); y = 20; }
  secaoTitulo(doc, 'Teste de Aptidao Fisica (TAF)', y);
  y += 8;

  if (tafs.length > 0) {
    const tafBody = tafs.slice(-6).map((t: any) => [
      formatarData(t.data || t.Data || ''),
      String(t.flexao ?? t.Flexao ?? '—'),
      String(t.abdominal ?? t.Abdominal ?? '—'),
      String(t.corrida ?? t.Corrida ?? t.distancia ?? '—'),
      t.resultado ?? t.Resultado ?? t.conceito ?? '—',
    ]);
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      tableWidth: pw - 28,
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [COR_R, COR_G, COR_B] as any, textColor: [255, 255, 255] as any, fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { textColor: COR_TEXTO as any },
      alternateRowStyles: { fillColor: [248, 252, 248] as any },
      head: [['DATA', 'FLEXAO', 'ABDOMINAL', 'CORRIDA/DIST.', 'RESULTADO']],
      body: tafBody,
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    // Grafico de barras - ultimo TAF
    const ult = tafs[tafs.length - 1];
    const dadosGrafico = [
      { label: 'Flexao', valor: Number(ult.flexao ?? ult.Flexao ?? 0), max: 50 },
      { label: 'Abdominal', valor: Number(ult.abdominal ?? ult.Abdominal ?? 0), max: 50 },
    ];
    if (dadosGrafico.some(d => d.valor > 0)) {
      if (y > ph - 45) { doc.addPage(); y = 20; }
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COR_R, COR_G, COR_B);
      doc.text('Desempenho - Ultimo TAF', 14, y);
      y += 5;
      y = desenharGraficoBarras(doc, dadosGrafico, 14, y, pw - 28);
    }
  } else {
    // Dados estaticos de exemplo quando nao ha TAF
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      tableWidth: pw - 28,
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [COR_R, COR_G, COR_B] as any, textColor: [255, 255, 255] as any, fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { textColor: [150, 160, 150] as any },
      alternateRowStyles: { fillColor: [248, 252, 248] as any },
      head: [['DATA', 'FLEXAO', 'ABDOMINAL', 'CORRIDA/DIST.', 'RESULTADO']],
      body: [
        ['01/06/2025', '—', '—', '—', 'Sem registro'],
        ['01/12/2024', '—', '—', '—', 'Sem registro'],
      ],
    });
    y = (doc as any).lastAutoTable.finalY + 6;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 160, 150);
    doc.text('* Nenhum resultado de TAF registrado para este militar.', 14, y);
    y += 7;
  }

  // Indicadores de desempenho (circulos) - so se tiver dados reais
  if (tafs.length > 0) {
    if (y > ph - 45) { doc.addPage(); y = 20; }
    const ult = tafs[tafs.length - 1];
    const fx = Math.min(Number(ult.flexao ?? ult.Flexao ?? 0), 50);
    const ab = Math.min(Number(ult.abdominal ?? ult.Abdominal ?? 0), 50);
    const media = (fx / 50 + ab / 50) / 2;
    const cor = (pct: number): [number, number, number] =>
      pct >= 0.7 ? [22, 101, 52] : pct >= 0.4 ? [161, 98, 7] : [185, 28, 28];

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COR_R, COR_G, COR_B);
    doc.text('Indicadores - Ultimo TAF', 14, y);
    y += 10;

    const r = 8;
    const sp = 36;
    const bx = 14 + r + 4;
    desenharCirculo(doc, bx, y, r, fx / 50, cor(fx / 50), 'Flexao');
    desenharCirculo(doc, bx + sp, y, r, ab / 50, cor(ab / 50), 'Abdominal');
    desenharCirculo(doc, bx + sp * 2, y, r, media, cor(media), 'Media TAF');
    y += r * 2 + 14;
  }

  // ── TIRO DE CAMPO ─────────────────────────────────────────────────────────────
  const tiros = Array.isArray(perfil.tiro) ? perfil.tiro : [];
  if (y > ph - 60) { doc.addPage(); y = 20; }
  y += 2;
  secaoTitulo(doc, 'Tiro de Campo', y);
  y += 8;

  if (tiros.length > 0) {
    const tiroBody = tiros.slice(-5).map((t: any) => [
      formatarData(t.data || t.Data || ''),
      t.arma ?? t.Arma ?? '—',
      String(t.pontuacao ?? t.Pontuacao ?? t.pontos ?? '—'),
      t.conceito ?? t.Conceito ?? '—',
    ]);
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      tableWidth: pw - 28,
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [COR_R, COR_G, COR_B] as any, textColor: [255, 255, 255] as any, fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { textColor: COR_TEXTO as any },
      alternateRowStyles: { fillColor: [248, 252, 248] as any },
      head: [['DATA', 'ARMA', 'PONTUACAO', 'CONCEITO']],
      body: tiroBody,
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  } else {
    // Dados estaticos de exemplo
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      tableWidth: pw - 28,
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [COR_R, COR_G, COR_B] as any, textColor: [255, 255, 255] as any, fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { textColor: [150, 160, 150] as any },
      alternateRowStyles: { fillColor: [248, 252, 248] as any },
      head: [['DATA', 'ARMA', 'PONTUACAO', 'CONCEITO']],
      body: [['Sem registro', '—', '—', '—']],
    });
    y = (doc as any).lastAutoTable.finalY + 6;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 160, 150);
    doc.text('* Nenhum resultado de tiro de campo registrado.', 14, y);
    y += 7;
  }

  // ── FERIAS ─────────────────────────────────────────────────────────────────────
  const ferias = Array.isArray(perfil.ferias) ? perfil.ferias : [];
  if (y > ph - 60) { doc.addPage(); y = 20; }
  y += 2;
  secaoTitulo(doc, 'Ferias', y);
  y += 8;

  if (ferias.length > 0) {
    const feriasBody = ferias.slice(-6).map((f: any) => [
      String(f.ano ?? f.Ano ?? '—'),
      formatarData(f.inicio ?? f.data_inicio ?? ''),
      formatarData(f.fim ?? f.data_fim ?? ''),
      f.tipo ?? f.Tipo ?? 'Ferias Regulares',
      f.observacao ?? f.obs ?? '—',
    ]);
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      tableWidth: pw - 28,
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [COR_R, COR_G, COR_B] as any, textColor: [255, 255, 255] as any, fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { textColor: COR_TEXTO as any },
      alternateRowStyles: { fillColor: [248, 252, 248] as any },
      head: [['ANO', 'INICIO', 'FIM', 'TIPO', 'OBSERVACAO']],
      body: feriasBody,
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  } else {
    // Dados estaticos de exemplo
    const anoAtual = new Date().getFullYear();
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      tableWidth: pw - 28,
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [COR_R, COR_G, COR_B] as any, textColor: [255, 255, 255] as any, fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { textColor: [150, 160, 150] as any },
      alternateRowStyles: { fillColor: [248, 252, 248] as any },
      head: [['ANO', 'INICIO', 'FIM', 'TIPO', 'OBSERVACAO']],
      body: [
        [String(anoAtual), '—', '—', 'A programar', 'Sem registro'],
        [String(anoAtual - 1), '—', '—', '—', 'Sem registro'],
      ],
    });
    y = (doc as any).lastAutoTable.finalY + 6;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 160, 150);
    doc.text('* Nenhuma ferias registrada no sistema para este militar.', 14, y);
    y += 7;
  }

  // ── VISITAS MEDICAS ────────────────────────────────────────────────────────────
  const visitas = Array.isArray(perfil.visitasMedicas) ? perfil.visitasMedicas : [];
  if (y > ph - 60) { doc.addPage(); y = 20; }
  y += 2;
  secaoTitulo(doc, 'Historico de Visitas Medicas', y);
  y += 8;

  if (visitas.length > 0) {
    const visitasBody = visitas.slice(-6).map((v: any) => [
      formatarData(v.data ?? v.Data ?? ''),
      v.tipo ?? v.Tipo ?? v.especialidade ?? '—',
      v.medico ?? v.Medico ?? '—',
      v.diagnostico ?? v.Diagnostico ?? v.resultado ?? '—',
      v.observacao ?? v.obs ?? '—',
    ]);
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      tableWidth: pw - 28,
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [COR_R, COR_G, COR_B] as any, textColor: [255, 255, 255] as any, fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { textColor: COR_TEXTO as any },
      alternateRowStyles: { fillColor: [248, 252, 248] as any },
      head: [['DATA', 'ESPECIALIDADE', 'MEDICO', 'DIAGNOSTICO / RESULTADO', 'OBS.']],
      body: visitasBody,
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  } else {
    // Dados estaticos de exemplo
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      tableWidth: pw - 28,
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [COR_R, COR_G, COR_B] as any, textColor: [255, 255, 255] as any, fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { textColor: [150, 160, 150] as any },
      alternateRowStyles: { fillColor: [248, 252, 248] as any },
      head: [['DATA', 'ESPECIALIDADE', 'MEDICO', 'DIAGNOSTICO / RESULTADO', 'OBS.']],
      body: [
        ['—', 'Clinica Geral', '—', 'Sem registro', '—'],
        ['—', 'Odontologia', '—', 'Sem registro', '—'],
      ],
    });
    y = (doc as any).lastAutoTable.finalY + 6;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 160, 150);
    doc.text('* Nenhuma visita medica registrada no sistema para este militar.', 14, y);
    y += 7;
  }

  // ── PUNICOES / OCORRENCIAS ────────────────────────────────────────────────────
  const punicoes = Array.isArray(perfil.punicoes) ? perfil.punicoes
    : Array.isArray(perfil.ocorrencias) ? perfil.ocorrencias : [];
  if (y > ph - 60) { doc.addPage(); y = 20; }
  y += 2;
  secaoTitulo(doc, 'Punicoes e Ocorrencias Disciplinares', y);
  y += 8;

  if (punicoes.length > 0) {
    const punicoesBody = punicoes.slice(-6).map((p: any) => [
      formatarData(p.data ?? p.Data ?? ''),
      p.tipo ?? p.Tipo ?? p.natureza ?? '—',
      p.motivo ?? p.Motivo ?? p.descricao ?? '—',
      p.penalidade ?? p.Penalidade ?? p.sancao ?? '—',
      p.situacao ?? p.Situacao ?? 'Registrada',
    ]);
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      tableWidth: pw - 28,
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [COR_R, COR_G, COR_B] as any, textColor: [255, 255, 255] as any, fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { textColor: COR_TEXTO as any },
      alternateRowStyles: { fillColor: [248, 252, 248] as any },
      head: [['DATA', 'TIPO', 'MOTIVO', 'PENALIDADE', 'SITUACAO']],
      body: punicoesBody,
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  } else {
    doc.setFillColor(240, 249, 240);
    doc.rect(14, y, pw - 28, 10, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text('Nenhuma punicao ou ocorrencia disciplinar registrada.', 17, y + 6.5);
    y += 14;
  }

  // ── ESPECIALIZACOES / CURSOS ──────────────────────────────────────────────────
  const cursos = perfil.especialidades?.cursos || perfil.cursosProfissionais || '';
  if (y > ph - 35) { doc.addPage(); y = 20; }
  y += 2;
  secaoTitulo(doc, 'Especializacoes e Cursos Profissionais', y);
  y += 8;

  if (cursos) {
    doc.setFillColor(248, 252, 248);
    doc.rect(14, y - 2, pw - 28, 14, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COR_TEXTO);
    const cursosLines = doc.splitTextToSize(cursos, pw - 30);
    doc.text(cursosLines, 16, y + 4);
    y += Math.max(14, cursosLines.length * 5) + 4;
  } else {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 160, 150);
    doc.text('Nenhum curso ou especializacao registrado.', 14, y);
    y += 8;
  }

  // ── REDES SOCIAIS ─────────────────────────────────────────────────────────────
  const temRede = Object.values(perfil.redesSociais || {}).some(v => v && String(v).trim() !== '');
  if (temRede) {
    if (y > ph - 40) { doc.addPage(); y = 20; }
    y += 2;
    secaoTitulo(doc, 'Redes Sociais', y);
    y += 8;

    const redesBody = [
      ['Instagram', perfil.redesSociais?.instagram || '—'],
      ['Facebook', perfil.redesSociais?.facebook || '—'],
      ['TikTok', perfil.redesSociais?.tiktok || '—'],
      ['Twitter / X', perfil.redesSociais?.twitter || '—'],
      ['Outras', perfil.redesSociais?.outras || '—'],
    ].filter(r => r[1] !== '—');

    if (redesBody.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: { left: 14, right: 14 },
        tableWidth: pw - 28,
        styles: { fontSize: 8, cellPadding: 2.5 },
        bodyStyles: { textColor: COR_TEXTO as any },
        columnStyles: {
          0: { cellWidth: 38, fontStyle: 'bold', textColor: COR_LABEL as any, fillColor: COR_BG_HEADER as any },
          1: { cellWidth: 'auto' },
        },
        alternateRowStyles: { fillColor: [248, 252, 248] as any },
        body: redesBody,
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  void y;
  void ph;
}

// ─── Rodapes em todas as paginas ──────────────────────────────────────────────
function addFooters(doc: any): void {
  const numPages = doc.getNumberOfPages();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= numPages; i++) {
    doc.setPage(i);
    doc.setFillColor(COR_R, COR_G, COR_B);
    doc.rect(0, ph - 10, pw, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('6 BI INF - Sistema de Gestao de Tropas (SGTE)', 14, ph - 4);
    doc.text(`Pagina ${i} de ${numPages}`, pw - 14, ph - 4, { align: 'right' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Exportar perfil individual: nome_de_guerra.pdf
// ─────────────────────────────────────────────────────────────────────────────
export async function exportarPerfilPDF(perfil: any): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  await renderPerfilPage(doc, perfil);
  addFooters(doc);
  const nome = (perfil.nomeGuerra || perfil.nome || 'militar').toLowerCase().replace(/\s+/g, '_');
  doc.save(`${nome}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Exportar lote de perfis num unico arquivo: militares.pdf
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Exportar listagem resumida em landscape
// ─────────────────────────────────────────────────────────────────────────────
export async function exportarListaMilitaresPDF(militares: any[]): Promise<void> {
  if (!militares || militares.length === 0) return;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  doc.setFillColor(COR_R, COR_G, COR_B);
  doc.rect(0, 0, pw, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('6 BATALHAO DE INFANTARIA', pw / 2, 9, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('LISTAGEM DE MILITARES', pw / 2, 19, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Emitido em: ${new Date().toLocaleDateString('pt-BR')} as ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - Total: ${militares.length} militar(es)`,
    pw / 2, 27, { align: 'center' }
  );

  autoTable(doc, {
    startY: 38,
    margin: { left: 10, right: 10 },
    tableWidth: pw - 20,
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: [COR_R, COR_G, COR_B] as any, textColor: [255, 255, 255] as any, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { textColor: COR_TEXTO as any },
    alternateRowStyles: { fillColor: [248, 252, 248] as any },
    head: [['N.', 'POSTO/GRAD.', 'NOME DE GUERRA', 'CPF', 'IDT. MIL.', 'SUBUNIDADE', 'PELOTAO', 'VINCULO', 'SITUACAO']],
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
  });

  const numPages = doc.getNumberOfPages();
  for (let i = 1; i <= numPages; i++) {
    doc.setPage(i);
    doc.setFillColor(COR_R, COR_G, COR_B);
    doc.rect(0, ph - 10, pw, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('6 BI INF - Sistema de Gestao de Tropas (SGTE)', 12, ph - 4);
    doc.text(`Pagina ${i} de ${numPages}`, pw - 12, ph - 4, { align: 'right' });
  }
  doc.save('listagem_militares.pdf');
}
