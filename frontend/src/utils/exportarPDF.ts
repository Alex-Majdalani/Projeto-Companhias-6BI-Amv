import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─────────────────────────────────────────────────────────────────────────────
// FICHA DO MILITAR - Layout premium com espacamento adequado
// jsPDF nao suporta emoji/unicode especial - apenas texto Latin ASCII
// ─────────────────────────────────────────────────────────────────────────────

// Paleta de cores
const VD   = { r: 22,  g: 101, b: 52  };  // Verde militar principal
const VD_L = { r: 240, g: 248, b: 242 };  // Verde claro (fundo de celulas)
const CZ   = { r: 90,  g: 100, b: 90  };  // Cinza esverdeado (labels)
const PR   = { r: 20,  g: 20,  b: 20  };  // Preto suave (valores)
const BR   = { r: 255, g: 255, b: 255 };  // Branco

const MARGIN = 15;
const PAGE_W = 210;
const PAGE_H = 297;
const INNER_W = PAGE_W - MARGIN * 2;

// ─── Utilitarios de formatacao ────────────────────────────────────────────────
const fmt = {
  data: (d: string) => {
    if (!d) return '—';
    const p = d.split('T')[0].split('-');
    return p.length < 3 ? d : `${p[2]}/${p[1]}/${p[0]}`;
  },
  altura: (a: any) => (!a && a !== 0) ? '—' : `${String(a).replace('.', ',')} m`,
  idade: (data: string) => {
    if (!data) return '—';
    const nasc = new Date(data);
    const hoje = new Date();
    let age = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) age--;
    return age >= 0 ? `${age} anos` : '—';
  },
  str: (v: any) => (v !== undefined && v !== null && String(v).trim() !== '') ? String(v) : '—',
};

// ─── Busca imagem como base64 ─────────────────────────────────────────────────
async function toBase64(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

// ─── Define cor de texto no doc ──────────────────────────────────────────────
function cor(doc: any, c: { r: number; g: number; b: number }) {
  doc.setTextColor(c.r, c.g, c.b);
}

// ─── Titulo de secao ─────────────────────────────────────────────────────────
// Retorna o novo y apos o titulo
function secao(doc: any, titulo: string, y: number, icone = ''): number {
  // Linha decorativa lateral
  doc.setFillColor(VD.r, VD.g, VD.b);
  doc.rect(MARGIN, y, 3, 6, 'F');

  // Fundo leve
  doc.setFillColor(247, 252, 248);
  doc.rect(MARGIN + 3, y, INNER_W - 3, 6, 'F');

  // Texto
  const label = icone ? `${icone}  ${titulo}` : titulo;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  cor(doc, VD);
  doc.text(label.toUpperCase(), MARGIN + 7, y + 4.2);

  // Linha fina abaixo
  doc.setDrawColor(VD.r, VD.g, VD.b);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y + 6, MARGIN + INNER_W, y + 6);

  return y + 10; // retorna y com espacamento
}

// ─── Tabela de dados em grid (2 ou 4 colunas) ────────────────────────────────
function tabelaGrid(
  doc: any,
  dados: [string, string][],
  startY: number,
  cols = 2
): number {
  if (dados.length === 0) return startY;

  const totalCols = cols * 2;
  const colW = INNER_W / totalCols;

  // Calcula linhas
  const rows: [string, string][][] = [];
  for (let i = 0; i < dados.length; i += cols) {
    rows.push(dados.slice(i, i + cols));
  }

  const body = rows.map(row => {
    const cells: any[] = [];
    for (let c = 0; c < cols; c++) {
      const item = row[c] || ['', ''];
      cells.push({ content: item[0], styles: { fontStyle: 'bold', textColor: [CZ.r, CZ.g, CZ.b], fillColor: [VD_L.r, VD_L.g, VD_L.b], cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 2 } } });
      cells.push({ content: item[1], styles: { textColor: [PR.r, PR.g, PR.b], fillColor: [255, 255, 255], cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 } } });
    }
    return cells;
  });

  const colStyles: Record<number, any> = {};
  for (let i = 0; i < totalCols; i++) {
    colStyles[i] = { cellWidth: colW };
  }

  autoTable(doc, {
    startY,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: INNER_W,
    styles: { fontSize: 7.8, minCellHeight: 7, overflow: 'linebreak' },
    columnStyles: colStyles,
    body,
    theme: 'plain',
    tableLineColor: [220, 235, 220],
    tableLineWidth: 0.2,
  });

  return (doc as any).lastAutoTable.finalY + 6;
}

