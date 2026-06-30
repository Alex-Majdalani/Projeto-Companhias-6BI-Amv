import React, { useState, useEffect, useCallback } from 'react';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Edit2, Trash2, Settings, Check, X, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

// Função utilitária para remover acentos e converter para minúscula (busca insensível a acentos e caixa)
function normalizeText(text: string): string {
  if (!text) return '';
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Função utilitária para renderizar o nome completo do militar destacando em negrito e com sublinhado apenas as palavras do Nome de Guerra
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

interface FunctionType {
  id: number;
  name: string;
}

interface FunctionAssignment {
  id: number;
  functionName: string;
  effective: string;
  substitute: string;
  efetivoId?: number | null;
  substitutoId?: number | null;
  ativa?: boolean;
}

const isProtectedFunction = (name: string): boolean => {
  const normalized = (name || '').trim().toLowerCase();
  return normalized === 'comandante' || normalized === 'furriel' || normalized === 'sargenteante';
};

const PG_ORDER = [
  'CEL', 'TC', 'MAJ', 'CAP', '1º TEN', '2º TEN', 'ASP',
  'ST', '1º SGT', '2º SGT', '3º SGT', 'CB', 'SD EP', 'SD EV'
];

export function FuncoesCia() {
  // States
  const [functionTypes, setFunctionTypes] = useState<FunctionType[]>([]);
  const [assignments, setAssignments] = useState<FunctionAssignment[]>([]);
  const [militares, setMilitares] = useState<any[]>([]);
  
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [isEditingAssignment, setIsEditingAssignment] = useState(false);

  // Filtros Avançados
  const [showFiltersCard, setShowFiltersCard] = useState(false);
  const [pgFilter, setPgFilter] = useState('Todos');
  const [functionFilter, setFunctionFilter] = useState('Todos');
  const [showPgFilterScroll, setShowPgFilterScroll] = useState(false);
  const [showFunctionFilterScroll, setShowFunctionFilterScroll] = useState(false);

  // Form State - Config Function Types
  const [newFunctionTypeName, setNewFunctionTypeName] = useState('');

  // Estado para controle de exclusão via Modais de Confirmação
  const [deleteAssignmentTarget, setDeleteAssignmentTarget] = useState<number | null>(null);
  const [isDeletingAssignment, setIsDeletingAssignment] = useState(false);
  const [deleteAssignmentError, setDeleteAssignmentError] = useState<string | null>(null);

  const [clearAssignmentTarget, setClearAssignmentTarget] = useState<number | null>(null);
  const [isClearingAssignment, setIsClearingAssignment] = useState(false);
  const [clearAssignmentError, setClearAssignmentError] = useState<string | null>(null);

  const [deleteFunctionTypeTarget, setDeleteFunctionTypeTarget] = useState<number | null>(null);
  const [isDeletingFunctionType, setIsDeletingFunctionType] = useState(false);
  const [deleteFunctionTypeError, setDeleteFunctionTypeError] = useState<string | null>(null);

  // Estado para controle de salvamento concorrente
  const [isAddingFunctionType, setIsAddingFunctionType] = useState(false);

  // Form State - New Assignment
  const [selectedFunction, setSelectedFunction] = useState('');
  
  // States para a seleção do Militar Efetivo (idêntico ao plano de férias)
  const [effective, setEffective] = useState('');
  const [effectiveId, setEffectiveId] = useState<number | null>(null);
  const [selectedEffectivePG, setSelectedEffectivePG] = useState('');
  const [showEffectiveSuggestions, setShowEffectiveSuggestions] = useState(false);
  const [showEffectivePGScroll, setShowEffectivePGScroll] = useState(false);

  // States para a seleção do Militar Substituto (idêntico ao plano de férias)
  const [substitute, setSubstitute] = useState('');
  const [substituteId, setSubstituteId] = useState<number | null>(null);
  const [selectedSubstitutePG, setSelectedSubstitutePG] = useState('');
  const [showSubstituteSuggestions, setShowSubstituteSuggestions] = useState(false);
  const [showSubstitutePGScroll, setShowSubstitutePGScroll] = useState(false);

  const closeAllSelectsExcept = useCallback((except?: string) => {
    if (except !== 'effectivePG') setShowEffectivePGScroll(false);
    if (except !== 'effectiveSuggestions') setShowEffectiveSuggestions(false);
    if (except !== 'substitutePG') setShowSubstitutePGScroll(false);
    if (except !== 'substituteSuggestions') setShowSubstituteSuggestions(false);
    if (except !== 'pgFilter') setShowPgFilterScroll(false);
    if (except !== 'functionFilter') setShowFunctionFilterScroll(false);
  }, []);

  // Opções de P/G ordenadas hierarquicamente
  const pgOptions = Array.from(new Set(militares.map(m => m.posto).filter(Boolean)))
    .sort((a, b) => {
      const idxA = PG_ORDER.indexOf(a);
      const idxB = PG_ORDER.indexOf(b);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });

  // Função utilitária para garantir a primeira letra maiúscula conforme regras solicitadas
  const capitalizeFirstLetter = (str: string): string => {
    const match = str.match(/[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/);
    if (match && match.index !== undefined) {
      const idx = match.index;
      return str.slice(0, idx) + str.charAt(idx).toUpperCase() + str.slice(idx + 1);
    }
    return str;
  };

  // Carrega os militares da API
  const fetchMilitares = useCallback(async () => {
    try {
      const res = await api.get('/militares');
      setMilitares(res.data);
    } catch (err) {
      console.error('Erro ao buscar militares:', err);
    }
  }, []);

  // Carrega os tipos de funções do banco de dados NocoDB e as designações
  const fetchFunctionTypes = useCallback(async () => {
    try {
      const res = await api.get('/funcoes');
      const mappedTypes = res.data.map((f: any) => ({
        id: f.id,
        name: f.funcao
      }));
      setFunctionTypes(mappedTypes);

      const mappedAssignments = res.data.map((f: any) => ({
        id: f.id,
        functionName: f.funcao,
        effective: f.nomeEfetivo || 'Não designado',
        substitute: f.nomeSubstituto || 'Não designado',
        efetivoId: f.efetivoId,
        substitutoId: f.substitutoId,
        ativa: f.ativa !== false
      }));
      setAssignments(mappedAssignments);
    } catch (err) {
      console.error('Erro ao carregar tipos de funções e designações:', err);
    }
  }, []);

  useEffect(() => {
    fetchFunctionTypes();
    fetchMilitares();
  }, [fetchFunctionTypes, fetchMilitares]);

  // Estado para controle de edição inline das funções no modal
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  // Handlers for Function Types
  const handleSaveFunctionType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingFunctionType) return;

    const formattedName = capitalizeFirstLetter(newFunctionTypeName.trim());
    if (!formattedName) return;

    // Validação de unicidade no frontend
    const exists = functionTypes.some(f => normalizeText(f.name) === normalizeText(formattedName));
    if (exists) {
      alert('Já existe uma função cadastrada com este nome.');
      return;
    }

    try {
      setIsAddingFunctionType(true);
      const res = await api.post('/funcoes', { funcao: formattedName });
      const newType: FunctionType = {
        id: res.data.id,
        name: res.data.funcao
      };
      
      setFunctionTypes(prev => [...prev, newType]);
      setNewFunctionTypeName('');
    } catch (err) {
      console.error('Erro ao salvar nova função:', err);
      alert('Não foi possível salvar a função no banco de dados.');
    } finally {
      setIsAddingFunctionType(false);
    }
  };

  const handleUpdateFunctionType = async (id: number) => {
    const formattedName = capitalizeFirstLetter(editingName.trim());
    if (!formattedName) return;

    try {
      const res = await api.put(`/funcoes/${id}`, { funcao: formattedName });
      setFunctionTypes(prev => prev.map(f => f.id === id ? { ...f, name: res.data.funcao } : f));
      setEditingId(null);
      setEditingName('');
    } catch (err) {
      console.error('Erro ao atualizar função:', err);
      alert('Não foi possível atualizar o nome da função.');
    }
  };

  const handleDeleteFunctionType = (id: number) => {
    setDeleteFunctionTypeError(null);
    setDeleteFunctionTypeTarget(id);
  };

  const handleConfirmDeleteFunctionType = async () => {
    if (deleteFunctionTypeTarget === null) return;
    setIsDeletingFunctionType(true);
    setDeleteFunctionTypeError(null);
    try {
      await api.delete(`/funcoes/${deleteFunctionTypeTarget}`);
      setFunctionTypes(prev => prev.filter(f => f.id !== deleteFunctionTypeTarget));
      fetchFunctionTypes();
      setDeleteFunctionTypeTarget(null);
    } catch (err: any) {
      console.error('Erro ao excluir função:', err);
      setDeleteFunctionTypeError(err.response?.data?.error || 'Não foi possível excluir a função.');
    } finally {
      setIsDeletingFunctionType(false);
    }
  };

  const handleEffectiveMilitarChange = (val: string) => {
    setEffective(val);
    const normalizedVal = normalizeText(val);
    const found = militares.find(m => 
      normalizeText(`${m.posto} ${m.nome}`) === normalizedVal || 
      normalizeText(m.nome) === normalizedVal ||
      normalizeText(`${m.posto} ${m.nomeGuerra || m.nome_guerra || ''}`) === normalizedVal ||
      (m.nomeGuerra && normalizeText(m.nomeGuerra) === normalizedVal) ||
      (m.nome_guerra && normalizeText(m.nome_guerra) === normalizedVal)
    );
    if (found) {
      setEffectiveId(found.id);
      if (!selectedEffectivePG || selectedEffectivePG !== found.posto) {
        setSelectedEffectivePG(found.posto);
      }
    } else {
      setEffectiveId(null);
    }
  };

  const handleEffectivePGChange = (pg: string) => {
    setSelectedEffectivePG(pg);
    if (effectiveId) {
      const selectedMilitar = militares.find(m => m.id === effectiveId);
      if (selectedMilitar && selectedMilitar.posto !== pg) {
        setEffectiveId(null);
        setEffective('');
      }
    }
  };

  const handleSubstituteMilitarChange = (val: string) => {
    setSubstitute(val);
    const normalizedVal = normalizeText(val);
    const found = militares.find(m => 
      normalizeText(`${m.posto} ${m.nome}`) === normalizedVal || 
      normalizeText(m.nome) === normalizedVal ||
      normalizeText(`${m.posto} ${m.nomeGuerra || m.nome_guerra || ''}`) === normalizedVal ||
      (m.nomeGuerra && normalizeText(m.nomeGuerra) === normalizedVal) ||
      (m.nome_guerra && normalizeText(m.nome_guerra) === normalizedVal)
    );
    if (found) {
      setSubstituteId(found.id);
      if (!selectedSubstitutePG || selectedSubstitutePG !== found.posto) {
        setSelectedSubstitutePG(found.posto);
      }
    } else {
      setSubstituteId(null);
    }
  };

  const handleSubstitutePGChange = (pg: string) => {
    setSelectedSubstitutePG(pg);
    if (substituteId) {
      const selectedMilitar = militares.find(m => m.id === substituteId);
      if (selectedMilitar && selectedMilitar.posto !== pg) {
        setSubstituteId(null);
        setSubstitute('');
      }
    }
  };

  const resetAssignmentForm = useCallback(() => {
    setSelectedFunction('');
    setEffective('');
    setEffectiveId(null);
    setSelectedEffectivePG('');
    setShowEffectiveSuggestions(false);
    setShowEffectivePGScroll(false);
    setSubstitute('');
    setSubstituteId(null);
    setSelectedSubstitutePG('');
    setShowSubstituteSuggestions(false);
    setShowSubstitutePGScroll(false);
  }, []);

  // Handlers for Assignments
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[FuncoesCia] handleSaveAssignment chamando:', { selectedFunction, effective, effectiveId, substitute, substituteId });
    if (!selectedFunction) return;

    // Busca a função selecionada para encontrar o ID
    const foundFunction = functionTypes.find(f => f.name === selectedFunction);
    if (!foundFunction) {
      alert('Função selecionada inválida.');
      return;
    }

    // Validação: Militar Efetivo precisa existir no banco (id preenchido e correspondência exata de nome)
    const matchedEffective = militares.find(m => m.id === effectiveId);
    if (!matchedEffective || normalizeText(`${matchedEffective.posto} ${matchedEffective.nome}`) !== normalizeText(effective)) {
      alert('Militar Efetivo não encontrado no banco de dados. Por favor, selecione um militar válido a partir da lista de sugestões.');
      return;
    }

    // Validação: Militar Substituto, se digitado, precisa existir no banco (id preenchido e correspondência exata de nome)
    if (substitute.trim()) {
      const matchedSubstitute = militares.find(m => m.id === substituteId);
      if (!matchedSubstitute || normalizeText(`${matchedSubstitute.posto} ${matchedSubstitute.nome}`) !== normalizeText(substitute)) {
        alert('Militar Substituto não encontrado no banco de dados. Por favor, selecione um militar válido a partir da lista de sugestões.');
        return;
      }
    }

    // Validação: Efetivo e Substituto não podem ser a mesma pessoa
    if (effectiveId && substituteId && effectiveId === substituteId) {
      alert('O militar efetivo e o militar substituto não podem ser a mesma pessoa.');
      return;
    }

    try {
      setIsSavingAssignment(true);
      await api.put(`/funcoes/${foundFunction.id}/designar`, {
        efetivoId: effectiveId,
        substitutoId: substitute.trim() ? substituteId : null
      });

      setIsAssignmentModalOpen(false);
      resetAssignmentForm();
      fetchFunctionTypes(); // Recarrega a tabela de designações
    } catch (err) {
      console.error('Erro ao salvar designação:', err);
      alert('Não foi possível salvar a designação no banco de dados.');
    } finally {
      setIsSavingAssignment(false);
    }
  };

  const handleDeleteAssignment = (id: number) => {
    setDeleteAssignmentError(null);
    setDeleteAssignmentTarget(id);
  };

  const handleConfirmDeleteAssignment = async () => {
    if (deleteAssignmentTarget === null) return;
    setIsDeletingAssignment(true);
    setDeleteAssignmentError(null);
    try {
      await api.put(`/funcoes/${deleteAssignmentTarget}/designar`, {
        efetivoId: null,
        substitutoId: null,
        desativar: true
      });
      fetchFunctionTypes();
      setDeleteAssignmentTarget(null);
    } catch (err: any) {
      console.error('Erro ao excluir designação:', err);
      setDeleteAssignmentError(err.response?.data?.error || 'Não foi possível excluir a designação.');
    } finally {
      setIsDeletingAssignment(false);
    }
  };

  const handleClearAssignment = (id: number) => {
    setClearAssignmentError(null);
    setClearAssignmentTarget(id);
  };

  const handleConfirmClearAssignment = async () => {
    if (clearAssignmentTarget === null) return;
    setIsClearingAssignment(true);
    setClearAssignmentError(null);
    try {
      await api.put(`/funcoes/${clearAssignmentTarget}/designar`, {
        efetivoId: null,
        substitutoId: null,
        desativar: false
      });
      fetchFunctionTypes();
      setClearAssignmentTarget(null);
    } catch (err: any) {
      console.error('Erro ao limpar designação:', err);
      setClearAssignmentError(err.response?.data?.error || 'Não foi possível limpar a designação.');
    } finally {
      setIsClearingAssignment(false);
    }
  };

  // Opções de P/G filtradas para exibição no filtro (apenas postos/graduações que possuem designações)
  const pgOptionsFilter = React.useMemo(() => {
    const pgs = new Set<string>();
    assignments.forEach(a => {
      const effectiveMilitar = militares.find(m => m.id === (a as any).efetivoId);
      if (effectiveMilitar && effectiveMilitar.posto) pgs.add(effectiveMilitar.posto);
      const substituteMilitar = militares.find(m => m.id === (a as any).substitutoId);
      if (substituteMilitar && substituteMilitar.posto) pgs.add(substituteMilitar.posto);
    });
    return Array.from(pgs).sort((a, b) => {
      const idxA = PG_ORDER.indexOf(a);
      const idxB = PG_ORDER.indexOf(b);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
  }, [assignments, militares]);

  // Opções de Funções para exibição no filtro
  const functionFilterOptions = React.useMemo(() => {
    return Array.from(new Set(assignments.map(a => a.functionName).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [assignments]);

  // Derived state
  const filteredAssignments = assignments.filter(a => {
    // 0. Filtro de ativas (esconde se ativa for false)
    if ((a as any).ativa === false) return false;

    // 1. Filtro por P/G (Posto/Graduação)
    if (pgFilter !== 'Todos') {
      const effectiveMilitar = militares.find(m => m.id === (a as any).efetivoId);
      const substituteMilitar = militares.find(m => m.id === (a as any).substitutoId);
      const hasPgEffective = effectiveMilitar && effectiveMilitar.posto === pgFilter;
      const hasPgSubstitute = substituteMilitar && substituteMilitar.posto === pgFilter;
      if (!hasPgEffective && !hasPgSubstitute) return false;
    }

    // 2. Filtro por Função
    if (functionFilter !== 'Todos' && a.functionName !== functionFilter) {
      return false;
    }

    // 3. Busca por texto normalizada
    if (!searchTerm.trim()) return true;
    const term = normalizeText(searchTerm);

    if (normalizeText(a.functionName).includes(term)) return true;
    if (normalizeText(a.effective).includes(term)) return true;
    if (normalizeText(a.substitute).includes(term)) return true;

    const effectiveMilitar = militares.find(m => m.id === (a as any).efetivoId);
    if (effectiveMilitar) {
      if (effectiveMilitar.nome && normalizeText(effectiveMilitar.nome).includes(term)) return true;
      if (effectiveMilitar.nome_completo && normalizeText(effectiveMilitar.nome_completo).includes(term)) return true;
      if (effectiveMilitar.nome_guerra && normalizeText(effectiveMilitar.nome_guerra).includes(term)) return true;
      if (effectiveMilitar.posto && normalizeText(effectiveMilitar.posto).includes(term)) return true;
    }

    const substituteMilitar = militares.find(m => m.id === (a as any).substitutoId);
    if (substituteMilitar) {
      if (substituteMilitar.nome && normalizeText(substituteMilitar.nome).includes(term)) return true;
      if (substituteMilitar.nome_completo && normalizeText(substituteMilitar.nome_completo).includes(term)) return true;
      if (substituteMilitar.nome_guerra && normalizeText(substituteMilitar.nome_guerra).includes(term)) return true;
      if (substituteMilitar.posto && normalizeText(substituteMilitar.posto).includes(term)) return true;
    }

    return false;
  });

  const sortedAssignments = React.useMemo(() => {
    return [...filteredAssignments].sort((a, b) => 
      a.functionName.localeCompare(b.functionName, 'pt-BR')
    );
  }, [filteredAssignments]);

  const columns: any[] = [
    { header: 'Função', accessor: 'functionName' },
    { 
      header: 'Militar Efetivo', 
      accessor: (row: FunctionAssignment) => {
        if (row.effective === 'Não designado' || !row.effective) {
          return (
            <span className="flex items-center gap-1.5 text-amber-600 font-medium bg-amber-50/50 px-2 py-1 rounded border border-amber-100/50 w-fit">
              <AlertTriangle size={15} className="text-amber-500 flex-shrink-0" />
              Não designado
            </span>
          );
        }
        return row.effective;
      }
    },
    { 
      header: 'Militar Substituto', 
      accessor: (row: FunctionAssignment) => {
        if (row.substitute === 'Não designado' || !row.substitute) {
          return (
            <span className="flex items-center gap-1.5 text-amber-600 font-medium bg-amber-50/50 px-2 py-1 rounded border border-amber-100/50 w-fit">
              <AlertTriangle size={15} className="text-amber-500 flex-shrink-0" />
              Não designado
            </span>
          );
        }
        return row.substitute;
      }
    },
    {
      header: 'Ações',
      accessor: (row: FunctionAssignment) => (
        <div className="flex gap-2 text-gray-400">
          <button 
            onClick={() => {
              setSelectedFunction(row.functionName);
              const effectiveMilitar = militares.find(m => m.id === (row as any).efetivoId);
              if (effectiveMilitar) {
                setEffective(`${effectiveMilitar.posto} ${effectiveMilitar.nomeGuerra || effectiveMilitar.nome_guerra || effectiveMilitar.nome}`);
                setEffectiveId(effectiveMilitar.id);
                setSelectedEffectivePG(effectiveMilitar.posto);
              } else {
                setEffective('');
                setEffectiveId(null);
                setSelectedEffectivePG('');
              }
              const substituteMilitar = militares.find(m => m.id === (row as any).substitutoId);
              if (substituteMilitar) {
                setSubstitute(`${substituteMilitar.posto} ${substituteMilitar.nomeGuerra || substituteMilitar.nome_guerra || substituteMilitar.nome}`);
                setSubstituteId(substituteMilitar.id);
                setSelectedSubstitutePG(substituteMilitar.posto);
              } else {
                setSubstitute('');
                setSubstituteId(null);
                setSelectedSubstitutePG('');
              }
              setIsEditingAssignment(true);
              setIsAssignmentModalOpen(true);
            }}
            className="p-1 hover:text-militar-main transition-colors border border-gray-200 rounded"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => handleClearAssignment(row.id)}
            className="p-1 hover:text-amber-500 transition-colors border border-gray-200 rounded"
            title="Limpar Designação"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eraser"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21Z"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
          </button>
          {!isProtectedFunction(row.functionName) && (
            <button 
              onClick={() => handleDeleteAssignment(row.id)}
              className="p-1 hover:text-red-500 transition-colors border border-gray-200 rounded"
              title="Excluir Função da Tela"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const selectableFunctions = functionTypes;

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Funções Cia</h1>
          <Breadcrumb items={[{ label: 'Gestão de Pessoas' }, { label: 'Funções Cia' }]} />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsConfigModalOpen(true)} variant="outline" icon={<Settings size={16} />}>
            Configurar Funções
          </Button>
          <Button onClick={() => {
            setIsEditingAssignment(false);
            if (!selectedFunction && functionTypes.length > 0) {
              setSelectedFunction(functionTypes[0].name);
            }
            setIsAssignmentModalOpen(true);
          }} icon={<Plus size={16} />}>
            Nova Designação
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
        {/* Main Search Bar */}
        <div className="flex gap-4 items-center mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Buscar por função, militar efetivo ou substituto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
          <Button 
            onClick={() => setShowFiltersCard(!showFiltersCard)} 
            variant={showFiltersCard || pgFilter !== 'Todos' || functionFilter !== 'Todos' ? "primary" : "outline"} 
            icon={<Search size={16} />}
          >
            Filtrar {(pgFilter !== 'Todos' ? 1 : 0) + (functionFilter !== 'Todos' ? 1 : 0) > 0 && `(${(pgFilter !== 'Todos' ? 1 : 0) + (functionFilter !== 'Todos' ? 1 : 0)})`}
          </Button>
          {((pgFilter !== 'Todos' ? 1 : 0) + (functionFilter !== 'Todos' ? 1 : 0) > 0 || searchTerm) && (
            <Button onClick={() => { setPgFilter('Todos'); setFunctionFilter('Todos'); setSearchTerm(''); }} variant="ghost" size="sm" className="text-gray-500 hover:text-red-500 font-semibold">
              Limpar Filtros
            </Button>
          )}
        </div>

        {/* Expandable Filter Card */}
        {showFiltersCard && (
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 gap-4 grid grid-cols-1 sm:grid-cols-2 mb-6 animate-filters">
            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">P/G (Posto/Graduação)</label>
              <div className="relative">
                <Input
                  readOnly
                  value={pgFilter}
                  onClick={() => {
                    const nextState = !showPgFilterScroll;
                    closeAllSelectsExcept(nextState ? 'pgFilter' : undefined);
                    setShowPgFilterScroll(nextState);
                  }}
                  onFocus={() => {
                    closeAllSelectsExcept('pgFilter');
                    setShowPgFilterScroll(true);
                  }}
                  className="cursor-pointer pr-8 text-sm interactive-select"
                />
                <div className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-[10px] transition-transform duration-200 ${showPgFilterScroll ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </div>
              {showPgFilterScroll && (
                <>
                  <div className="fixed inset-0 z-[900]" onClick={() => setShowPgFilterScroll(false)} />
                  <div className="absolute z-[1000] w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div
                      onClick={() => {
                        setPgFilter('Todos');
                        setShowPgFilterScroll(false);
                      }}
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                        pgFilter === 'Todos' ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                      }`}
                    >
                      <span>Todos</span>
                      {pgFilter === 'Todos' && <span className="text-militar-main text-xs">✓</span>}
                    </div>
                    {pgOptionsFilter.map((pg) => {
                      const isSelected = pgFilter === pg;
                      return (
                        <div
                          key={pg}
                          onClick={() => {
                            setPgFilter(pg);
                            setShowPgFilterScroll(false);
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

            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Função</label>
              <div className="relative">
                <Input
                  readOnly
                  value={functionFilter}
                  onClick={() => {
                    const nextState = !showFunctionFilterScroll;
                    closeAllSelectsExcept(nextState ? 'functionFilter' : undefined);
                    setShowFunctionFilterScroll(nextState);
                  }}
                  onFocus={() => {
                    closeAllSelectsExcept('functionFilter');
                    setShowFunctionFilterScroll(true);
                  }}
                  className="cursor-pointer pr-8 text-sm interactive-select"
                />
                <div className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-[10px] transition-transform duration-200 ${showFunctionFilterScroll ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </div>
              {showFunctionFilterScroll && (
                <>
                  <div className="fixed inset-0 z-[900]" onClick={() => setShowFunctionFilterScroll(false)} />
                  <div className="absolute z-[1000] w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div
                      onClick={() => {
                        setFunctionFilter('Todos');
                        setShowFunctionFilterScroll(false);
                      }}
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                        functionFilter === 'Todos' ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                      }`}
                    >
                      <span>Todos</span>
                      {functionFilter === 'Todos' && <span className="text-militar-main text-xs">✓</span>}
                    </div>
                    {functionFilterOptions.map((fName) => {
                      const isSelected = functionFilter === fName;
                      return (
                        <div
                          key={fName}
                          onClick={() => {
                            setFunctionFilter(fName);
                            setShowFunctionFilterScroll(false);
                          }}
                          className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                            isSelected ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                          }`}
                        >
                          <span>{fName}</span>
                          {isSelected && <span className="text-militar-main text-xs">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
           <span className="text-sm text-gray-600">Total de <strong className="text-gray-900">{filteredAssignments.length}</strong> designações encontradas</span>
        </div>

        {/* Table */}
        <DataTable 
          columns={columns}
          data={sortedAssignments}
          keyExtractor={(row) => row.id}
        />
      </div>

      <Modal 
        isOpen={isAssignmentModalOpen} 
        onClose={() => {
          setIsAssignmentModalOpen(false);
          resetAssignmentForm();
        }} 
        title={isEditingAssignment ? "Editar Designação de Função" : "Cadastrar Designação de Função"}
        size="lg"
        overflowVisible
      >
        <form onSubmit={handleSaveAssignment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Função
            </label>
            <Select 
              required
              value={selectedFunction}
              onChange={(e) => {
                const funcName = e.target.value;
                setSelectedFunction(funcName);
                if (!isEditingAssignment) {
                  const ass = assignments.find(a => a.functionName === funcName);
                  if (ass && ass.efetivoId) {
                    const effectiveMilitar = militares.find(m => m.id === (ass as any).efetivoId);
                    if (effectiveMilitar) {
                      setEffective(`${effectiveMilitar.posto} ${effectiveMilitar.nomeGuerra || effectiveMilitar.nome_guerra || effectiveMilitar.nome}`);
                      setEffectiveId(effectiveMilitar.id);
                      setSelectedEffectivePG(effectiveMilitar.posto);
                    }
                    const substituteMilitar = militares.find(m => m.id === (ass as any).substitutoId);
                    if (substituteMilitar) {
                      setSubstitute(`${substituteMilitar.posto} ${substituteMilitar.nomeGuerra || substituteMilitar.nome_guerra || substituteMilitar.nome}`);
                      setSubstituteId(substituteMilitar.id);
                      setSelectedSubstitutePG(substituteMilitar.posto);
                    } else {
                      setSubstitute('');
                      setSubstituteId(null);
                      setSelectedSubstitutePG('');
                    }
                  } else {
                    setEffective('');
                    setEffectiveId(null);
                    setSelectedEffectivePG('');
                    setSubstitute('');
                    setSubstituteId(null);
                    setSelectedSubstitutePG('');
                  }
                }
              }}
              disabled={isEditingAssignment}
            >
              <option value="" disabled>Selecione uma função</option>
              {selectableFunctions.map(f => (
                <option key={f.id} value={f.name}>
                  {f.name}
                </option>
              ))}
            </Select>
            {!isEditingAssignment && selectedFunction && assignments.find(a => a.functionName === selectedFunction)?.efetivoId && (
              <div className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg flex items-center gap-1.5 mt-2 animate-filters">
                <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                <span>Aviso: Esta função já possui militares designados. Salvar irá atualizar a designação existente.</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                P/G (Efetivo)
              </label>
              <div className="relative">
                <Input
                  readOnly
                  value={selectedEffectivePG || 'Todos'}
                  onClick={() => {
                    const nextState = !showEffectivePGScroll;
                    closeAllSelectsExcept(nextState ? 'effectivePG' : undefined);
                    setShowEffectivePGScroll(nextState);
                  }}
                  onFocus={() => {
                    closeAllSelectsExcept('effectivePG');
                    setShowEffectivePGScroll(true);
                  }}
                  className="cursor-pointer pr-10 interactive-select text-sm"
                />
                <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs transition-transform duration-200 ${showEffectivePGScroll ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </div>
              {showEffectivePGScroll && (
                <>
                  <div className="fixed inset-0 z-[900]" onClick={() => setShowEffectivePGScroll(false)} />
                  <div className="absolute z-[1000] w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div
                      onClick={() => {
                        handleEffectivePGChange('');
                        setShowEffectivePGScroll(false);
                      }}
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                        selectedEffectivePG === '' ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                      }`}
                    >
                      <span>Todos</span>
                      {selectedEffectivePG === '' && <span className="text-militar-main text-xs">✓</span>}
                    </div>
                    {pgOptions.map((pg) => {
                      const isSelected = selectedEffectivePG === pg;
                      return (
                        <div
                          key={pg}
                          onClick={() => {
                            handleEffectivePGChange(pg);
                            setShowEffectivePGScroll(false);
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
            
            <div className="col-span-2 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Militar Efetivo
              </label>
              <Input 
                required
                placeholder="Digite para buscar..."
                value={effective}
                onChange={(e) => {
                  handleEffectiveMilitarChange(e.target.value);
                  setShowEffectiveSuggestions(true);
                }}
                onFocus={() => {
                  closeAllSelectsExcept('effectiveSuggestions');
                  setShowEffectiveSuggestions(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowEffectiveSuggestions(false), 250);
                }}
              />
              {showEffectiveSuggestions && (
                <div className="absolute z-[1000] w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                  {militares
                    .filter(m => {
                      if (substituteId && m.id === substituteId) return false;
                      if (selectedEffectivePG && m.posto !== selectedEffectivePG) return false;
                      const search = normalizeText(effective);
                      return normalizeText(`${m.posto} ${m.nome}`).includes(search) ||
                        (m.nome_completo && normalizeText(m.nome_completo).includes(search)) ||
                        (m.nome_guerra && normalizeText(m.nome_guerra).includes(search));
                    })
                    .map(m => (
                      <div
                        key={m.id}
                        onMouseDown={() => {
                          handleEffectiveMilitarChange(`${m.posto} ${m.nomeGuerra || m.nome_guerra || m.nome}`);
                          setEffectiveId(m.id);
                          setSelectedEffectivePG(m.posto);
                          setShowEffectiveSuggestions(false);
                        }}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center"
                      >
                        <span>
                          <span className="text-gray-400 mr-2 text-xs font-semibold uppercase">{m.posto}</span>
                          {renderMilitarName(m)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                P/G (Substituto)
              </label>
              <div className="relative">
                <Input
                  readOnly
                  value={selectedSubstitutePG || 'Todos'}
                  onClick={() => {
                    const nextState = !showSubstitutePGScroll;
                    closeAllSelectsExcept(nextState ? 'substitutePG' : undefined);
                    setShowSubstitutePGScroll(nextState);
                  }}
                  onFocus={() => {
                    closeAllSelectsExcept('substitutePG');
                    setShowSubstitutePGScroll(true);
                  }}
                  className="cursor-pointer pr-10 interactive-select text-sm"
                />
                <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs transition-transform duration-200 ${showSubstitutePGScroll ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </div>
              {showSubstitutePGScroll && (
                <>
                  <div className="fixed inset-0 z-[900]" onClick={() => setShowSubstitutePGScroll(false)} />
                  <div className="absolute z-[1000] w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div
                      onClick={() => {
                        handleSubstitutePGChange('');
                        setShowSubstitutePGScroll(false);
                      }}
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center ${
                        selectedSubstitutePG === '' ? 'bg-militar-light/10 font-semibold text-militar-main' : 'text-gray-700'
                      }`}
                    >
                      <span>Todos</span>
                      {selectedSubstitutePG === '' && <span className="text-militar-main text-xs">✓</span>}
                    </div>
                    {pgOptions.map((pg) => {
                      const isSelected = selectedSubstitutePG === pg;
                      return (
                        <div
                          key={pg}
                          onClick={() => {
                            handleSubstitutePGChange(pg);
                            setShowSubstitutePGScroll(false);
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
            
            <div className="col-span-2 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Militar Substituto
              </label>
              <Input 
                placeholder="Digite para buscar (Opcional)..."
                value={substitute}
                onChange={(e) => {
                  handleSubstituteMilitarChange(e.target.value);
                  setShowSubstituteSuggestions(true);
                }}
                onFocus={() => {
                  closeAllSelectsExcept('substituteSuggestions');
                  setShowSubstituteSuggestions(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowSubstituteSuggestions(false), 250);
                }}
              />
              {showSubstituteSuggestions && (
                <div className="absolute z-[1000] w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                  {militares
                    .filter(m => {
                      if (effectiveId && m.id === effectiveId) return false;
                      if (selectedSubstitutePG && m.posto !== selectedSubstitutePG) return false;
                      const search = normalizeText(substitute);
                      return normalizeText(`${m.posto} ${m.nome}`).includes(search) ||
                        (m.nome_completo && normalizeText(m.nome_completo).includes(search)) ||
                        (m.nome_guerra && normalizeText(m.nome_guerra).includes(search));
                    })
                    .map(m => (
                      <div
                        key={m.id}
                        onMouseDown={() => {
                          handleSubstituteMilitarChange(`${m.posto} ${m.nomeGuerra || m.nome_guerra || m.nome}`);
                          setSubstituteId(m.id);
                          setSelectedSubstitutePG(m.posto);
                          setShowSubstituteSuggestions(false);
                        }}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center"
                      >
                        <span>
                          <span className="text-gray-400 mr-2 text-xs font-semibold uppercase">{m.posto}</span>
                          {renderMilitarName(m)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => {
              setIsAssignmentModalOpen(false);
              resetAssignmentForm();
            }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSavingAssignment}>
              {isSavingAssignment ? 'Salvando...' : 'Salvar Designação'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal - Configurar Funções */}
      <Modal 
        isOpen={isConfigModalOpen} 
        onClose={() => setIsConfigModalOpen(false)} 
        title="Configurar Tipos de Função"
      >
        <div className="space-y-6">
          <form onSubmit={handleSaveFunctionType} className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800">Adicionar Nova Função</h3>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome da Função</label>
                <Input 
                  required 
                  placeholder="Ex: Sargenteante" 
                  value={newFunctionTypeName} 
                  onChange={e => setNewFunctionTypeName(e.target.value)} 
                  onBlur={() => setNewFunctionTypeName(capitalizeFirstLetter(newFunctionTypeName))}
                  disabled={isAddingFunctionType}
                />
              </div>
              <Button type="submit" size="md" icon={<Plus size={16} />} disabled={isAddingFunctionType}>
                {isAddingFunctionType ? 'Salvando...' : 'Adicionar'}
              </Button>
            </div>
          </form>

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Funções Cadastradas</h3>
            {functionTypes.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma função cadastrada.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto pr-2">
                <ul className="space-y-2">
                  {functionTypes.map(f => {
                    const isEditing = editingId === f.id;
                    return (
                      <li key={f.id} className="flex justify-between items-center bg-white border border-gray-200 p-3 rounded-lg shadow-sm gap-2">
                        {isEditing ? (
                          <Input 
                            value={editingName} 
                            onChange={e => setEditingName(e.target.value)} 
                            onBlur={() => setEditingName(capitalizeFirstLetter(editingName))}
                            className="flex-1 text-sm py-1"
                            autoFocus
                          />
                        ) : (
                          <span className="block text-sm font-medium text-gray-900">{f.name}</span>
                        )}
                        <div className="flex gap-1.5">
                          {isEditing ? (
                            <>
                              <button 
                                onClick={() => handleUpdateFunctionType(f.id)}
                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                title="Salvar"
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingId(null);
                                  setEditingName('');
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                title="Cancelar"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              {isProtectedFunction(f.name) ? (
                                <span className="text-xs font-semibold text-militar-main bg-militar-light/10 px-2 py-1 rounded">
                                  Protegida
                                </span>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => {
                                      setEditingId(f.id);
                                      setEditingName(f.name);
                                    }}
                                    className="p-2 text-gray-400 hover:text-militar-main hover:bg-militar-light/10 rounded-md transition-colors"
                                    title="Editar"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteFunctionType(f.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    title="Excluir"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button 
              onClick={() => setIsConfigModalOpen(false)}
              disabled={editingId !== null}
            >
              Concluir
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação para Excluir Designação */}
      <Modal
        isOpen={deleteAssignmentTarget !== null}
        onClose={() => !isDeletingAssignment && setDeleteAssignmentTarget(null)}
        title="Confirmar Exclusão de Função da Tela"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <Trash2 size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800 font-medium">
              Tem certeza que deseja excluir esta função da tela? Ela sairá desta visualização e perderá os militares designados, mas continuará cadastrada no sistema.
            </p>
          </div>

          {deleteAssignmentError && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              ⚠️ {deleteAssignmentError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setDeleteAssignmentTarget(null); setDeleteAssignmentError(null); }} disabled={isDeletingAssignment}>
              Cancelar
            </Button>
            <button
              onClick={handleConfirmDeleteAssignment}
              disabled={isDeletingAssignment}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              {isDeletingAssignment ? 'Excluindo...' : 'Sim, Excluir'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação para Limpar Designação */}
      <Modal
        isOpen={clearAssignmentTarget !== null}
        onClose={() => !isClearingAssignment && setClearAssignmentTarget(null)}
        title="Confirmar Limpeza de Designação"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 mt-0.5 flex-shrink-0"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21Z"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
            <p className="text-sm text-amber-800 font-medium">
              Tem certeza que deseja limpar as designações desta função? A função continuará visível na tela como "Não designado".
            </p>
          </div>

          {clearAssignmentError && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              ⚠️ {clearAssignmentError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setClearAssignmentTarget(null); setClearAssignmentError(null); }} disabled={isClearingAssignment}>
              Cancelar
            </Button>
            <button
              onClick={handleConfirmClearAssignment}
              disabled={isClearingAssignment}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 inline-block"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21Z"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
              {isClearingAssignment ? 'Limpando...' : 'Sim, Limpar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação para Excluir Tipo de Função */}
      <Modal
        isOpen={deleteFunctionTypeTarget !== null}
        onClose={() => !isDeletingFunctionType && setDeleteFunctionTypeTarget(null)}
        title="Confirmar Exclusão de Função"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <Trash2 size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800 font-medium">
              Tem certeza que deseja excluir esta função permanentemente do cadastro? Essa ação removerá a função e qualquer designação associada a ela.
            </p>
          </div>

          {deleteFunctionTypeError && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              ⚠️ {deleteFunctionTypeError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setDeleteFunctionTypeTarget(null); setDeleteFunctionTypeError(null); }} disabled={isDeletingFunctionType}>
              Cancelar
            </Button>
            <button
              onClick={handleConfirmDeleteFunctionType}
              disabled={isDeletingFunctionType}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              {isDeletingFunctionType ? 'Excluindo...' : 'Sim, Excluir'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
