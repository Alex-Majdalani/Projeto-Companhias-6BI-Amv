import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { 
  FileText, ChevronDown, ChevronUp, AlertCircle, 
  User, ShieldAlert, Calendar, FileCheck, RefreshCw, Scale 
} from 'lucide-react';
import { militaresMock } from './CadastroMilitares';

interface FATDForm {
  // Identificação da FATD
  processo: string;
  data: string;

  // Dados do arrolado
  pgArrolado: string;
  nomeArrolado: string;
  subunidadeArrolado: string;

  // Dados do participante
  pgParticipante: string;
  nomeParticipante: string;
  subunidadeParticipante: string;
  funcaoParticipante: string;

  // Descrição do Fato
  relatoFato: string;
  sargenteanteNome: string;
  sargenteantePosto: string;
  sargenteanteCargo: string;

  // Cmt Cia
  cmtCia: string;
}

const cmtsCiaMock = [
  'Cap Rômulo',
  '1º Ten Castro',
  '2º Ten Henrique'
];

const subunidadesMock = [
  '1ª Cia Fuz Amv',
  '2ª Cia Fuz Amv',
  'CCAp / 6º BI Amv',
  'Esqd Cia',
  '6º BI Amv'
];

const postosGraduacoes = [
  'Maj', 'Cap', '1º Ten', '2º Ten', 'Asp', 'Subten', 
  '1º Sgt', '2º Sgt', '3º Sgt', 'Cb', 'Sd'
];

