import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─────────────────────────────────────────────────────────────────────────────
// Utilitário de geração de PDF para perfil completo do militar.
// Inclui foto, dados militares, pessoais, saúde, TAF, tiro e especializações.
// ─────────────────────────────────────────────────────────────────────────────

const COR_R = 22;
const COR_G = 101;
const COR_B = 52;
const COR_TEXTO: [number, number, number] = [30, 30, 30];
const COR_LABEL: [number, number, number] = [100, 110, 100];
const COR_BG_HEADER: [number, number, number] = [240, 247, 240];

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
  } catch {
    return null;
  }
}

// ─── Desenha uma seção (título colorido + tabela de dados) ───────────────────
function secaoTitulo(doc: any, titulo: string, y: number): void {
  doc.setFillColor(COR_R, COR_G, COR_B);
  doc.rect(14, y - 3.5, doc.internal.pageSize.getWidth() - 28, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo.toUpperCase(), 17, y + 1.5);
}

// ─── Desenha gráfico de barras horizontal simples ─────────────────────────────
function desenharGraficoBarras(
  doc: any,
  dados: { label: string; valor: number; max: number; cor?: [number, number, number] }[],
  x: number,
  y: number,
  largura: number,
  alturaLinha = 6
): number {
  const barWidth = largura - 50;
  dados.forEach((d, i) => {
    const yLinha = y + i * (alturaLinha + 2);
    const pct = Math.min(d.valor / d.max, 1);
    const corBarra: [number, number, number] = d.cor || (pct >= 0.7 ? [22, 101, 52] : pct >= 0.4 ? [234, 179, 8] : [220, 38, 38]);

    // Label
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COR_LABEL);
    doc.text(d.label, x, yLinha + alturaLinha - 1);

    // Fundo da barra
    doc.setFillColor(230, 235, 230);
    doc.roundedRect(x + 38, yLinha, barWidth, alturaLinha, 1, 1, 'F');

    // Barra preenchida
    if (pct > 0) {
      doc.setFillColor(...corBarra);
      doc.roundedRect(x + 38, yLinha, Math.max(barWidth * pct, 2), alturaLinha, 1, 1, 'F');
    }

    // Valor
    doc.setFontSize(7);
    doc.setTextColor(...COR_TEXTO);
    doc.text(`${d.valor}/${d.max}`, x + 38 + barWidth + 2, yLinha + alturaLinha - 1);
  });
  return y + dados.length * (alturaLinha + 2) + 4;
}

// ─── Desenha radar/pontuação circular (simula com arco) ──────────────────────
function desenharCirculoPontuacao(doc: any, cx: number, cy: number, raio: number, pct: number, cor: [number, number, number], label: string) {
  doc.setDrawColor(230, 235, 230);
  doc.setLineWidth(3);
  doc.circle(cx, cy, raio, 'S');
  
  const angEnd = -Math.PI / 2 + 2 * Math.PI * pct;
  const steps = Math.max(1, Math.floor(32 * pct));
  doc.setDrawColor(...cor);
  for (let i = 0; i < steps; i++) {
    const a1 = -Math.PI / 2 + (2 * Math.PI * pct * i) / steps;
    const a2 = -Math.PI / 2 + (2 * Math.PI * pct * (i + 1)) / steps;
    const x1 = cx + raio * Math.cos(a1);
    const y1 = cy + raio * Math.sin(a1);
    const x2 = cx + raio * Math.cos(a2);
    const y2 = cy + raio * Math.sin(a2);
    doc.line(x1, y1, x2, y2);
  }
  void angEnd;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...cor);
  const pctStr = `${Math.round(pct * 100)}%`;
  doc.text(pctStr, cx, cy + 1.5, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COR_LABEL);
  doc.text(label, cx, cy + raio + 5, { align: 'center' });
}

