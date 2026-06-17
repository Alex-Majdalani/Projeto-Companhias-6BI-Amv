import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import type { Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Trash2, HeartPulse, ShieldAlert, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface Medico {
  id: number;
  nomeCompleto: string;
  crm: string;
}

interface VisitaMedica {
  id: number;
  militarId: number | null;
  pgMilitar: string;
  nomeCompletoMilitar: string;
  nomeGuerraMilitar: string;
  dataVisita: string;
  baixado: 'Sim' | 'Não';
  medicoResponsavel: string;
  parecerMedico: string;
  obs: string;
  baixadoInfo?: {
    id: number;
    motivo: string;
    dataInicio: string;
    dataRetorno: string;
    csd: string[];
  } | null;
}

function normalizeText(text: string): string {
  if (!text) return '';
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
}

export function Atendimentos() {
  const [visitas, setVisitas] = useState<VisitaMedica[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [militares, setMilitares] = useState<any[]>([]);
  
  // Modais
  const [isVisitaModalOpen, setIsVisitaModalOpen] = useState(false);
  const [isMedicoModalOpen, setIsMedicoModalOpen] = useState(false);
  
  // Busca/Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [baixadoFilter, setBaixadoFilter] = useState('Todos');
  const [medicoFilter, setMedicoFilter] = useState('Todos');

  // Form Medico
  const [medicoNome, setMedicoNome] = useState('');
  const [medicoCrm, setMedicoCrm] = useState('');
  const [isSavingMedico, setIsSavingMedico] = useState(false);

  // Form Visita
  const [militarId, setMilitarId] = useState<number | null>(null);
  const [searchMilitar, setSearchMilitar] = useState('');
  const [selectedPG, setSelectedPG] = useState('');
  const [showMilitarSuggestions, setShowMilitarSuggestions] = useState(false);
  const [motivoVisita, setMotivoVisita] = useState('');
  const [dataVisita, setDataVisita] = useState(new Date().toISOString().split('T')[0]);
  const [medicoResponsavel, setMedicoResponsavel] = useState('');
  const [parecerMedico, setParecerMedico] = useState('');
  const [obs, setObs] = useState('');
  const [baixado, setBaixado] = useState<'Sim' | 'Não'>('Não');
  const [motivoBaixa, setMotivoBaixa] = useState('');
  const [diasBaixado, setDiasBaixado] = useState<string>('');
  const [dataRetorno, setDataRetorno] = useState('');
  const [csd, setCsd] = useState<string[]>([]);
  const [isSavingVisita, setIsSavingVisita] = useState(false);

  // Exclusão
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Autocomplete militar no form
  const [showPGScroll, setShowPGScroll] = useState(false);

  const PG_ORDER = [
    'CEL', 'TC', 'MAJ', 'CAP', '1º TEN', '2º TEN', 'ASP',
    'ST', '1º SGT', '2º SGT', '3º SGT', 'CB', 'SD EP', 'SD EV'
  ];

  const pgOptions = Array.from(new Set(militares.map(m => m.posto).filter(Boolean)))
    .sort((a, b) => {
      const idxA = PG_ORDER.indexOf(a);
      const idxB = PG_ORDER.indexOf(b);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });

  const loadData = async () => {
    try {
      const [visitasRes, medicosRes, milRes] = await Promise.all([
        api.get('/atendimentos/visitas'),
        api.get('/atendimentos/medicos'),
        api.get('/militares')
      ]);
      setVisitas(visitasRes.data || []);
      setMedicos(medicosRes.data || []);
      setMilitares(milRes.data || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calcular data de retorno quando altera dias
  useEffect(() => {
    if (baixado === 'Sim' && diasBaixado && dataVisita) {
      const date = new Date(dataVisita + 'T12:00:00');
      date.setDate(date.getDate() + parseInt(diasBaixado));
      setDataRetorno(date.toISOString().split('T')[0]);
    }
  }, [diasBaixado, dataVisita, baixado]);

  // Calcular dias quando altera data de retorno
  const handleDataRetornoChange = (val: string) => {
    setDataRetorno(val);
    if (val && dataVisita) {
      const diffTime = new Date(val + 'T12:00:00').getTime() - new Date(dataVisita + 'T12:00:00').getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        setDiasBaixado(String(diffDays));
      }
    }
  };

  const handleMilitarSearchChange = (val: string) => {
    setSearchMilitar(val);
    const normalizedVal = normalizeText(val);
    const found = militares.find(m => 
      normalizeText(`${m.posto} ${m.nome}`) === normalizedVal || 
      normalizeText(m.nome) === normalizedVal
    );
    if (found) {
      setMilitarId(found.id);
      setSelectedPG(found.posto);
    } else {
      setMilitarId(null);
    }
  };

  const handlePGChange = (pg: string) => {
    setSelectedPG(pg);
    setMilitarId(null);
    setSearchMilitar('');
  };

  const handleCsdToggle = (item: string) => {
    if (csd.includes(item)) {
      setCsd(csd.filter(c => c !== item));
    } else {
      setCsd([...csd, item]);
    }
  };

  const handleSaveMedico = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formattedNome = medicoNome
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const formattedCrm = medicoCrm.trim();

    if (!formattedNome || !formattedCrm) {
      alert('Nome completo e CRM são obrigatórios.');
      return;
    }

    if (!/^\d{6}$/.test(formattedCrm)) {
      alert('O CRM deve conter exatamente 6 números.');
      return;
    }

    setIsSavingMedico(true);
    try {
      await api.post('/atendimentos/medicos', {
        nomeCompleto: formattedNome,
        crm: formattedCrm
      });
      alert('Médico cadastrado com sucesso!');
      setMedicoNome('');
      setMedicoCrm('');
      setIsMedicoModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Erro ao cadastrar médico.');
    } finally {
      setIsSavingMedico(false);
    }
  };

  const handleSaveVisita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!militarId || !motivoVisita.trim() || !medicoResponsavel || !dataVisita) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    if (baixado === 'Sim' && (!motivoBaixa.trim() || !dataRetorno)) {
      alert('Campos de baixa são obrigatórios.');
      return;
    }

    setIsSavingVisita(true);
    try {
      await api.post('/atendimentos/visitas', {
        militarId,
        motivoVisita,
        dataVisita,
        medicoResponsavel,
        parecerMedico,
        obs,
        baixado,
        motivoBaixa,
        dataRetorno,
        csd
      });
      alert('Atendimento médico registrado com sucesso!');
      setIsVisitaModalOpen(false);
      resetVisitaForm();
      loadData();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao registrar atendimento médico.');
    } finally {
      setIsSavingVisita(false);
    }
  };

  const resetVisitaForm = () => {
    setMilitarId(null);
    setSearchMilitar('');
    setSelectedPG('');
    setMotivoVisita('');
    setDataVisita(new Date().toISOString().split('T')[0]);
    setMedicoResponsavel('');
    setParecerMedico('');
    setObs('');
    setBaixado('Não');
    setMotivoBaixa('');
    setDiasBaixado('');
    setDataRetorno('');
    setCsd([]);
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/atendimentos/visitas/${deleteTargetId}`);
      alert('Registro excluído com sucesso!');
      setDeleteTargetId(null);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir registro.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtros
  const filteredVisitas = visitas.filter(v => {
    const matchesSearch = 
      v.nomeGuerraMilitar.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.pgMilitar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.medicoResponsavel.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBaixado = 
      baixadoFilter === 'Todos' || 
      v.baixado === baixadoFilter;

    const matchesMedico = 
      medicoFilter === 'Todos' || 
      v.medicoResponsavel === medicoFilter;

    return matchesSearch && matchesBaixado && matchesMedico;
  });

  const columns: Column<VisitaMedica>[] = [
    { 
      header: 'P/G NOME COMPLETO', 
      accessor: (row: VisitaMedica) => (
        <span className="font-semibold text-gray-900">
          {row.pgMilitar} {row.nomeCompletoMilitar}
        </span>
      )
    },
    { 
      header: 'Data da Visita', 
      accessor: (row: VisitaMedica) => formatShortDate(row.dataVisita)
    },
    {
      header: 'Baixado',
      accessor: (row: VisitaMedica) => {
        const isBx = row.baixado === 'Sim';
        return (
          <Badge variant={isBx ? 'danger' : 'success'}>
            {row.baixado}
          </Badge>
        );
      }
    },
    { 
      header: 'Médico Responsável', 
      accessor: (row: VisitaMedica) => row.medicoResponsavel
    },
    {
      header: 'Ações',
      accessor: (row: VisitaMedica) => (
        <div className="flex gap-2 text-gray-400" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => setDeleteTargetId(row.id)}
            className="p-1 hover:text-red-500 transition-colors border border-gray-200 rounded"
            title="Excluir Registro"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )
    }
  ];

  const renderExpandedRow = (row: VisitaMedica) => {
    const dias = row.baixadoInfo && row.dataVisita && row.baixadoInfo.dataRetorno
      ? Math.ceil((new Date(row.baixadoInfo.dataRetorno + 'T12:00:00').getTime() - new Date(row.dataVisita + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return (
      <div className="p-4 bg-gray-50/60 rounded-xl border border-gray-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Parecer Médico</h4>
              <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm min-h-[60px]">
                <p className="text-sm text-gray-700 whitespace-pre-line">{row.parecerMedico || 'Nenhum parecer cadastrado.'}</p>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Observações</h4>
              <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm min-h-[40px]">
                <p className="text-sm text-gray-700">{row.obs || 'Nenhuma observação.'}</p>
              </div>
            </div>
          </div>
          <div>
            {row.baixado === 'Sim' && row.baixadoInfo ? (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Detalhes da Baixa Médica</h4>
                <div className="p-4 bg-red-50/50 border border-red-100 rounded-lg shadow-sm space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-600 font-medium">Motivo:</span>{' '}
                    <strong className="text-gray-900">{row.baixadoInfo.motivo}</strong>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600 font-medium">Dias de Baixa:</span>{' '}
                    <strong className="text-gray-900">{dias} dia(s)</strong>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600 font-medium">Data de Retorno:</span>{' '}
                    <strong className="text-gray-900">{formatShortDate(row.baixadoInfo.dataRetorno)}</strong>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600 font-medium">Dispensa:</span>{' '}
                    {row.baixadoInfo.csd.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {row.baixadoInfo.csd.map(c => (
                          <Badge key={c} variant="warning">{c}</Badge>
                        ))}
                      </div>
                    ) : (
                      <strong className="text-gray-400 italic">Nenhuma dispensa selecionada</strong>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 p-4 rounded-lg shadow-sm h-full justify-center">
                <HeartPulse size={18} className="text-gray-400" />
                <span>Militar não necessitou de baixa médica.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Atendimentos Médicos</h1>
          <Breadcrumb items={[{ label: 'Saúde' }, { label: 'Atendimentos' }]} />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsMedicoModalOpen(true)} variant="outline" className="flex items-center gap-2">
            <Plus size={16} />
            Novo Médico
          </Button>
          <Button onClick={() => setIsVisitaModalOpen(true)} className="flex items-center gap-2">
            <Plus size={16} />
            Nova Visita
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Buscar militar ou médico</label>
            <Input 
              placeholder="Digite para filtrar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>
          <div className="w-48">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Filtrar por Baixa</label>
            <Select value={baixadoFilter} onChange={(e) => setBaixadoFilter(e.target.value)}>
              <option value="Todos">Todos</option>
              <option value="Sim">Sim</option>
              <option value="Não">Não</option>
            </Select>
          </div>
          <div className="w-64">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Médico Responsável</label>
            <Select value={medicoFilter} onChange={(e) => setMedicoFilter(e.target.value)}>
              <option value="Todos">Todos</option>
              {medicos.map(m => (
                <option key={m.id} value={m.nomeCompleto}>{m.nomeCompleto} (CRM {m.crm})</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <DataTable 
            columns={columns}
            data={filteredVisitas}
            keyExtractor={(row) => row.id}
            renderExpandedRow={renderExpandedRow}
          />
        </div>
      </div>

      {/* Modal: Novo Médico */}
      <Modal isOpen={isMedicoModalOpen} onClose={() => setIsMedicoModalOpen(false)} title="Cadastrar Novo Médico" size="md">
        <form onSubmit={handleSaveMedico} className="space-y-4">
          <Input 
            label="Nome Completo" 
            placeholder="Ex: Dr. Roberto Silva" 
            value={medicoNome} 
            onChange={(e) => setMedicoNome(e.target.value)} 
          />
          <Input 
            label="CRM" 
            placeholder="Ex: 123456" 
            value={medicoCrm} 
            maxLength={6}
            onChange={(e) => setMedicoCrm(e.target.value.replace(/\D/g, ''))} 
          />
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setIsMedicoModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSavingMedico}>
              {isSavingMedico ? 'Salvando...' : 'Salvar Médico'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Nova Visita */}
      <Modal isOpen={isVisitaModalOpen} onClose={() => setIsVisitaModalOpen(false)} title="Registrar Nova Visita Médica" size="lg">
        <form onSubmit={handleSaveVisita} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Combobox de P/G */}
            <div className="col-span-1 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">P/G</label>
              <div className="relative">
                <Input
                  readOnly
                  value={selectedPG || 'Todos'}
                  onClick={() => setShowPGScroll(!showPGScroll)}
                  className="cursor-pointer pr-10 text-sm"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">▼</div>
              </div>
              {showPGScroll && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setShowPGScroll(false)} />
                  <div className="absolute z-[100] w-full mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div onClick={() => { handlePGChange(''); setShowPGScroll(false); }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm">Todos</div>
                    {pgOptions.map(pg => (
                      <div key={pg} onClick={() => { handlePGChange(pg); setShowPGScroll(false); }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm">{pg}</div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Autocomplete de Militar */}
            <div className="col-span-2 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o Militar</label>
              <Input 
                placeholder="Digite para buscar..."
                value={searchMilitar}
                onChange={(e) => {
                  handleMilitarSearchChange(e.target.value);
                  setShowMilitarSuggestions(true);
                }}
                onFocus={() => setShowMilitarSuggestions(true)}
                onBlur={() => setTimeout(() => setShowMilitarSuggestions(false), 250)}
              />
              {showMilitarSuggestions && (
                <div className="absolute z-[100] w-full mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                  {militares
                    .filter(m => {
                      if (selectedPG && m.posto !== selectedPG) return false;
                      const search = normalizeText(searchMilitar);
                      return normalizeText(`${m.posto} ${m.nome}`).includes(search) ||
                        (m.nome_completo && normalizeText(m.nome_completo).includes(search)) ||
                        (m.nome_guerra && normalizeText(m.nome_guerra).includes(search));
                    })
                    .map(m => (
                      <div
                        key={m.id}
                        onMouseDown={() => {
                          handleMilitarSearchChange(`${m.posto} ${m.nome}`);
                          setMilitarId(m.id);
                          setShowMilitarSuggestions(false);
                        }}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      >
                        <span className="text-gray-400 mr-2 text-xs font-semibold">{m.posto}</span>
                        {m.nome_completo || m.nome}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Motivo da Visita" 
              placeholder="Ex: Dor de cabeça, Inspeção de saúde" 
              value={motivoVisita} 
              onChange={(e) => setMotivoVisita(e.target.value)} 
            />
            <Input 
              label="Data da Visita" 
              type="date" 
              value={dataVisita} 
              onChange={(e) => setDataVisita(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Médico Responsável" 
              value={medicoResponsavel} 
              onChange={(e) => setMedicoResponsavel(e.target.value)}
            >
              <option value="">Selecione o médico...</option>
              {medicos.map(m => (
                <option key={m.id} value={m.nomeCompleto}>{m.nomeCompleto} (CRM {m.crm})</option>
              ))}
            </Select>
            <Select 
              label="Militar será Baixado?" 
              value={baixado} 
              onChange={(e) => setBaixado(e.target.value as any)}
            >
              <option value="Não">Não</option>
              <option value="Sim">Sim</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Parecer Médico (Long Text)</label>
            <textarea
              rows={4}
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-militar-light focus:border-transparent transition-all"
              placeholder="Digite o parecer detalhado do médico..."
              value={parecerMedico}
              onChange={(e) => setParecerMedico(e.target.value)}
            />
          </div>

          <Input 
            label="Observação" 
            placeholder="Ex: Retorno em caso de novos sintomas" 
            value={obs} 
            onChange={(e) => setObs(e.target.value)} 
          />

          {/* Campos condicionais para Baixado = Sim */}
          {baixado === 'Sim' && (
            <div className="border-t border-red-100 pt-4 space-y-4 animate-filters">
              <h3 className="text-sm font-semibold text-red-600 flex items-center gap-1.5">
                <ShieldAlert size={16} />
                Dados do Afastamento (Baixa)
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <Input 
                    label="Motivo de Baixa" 
                    placeholder="Ex: CID X10" 
                    value={motivoBaixa} 
                    onChange={(e) => setMotivoBaixa(e.target.value)} 
                  />
                </div>
                <div className="col-span-1">
                  <Input 
                    label="Quantidade de dias" 
                    type="number" 
                    min={1} 
                    value={diasBaixado} 
                    onChange={(e) => setDiasBaixado(e.target.value)} 
                  />
                </div>
                <div className="col-span-1">
                  <Input 
                    label="Data de Retorno" 
                    type="date" 
                    value={dataRetorno} 
                    onChange={(e) => handleDataRetornoChange(e.target.value)} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Convém ser dispensado de:</label>
                <div className="flex gap-4">
                  {['TFM', 'Formatura', 'Serviço', 'Atividade Fisica'].map((item) => {
                    const isChecked = csd.includes(item);
                    return (
                      <label key={item} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleCsdToggle(item)}
                          className="w-4 h-4 text-militar-main border-gray-300 rounded focus:ring-militar-light focus:ring-2"
                        />
                        {item}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => { setIsVisitaModalOpen(false); resetVisitaForm(); }}>Cancelar</Button>
            <Button type="submit" disabled={isSavingVisita}>
              {isSavingVisita ? 'Gravando...' : 'Gravar Atendimento'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirmação de Exclusão */}
      <Modal isOpen={deleteTargetId !== null} onClose={() => setDeleteTargetId(null)} title="Excluir Atendimento Médico" size="sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3.5 rounded-lg border border-amber-100">
            <AlertCircle size={20} className="flex-shrink-0" />
            <p className="text-sm font-medium">Atenção: Esta ação é irreversível.</p>
          </div>
          <p className="text-sm text-gray-600">Deseja realmente excluir este atendimento médico e sua respectiva baixa (se houver)?</p>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setDeleteTargetId(null)}>Cancelar</Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white border-transparent" disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