export function FATD() {
  const [form, setForm] = useState<FATDForm>({
    processo: '',
    data: new Date().toISOString().split('T')[0],

    pgArrolado: '',
    nomeArrolado: '',
    subunidadeArrolado: '2ª Cia Fuz Amv',

    pgParticipante: '',
    nomeParticipante: '',
    subunidadeParticipante: '2ª Cia Fuz Amv',
    funcaoParticipante: '',

    relatoFato: '',
    sargenteanteNome: 'ALEXNALDO MAJDALANI DE MELO JUNIOR',
    sargenteantePosto: '2° SGT',
    sargenteanteCargo: 'Sargenteante da 2ª Cia Fuz Amv',

    cmtCia: cmtsCiaMock[0],
  });

  const [expandedSections, setExpandedSections] = useState({
    identificacao: true,
    arrolado: true,
    participante: true,
    relato: true,
    cmtCiaSec: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleFieldChange = (field: keyof FATDForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Preenche dados do Arrolado automaticamente se encontrar no autocomplete
  const handleNomeArroladoChange = (val: string) => {
    handleFieldChange('nomeArrolado', val);
    const encontrado = militaresMock.find(m => 
      m.nome.toLowerCase() === val.trim().toLowerCase() ||
      `${m.posto} ${m.nome}`.toLowerCase() === val.trim().toLowerCase()
    );
    if (encontrado) {
      setForm(prev => ({
        ...prev,
        nomeArrolado: encontrado.nome,
        pgArrolado: encontrado.posto,
        subunidadeArrolado: encontrado.subunidade || '2ª Cia Fuz Amv',
      }));
    }
  };

  // Preenche dados do Participante automaticamente se encontrar no autocomplete
  const handleNomeParticipanteChange = (val: string) => {
    handleFieldChange('nomeParticipante', val);
    const encontrado = militaresMock.find(m => 
      m.nome.toLowerCase() === val.trim().toLowerCase() ||
      `${m.posto} ${m.nome}`.toLowerCase() === val.trim().toLowerCase()
    );
    if (encontrado) {
      setForm(prev => ({
        ...prev,
        nomeParticipante: encontrado.nome,
        pgParticipante: encontrado.posto,
        subunidadeParticipante: encontrado.subunidade || '2ª Cia Fuz Amv',
      }));
    }
  };

  const handleLimparFormulario = () => {
    if (window.confirm('Deseja realmente limpar todos os campos do formulário?')) {
      setForm({
        processo: '',
        data: new Date().toISOString().split('T')[0],
        pgArrolado: '',
        nomeArrolado: '',
        subunidadeArrolado: '2ª Cia Fuz Amv',
        pgParticipante: '',
        nomeParticipante: '',
        subunidadeParticipante: '2ª Cia Fuz Amv',
        funcaoParticipante: '',
        relatoFato: '',
        sargenteanteNome: 'ALEXNALDO MAJDALANI DE MELO JUNIOR',
        sargenteantePosto: '2° SGT',
        sargenteanteCargo: 'Sargenteante da 2ª Cia Fuz Amv',
        cmtCia: cmtsCiaMock[0],
      });
    }
  };

  const formatShortDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Geração do PDF conforme o modelo FATD_MODELO2.pdf
  const gerarPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth(); // 210mm
    const margin = 15;
    const contentW = pageW - margin * 2; // 180mm

    // ==========================================
    // PÁGINA 1
    // ==========================================
    let y = 15;

    // Cabeçalho Institucional
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('MINISTÉRIO DA DEFESA', pageW / 2, y, { align: 'center' });
    y += 4.5;
    doc.text('EXÉRCITO BRASILEIRO', pageW / 2, y, { align: 'center' });
    y += 4.5;
    doc.text('6º BATALHÃO DE INFANTARIA AEROMÓVEL', pageW / 2, y, { align: 'center' });
    y += 4.5;
    doc.text('REGIMENTO IPIRANGA', pageW / 2, y, { align: 'center' });
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('(BC PRO DO CE/ 1842)', pageW / 2, y, { align: 'center' });
    y += 7;

    // Subunidade com sublinhado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('2ª COMPANHIA DE FUZILEIROS AEROMÓVEL', pageW / 2, y, { align: 'center' });
    // Linha de sublinhado da subunidade
    doc.setLineWidth(0.3);
    doc.line(pageW / 2 - 45, y + 1.5, pageW / 2 + 45, y + 1.5);
    y += 8;

    // Título do documento
    doc.setFontSize(11);
    doc.text('FORMULÁRIO DE APURAÇÃO DE TRANSGRESSÃO DISCIPLINAR', pageW / 2, y, { align: 'center' });
    doc.line(pageW / 2 - 65, y + 1.5, pageW / 2 + 65, y + 1.5);
    y += 7;

    // Retângulo: Identificação da FATD (Processo e Data)
    doc.setLineWidth(0.4);
    doc.rect(margin, y, contentW, 10);
    // Linha divisória vertical
    doc.line(115, y, 115, y + 10);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(`PROCESSO Nº ${form.processo || '______'}`, margin + 3, y + 6.5);
    doc.text(`DATA: ${formatShortDate(form.data)}`, 115 + 3, y + 6.5);
    y += 14;

    // Retângulo: IDENTIFICAÇÃO DO MILITAR (ARROLADO)
    const hArrolado = 26;
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.rect(margin, y, contentW, hArrolado);
    doc.rect(margin, y, contentW, 7); // borda do cabeçalho
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('IDENTIFICAÇÃO DO MILITAR', pageW / 2, y + 5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Grau Hierárquico: ${form.pgArrolado || ''}`, margin + 3, y + 12);
    doc.text(`Nome Completo: ${form.nomeArrolado || ''}`, margin + 3, y + 17);
    doc.text(`Subunidade/OM: ${form.subunidadeArrolado || ''}`, margin + 3, y + 22);
    y += hArrolado + 4;

    // Retângulo: IDENTIFICAÇÃO DO PARTICIPANTE
    const hParticipante = 42;
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.rect(margin, y, contentW, hParticipante);
    doc.rect(margin, y, contentW, 7); // borda do cabeçalho
    doc.setFont('helvetica', 'bold');
    doc.text('IDENTIFICAÇÃO DO PARTICIPANTE', pageW / 2, y + 5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.text(`Grau Hierárquico: ${form.pgParticipante || ''}`, margin + 3, y + 12);
    doc.text(`Nome Completo: ${form.nomeParticipante || ''}`, margin + 3, y + 17);
    doc.text(`Subunidade/OM: ${form.subunidadeParticipante || ''}`, margin + 3, y + 22);

    // Assinatura do participante
    const assParticNome = form.nomeParticipante || '_______________________________';
    const assParticPg = form.pgParticipante ? ` – ${form.pgParticipante}` : '';
    doc.text(`${assParticNome}${assParticPg}`, pageW / 2, y + 32, { align: 'center' });
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.text(form.funcaoParticipante || 'Função', pageW / 2, y + 36.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    y += hParticipante + 4;

    // Retângulo: RELATO DO FATO
    const hRelato = 62;
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.rect(margin, y, contentW, hRelato);
    doc.rect(margin, y, contentW, 7); // borda do cabeçalho
    doc.setFont('helvetica', 'bold');
    doc.text('RELATO DO FATO', pageW / 2, y + 5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    const relatoTexto = form.relatoFato || 'Sem relato informado.';
    const linhasRelato = doc.splitTextToSize(relatoTexto, contentW - 6);
    doc.text(linhasRelato, margin + 3, y + 12);

    // Assinatura de quem lavra/confecciona (Sargenteante)
    const assSgteNome = form.sargenteanteNome || '_______________________________';
    const assSgtePg = form.sargenteantePosto ? ` – ${form.sargenteantePosto}` : '';
    doc.setFont('helvetica', 'bold');
    doc.text(`${assSgteNome}${assSgtePg}`, pageW / 2, y + 50, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(form.sargenteanteCargo || 'Sargenteante', pageW / 2, y + 54.5, { align: 'center' });
    doc.setFontSize(9);
    y += hRelato + 4;

    // Retângulo: CIENTE DO MILITAR ARROLADO
    const hCiente = 66;
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.rect(margin, y, contentW, hCiente);
    doc.rect(margin, y, contentW, 7); // borda do cabeçalho
    doc.setFont('helvetica', 'bold');
    doc.text('CIENTE DO MILITAR ARROLADO', pageW / 2, y + 5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    const cienteTexto = 'Declaro que tenho conhecimento de que me está sendo imputada a autoria dos atos acima e me foi concedido o prazo de três dias úteis, para, querendo, apresentar, por escrito, as minhas justificativas ou razões de defesa.';
    const linhasCiente = doc.splitTextToSize(cienteTexto, contentW - 6);
    doc.text(linhasCiente, margin + 3, y + 12);

    // Data e local
    doc.text('Caçapava-SP,          de                                 de 2026.', pageW / 2, y + 32, { align: 'center' });

    // Linha e assinatura
    doc.line(pageW / 2 - 50, y + 52, pageW / 2 + 50, y + 52);
    const assArroladoNome = form.nomeArrolado || '_______________________________';
    const assArroladoPg = form.pgArrolado ? ` – ${form.pgArrolado}` : '';
    doc.text(`${assArroladoNome}${assArroladoPg}`, pageW / 2, y + 57, { align: 'center' });


    // ==========================================
    // PÁGINA 2
    // ==========================================
    doc.addPage();
    y = 15;

    // Retângulo: JUSTIFICATIVAS / RAZÕES DE DEFESA
    const hDefesa = 115;
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.rect(margin, y, contentW, hDefesa);
    doc.rect(margin, y, contentW, 7); // borda do cabeçalho
    doc.setFont('helvetica', 'bold');
    doc.text('JUSTIFICATIVAS / RAZÕES DE DEFESA', pageW / 2, y + 5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    const introDefesa = `Eu, ${form.nomeArrolado || '___________________________'}${assArroladoPg}, amparado pelo Inciso LV, do Art 5º da Constituição Federal declaro em minha defesa que:`;
    const linhasIntro = doc.splitTextToSize(introDefesa, contentW - 6);
    doc.text(linhasIntro, margin + 3, y + 12);

    // Linhas pautadas cinzas para escrita manual da defesa
    doc.setDrawColor(210);
    doc.setLineWidth(0.25);
    for (let ly = y + 23; ly <= y + 87; ly += 8) {
      doc.line(margin + 3, ly, pageW - margin - 3, ly);
    }
    doc.setDrawColor(0); // Volta cor padrão preta

    // Data e local
    doc.text('Caçapava-SP,          de                                 de 2026.', pageW / 2, y + 97, { align: 'center' });

    // Assinatura
    doc.setLineWidth(0.3);
    doc.line(pageW / 2 - 50, y + 107, pageW / 2 + 50, y + 107);
    doc.text(`${assArroladoNome}${assArroladoPg}`, pageW / 2, y + 111, { align: 'center' });
    y += hDefesa + 4;

    // Retângulo: DECISÃO DA AUTORIDADE COMPETENTE
    const hDecisao = 142;
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.rect(margin, y, contentW, hDecisao);
    doc.rect(margin, y, contentW, 7); // borda do cabeçalho
    doc.setFont('helvetica', 'bold');
    doc.text('DECISÃO DA AUTORIDADE COMPETENTE PARA APLICAR A PUNIÇÃO DISCIPLINAR', pageW / 2, y + 5, { align: 'center' });

    // Linhas pautadas cinzas para escrita manual da decisão
    doc.setDrawColor(210);
    doc.setLineWidth(0.25);
    for (let ly = y + 14; ly <= ly + 64 && ly <= y + 86; ly += 8) {
      doc.line(margin + 3, ly, pageW - margin - 3, ly);
    }
    // Desenhando linhas adicionais até cobrir espaço
    for (let ly = y + 14; ly <= y + 78; ly += 8) {
      doc.line(margin + 3, ly, pageW - margin - 3, ly);
    }
    doc.setDrawColor(0);

    // Assinatura do Comandante de Companhia
    doc.setLineWidth(0.3);
    doc.line(pageW / 2 - 50, y + 105, pageW / 2 + 50, y + 105);
    doc.setFont('helvetica', 'bold');
    doc.text(form.cmtCia || '_______________________________', pageW / 2, y + 110, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Cmt 2ª Cia Fuz Amv', pageW / 2, y + 114, { align: 'center' });
    doc.setFontSize(9);

    // Publicação no Boletim Interno no rodapé da caixa
    doc.text('PUNIÇÃO PUBLICADA NO BI nº_________,de__________________de_______________', pageW / 2, y + 134, { align: 'center' });

    // Salvar no localStorage para integrar com a aba de Punições
    try {
      const obterNomeGuerra = (nomeCompleto: string) => {
        if (!nomeCompleto) return '';
        const partes = nomeCompleto.trim().split(/\s+/);
        return partes.length > 0 ? partes[partes.length - 1].toUpperCase() : '';
      };

      const novasPunicoesRaw = localStorage.getItem('@SisGAdm:punicoes');
      const punicoes = novasPunicoesRaw ? JSON.parse(novasPunicoesRaw) : [];

      const novaPunicao = {
        id: Date.now().toString(),
        numProcesso: form.processo || 'S/N',
        pgMilitar: form.pgArrolado || 'Sem P/G',
        nomeGuerra: obterNomeGuerra(form.nomeArrolado) || form.nomeArrolado || 'Sem Nome',
        dataFATD: form.data,
        relatoFato: form.relatoFato || 'Sem relato',
        status: 'Não Publicado',
        biPublicacao: '',
        tipoPunicao: '',
        quantidadeDias: '',
        nomeParticipante: form.nomeParticipante || 'Não informado',
        pgParticipante: form.pgParticipante || '',
      };

      punicoes.push(novaPunicao);
      localStorage.setItem('@SisGAdm:punicoes', JSON.stringify(punicoes));
      alert('Documento gerado com sucesso! A punição foi registrada na aba "Punições" com status "Não Publicado".');
    } catch (e) {
      console.error('Erro ao salvar punição no localStorage:', e);
    }

    // Salvar documento
    const nomeArquivo = `FATD_PROCESSO_${form.processo.replace(/\//g, '-') || 'RASCUNHO'}.pdf`;
    doc.save(nomeArquivo);
  };

  // Auxiliar para os headers de seções
  const SectionHeader = ({ label, section, icon }: { label: string; section: keyof typeof expandedSections; icon: React.ReactNode }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex justify-between items-center bg-gray-50 border border-gray-200 rounded-lg p-3.5 text-left font-semibold text-gray-800 hover:bg-gray-100 transition-colors shadow-sm"
      type="button"
    >
      <div className="flex items-center gap-3">
        <div className="text-militar-main">{icon}</div>
        <span>{label}</span>
      </div>
      {expandedSections[section] ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
    </button>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Apuração de Transgressão Disciplinar (FATD)</h1>
          <Breadcrumb items={[{ label: 'Sargenteação' }, { label: 'FATD' }]} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel do Formulário */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* SEÇÃO 1: Identificação da FATD */}
          <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <SectionHeader label="Identificação da FATD" section="identificacao" icon={<Calendar size={18} />} />
            {expandedSections.identificacao && (
              <div className="p-5 space-y-4 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Número do Processo"
                    placeholder="Ex: 001/2026"
                    value={form.processo}
                    onChange={e => handleFieldChange('processo', e.target.value)}
                  />
                  <Input 
                    label="Data do Processo / Fato"
                    type="date"
                    value={form.data}
                    onChange={e => handleFieldChange('data', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* SEÇÃO 2: Dados do Arrolado */}
          <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <SectionHeader label="Dados do Militar Arrolado (Transgressor)" section="arrolado" icon={<User size={18} />} />
            {expandedSections.arrolado && (
              <div className="p-5 space-y-4 border-t border-gray-100">
                <div>
                  <Input 
                    label="Nome Completo do Arrolado"
                    list="arrolado-list"
                    placeholder="Digite para buscar militar..."
                    value={form.nomeArrolado}
                    onChange={e => handleNomeArroladoChange(e.target.value)}
                  />
                  <datalist id="arrolado-list">
                    {militaresMock.map(m => (
                      <option key={`arrolado-${m.id}`} value={`${m.posto} ${m.nome}`} />
                    ))}
                  </datalist>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select 
                    label="Posto/Graduação (P/G)"
                    value={form.pgArrolado}
                    onChange={e => handleFieldChange('pgArrolado', e.target.value)}
                  >
                    <option value="">Selecione o P/G...</option>
                    {postosGraduacoes.map(pg => (
                      <option key={`pg-arrolado-${pg}`} value={pg}>{pg}</option>
                    ))}
                  </Select>
                  <Input 
                    label="Subunidade / OM"
                    list="subunidade-list"
                    placeholder="Subunidade do militar"
                    value={form.subunidadeArrolado}
                    onChange={e => handleFieldChange('subunidadeArrolado', e.target.value)}
                  />
                  <datalist id="subunidade-list">
                    {subunidadesMock.map(sub => (
                      <option key={`sub-${sub}`} value={sub} />
                    ))}
                  </datalist>
                </div>
              </div>
            )}
          </div>

          {/* SEÇÃO 3: Dados do Participante */}
          <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <SectionHeader label="Dados do Militar Participante" section="participante" icon={<ShieldAlert size={18} />} />
            {expandedSections.participante && (
              <div className="p-5 space-y-4 border-t border-gray-100">
                <div>
                  <Input 
                    label="Nome Completo do Participante"
                    list="participante-list"
                    placeholder="Digite para buscar militar..."
                    value={form.nomeParticipante}
                    onChange={e => handleNomeParticipanteChange(e.target.value)}
                  />
                  <datalist id="participante-list">
                    {militaresMock.map(m => (
                      <option key={`partic-${m.id}`} value={`${m.posto} ${m.nome}`} />
                    ))}
                  </datalist>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select 
                    label="Posto/Graduação (P/G)"
                    value={form.pgParticipante}
                    onChange={e => handleFieldChange('pgParticipante', e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {postosGraduacoes.map(pg => (
                      <option key={`pg-partic-${pg}`} value={pg}>{pg}</option>
                    ))}
                  </Select>
                  <Input 
                    label="Subunidade / OM"
                    placeholder="Ex: 2ª Cia Fuz"
                    value={form.subunidadeParticipante}
                    onChange={e => handleFieldChange('subunidadeParticipante', e.target.value)}
                  />
                  <Input 
                    label="Função do Participante"
                    placeholder="Ex: Oficial de Dia, Adjunto"
                    value={form.funcaoParticipante}
                    onChange={e => handleFieldChange('funcaoParticipante', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* SEÇÃO 4: Descrição do Fato */}
          <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <SectionHeader label="Descrição do Fato" section="relato" icon={<Scale size={18} />} />
            {expandedSections.relato && (
              <div className="p-5 space-y-4 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">O Fato Relatado</label>
                  <textarea
                    rows={6}
                    className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-militar-light focus:border-transparent transition-all"
                    placeholder="Descreva detalhadamente o fato ocorrido de forma impessoal e concisa..."
                    value={form.relatoFato}
                    onChange={e => handleFieldChange('relatoFato', e.target.value)}
                  />
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Assinatura de Confeccionamento (Sargenteante)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input 
                      label="Nome do Sargenteante"
                      value={form.sargenteanteNome}
                      onChange={e => handleFieldChange('sargenteanteNome', e.target.value)}
                    />
                    <Select 
                      label="Posto/Grad."
                      value={form.sargenteantePosto}
                      onChange={e => handleFieldChange('sargenteantePosto', e.target.value)}
                    >
                      {postosGraduacoes.map(pg => (
                        <option key={`pg-sgte-${pg}`} value={pg}>{pg}</option>
                      ))}
                    </Select>
                    <Input 
                      label="Cargo / Função da Assinatura"
                      value={form.sargenteanteCargo}
                      onChange={e => handleFieldChange('sargenteanteCargo', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SEÇÃO 5: Comandante da Companhia */}
          <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <SectionHeader label="Comandante da Companhia (Cmt Cia)" section="cmtCiaSec" icon={<FileCheck size={18} />} />
            {expandedSections.cmtCiaSec && (
              <div className="p-5 space-y-4 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select 
                    label="Selecione o Comandante"
                    value={form.cmtCia}
                    onChange={e => handleFieldChange('cmtCia', e.target.value)}
                  >
                    {cmtsCiaMock.map(c => (
                      <option key={`cmt-${c}`} value={c}>{c}</option>
                    ))}
                  </Select>
                  <Input 
                    label="Ou digite o nome e posto"
                    placeholder="Ex: Cap Rodolfo Rômulo"
                    value={form.cmtCia}
                    onChange={e => handleFieldChange('cmtCia', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Painel de Ações Lateral */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-5 sticky top-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Ações do Documento</h2>
              <p className="text-xs text-gray-500">Gere a FATD oficial preenchida no formato A4 oficial.</p>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <Button 
                onClick={gerarPDF}
                className="w-full flex justify-center items-center gap-2"
                size="lg"
              >
                <FileText size={18} />
                Gerar Documento (PDF)
              </Button>

              <Button 
                onClick={handleLimparFormulario}
                variant="outline"
                className="w-full flex justify-center items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                size="md"
              >
                <RefreshCw size={15} />
                Limpar Campos
              </Button>
            </div>

            <div className="bg-amber-50 rounded-lg p-3.5 border border-amber-200 flex gap-2.5">
              <AlertCircle className="text-amber-600 flex-shrink-0" size={18} />
              <div className="text-xs text-amber-800 leading-relaxed">
                <strong>Substituição de Tags:</strong> O documento será gerado com base no modelo A4 de 2 páginas. Todas as tags correspondentes do <code>FATD_MODELO2</code> serão preenchidas.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
