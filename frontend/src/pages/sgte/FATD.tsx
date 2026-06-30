import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MilitarAutocomplete } from '../../components/ui/MilitarAutocomplete';
import { 
  FileText, ChevronDown, ChevronUp, AlertCircle, 
  User, ShieldAlert, Calendar, FileCheck, RefreshCw, Scale 
} from 'lucide-react';
import { api } from '../../services/api';

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
  sargenteanteFuncao: string;
  sargenteanteCia: string;

  // Cmt Cia
  cmtCiaNome: string;
  cmtCiaPosto: string;
  cmtCiaFuncao: string;
  cmtCiaCia: string;
}


const PG_ORDER = [
  'CEL', 'TC', 'MAJ', 'CAP', '1º TEN', '2º TEN', 'ASP',
  'ST', '1º SGT', '2º SGT', '3º SGT', 'CB', 'SD EP', 'SD EV'
];

function normalizeText(text: string): string {
  if (!text) return '';
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function renderMilitarName(militar: any) {
  const nomeCompleto = militar.nome_completo || militar.nome || '';
  const nomeGuerra = militar.nomeGuerra || militar.nome_guerra || '';

  if (!nomeGuerra) {
    return <span className="font-medium text-gray-900">{nomeCompleto}</span>;
  }

  const words = nomeGuerra.split(/\s+/).filter((w: string) => w.trim().length > 0);
  if (words.length === 0) {
    return <span className="font-medium text-gray-900">{nomeCompleto}</span>;
  }

  const escapedWords = words.map((w: string) => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
  const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
  const parts = nomeCompleto.split(regex);

  return (
    <span>
      {parts.map((part: string, index: number) => 
        words.some(w => w.toLowerCase() === part.toLowerCase()) ? (
          <strong key={index} className="font-bold text-militar-main underline decoration-2 decoration-militar-light">
            {part}
          </strong>
        ) : (
          <span key={index} className="font-medium text-gray-600">
            {part}
          </span>
        )
      )}
    </span>
  );
}

export function FATD() {
  const [militares, setMilitares] = useState<any[]>([]);
  const [funcoes, setFuncoes] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState<FATDForm>({
    processo: '',
    data: new Date().toISOString().split('T')[0],

    pgArrolado: '',
    nomeArrolado: '',
    subunidadeArrolado: '',

    pgParticipante: '',
    nomeParticipante: '',
    subunidadeParticipante: '',
    funcaoParticipante: '',

    relatoFato: '',
    sargenteanteNome: '',
    sargenteantePosto: '',
    sargenteanteFuncao: '',
    sargenteanteCia: '',

    cmtCiaNome: '',
    cmtCiaPosto: '',
    cmtCiaFuncao: '',
    cmtCiaCia: '',
  });

  // Autocomplete States - Arrolado
  const [arroladoId, setArroladoId] = useState<number | null>(null);
  const [searchArrolado, setSearchArrolado] = useState('');
  const [selectedArroladoPG, setSelectedArroladoPG] = useState('');
  const [showArroladoSuggestions, setShowArroladoSuggestions] = useState(false);
  const [showArroladoPGScroll, setShowArroladoPGScroll] = useState(false);

  // Autocomplete States - Participante
  const [participanteId, setParticipanteId] = useState<number | null>(null);
  const [searchParticipante, setSearchParticipante] = useState('');
  const [selectedParticipantePG, setSelectedParticipantePG] = useState('');
  const [showParticipanteSuggestions, setShowParticipanteSuggestions] = useState(false);
  const [showParticipantePGScroll, setShowParticipantePGScroll] = useState(false);

  // Autocomplete States - Sargenteante
  const [sargenteanteId, setSargenteanteId] = useState<number | null>(null);
  const [searchSargenteante, setSearchSargenteante] = useState('');
  const [selectedSargenteantePG, setSelectedSargenteantePG] = useState('');
  const [showSargenteanteSuggestions, setShowSargenteanteSuggestions] = useState(false);
  const [showSargenteantePGScroll, setShowSargenteantePGScroll] = useState(false);

  // Autocomplete States - Comandante
  const [comandanteId, setComandanteId] = useState<number | null>(null);
  const [searchComandante, setSearchComandante] = useState('');
  const [selectedComandantePG, setSelectedComandantePG] = useState('');
  const [showComandanteSuggestions, setShowComandanteSuggestions] = useState(false);
  const [showComandantePGScroll, setShowComandantePGScroll] = useState(false);

  const [expandedSections, setExpandedSections] = useState({
    identificacao: true,
    arrolado: true,
    participante: true,
    relato: true,
    cmtCiaSec: true,
  });

  const closeAllSelectsExcept = useCallback((except?: string) => {
    if (except !== 'arroladoPG') setShowArroladoPGScroll(false);
    if (except !== 'arroladoSuggestions') setShowArroladoSuggestions(false);
    if (except !== 'participantePG') setShowParticipantePGScroll(false);
    if (except !== 'participanteSuggestions') setShowParticipanteSuggestions(false);
    if (except !== 'sargenteantePG') setShowSargenteantePGScroll(false);
    if (except !== 'sargenteanteSuggestions') setShowSargenteanteSuggestions(false);
    if (except !== 'comandantePG') setShowComandantePGScroll(false);
    if (except !== 'comandanteSuggestions') setShowComandanteSuggestions(false);
  }, []);

  // Opções de P/G ordenadas hierarquicamente
  const pgOptions = Array.from(new Set(militares.map(m => m.posto).filter(Boolean)))
    .sort((a, b) => {
      const idxA = PG_ORDER.indexOf(a);
      const idxB = PG_ORDER.indexOf(b);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });

  // Carregar dados da API
  useEffect(() => {
    const loadData = async () => {
      let loadedMilitares: any[] = [];
      let loadedFuncoes: any[] = [];

      try {
        const resMil = await api.get('/militares');
        loadedMilitares = resMil.data || [];
        setMilitares(loadedMilitares);
      } catch (err) {
        console.error('Erro ao carregar militares:', err);
      }

      try {
        const resFun = await api.get('/funcoes');
        loadedFuncoes = resFun.data || [];
        setFuncoes(loadedFuncoes);
      } catch (err) {
        console.error('Erro ao carregar funções:', err);
      }

      // Preenchimento Automático para Sargenteante
      const sgte = loadedFuncoes.find(f => normalizeText(f.funcao) === 'sargenteante');
      if (sgte) {
        const mId = sgte.efetivoId || sgte.substitutoId;
        if (mId) {
          const mil = loadedMilitares.find(m => m.id === mId);
          if (mil) {
            const funcFound = loadedFuncoes.find(f => (f.efetivoId === mId || f.substitutoId === mId) && f.ativa !== false);
            const funcName = funcFound ? funcFound.funcao : '';
            setForm(prev => ({
              ...prev,
              sargenteanteNome: mil.nome_completo || mil.nome || '',
              sargenteantePosto: mil.posto || '',
              sargenteanteFuncao: funcName,
              sargenteanteCia: mil.subunidade || ''
            }));
            setSearchSargenteante(`${mil.posto} ${mil.nome}`);
            setSelectedSargenteantePG(mil.posto);
            setSargenteanteId(mId);
          }
        }
      }

      // Preenchimento Automático para Comandante
      const cmt = loadedFuncoes.find(f => normalizeText(f.funcao) === 'comandante');
      if (cmt) {
        const mId = cmt.efetivoId || cmt.substitutoId;
        if (mId) {
          const mil = loadedMilitares.find(m => m.id === mId);
          if (mil) {
            const funcFound = loadedFuncoes.find(f => (f.efetivoId === mId || f.substitutoId === mId) && f.ativa !== false);
            const funcName = funcFound ? funcFound.funcao : '';
            setForm(prev => ({
              ...prev,
              cmtCiaNome: mil.nome_completo || mil.nome || '',
              cmtCiaPosto: mil.posto || '',
              cmtCiaFuncao: funcName,
              cmtCiaCia: mil.subunidade || ''
            }));
            setSearchComandante(`${mil.posto} ${mil.nome}`);
            setSelectedComandantePG(mil.posto);
            setComandanteId(mId);
          }
        }
      }
    };

    loadData();
  }, []);


  // Helper para buscar função automática do militar
  const getMilitarFunction = (mId: number | null): string => {
    if (!mId) return '';
    const found = funcoes.find(f => (f.efetivoId === mId || f.substitutoId === mId) && f.ativa !== false);
    return found ? found.funcao : '';
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleFieldChange = (field: keyof FATDForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Máscara do Processo (xxx/xxxx) - Apenas números
  const handleProcessoChange = (val: string) => {
    let cleaned = val.replace(/[^0-9]/g, '');
    if (cleaned.length > 7) {
      cleaned = cleaned.slice(0, 7);
    }
    let formatted = cleaned;
    if (cleaned.length > 3) {
      formatted = `${cleaned.slice(0, 3)}/${cleaned.slice(3)}`;
    }
    handleFieldChange('processo', formatted);
  };

  // Handlers de Autocomplete - Arrolado
  const handleArroladoNameChange = (val: string) => {
    setSearchArrolado(val);
    const normalizedVal = normalizeText(val);
    const found = militares.find(m => 
      normalizeText(`${m.posto} ${m.nome}`) === normalizedVal || 
      normalizeText(m.nome) === normalizedVal ||
      normalizeText(`${m.posto} ${m.nomeGuerra || m.nome_guerra || ''}`) === normalizedVal ||
      (m.nomeGuerra && normalizeText(m.nomeGuerra) === normalizedVal) ||
      (m.nome_guerra && normalizeText(m.nome_guerra) === normalizedVal)
    );
    if (found) {
      setForm(prev => ({
        ...prev,
        nomeArrolado: found.nome_completo || found.nome || '',
        pgArrolado: found.posto || '',
        subunidadeArrolado: found.subunidade || ''
      }));
      setSelectedArroladoPG(found.posto);
      setArroladoId(found.id);
    } else {
      handleFieldChange('nomeArrolado', val);
      setArroladoId(null);
    }
  };

  const handleArroladoPGChange = (pg: string) => {
    setSelectedArroladoPG(pg);
    handleFieldChange('pgArrolado', pg);
    const currentMilitar = militares.find(m => normalizeText(m.nome) === normalizeText(form.nomeArrolado));
    if (currentMilitar && currentMilitar.posto !== pg) {
      setSearchArrolado('');
      handleFieldChange('nomeArrolado', '');
      setArroladoId(null);
    }
  };

  // Handlers de Autocomplete - Participante
  const handleParticipanteNameChange = (val: string) => {
    setSearchParticipante(val);
    const normalizedVal = normalizeText(val);
    const found = militares.find(m => 
      normalizeText(`${m.posto} ${m.nome}`) === normalizedVal || 
      normalizeText(m.nome) === normalizedVal ||
      normalizeText(`${m.posto} ${m.nomeGuerra || m.nome_guerra || ''}`) === normalizedVal ||
      (m.nomeGuerra && normalizeText(m.nomeGuerra) === normalizedVal) ||
      (m.nome_guerra && normalizeText(m.nome_guerra) === normalizedVal)
    );
    if (found) {
      const funcName = getMilitarFunction(found.id);
      setForm(prev => ({
        ...prev,
        nomeParticipante: found.nome_completo || found.nome || '',
        pgParticipante: found.posto || '',
        subunidadeParticipante: found.subunidade || '',
        funcaoParticipante: funcName
      }));
      setSelectedParticipantePG(found.posto);
      setParticipanteId(found.id);
    } else {
      handleFieldChange('nomeParticipante', val);
      setParticipanteId(null);
    }
  };

  const handleParticipantePGChange = (pg: string) => {
    setSelectedParticipantePG(pg);
    handleFieldChange('pgParticipante', pg);
    const currentMilitar = militares.find(m => m.id === participanteId);
    if (currentMilitar && currentMilitar.posto !== pg) {
      setSearchParticipante('');
      handleFieldChange('nomeParticipante', '');
      handleFieldChange('funcaoParticipante', '');
      setParticipanteId(null);
    }
  };

  // Handlers de Autocomplete - Sargenteante
  const handleSargenteanteNameChange = (val: string) => {
    setSearchSargenteante(val);
    const normalizedVal = normalizeText(val);
    const found = militares.find(m => 
      normalizeText(`${m.posto} ${m.nome}`) === normalizedVal || 
      normalizeText(m.nome) === normalizedVal ||
      normalizeText(`${m.posto} ${m.nomeGuerra || m.nome_guerra || ''}`) === normalizedVal ||
      (m.nomeGuerra && normalizeText(m.nomeGuerra) === normalizedVal) ||
      (m.nome_guerra && normalizeText(m.nome_guerra) === normalizedVal)
    );
    if (found) {
      const funcName = getMilitarFunction(found.id);
      setForm(prev => ({
        ...prev,
        sargenteanteNome: found.nome_completo || found.nome || '',
        sargenteantePosto: found.posto || '',
        sargenteanteFuncao: funcName,
        sargenteanteCia: found.subunidade || ''
      }));
      setSelectedSargenteantePG(found.posto);
      setSargenteanteId(found.id);
    } else {
      handleFieldChange('sargenteanteNome', val);
      setSargenteanteId(null);
    }
  };

  const handleSargenteantePGChange = (pg: string) => {
    setSelectedSargenteantePG(pg);
    handleFieldChange('sargenteantePosto', pg);
    const currentMilitar = militares.find(m => normalizeText(m.nome) === normalizeText(form.sargenteanteNome));
    if (currentMilitar && currentMilitar.posto !== pg) {
      setSearchSargenteante('');
      handleFieldChange('sargenteanteNome', '');
      handleFieldChange('sargenteanteFuncao', '');
      setSargenteanteId(null);
    }
  };

  // Handlers de Autocomplete - Comandante
  const handleComandanteNameChange = (val: string) => {
    setSearchComandante(val);
    const normalizedVal = normalizeText(val);
    const found = militares.find(m => 
      normalizeText(`${m.posto} ${m.nome}`) === normalizedVal || 
      normalizeText(m.nome) === normalizedVal ||
      normalizeText(`${m.posto} ${m.nomeGuerra || m.nome_guerra || ''}`) === normalizedVal ||
      (m.nomeGuerra && normalizeText(m.nomeGuerra) === normalizedVal) ||
      (m.nome_guerra && normalizeText(m.nome_guerra) === normalizedVal)
    );
    if (found) {
      const funcName = getMilitarFunction(found.id);
      setForm(prev => ({
        ...prev,
        cmtCiaNome: found.nome_completo || found.nome || '',
        cmtCiaPosto: found.posto || '',
        cmtCiaFuncao: funcName,
        cmtCiaCia: found.subunidade || ''
      }));
      setSelectedComandantePG(found.posto);
      setComandanteId(found.id);
    } else {
      handleFieldChange('cmtCiaNome', val);
      setComandanteId(null);
    }
  };

  const handleComandantePGChange = (pg: string) => {
    setSelectedComandantePG(pg);
    handleFieldChange('cmtCiaPosto', pg);
    const currentMilitar = militares.find(m => normalizeText(m.nome) === normalizeText(form.cmtCiaNome));
    if (currentMilitar && currentMilitar.posto !== pg) {
      setSearchComandante('');
      handleFieldChange('cmtCiaNome', '');
      handleFieldChange('cmtCiaFuncao', '');
      setComandanteId(null);
    }
  };

  const handleLimparFormulario = (force?: boolean) => {
    if (force === true || window.confirm('Deseja realmente limpar todos os campos do formulário?')) {
      setForm({
        processo: '',
        data: new Date().toISOString().split('T')[0],
        pgArrolado: '',
        nomeArrolado: '',
        subunidadeArrolado: '',
        pgParticipante: '',
        nomeParticipante: '',
        subunidadeParticipante: '',
        funcaoParticipante: '',
        relatoFato: '',
        sargenteanteNome: '',
        sargenteantePosto: '',
        sargenteanteFuncao: '',
        sargenteanteCia: '',
        cmtCiaNome: '',
        cmtCiaPosto: '',
        cmtCiaFuncao: '',
        cmtCiaCia: '',
      });
      setSearchArrolado('');
      setSelectedArroladoPG('');
      setArroladoId(null);
      setSearchParticipante('');
      setSelectedParticipantePG('');
      setParticipanteId(null);
      setSearchSargenteante('');
      setSelectedSargenteantePG('');
      setSargenteanteId(null);
      setSearchComandante('');
      setSelectedComandantePG('');
      setComandanteId(null);
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

  // Geração de PDF adaptada
  const gerarPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentW = pageW - margin * 2;

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
    doc.setLineWidth(0.3);
    doc.line(pageW / 2 - 45, y + 1.5, pageW / 2 + 45, y + 1.5);
    y += 8;

    // Título do documento
    doc.setFontSize(11);
    doc.text('FORMULÁRIO DE APURAÇÃO DE TRANSGRESSÃO DISCIPLINAR', pageW / 2, y, { align: 'center' });
    doc.line(pageW / 2 - 65, y + 1.5, pageW / 2 + 65, y + 1.5);
    y += 7;

    // Retângulo: Identificação da FATD
    doc.setLineWidth(0.4);
    doc.rect(margin, y, contentW, 10);
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
    doc.rect(margin, y, contentW, 7);
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
    doc.rect(margin, y, contentW, 7);
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
    doc.rect(margin, y, contentW, 7);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATO DO FATO', pageW / 2, y + 5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    const relatoTexto = form.relatoFato || 'Sem relato informado.';
    const linhasRelato = doc.splitTextToSize(relatoTexto, contentW - 6);
    doc.text(linhasRelato, margin + 3, y + 12);

    // Assinatura do Sargenteante
    const assSgteNome = form.sargenteanteNome || '_______________________________';
    const assSgtePg = form.sargenteantePosto ? ` – ${form.sargenteantePosto}` : '';
    doc.setFont('helvetica', 'bold');
    doc.text(`${assSgteNome}${assSgtePg}`, pageW / 2, y + 50, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const subSgte = `${form.sargenteanteFuncao || 'Sargenteante'} da ${form.sargenteanteCia || '2ª Cia Fuz Amv'}`;
    doc.text(subSgte, pageW / 2, y + 54.5, { align: 'center' });
    doc.setFontSize(9);
    y += hRelato + 4;

    // Retângulo: CIENTE DO MILITAR ARROLADO
    const hCiente = 66;
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.rect(margin, y, contentW, hCiente);
    doc.rect(margin, y, contentW, 7);
    doc.setFont('helvetica', 'bold');
    doc.text('CIENTE DO MILITAR ARROLADO', pageW / 2, y + 5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    const cienteTexto = 'Declaro que tenho conhecimento de que me está sendo imputada a autoria dos atos acima e me foi concedido o prazo de três dias úteis, para, querendo, apresentar, por escrito, as minhas justificativas ou razões de defesa.';
    const linhasCiente = doc.splitTextToSize(cienteTexto, contentW - 6);
    doc.text(linhasCiente, margin + 3, y + 12);

    doc.text('Caçapava-SP,          de                                 de 2026.', pageW / 2, y + 32, { align: 'center' });

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
    doc.rect(margin, y, contentW, 7);
    doc.setFont('helvetica', 'bold');
    doc.text('JUSTIFICATIVAS / RAZÕES DE DEFESA', pageW / 2, y + 5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    const introDefesa = `Eu, ${form.nomeArrolado || '___________________________'}${assArroladoPg}, amparado pelo Inciso LV, do Art 5º da Constituição Federal declaro em minha defesa que:`;
    const linhasIntro = doc.splitTextToSize(introDefesa, contentW - 6);
    doc.text(linhasIntro, margin + 3, y + 12);

    doc.setDrawColor(210);
    doc.setLineWidth(0.25);
    for (let ly = y + 23; ly <= y + 87; ly += 8) {
      doc.line(margin + 3, ly, pageW - margin - 3, ly);
    }
    doc.setDrawColor(0);

    doc.text('Caçapava-SP,          de                                 de 2026.', pageW / 2, y + 97, { align: 'center' });

    doc.setLineWidth(0.3);
    doc.line(pageW / 2 - 50, y + 107, pageW / 2 + 50, y + 107);
    doc.text(`${assArroladoNome}${assArroladoPg}`, pageW / 2, y + 111, { align: 'center' });
    y += hDefesa + 4;

    // Retângulo: DECISÃO DA AUTORIDADE COMPETENTE
    const hDecisao = 142;
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.rect(margin, y, contentW, hDecisao);
    doc.rect(margin, y, contentW, 7);
    doc.setFont('helvetica', 'bold');
    doc.text('DECISÃO DA AUTORIDADE COMPETENTE PARA APLICAR A PUNIÇÃO DISCIPLINAR', pageW / 2, y + 5, { align: 'center' });

    doc.setDrawColor(210);
    doc.setLineWidth(0.25);
    for (let ly = y + 14; ly <= y + 78; ly += 8) {
      doc.line(margin + 3, ly, pageW - margin - 3, ly);
    }
    doc.setDrawColor(0);

    // Assinatura do Comandante de Companhia
    doc.setLineWidth(0.3);
    doc.line(pageW / 2 - 50, y + 105, pageW / 2 + 50, y + 105);
    doc.setFont('helvetica', 'bold');
    const assCmtNome = form.cmtCiaNome || '_______________________________';
    const assCmtPg = form.cmtCiaPosto ? ` – ${form.cmtCiaPosto}` : '';
    doc.text(`${assCmtNome}${assCmtPg}`, pageW / 2, y + 110, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const subCmt = `${form.cmtCiaFuncao || 'Comandante'} da ${form.cmtCiaCia || '2ª Cia Fuz Amv'}`;
    doc.text(subCmt, pageW / 2, y + 114, { align: 'center' });
    doc.setFontSize(9);

    doc.text('PUNIÇÃO PUBLICADA NO BI nº_________,de__________________de_______________', pageW / 2, y + 134, { align: 'center' });

    // Validação de todos os campos obrigatórios
    if (!form.processo.trim()) {
      alert('Por favor, informe o número do processo.');
      return;
    }
    if (!form.data) {
      alert('Por favor, informe a data do processo/fato.');
      return;
    }
    if (!arroladoId) {
      alert('Por favor, selecione o Militar Arrolado (Transgressor) da lista.');
      return;
    }
    if (!participanteId) {
      alert('Por favor, selecione o Militar Participante da lista.');
      return;
    }
    if (!form.funcaoParticipante.trim()) {
      alert('Por favor, informe a função do participante.');
      return;
    }
    if (!form.relatoFato.trim()) {
      alert('Por favor, relate o fato ocorrido.');
      return;
    }
    if (!sargenteanteId) {
      alert('Por favor, selecione o Sargenteante da lista.');
      return;
    }
    if (!comandanteId) {
      alert('Por favor, selecione o Comandante de Cia da lista.');
      return;
    }

    // Função assíncrona interna para lidar com as chamadas de API
    const salvarEGerar = async () => {
      setIsSaving(true);
      try {
        // 1. Verificar duplicidade do processo
        const checkRes = await api.get(`/fatd/verify`, {
          params: { numeroProcesso: form.processo }
        });
        if (checkRes.data && checkRes.data.exists) {
          alert(`Erro: Já existe um processo cadastrado com o número ${form.processo}.`);
          setIsSaving(false);
          return;
        }

        // 2. Obter blob do PDF do jsPDF
        const blob = doc.output('blob');

        // 3. Montar FormData
        const formData = new FormData();
        formData.append('pdf', blob, `FATD_PROCESSO_${form.processo.replace(/\//g, '-')}.pdf`);
        formData.append('numeroProcesso', form.processo);
        formData.append('dataProcessoFato', form.data);
        formData.append('fatoRelatado', form.relatoFato);
        formData.append('funcaoParticipante', form.funcaoParticipante);
        if (arroladoId) formData.append('arroladoId', String(arroladoId));
        if (participanteId) formData.append('participanteId', String(participanteId));
        if (sargenteanteId) formData.append('sargenteanteId', String(sargenteanteId));
        if (comandanteId) formData.append('comandanteId', String(comandanteId));

        // 4. Salvar no banco
        await api.post('/fatd', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        // 5. Download do PDF local
        const nomeArquivo = `FATD_PROCESSO_${form.processo.replace(/\//g, '-') || 'RASCUNHO'}.pdf`;
        doc.save(nomeArquivo);

        // 6. Registrar punição no localStorage (legado)
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
        } catch (localErr) {
          console.error('Erro ao salvar punição no localStorage:', localErr);
        }

        alert('FATD registrada e documento PDF gerado com sucesso!');
        handleLimparFormulario(true); // Limpa campos automaticamente

      } catch (saveErr: any) {
        console.error('Erro ao salvar FATD:', saveErr);
        const msg = saveErr.response?.data?.error || 'Erro interno ao salvar os dados.';
        alert(`Erro ao salvar a FATD: ${msg}`);
      } finally {
        setIsSaving(false);
      }
    };

    salvarEGerar();
  };

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
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-filters {
          animation: fadeIn 0.12s ease-in-out forwards;
          overflow: visible;
        }
        .interactive-select {
          transition: all 0.15s ease;
        }
        .interactive-select:hover {
          border-color: #1F7A45;
        }
      `}} />

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Apuração de Transgressão Disciplinar (FATD)</h1>
          <Breadcrumb items={[{ label: 'Sargenteação' }, { label: 'FATD' }]} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          
          {/* SEÇÃO 1: Identificação da FATD */}
          <div className="bg-white rounded-xl overflow-visible border border-gray-200 shadow-sm">
            <SectionHeader label="Identificação da FATD" section="identificacao" icon={<Calendar size={18} />} />
            {expandedSections.identificacao && (
              <div className="p-5 space-y-4 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Número do Processo"
                    placeholder="Ex: 001/2026"
                    value={form.processo}
                    onChange={e => handleProcessoChange(e.target.value)}
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
          <div className="bg-white rounded-xl overflow-visible border border-gray-200 shadow-sm">
            <SectionHeader label="Dados do Militar Arrolado (Transgressor)" section="arrolado" icon={<User size={18} />} />
            {expandedSections.arrolado && (
              <div className="p-5 space-y-4 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-4">
                  {/* Dropdown de P/G */}
                  <div className="col-span-1 relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">P/G</label>
                    <div className="relative">
                      <Input
                        readOnly
                        value={selectedArroladoPG || 'Todos'}
                        onClick={() => {
                          const nextState = !showArroladoPGScroll;
                          closeAllSelectsExcept(nextState ? 'arroladoPG' : undefined);
                          setShowArroladoPGScroll(nextState);
                        }}
                        onFocus={() => {
                          closeAllSelectsExcept('arroladoPG');
                          setShowArroladoPGScroll(true);
                        }}
                        className="cursor-pointer pr-10 interactive-select text-sm"
                      />
                      <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs transition-transform duration-200 ${showArroladoPGScroll ? 'rotate-180' : ''}`}>
                        ▼
                      </div>
                    </div>
                    {showArroladoPGScroll && (
                      <>
                        <div className="fixed inset-0 z-[900]" onClick={() => setShowArroladoPGScroll(false)} />
                        <div className="absolute z-[1000] w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                          <div
                            onClick={() => {
                              handleArroladoPGChange('');
                              setShowArroladoPGScroll(false);
                            }}
                            className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                              selectedArroladoPG === '' ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                            }`}
                          >
                            <span>Todos</span>
                            {selectedArroladoPG === '' && <span className="text-militar-main text-xs">✓</span>}
                          </div>
                          {pgOptions.map((pg) => {
                            const isSelected = selectedArroladoPG === pg;
                            return (
                              <div
                                key={pg}
                                onClick={() => {
                                  handleArroladoPGChange(pg);
                                  setShowArroladoPGScroll(false);
                                }}
                                className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                                  isSelected ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                                }`}
                              >
                                <span>{pg}</span>
                                {isSelected && <span className="text-militar-main text-xs">✓</span>}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Nome do Militar */}
                  <MilitarAutocomplete
                    className="col-span-2"
                    label="Militar Arrolado"
                    value={searchArrolado}
                    onChange={handleArroladoNameChange}
                    onSelect={(m) => setArroladoId(m.id)}
                    militares={militares}
                    selectedPG={selectedArroladoPG}
                    setSelectedPG={setSelectedArroladoPG}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Companhia"
                    value={form.subunidadeArrolado || '(Aguardando militar)'}
                    readOnly
                    className={`bg-gray-100 cursor-not-allowed ${!form.subunidadeArrolado ? 'text-gray-500 italic' : 'text-gray-900 font-medium'}`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* SEÇÃO 3: Dados do Participante */}
          <div className="bg-white rounded-xl overflow-visible border border-gray-200 shadow-sm">
            <SectionHeader label="Dados do Militar Participante" section="participante" icon={<ShieldAlert size={18} />} />
            {expandedSections.participante && (
              <div className="p-5 space-y-4 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-4">
                  {/* Dropdown de P/G */}
                  <div className="col-span-1 relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">P/G</label>
                    <div className="relative">
                      <Input
                        readOnly
                        value={selectedParticipantePG || 'Todos'}
                        onClick={() => {
                          const nextState = !showParticipantePGScroll;
                          closeAllSelectsExcept(nextState ? 'participantePG' : undefined);
                          setShowParticipantePGScroll(nextState);
                        }}
                        onFocus={() => {
                          closeAllSelectsExcept('participantePG');
                          setShowParticipantePGScroll(true);
                        }}
                        className="cursor-pointer pr-10 interactive-select text-sm"
                      />
                      <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs transition-transform duration-200 ${showParticipantePGScroll ? 'rotate-180' : ''}`}>
                        ▼
                      </div>
                    </div>
                    {showParticipantePGScroll && (
                      <>
                        <div className="fixed inset-0 z-[900]" onClick={() => setShowParticipantePGScroll(false)} />
                        <div className="absolute z-[1000] w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                          <div
                            onClick={() => {
                              handleParticipantePGChange('');
                              setShowParticipantePGScroll(false);
                            }}
                            className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                              selectedParticipantePG === '' ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                            }`}
                          >
                            <span>Todos</span>
                            {selectedParticipantePG === '' && <span className="text-militar-main text-xs">✓</span>}
                          </div>
                          {pgOptions.map((pg) => {
                            const isSelected = selectedParticipantePG === pg;
                            return (
                              <div
                                key={pg}
                                onClick={() => {
                                  handleParticipantePGChange(pg);
                                  setShowParticipantePGScroll(false);
                                }}
                                className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                                  isSelected ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                                }`}
                              >
                                <span>{pg}</span>
                                {isSelected && <span className="text-militar-main text-xs">✓</span>}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Nome do Militar */}
                  <MilitarAutocomplete
                    className="col-span-2"
                    label="Militar Participante"
                    value={searchParticipante}
                    onChange={handleParticipanteNameChange}
                    onSelect={(m) => setParticipanteId(m.id)}
                    militares={militares}
                    selectedPG={selectedParticipantePG}
                    setSelectedPG={setSelectedParticipantePG}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Companhia"
                    value={form.subunidadeParticipante || '(Aguardando militar)'}
                    readOnly
                    className={`bg-gray-100 cursor-not-allowed ${!form.subunidadeParticipante ? 'text-gray-500 italic' : 'text-gray-900 font-medium'}`}
                  />
                  <div>
                    <Input 
                      label="Função do Participante"
                      placeholder="Ex: Oficial de Dia, Adjunto"
                      value={form.funcaoParticipante}
                      onChange={e => handleFieldChange('funcaoParticipante', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SEÇÃO 4: Descrição do Fato */}
          <div className="bg-white rounded-xl overflow-visible border border-gray-200 shadow-sm">
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Dropdown de P/G */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">P/G</label>
                      <div className="relative">
                        <Input
                          readOnly
                          value={selectedSargenteantePG || 'Todos'}
                          onClick={() => {
                            const nextState = !showSargenteantePGScroll;
                            closeAllSelectsExcept(nextState ? 'sargenteantePG' : undefined);
                            setShowSargenteantePGScroll(nextState);
                          }}
                          onFocus={() => {
                            closeAllSelectsExcept('sargenteantePG');
                            setShowSargenteantePGScroll(true);
                          }}
                          className="cursor-pointer pr-10 interactive-select text-sm"
                        />
                        <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs transition-transform duration-200 ${showSargenteantePGScroll ? 'rotate-180' : ''}`}>
                          ▼
                        </div>
                      </div>
                      {showSargenteantePGScroll && (
                        <>
                          <div className="fixed inset-0 z-[900]" onClick={() => setShowSargenteantePGScroll(false)} />
                          <div className="absolute z-[1000] w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                            <div
                              onClick={() => {
                                handleSargenteantePGChange('');
                                setShowSargenteantePGScroll(false);
                              }}
                              className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                                selectedSargenteantePG === '' ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                              }`}
                            >
                              <span>Todos</span>
                              {selectedSargenteantePG === '' && <span className="text-militar-main text-xs">✓</span>}
                            </div>
                            {pgOptions.map((pg) => {
                              const isSelected = selectedSargenteantePG === pg;
                              return (
                                <div
                                  key={pg}
                                  onClick={() => {
                                    handleSargenteantePGChange(pg);
                                    setShowSargenteantePGScroll(false);
                                  }}
                                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                                    isSelected ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                                  }`}
                                >
                                  <span>{pg}</span>
                                  {isSelected && <span className="text-militar-main text-xs">✓</span>}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Nome do Militar */}
                    <MilitarAutocomplete
                      label="Militar Sargenteante"
                      value={searchSargenteante}
                      onChange={handleSargenteanteNameChange}
                      onSelect={(m) => setSargenteanteId(m.id)}
                      militares={militares}
                      selectedPG={selectedSargenteantePG}
                      setSelectedPG={setSelectedSargenteantePG}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                      label="Função"
                      value={form.sargenteanteFuncao}
                      readOnly
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <Input 
                      label="Companhia"
                      value={form.sargenteanteCia || '(Aguardando militar)'}
                      readOnly
                      className={`bg-gray-100 cursor-not-allowed ${!form.sargenteanteCia ? 'text-gray-500 italic' : 'text-gray-900 font-medium'}`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SEÇÃO 5: Comandante da Companhia */}
          <div className="bg-white rounded-xl overflow-visible border border-gray-200 shadow-sm">
            <SectionHeader label="Comandante da Companhia (Cmt Cia)" section="cmtCiaSec" icon={<FileCheck size={18} />} />
            {expandedSections.cmtCiaSec && (
              <div className="p-5 space-y-4 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Dropdown de P/G */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">P/G</label>
                    <div className="relative">
                      <Input
                        readOnly
                        value={selectedComandantePG || 'Todos'}
                        onClick={() => {
                          const nextState = !showComandantePGScroll;
                          closeAllSelectsExcept(nextState ? 'comandantePG' : undefined);
                          setShowComandantePGScroll(nextState);
                        }}
                        onFocus={() => {
                          closeAllSelectsExcept('comandantePG');
                          setShowComandantePGScroll(true);
                        }}
                        className="cursor-pointer pr-10 interactive-select text-sm"
                      />
                      <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs transition-transform duration-200 ${showComandantePGScroll ? 'rotate-180' : ''}`}>
                        ▼
                      </div>
                    </div>
                    {showComandantePGScroll && (
                      <>
                        <div className="fixed inset-0 z-[900]" onClick={() => setShowComandantePGScroll(false)} />
                        <div className="absolute z-[1000] w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                          <div
                            onClick={() => {
                              handleComandantePGChange('');
                              setShowComandantePGScroll(false);
                            }}
                            className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                              selectedComandantePG === '' ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                            }`}
                          >
                            <span>Todos</span>
                            {selectedComandantePG === '' && <span className="text-militar-main text-xs">✓</span>}
                          </div>
                          {pgOptions.map((pg) => {
                            const isSelected = selectedComandantePG === pg;
                            return (
                              <div
                                key={pg}
                                onClick={() => {
                                  handleComandantePGChange(pg);
                                  setShowComandantePGScroll(false);
                                }}
                                className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                                  isSelected ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                                }`}
                              >
                                <span>{pg}</span>
                                {isSelected && <span className="text-militar-main text-xs">✓</span>}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Nome do Militar */}
                  <MilitarAutocomplete
                    label="Militar Comandante"
                    value={searchComandante}
                    onChange={handleComandanteNameChange}
                    onSelect={(m) => setComandanteId(m.id)}
                    militares={militares}
                    selectedPG={selectedComandantePG}
                    setSelectedPG={setSelectedComandantePG}
                    required
                  />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Função"
                    value={form.cmtCiaFuncao}
                    readOnly
                    className="bg-gray-100 cursor-not-allowed"
                  />
                  <Input 
                    label="Companhia"
                    value={form.cmtCiaCia || '(Aguardando militar)'}
                    readOnly
                    className={`bg-gray-100 cursor-not-allowed ${!form.cmtCiaCia ? 'text-gray-500 italic' : 'text-gray-900 font-medium'}`}
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
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="animate-spin" size={18} />
                    Salvando...
                  </>
                ) : (
                  <>
                    <FileText size={18} />
                    Salvar e Gerar Documento (PDF)
                  </>
                )}
              </Button>

              <Button 
                onClick={() => handleLimparFormulario()}
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