// ─── Tabela com cabecalho ─────────────────────────────────────────────────────
function tabelaComCabecalho(
  doc: any,
  cabecalho: string[],
  corpo: string[][],
  startY: number
): number {
  autoTable(doc, {
    startY,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: INNER_W,
    styles: { fontSize: 7.5, cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 }, overflow: 'linebreak' },
    headStyles: {
      fillColor: [VD.r, VD.g, VD.b],
      textColor: [BR.r, BR.g, BR.b],
      fontStyle: 'bold',
      fontSize: 7,
    },
    bodyStyles: { textColor: [PR.r, PR.g, PR.b] },
    alternateRowStyles: { fillColor: [VD_L.r, VD_L.g, VD_L.b] },
    head: [cabecalho],
    body: corpo,
    tableLineColor: [210, 230, 210],
    tableLineWidth: 0.2,
  });
  return (doc as any).lastAutoTable.finalY + 6;
}

// ─── Caixa de aviso ──────────────────────────────────────────────────────────
function caixaAviso(doc: any, texto: string, y: number, tipo: 'sucesso' | 'neutro' = 'neutro'): number {
  const c = tipo === 'sucesso' ? { bg: [232, 252, 238], borda: [22, 101, 52], txt: [22, 101, 52] }
                                : { bg: [248, 249, 248], borda: [180, 195, 180], txt: [120, 130, 120] };
  doc.setFillColor(...c.bg as [number, number, number]);
  doc.setDrawColor(...c.borda as [number, number, number]);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, INNER_W, 9, 1.5, 1.5, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...c.txt as [number, number, number]);
  doc.text(texto, MARGIN + 4, y + 5.8);
  return y + 13;
}

// ─── Grafico de barras ────────────────────────────────────────────────────────
function graficoBarras(
  doc: any,
  dados: { label: string; valor: number; max: number }[],
  x: number,
  y: number,
  largura: number
): number {
  const barH = 5;
  const gap = 4;
  const barW = largura - 52;

  dados.forEach((d, i) => {
    const yL = y + i * (barH + gap);
    const pct = Math.min(d.valor / (d.max || 1), 1);
    const c: [number, number, number] = pct >= 0.7 ? [22, 101, 52] : pct >= 0.4 ? [202, 138, 4] : [185, 28, 28];

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(CZ.r, CZ.g, CZ.b);
    doc.text(d.label, x, yL + barH - 0.5);

    // Fundo
    doc.setFillColor(220, 232, 220);
    doc.roundedRect(x + 40, yL, barW, barH, 1, 1, 'F');

    // Barra
    if (pct > 0) {
      doc.setFillColor(...c);
      doc.roundedRect(x + 40, yL, Math.max(barW * pct, 2), barH, 1, 1, 'F');
    }

    // Valor
    doc.setFontSize(6.5);
    doc.setTextColor(PR.r, PR.g, PR.b);
    doc.text(`${d.valor} / ${d.max}`, x + 40 + barW + 3, yL + barH - 0.5);
  });

  return y + dados.length * (barH + gap) + 4;
}

// ─── Indicador circular ──────────────────────────────────────────────────────
function circulo(
  doc: any,
  cx: number, cy: number, raio: number,
  pct: number,
  cor_c: [number, number, number],
  label: string,
  sublabel = ''
): void {
  // Anel de fundo
  doc.setDrawColor(215, 230, 215);
  doc.setLineWidth(2);
  doc.circle(cx, cy, raio, 'S');

  // Anel preenchido (segmentado)
  const steps = Math.max(1, Math.floor(60 * pct));
  doc.setDrawColor(...cor_c);
  doc.setLineWidth(2);
  for (let i = 0; i < steps; i++) {
    const a1 = -Math.PI / 2 + (2 * Math.PI * pct * i) / steps;
    const a2 = -Math.PI / 2 + (2 * Math.PI * pct * (i + 1)) / steps;
    doc.line(cx + raio * Math.cos(a1), cy + raio * Math.sin(a1),
             cx + raio * Math.cos(a2), cy + raio * Math.sin(a2));
  }

  // Valor central
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...cor_c);
  doc.text(`${Math.round(pct * 100)}%`, cx, cy + 2.5, { align: 'center' });

  // Label abaixo
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(CZ.r, CZ.g, CZ.b);
  doc.text(label, cx, cy + raio + 5, { align: 'center' });
  if (sublabel) {
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(sublabel, cx, cy + raio + 9, { align: 'center' });
  }
}