async function renderPerfilPage(doc: any, perfil: any): Promise<void> {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  let y = 0;

  // ══ CABEÇALHO ════════════════════════════════════════════════════════════════
  doc.setFillColor(COR_R, COR_G, COR_B);
  doc.rect(0, 0, pw, 10, 'F');

  // Bandeira listrada no topo
  doc.setFillColor(255, 215, 0);
  doc.rect(0, 8, pw, 2, 'F');

  doc.setFillColor(COR_R, COR_G, COR_B);
  doc.rect(0, 10, pw, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('6º BATALHÃO DE INFANTARIA — EXÉRCITO BRASILEIRO', pw / 2, 17, { align: 'center' });
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('FICHA DE PERFIL DO MILITAR', pw / 2, 25, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, pw / 2, 31, { align: 'center' });

  y = 42;

  // ══ BLOCO DE IDENTIFICAÇÃO ════════════════════════════════════════════════════
  // Foto grande (50x65mm)
  const fotoUrl = perfil.dadosCivil?.fotoUrl || perfil.fotoUrl;
  const FOTO_W = 45;
  const FOTO_H = 55;

  let fotoCarregada = false;
  if (fotoUrl) {
    const b64 = await getBase64ImageFromUrl(fotoUrl);
    if (b64) {
      doc.setDrawColor(COR_R, COR_G, COR_B);
      doc.setLineWidth(0.5);
      doc.rect(14, y, FOTO_W, FOTO_H);
      doc.addImage(b64, 'JPEG', 14.5, y + 0.5, FOTO_W - 1, FOTO_H - 1);
      fotoCarregada = true;
    }
  }

  if (!fotoCarregada) {
    doc.setFillColor(240, 245, 240);
    doc.rect(14, y, FOTO_W, FOTO_H, 'F');
    doc.setDrawColor(COR_R, COR_G, COR_B);
    doc.setLineWidth(0.5);
    doc.rect(14, y, FOTO_W, FOTO_H);
    doc.setFontSize(7);
    doc.setTextColor(COR_R, COR_G, COR_B);
    doc.text('SEM FOTO', 14 + FOTO_W / 2, y + FOTO_H / 2, { align: 'center' });
  }

  // Dados principais ao lado da foto
  const textX = 14 + FOTO_W + 6;
  const maxTextW = pw - textX - 14;

  const nomeCompleto = perfil.dadosCivil?.nomeCompleto || perfil.nome || '—';
  const nomeGuerra = perfil.nomeGuerra || perfil.nome_guerra || '—';
  const posto = perfil.postoGraduacao || perfil.posto || '';

  // Badge de situação
  const situacao = perfil.situacao || 'Ativo';
  const corSit: [number, number, number] = situacao === 'Ativo' ? [22, 101, 52] : situacao === 'Baixado' ? [185, 28, 28] : [161, 98, 7];
  const bgSit: [number, number, number] = situacao === 'Ativo' ? [220, 252, 231] : situacao === 'Baixado' ? [254, 226, 226] : [254, 243, 199];

  doc.setFillColor(...bgSit);
  doc.roundedRect(textX, y, 28, 7, 1.5, 1.5, 'F');
  doc.setTextColor(...corSit);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(situacao.toUpperCase(), textX + 14, y + 4.8, { align: 'center' });

  // Nome completo
  doc.setTextColor(COR_R, COR_G, COR_B);
  doc.setFontSize(12.5);
  doc.setFont('helvetica', 'bold');
  const nomeLines = doc.splitTextToSize(nomeCompleto, maxTextW);
  doc.text(nomeLines, textX, y + 14);

  // Posto e nome de guerra
  doc.setTextColor(...COR_LABEL);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${posto} — ${nomeGuerra}`, textX, y + 14 + nomeLines.length * 6 + 2);

  // Grade de dados de identificação
  const infoY = y + 14 + nomeLines.length * 6 + 10;
  const campos = [
    ['Idt. Militar', perfil.idtMilitar || '—'],
    ['CPF', perfil.dadosCivil?.cpf || '—'],
    ['Data de Praça', formatarData(perfil.dataPraca)],
    ['Companhia', perfil.companhia || '—'],
    ['Pelotão', perfil.pelotao || '—'],
    ['Prec-CP', perfil.precCP || '—'],
    ['Nº Campo', String(perfil.numeroCampoBasico || '—')],
    ['Nº EBCA', String(perfil.numeroEbca || '—')],
  ];

  const colunas = 2;
  const colW = maxTextW / colunas;
  campos.forEach((c, i) => {
    const col = i % colunas;
    const row = Math.floor(i / colunas);
    const cx = textX + col * colW;
    const cy = infoY + row * 9;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COR_LABEL);
    doc.text(c[0], cx, cy);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COR_TEXTO);
    doc.text(c[1], cx, cy + 4);
  });

  y = Math.max(y + FOTO_H + 6, infoY + Math.ceil(campos.length / colunas) * 9 + 6);

  // ══ DADOS MILITARES ═══════════════════════════════════════════════════════════
  if (y > ph - 60) { doc.addPage(); y = 20; }
  secaoTitulo(doc, '📋 Dados Militares', y);
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    tableWidth: pw - 28,
    styles: { fontSize: 8, cellPadding: 2.5 },
    bodyStyles: { textColor: COR_TEXTO },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold', textColor: COR_LABEL as any, fillColor: COR_BG_HEADER as any },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 40, fontStyle: 'bold', textColor: COR_LABEL as any, fillColor: COR_BG_HEADER as any },
      3: { cellWidth: 'auto' },
    },
    body: [
      ['Posto/Graduação', perfil.postoGraduacao || '—', 'Nome de Guerra', perfil.nomeGuerra || '—'],
      ['Tipo de Vínculo', perfil.tipoVinculo || '—', 'Situação', situacao],
      ['Companhia', perfil.companhia || '—', 'Pelotão', perfil.pelotao || '—'],
      ['Turma de Formação', String(perfil.turmaFormacao || '—'), 'Período Obrigatório', perfil.periodoObrigatorio || '—'],
      ['Nº Campo Básico', String(perfil.numeroCampoBasico || '—'), 'Nº EBCA', String(perfil.numeroEbca || '—')],
      ['Prec-CP', perfil.precCP || '—', 'Data de Praça', formatarData(perfil.dataPraca)],
    ],
    alternateRowStyles: { fillColor: [248, 252, 248] },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ══ DADOS PESSOAIS ═══════════════════════════════════════════════════════════
  if (y > ph - 70) { doc.addPage(); y = 20; }
  secaoTitulo(doc, '👤 Dados Pessoais', y);
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    tableWidth: pw - 28,
    styles: { fontSize: 8, cellPadding: 2.5 },
    bodyStyles: { textColor: COR_TEXTO },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold', textColor: COR_LABEL as any, fillColor: COR_BG_HEADER as any },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 40, fontStyle: 'bold', textColor: COR_LABEL as any, fillColor: COR_BG_HEADER as any },
      3: { cellWidth: 'auto' },
    },
    body: [
      ['Nome Completo', { content: perfil.dadosCivil?.nomeCompleto || '—', colSpan: 3 }],
      ['Nome do Pai', perfil.dadosCivil?.nomePai || '—', 'Nome da Mãe', perfil.dadosCivil?.nomeMae || '—'],
      ['Data de Nascimento', formatarData(perfil.dadosCivil?.dataNascimento), 'Idade', calcularIdade(perfil.dadosCivil?.dataNascimento)],
      ['CPF', perfil.dadosCivil?.cpf || '—', 'Identidade Civil', perfil.dadosCivil?.idtCivil || '—'],
      ['Escolaridade', perfil.dadosCivil?.escolaridade || '—', 'Religião', perfil.dadosCivil?.religiao || '—'],
      ['CNH', (Array.isArray(perfil.dadosCivil?.cnhCategoria) ? perfil.dadosCivil.cnhCategoria.join(', ') : perfil.dadosCivil?.cnhCategoria) || '—', 'Estado Civil', perfil.dadosCivil?.estadoCivil || '—'],
    ],
    alternateRowStyles: { fillColor: [248, 252, 248] },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ══ DADOS DE SAÚDE / FÍSICOS ═══════════════════════════════════════════════
  if (y > ph - 70) { doc.addPage(); y = 20; }
  secaoTitulo(doc, '🏥 Saúde e Características Físicas', y);
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    tableWidth: pw - 28,
    styles: { fontSize: 8, cellPadding: 2.5 },
    bodyStyles: { textColor: COR_TEXTO },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold', textColor: COR_LABEL as any, fillColor: COR_BG_HEADER as any },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 40, fontStyle: 'bold', textColor: COR_LABEL as any, fillColor: COR_BG_HEADER as any },
      3: { cellWidth: 'auto' },
    },
    body: [
      ['Altura', formatarAltura(perfil.dadosCivil?.altura), 'Tipo Sanguíneo', `${perfil.dadosCivil?.tipoSanguineo || '—'} ${perfil.dadosCivil?.fatorRh || ''}`],
      ['Cutis', perfil.dadosCivil?.cutis || '—', 'Olhos', perfil.dadosCivil?.olhos || '—'],
      ['Cabelos', perfil.dadosCivil?.cabelos || '—', 'Fator RH', perfil.dadosCivil?.fatorRh || '—'],
    ],
    alternateRowStyles: { fillColor: [248, 252, 248] },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ══ ENDEREÇO E CONTATO ════════════════════════════════════════════════════════
  if (y > ph - 60) { doc.addPage(); y = 20; }
  secaoTitulo(doc, '📍 Endereço e Contato', y);
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    tableWidth: pw - 28,
    styles: { fontSize: 8, cellPadding: 2.5 },
    bodyStyles: { textColor: COR_TEXTO },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold', textColor: COR_LABEL as any, fillColor: COR_BG_HEADER as any },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 40, fontStyle: 'bold', textColor: COR_LABEL as any, fillColor: COR_BG_HEADER as any },
      3: { cellWidth: 'auto' },
    },
    body: [
      ['Logradouro', `${perfil.endereco?.rua || '—'}, ${perfil.endereco?.numero || 'S/N'}`, 'Bairro', perfil.endereco?.bairro || '—'],
      ['Cidade / UF', `${perfil.endereco?.cidade || '—'} / ${perfil.endereco?.uf || '—'}`, 'CEP', perfil.endereco?.cep || '—'],
      ['Telefone', perfil.contato?.telefone || '—', 'Reside com', perfil.contato?.coabitacao || '—'],
      ['Emergência', `${perfil.contato?.nomeEmergencia || '—'} (${perfil.contato?.grauParentesco || '—'})`, 'Tel. Emergência', perfil.contato?.telefoneEmergencia || '—'],
    ],
    alternateRowStyles: { fillColor: [248, 252, 248] },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ══ DESEMPENHO TAF ════════════════════════════════════════════════════════════
  const tafs = Array.isArray(perfil.taf) ? perfil.taf : [];
  if (y > ph - 80) { doc.addPage(); y = 20; }
  secaoTitulo(doc, '🏃 Teste de Aptidão Física (TAF)', y);
  y += 10;

  if (tafs.length > 0) {
    // Tabela dos últimos TAFs
    const tafBody = tafs.slice(-5).map((t: any) => [
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
      bodyStyles: { textColor: COR_TEXTO },
      alternateRowStyles: { fillColor: [248, 252, 248] },
      head: [['DATA', 'FLEXÃO', 'ABDOMINAL', 'CORRIDA/DIST.', 'RESULTADO']],
      body: tafBody,
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    // Gráfico de barras de desempenho por exercício (último TAF)
    const ult = tafs[tafs.length - 1];
    const dadosGrafico = [
      { label: 'Flexão', valor: Number(ult.flexao ?? ult.Flexao ?? 0), max: 50 },
      { label: 'Abdominal', valor: Number(ult.abdominal ?? ult.Abdominal ?? 0), max: 50 },
    ];
    if (dadosGrafico.some(d => d.valor > 0)) {
      if (y > ph - 50) { doc.addPage(); y = 20; }
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COR_R, COR_G, COR_B);
      doc.text('Desempenho — Último TAF', 14, y);
      y += 5;
      y = desenharGraficoBarras(doc, dadosGrafico, 14, y, pw - 28);
    }
  } else {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COR_LABEL);
    doc.text('Nenhum TAF registrado.', 14, y);
    y += 8;
  }

  // ══ TIRO DE CAMPO ════════════════════════════════════════════════════════════
  const tiros = Array.isArray(perfil.tiro) ? perfil.tiro : [];
  if (y > ph - 60) { doc.addPage(); y = 20; }
  y += 4;
  secaoTitulo(doc, '🎯 Tiro de Campo', y);
  y += 10;

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
      bodyStyles: { textColor: COR_TEXTO },
      alternateRowStyles: { fillColor: [248, 252, 248] },
      head: [['DATA', 'ARMA', 'PONTUAÇÃO', 'CONCEITO']],
      body: tiroBody,
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  } else {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COR_LABEL);
    doc.text('Nenhum tiro de campo registrado.', 14, y);
    y += 8;
  }

  // ══ ESPECIALIZAÇÕES / CURSOS ══════════════════════════════════════════════════
  const cursos = perfil.especialidades?.cursos || perfil.cursosProfissionais || '';
  if (cursos) {
    if (y > ph - 40) { doc.addPage(); y = 20; }
    y += 2;
    secaoTitulo(doc, '🎓 Especializações e Cursos', y);
    y += 10;

    doc.setFillColor(248, 252, 248);
    doc.rect(14, y - 2, pw - 28, 12, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COR_TEXTO);
    const cursosLines = doc.splitTextToSize(cursos, pw - 30);
    doc.text(cursosLines, 16, y + 4);
    y += Math.max(12, cursosLines.length * 5) + 6;
  }

  // ══ REDES SOCIAIS ═════════════════════════════════════════════════════════════
  const temRede = Object.values(perfil.redesSociais || {}).some(v => v && String(v).trim() !== '');
  if (temRede) {
    if (y > ph - 40) { doc.addPage(); y = 20; }
    y += 2;
    secaoTitulo(doc, '📱 Redes Sociais', y);
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
        bodyStyles: { textColor: COR_TEXTO },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: 'bold', textColor: COR_LABEL as any, fillColor: COR_BG_HEADER as any },
          1: { cellWidth: 'auto' },
        },
        body: redesBody,
        alternateRowStyles: { fillColor: [248, 252, 248] },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // ══ INDICADORES (círculos de pontuação) ═══════════════════════════════════════
  // Só renderiza se tiver dados de TAF
  if (tafs.length > 0) {
    if (y > ph - 50) { doc.addPage(); y = 20; }
    y += 2;
    secaoTitulo(doc, '📊 Indicadores de Desempenho', y);
    y += 12;

    const ult = tafs[tafs.length - 1];
    const fx = Math.min(Number(ult.flexao ?? ult.Flexao ?? 0), 50);
    const ab = Math.min(Number(ult.abdominal ?? ult.Abdominal ?? 0), 50);
    const nota = (fx / 50 + ab / 50) / 2;

    const cor: (pct: number) => [number, number, number] = (pct) =>
      pct >= 0.7 ? [22, 101, 52] : pct >= 0.4 ? [161, 98, 7] : [185, 28, 28];

    const raio = 8;
    const spacing = 35;
    const baseX = 14 + raio + 4;

    desenharCirculoPontuacao(doc, baseX, y, raio, fx / 50, cor(fx / 50), 'Flexão');
    desenharCirculoPontuacao(doc, baseX + spacing, y, raio, ab / 50, cor(ab / 50), 'Abdominal');
    desenharCirculoPontuacao(doc, baseX + spacing * 2, y, raio, nota, cor(nota), 'Média TAF');

    y += raio * 2 + 12;
  }

  void ph;
}

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
    doc.text('6º BI INF — Sistema de Gestão de Tropas (SGTE)', 14, ph - 4);
    doc.text(`Página ${i} de ${numPages}`, pw - 14, ph - 4, { align: 'right' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export async function exportarPerfilPDF(perfil: any): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  await renderPerfilPage(doc, perfil);
  addFooters(doc);
  const nomeGuerra = (perfil.nomeGuerra || perfil.nome || 'militar').toLowerCase().replace(/\s+/g, '_');
  doc.save(`${nomeGuerra}.pdf`);
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

  doc.setFillColor(COR_R, COR_G, COR_B);
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

  autoTable(doc, {
    startY: 38,
    margin: { left: 10, right: 10 },
    tableWidth: pw - 20,
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: [COR_R, COR_G, COR_B] as any, textColor: [255, 255, 255] as any, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { textColor: COR_TEXTO },
    alternateRowStyles: { fillColor: [248, 252, 248] },
    head: [['Nº', 'POSTO/GRAD.', 'NOME DE GUERRA', 'CPF', 'IDT. MIL.', 'SUBUNIDADE', 'PELOTÃO', 'VÍNCULO', 'SITUAÇÃO']],
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
    doc.text('6º BI INF — Sistema de Gestão de Tropas (SGTE)', 12, ph - 4);
    doc.text(`Página ${i} de ${numPages}`, pw - 12, ph - 4, { align: 'right' });
  }

  doc.save('listagem_militares.pdf');
}