// ─── Verifica espaco e adiciona pagina se necessario ────────────────────────
function checkPage(doc: any, y: number, needed: number): number {
  if (y + needed > PAGE_H - 18) {
    doc.addPage();
    return 22;
  }
  return y;
}

// ─── Separador entre secoes ──────────────────────────────────────────────────
function sep(y: number) { return y + 4; }

// ═════════════════════════════════════════════════════════════════════════════
// RENDERIZA UMA PAGINA DE PERFIL COMPLETO
// ═════════════════════════════════════════════════════════════════════════════
async function renderPerfil(doc: any, perfil: any): Promise<void> {
  let y = 0;

  // ━━━ CABECALHO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Faixa superior verde escuro
  doc.setFillColor(16, 80, 40);
  doc.rect(0, 0, PAGE_W, 6, 'F');

  // Faixa dourada
  doc.setFillColor(180, 145, 0);
  doc.rect(0, 6, PAGE_W, 2, 'F');

  // Faixa principal verde
  doc.setFillColor(VD.r, VD.g, VD.b);
  doc.rect(0, 8, PAGE_W, 28, 'F');



  doc.setTextColor(BR.r, BR.g, BR.b);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('EXERCITO BRASILEIRO  |  6. BATALHAO DE INFANTARIA', PAGE_W / 2, 13, { align: 'center' });

  doc.setFontSize(12.5);
  doc.setFont('helvetica', 'bold');
  doc.text('FICHA DE PERFIL DO MILITAR', PAGE_W / 2, 27, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 230, 210);
  doc.text(
    `Gerado em ${new Date().toLocaleDateString('pt-BR')} as ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    PAGE_W / 2, 33, { align: 'center' }
  );

  y = 44;

  // ━━━ BLOCO DE IDENTIFICACAO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const FOTO_W = 44;
  const FOTO_H = 54;

  // Sombra da foto
  doc.setFillColor(200, 215, 200);
  doc.roundedRect(MARGIN + 1, y + 1, FOTO_W, FOTO_H, 2, 2, 'F');

  // Borda foto
  doc.setFillColor(VD_L.r, VD_L.g, VD_L.b);
  doc.setDrawColor(VD.r, VD.g, VD.b);
  doc.setLineWidth(0.8);
  doc.roundedRect(MARGIN, y, FOTO_W, FOTO_H, 2, 2, 'FD');

  const fotoUrl = perfil.dadosCivil?.fotoUrl || perfil.fotoUrl;
  let fotoOk = false;
  if (fotoUrl) {
    const b64 = await toBase64(fotoUrl);
    if (b64) {
      doc.addImage(b64, 'JPEG', MARGIN + 0.8, y + 0.8, FOTO_W - 1.6, FOTO_H - 1.6);
      fotoOk = true;
    }
  }
  if (!fotoOk) {
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'italic');
    cor(doc, { r: 140, g: 160, b: 140 });
    doc.text('Sem foto', MARGIN + FOTO_W / 2, y + FOTO_H / 2, { align: 'center' });
  }

  // Dados ao lado da foto
  const TX = MARGIN + FOTO_W + 7;
  const TW = PAGE_W - TX - MARGIN;

  // Badge de situacao
  const sit = perfil.situacao || 'Ativo';
  const sitCores: Record<string, { bg: [number,number,number]; txt: [number,number,number] }> = {
    Ativo:       { bg: [212, 250, 225], txt: [14, 90, 42] },
    Baixado:     { bg: [254, 220, 220], txt: [160, 20, 20] },
    Transferido: { bg: [255, 240, 200], txt: [140, 90, 0] },
  };
  const sc = sitCores[sit] || { bg: [230, 230, 230], txt: [80, 80, 80] };
  doc.setFillColor(...sc.bg);
  doc.roundedRect(TX, y, 32, 7, 1.5, 1.5, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...sc.txt);
  doc.text(sit.toUpperCase(), TX + 16, y + 4.8, { align: 'center' });

  // Nome completo
  const nomeCompleto = perfil.dadosCivil?.nomeCompleto || '—';
  const nomeGuerra   = perfil.nomeGuerra || '—';
  const posto        = perfil.postoGraduacao || '';

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  cor(doc, VD);
  const nL = doc.splitTextToSize(nomeCompleto, TW);
  doc.text(nL, TX, y + 13);

  const subY = y + 13 + nL.length * 5.8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  cor(doc, CZ);
  doc.text(`${posto}  |  ${nomeGuerra}`, TX, subY);

  // Divider
  doc.setDrawColor(200, 220, 200);
  doc.setLineWidth(0.3);
  doc.line(TX, subY + 3, TX + TW, subY + 3);

  // Info pills
  const pills: [string, string][] = [
    ['Idt. Militar', fmt.str(perfil.idtMilitar)],
    ['CPF', fmt.str(perfil.dadosCivil?.cpf)],
    ['Data Praca', fmt.data(perfil.dataPraca)],
    ['Companhia', fmt.str(perfil.companhia)],
    ['Pelotao', fmt.str(perfil.pelotao)],
    ['Prec-CP', fmt.str(perfil.precCP)],
  ];

  const pillStartY = subY + 7;
  const pillColW = TW / 2;
  pills.forEach(([lbl, val], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const px = TX + col * pillColW;
    const py = pillStartY + row * 10;

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    cor(doc, CZ);
    doc.text(lbl.toUpperCase(), px, py);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    cor(doc, PR);
    doc.text(val, px, py + 4.5);
  });

  y = Math.max(y + FOTO_H + 10, pillStartY + Math.ceil(pills.length / 2) * 10 + 6);

  // Linha divisoria elegante
  doc.setDrawColor(VD.r, VD.g, VD.b);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, MARGIN + INNER_W, y);
  y += 8;

  // ━━━ DADOS MILITARES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  y = checkPage(doc, y, 55);
  y = secao(doc, 'Dados Militares', y);
  y = tabelaGrid(doc, [
    ['Posto / Graduacao', fmt.str(perfil.postoGraduacao)],
    ['Nome de Guerra', fmt.str(perfil.nomeGuerra)],
    ['Tipo de Vinculo', fmt.str(perfil.tipoVinculo)],
    ['Situacao', sit],
    ['Companhia', fmt.str(perfil.companhia)],
    ['Pelotao', fmt.str(perfil.pelotao)],
    ['Turma de Formacao', fmt.str(perfil.turmaFormacao)],
    ['Periodo Obrigatorio', fmt.str(perfil.periodoObrigatorio)],
    ['Numero Campo Basico', fmt.str(perfil.numeroCampoBasico)],
    ['Numero EBCA', fmt.str(perfil.numeroEbca)],
    ['Prec-CP', fmt.str(perfil.precCP)],
    ['Data de Praca', fmt.data(perfil.dataPraca)],
  ], y, 2);

  y = sep(y);

  // ━━━ FUNCOES CIA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const funcoesCia = Array.isArray(perfil.funcoesCia) ? perfil.funcoesCia : [];
  y = checkPage(doc, y, 40);
  y = secao(doc, 'Funcoes e Cargos na Cia', y);

  if (funcoesCia.length > 0) {
    y = tabelaComCabecalho(doc,
      ['FUNCAO', 'VINCULO', 'STATUS'],
      funcoesCia.map((f: any) => [
        fmt.str(f.funcao),
        fmt.str(f.vinculo),
        f.ativa ? 'Ativa' : 'Inativa',
      ]), y
    );
  } else {
    y = caixaAviso(doc, '* Nenhuma funcao registrada para este militar na Cia.', y, 'neutro');
  }

  y = sep(y);

  // ━━━ DADOS PESSOAIS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  y = checkPage(doc, y, 65);
  y = secao(doc, 'Dados Pessoais', y);
  y = tabelaGrid(doc, [
    ['Nome Completo', fmt.str(perfil.dadosCivil?.nomeCompleto)],
    // Espaçamento vazio (tupla de 2 strings exigida pela tipagem de tabelaGrid)
    ['', ''],
    ['Nome do Pai', fmt.str(perfil.dadosCivil?.nomePai)],
    ['Nome da Mae', fmt.str(perfil.dadosCivil?.nomeMae)],
    ['Data de Nascimento', fmt.data(perfil.dadosCivil?.dataNascimento)],
    ['Sexo', perfil.dadosCivil?.sexo || '—'],
    ['Idade', fmt.idade(perfil.dadosCivil?.dataNascimento)],
    ['CPF', fmt.str(perfil.dadosCivil?.cpf)],
    ['Identidade Civil', fmt.str(perfil.dadosCivil?.idtCivil)],
    ['Escolaridade', fmt.str(perfil.dadosCivil?.escolaridade)],
    ['Religiao', fmt.str(perfil.dadosCivil?.religiao)],
    ['CNH (Categorias)', Array.isArray(perfil.dadosCivil?.cnhCategoria) ? (perfil.dadosCivil.cnhCategoria.join(', ') || '—') : fmt.str(perfil.dadosCivil?.cnhCategoria)],
    ['Estado Civil', fmt.str(perfil.dadosCivil?.estadoCivil)],
  ], y, 2);

  y = sep(y);

  // ━━━ SAUDE E FISICO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  y = checkPage(doc, y, 40);
  y = secao(doc, 'Saude e Caracteristicas Fisicas', y);
  y = tabelaGrid(doc, [
    ['Altura', fmt.altura(perfil.dadosCivil?.altura)],
    ['Tipo Sanguineo / RH', `${fmt.str(perfil.dadosCivil?.tipoSanguineo)} ${fmt.str(perfil.dadosCivil?.fatorRh)}`],
    ['Cutis', fmt.str(perfil.dadosCivil?.cutis)],
    ['Olhos', fmt.str(perfil.dadosCivil?.olhos)],
    ['Cabelos', fmt.str(perfil.dadosCivil?.cabelos)],
    ['Fator RH', fmt.str(perfil.dadosCivil?.fatorRh)],
  ], y, 2);

  y = sep(y);

  // ━━━ ENDERECO E CONTATO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  y = checkPage(doc, y, 45);
  y = secao(doc, 'Endereco e Contato', y);
  y = tabelaGrid(doc, [
    ['Logradouro', `${fmt.str(perfil.endereco?.rua)}, ${fmt.str(perfil.endereco?.numero)}`],
    ['Bairro', fmt.str(perfil.endereco?.bairro)],
    ['Cidade / UF', `${fmt.str(perfil.endereco?.cidade)} / ${fmt.str(perfil.endereco?.uf)}`],
    ['CEP', fmt.str(perfil.endereco?.cep)],
    ['Telefone', fmt.str(perfil.contato?.telefone)],
    ['Reside com', fmt.str(perfil.contato?.coabitacao)],
    ['Contato de Emergencia', `${fmt.str(perfil.contato?.nomeEmergencia)} (${fmt.str(perfil.contato?.grauParentesco)})`],
    ['Tel. Emergencia', fmt.str(perfil.contato?.telefoneEmergencia)],
  ], y, 2);

  y = sep(y);

  // ━━━ TAF ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Alterado: O campo pontuacao foi alterado para mencao no TAF, de acordo com o pedido.
  const tafs = Array.isArray(perfil.taf) ? perfil.taf : [];
  y = checkPage(doc, y, 70);
  y = secao(doc, 'Teste de Aptidao Fisica (TAF)', y);

  if (tafs.length > 0) {
    const cab = ['DATA', 'FLEXAO', 'ABDOMINAL', 'CORRIDA / DISTANCIA', 'MENCAO', 'RESULTADO'];
    const corpo = tafs.slice(-6).map((t: any) => [
      fmt.data(t.data || t.Data || ''),
      fmt.str(t.flexao ?? t.Flexao),
      fmt.str(t.abdominal ?? t.Abdominal),
      fmt.str(t.corrida ?? t.Corrida ?? t.distancia),
      fmt.str(t.mencao ?? t.Mencao ?? t.pontuacao),
      fmt.str(t.resultado ?? t.Resultado ?? t.conceito),
    ]);
    y = tabelaComCabecalho(doc, cab, corpo, y);

    // Graficos
    const ult = tafs[tafs.length - 1];
    const fx = Math.min(Number(ult.flexao ?? ult.Flexao ?? 0), 50);
    const ab = Math.min(Number(ult.abdominal ?? ult.Abdominal ?? 0), 50);
    if (fx > 0 || ab > 0) {
      y = checkPage(doc, y, 40);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      cor(doc, CZ);
      doc.text('Grafico de Desempenho - Ultimo TAF', MARGIN, y + 4);
      y += 7;
      y = graficoBarras(doc, [
        { label: 'Flexao', valor: fx, max: 50 },
        { label: 'Abdominal', valor: ab, max: 50 },
      ], MARGIN, y, INNER_W / 2);

      // Indicadores circulares
      y = checkPage(doc, y, 35);
      const corFn = (p: number): [number, number, number] =>
        p >= 0.7 ? [22, 101, 52] : p >= 0.4 ? [161, 98, 7] : [185, 28, 28];
      const R = 9;
      const SP = 38;
      const BX = MARGIN + R + 4;
      const CY = y + R + 4;
      circulo(doc, BX,        CY, R, fx / 50, corFn(fx / 50), 'Flexao',    `${fx} rep.`);
      circulo(doc, BX + SP,   CY, R, ab / 50, corFn(ab / 50), 'Abdominal', `${ab} rep.`);
      const med = (fx / 50 + ab / 50) / 2;
      circulo(doc, BX + SP*2, CY, R, med,     corFn(med),     'Media TAF', `${Math.round(med*100)}%`);
      y = CY + R + 14;
    }
  } else {
    y = tabelaComCabecalho(doc,
      ['DATA', 'FLEXAO', 'ABDOMINAL', 'CORRIDA / DISTANCIA', 'MENCAO', 'RESULTADO'],
      [
        [`${new Date().getFullYear()}`, '—', '—', '—', '—', 'Sem registro'],
        [`${new Date().getFullYear() - 1}`, '—', '—', '—', '—', 'Sem registro'],
      ], y
    );
    y = caixaAviso(doc, '* Nenhum resultado de TAF registrado para este militar.', y, 'neutro');
  }

  y = sep(y);

  // ━━━ TIRO DE CAMPO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Alterado: Sistemática do tiro atualizada para exibir data, tipo, mencao e obs.
  const tiros = Array.isArray(perfil.tiro) ? perfil.tiro : [];
  y = checkPage(doc, y, 55);
  y = secao(doc, 'Tiro de Campo', y);

  if (tiros.length > 0) {
    y = tabelaComCabecalho(doc,
      ['DATA', 'TIPO', 'MENCAO', 'OBS'],
      tiros.slice(-5).map((t: any) => [
        fmt.data(t.data || t.Data || ''),
        fmt.str(t.tipo ?? t.Tipo ?? t.arma ?? t.Arma),
        fmt.str(t.mencao ?? t.Mencao ?? t.pontuacao ?? t.Pontuacao ?? t.pontos),
        fmt.str(t.obs ?? t.Obs ?? t.observacao ?? t.conceito ?? t.Conceito),
      ]), y
    );
  } else {
    y = tabelaComCabecalho(doc,
      ['DATA', 'TIPO', 'MENCAO', 'OBS'],
      [['—', '—', '—', 'Sem registro']], y
    );
    y = caixaAviso(doc, '* Nenhum resultado de tiro de campo registrado.', y, 'neutro');
  }

  y = sep(y);

  // ━━━ FERIAS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const planosFerias = Array.isArray(perfil.planosFerias) ? perfil.planosFerias : [];
  y = checkPage(doc, y, 55);
  y = secao(doc, 'Planos de Ferias', y);

  if (planosFerias.length > 0) {
    const feriasFlat: any[] = [];
    planosFerias.forEach((pf: any) => {
      if (pf.periodos && pf.periodos.length > 0) {
        pf.periodos.forEach((p: any) => {
          feriasFlat.push({ ...p, titulo: pf.titulo, ano: pf.anoReferencia, status: pf.status });
        });
      } else {
        feriasFlat.push({ titulo: pf.titulo, ano: pf.anoReferencia, status: pf.status, nome: '—', inicio: '', fim: '' });
      }
    });

    y = tabelaComCabecalho(doc,
      ['PLANO / ANO', 'PERIODO', 'INICIO', 'FIM', 'STATUS'],
      feriasFlat.slice(-8).map((f: any) => [
        `${fmt.str(f.titulo)} (${fmt.str(f.ano)})`,
        fmt.str(f.nome),
        fmt.data(f.inicio),
        fmt.data(f.fim),
        fmt.str(f.status),
      ]), y
    );
  } else {
    const ano = new Date().getFullYear();
    y = tabelaComCabecalho(doc,
      ['PLANO / ANO', 'PERIODO', 'INICIO', 'FIM', 'STATUS'],
      [
        [`— (${ano})`, '—', '—', '—', 'Sem registro'],
      ], y
    );
    y = caixaAviso(doc, '* Nenhum plano de ferias registrado no sistema.', y, 'neutro');
  }

  y = sep(y);

  // ━━━ VISITAS MEDICAS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const visitas = Array.isArray(perfil.visitasMedicas) ? perfil.visitasMedicas : [];
  y = checkPage(doc, y, 55);
  y = secao(doc, 'Historico de Visitas Medicas', y);

  if (visitas.length > 0) {
    y = tabelaComCabecalho(doc,
      ['DATA', 'MOTIVO', 'MEDICO', 'PARECER', 'BAIXADO'],
      visitas.slice(-6).map((v: any) => [
        fmt.data(v.data),
        fmt.str(v.motivo),
        fmt.str(v.medico),
        fmt.str(v.resultado),
        v.baixado ? 'Sim' : 'Nao',
      ]), y
    );
  } else {
    y = tabelaComCabecalho(doc,
      ['DATA', 'MOTIVO', 'MEDICO', 'PARECER', 'BAIXADO'],
      [
        ['—', '—', '—', 'Sem registro', '—'],
      ], y
    );
    y = caixaAviso(doc, '* Nenhuma visita medica registrada no sistema.', y, 'neutro');
  }

  y = sep(y);

  // ━━━ BAIXADOS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const baixados = Array.isArray(perfil.baixados) ? perfil.baixados : [];
  y = checkPage(doc, y, 55);
  y = secao(doc, 'Baixas / Licencas de Saude', y);

  if (baixados.length > 0) {
    y = tabelaComCabecalho(doc,
      ['INICIO', 'RETORNO', 'MOTIVO', 'CSD'],
      baixados.slice(-6).map((b: any) => [
        fmt.data(b.dataInicio),
        fmt.data(b.dataFim),
        fmt.str(b.motivo),
        fmt.str(b.csd),
      ]), y
    );
  } else {
    y = caixaAviso(doc, '* Nenhum registro de baixa medica para este militar.', y, 'sucesso');
  }

  y = sep(y);

  // ━━━ PUNICOES RECEBIDAS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const punicoesRecebidas = Array.isArray(perfil.punicoesRecebidas) ? perfil.punicoesRecebidas : [];
  y = checkPage(doc, y, 50);
  y = secao(doc, 'Punicoes Recebidas', y);

  if (punicoesRecebidas.length > 0) {
    y = tabelaComCabecalho(doc,
      ['DATA DO FATO', 'PROCESSO / BI', 'TIPO', 'DIAS', 'FATO RELATADO'],
      punicoesRecebidas.slice(-6).map((p: any) => [
        fmt.data(p.dataFato),
        `${fmt.str(p.numeroProcesso)}\nBI: ${fmt.str(p.biPublicacao)}`,
        fmt.str(p.tipo),
        fmt.str(p.dias),
        fmt.str(p.fatoRelatado),
      ]), y
    );
  } else {
    y = caixaAviso(doc, 'Nenhuma punicao registrada para este militar.', y, 'sucesso');
  }

  y = sep(y);

  // Alterado: A seção "Processos como Participante" foi removida conforme solicitado.

  // ━━━ CURSOS E ESPECIALIZACOES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const cursos = perfil.especialidades?.cursos || perfil.cursosProfissionais || '';
  y = checkPage(doc, y, 35);
  y = secao(doc, 'Cursos e Especializacoes', y);

  if (cursos) {
    doc.setFillColor(VD_L.r, VD_L.g, VD_L.b);
    doc.setDrawColor(VD.r, VD.g, VD.b);
    doc.setLineWidth(0.2);
    const cursosLines = doc.splitTextToSize(cursos, INNER_W - 8);
    const boxH = cursosLines.length * 5 + 8;
    doc.roundedRect(MARGIN, y, INNER_W, boxH, 1.5, 1.5, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    cor(doc, PR);
    doc.text(cursosLines, MARGIN + 4, y + 6);
    y += boxH + 6;
  } else {
    y = caixaAviso(doc, 'Nenhum curso ou especializacao registrado.', y, 'neutro');
  }

  // ━━━ REDES SOCIAIS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const temRede = Object.values(perfil.redesSociais || {}).some(v => v && String(v).trim() !== '');
  if (temRede) {
    y = sep(y);
    y = checkPage(doc, y, 40);
    y = secao(doc, 'Redes Sociais', y);
    const redesBody = [
      ['Instagram', fmt.str(perfil.redesSociais?.instagram)],
      ['Facebook',  fmt.str(perfil.redesSociais?.facebook)],
      ['TikTok',    fmt.str(perfil.redesSociais?.tiktok)],
      ['Twitter/X', fmt.str(perfil.redesSociais?.twitter)],
      ['Outras',    fmt.str(perfil.redesSociais?.outras)],
    ].filter(r => r[1] !== '—') as [string, string][];
    if (redesBody.length) y = tabelaGrid(doc, redesBody, y, 1);
  }

  void y;
}

// ─── Rodape em todas as paginas ──────────────────────────────────────────────
function addFooters(doc: any): void {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    // Linha verde no fundo
    doc.setFillColor(VD.r, VD.g, VD.b);
    doc.rect(0, PAGE_H - 11, PAGE_W, 11, 'F');
    doc.setFillColor(180, 145, 0);
    doc.rect(0, PAGE_H - 11, PAGE_W, 1.5, 'F');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(BR.r, BR.g, BR.b);
    doc.text('6.o BI INF  -  Sistema de Gestao de Tropas (SGTE)  -  EXERCITO BRASILEIRO', MARGIN, PAGE_H - 4.5);
    doc.text(`Pagina ${i} de ${total}`, PAGE_W - MARGIN, PAGE_H - 4.5, { align: 'right' });
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═════════════════════════════════════════════════════════════════════════════

export async function exportarPerfilPDF(perfil: any): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  await renderPerfil(doc, perfil);
  addFooters(doc);
  const nomeValido = perfil.dadosCivil?.nomeCompleto || perfil.nomeGuerra || perfil.nome || 'Militar';
  const nomeArquivo = nomeValido.replace(/\s+/g, '_');
  doc.save(`${nomeArquivo}.pdf`);
}

export async function exportarLotePerfisPDF(perfis: any[]): Promise<void> {
  if (!perfis?.length) return;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  for (let i = 0; i < perfis.length; i++) {
    if (i > 0) doc.addPage();
    await renderPerfil(doc, perfis[i]);
  }
  addFooters(doc);
  doc.save('Militares.pdf');
}

export async function exportarListaMilitaresPDF(militares: any[]): Promise<void> {
  if (!militares?.length) return;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  doc.setFillColor(VD.r, VD.g, VD.b);
  doc.rect(0, 0, pw, 30, 'F');
  doc.setFillColor(180, 145, 0);
  doc.rect(0, 28, pw, 2, 'F');

  doc.setTextColor(BR.r, BR.g, BR.b);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('EXERCITO BRASILEIRO  |  6.o BATALHAO DE INFANTARIA', pw / 2, 10, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('LISTAGEM DE MILITARES', pw / 2, 20, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 230, 210);
  doc.text(
    `Emitido em ${new Date().toLocaleDateString('pt-BR')} as ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}  |  Total: ${militares.length} militar(es)`,
    pw / 2, 26, { align: 'center' }
  );

  autoTable(doc, {
    startY: 36,
    margin: { left: 10, right: 10 },
    styles: { fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 3, right: 3 } },
    headStyles: { fillColor: [16, 80, 40], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { textColor: [PR.r, PR.g, PR.b] },
    alternateRowStyles: { fillColor: [VD_L.r, VD_L.g, VD_L.b] },
    tableLineColor: [210, 230, 210],
    tableLineWidth: 0.2,
    head: [['N.', 'POSTO/GRAD.', 'NOME DE GUERRA', 'CPF', 'IDT. MIL.', 'SUBUNIDADE', 'PELOTAO', 'VINCULO', 'SITUACAO']],
    body: militares.map((m, idx) => [
      String(idx + 1).padStart(2, '0'),
      m.posto || '—', m.nomeGuerra || m.nome || '—',
      m.cpf || '—', m.identidade || '—',
      m.subunidade || m.companhia || '—',
      m.pelotao || '—', m.tipoVinculo || '—',
      m.situacao || 'Ativo',
    ]),
  });

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFillColor(VD.r, VD.g, VD.b);
    doc.rect(0, ph - 10, pw, 10, 'F');
    doc.setFillColor(180, 145, 0);
    doc.rect(0, ph - 10, pw, 1, 'F');
    doc.setTextColor(BR.r, BR.g, BR.b);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text('6.o BI INF  -  Sistema de Gestao de Tropas (SGTE)', 12, ph - 4);
    doc.text(`Pagina ${i} de ${total}`, pw - 12, ph - 4, { align: 'right' });
  }

  doc.save('Militares.pdf');
}
