import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { 
  Scale, Search, Edit2, Trash2, CheckCircle2, 
  AlertCircle, ShieldCheck, RefreshCw 
} from 'lucide-react';
import { api } from '../../services/api';

interface Punicao {
  id: string;
  numProcesso: string;
  pgMilitar: string;
  nomeGuerra: string;
  dataFATD: string;
  relatoFato: string;
  status: 'Publicado em BI' | 'Não Publicado';
  biPublicacao: string;
  tipoPunicao: 'Advertido' | 'Impedimento' | 'Repreensão' | 'Detenção' | 'Prisão' | '';
  quantidadeDias: number | string;
  nomeParticipante: string;
  pgParticipante: string;
  documentoFatdUrl?: string;
  arroladoId?: number | null;
  participanteId?: number | null;
}

export function Punicoes() {
  const [punicoes, setPunicoes] = useState<Punicao[]>([]);
  const [militares, setMilitares] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPunicaoId, setSelectedPunicaoId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');

  // Form State
  const [numProcesso, setNumProcesso] = useState('');
  const [pgMilitar, setPgMilitar] = useState('');
  const [nomeMilitarBusca, setNomeMilitarBusca] = useState('');
  const [dataFATD, setDataFATD] = useState(new Date().toISOString().split('T')[0]);
  const [relatoFato, setRelatoFato] = useState('');
  const [biPublicacao, setBiPublicacao] = useState('');
  const [tipoPunicao, setTipoPunicao] = useState<'Advertido' | 'Impedimento' | 'Repreensão' | 'Detenção' | 'Prisão' | ''>('');
  const [quantidadeDias, setQuantidadeDias] = useState<number | string>('');
  
  // Participante Form State
  const [nomeParticipante, setNomeParticipante] = useState('');
  const [pgParticipante, setPgParticipante] = useState('');
  const [arroladoId, setArroladoId] = useState<number | null>(null);
  const [participanteId, setParticipanteId] = useState<number | null>(null);

  // Carregar dados iniciais do banco de dados
  const loadData = async () => {
    try {
      // Carrega militares primeiro para fazer a correspondência de nomes destacados
      const milRes = await api.get('/militares');
      setMilitares(milRes.data || []);

      const res = await api.get('/fatd');
      const list = (res.data || []).map((f: any) => ({
        id: String(f.id),
        numProcesso: f.numeroProcesso,
        pgMilitar: f.pgArrolado,
        nomeGuerra: f.nomeArrolado.toUpperCase(),
        dataFATD: f.dataProcessoFato,
        relatoFato: f.fatoRelatado,
        status: f.punicao && f.punicao.bi_publicacao && f.punicao.tipo ? 'Publicado em BI' : 'Não Publicado',
        biPublicacao: f.punicao?.bi_publicacao || '',
        tipoPunicao: f.punicao?.tipo || '',
        quantidadeDias: f.punicao?.dias || '',
        nomeParticipante: f.nomeParticipante,
        pgParticipante: f.pgParticipante,
        documentoFatdUrl: f.documentoFatdUrl,
        arroladoId: f.arroladoId,
        participanteId: f.participanteId
      }));
      setPunicoes(list);
    } catch (err) {
      console.error('Erro ao carregar punições/FATDs:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEditModal = (p: Punicao) => {
    setIsEditMode(true);
    setSelectedPunicaoId(p.id);
    // Preenche Form
    setNumProcesso(p.numProcesso);
    setPgMilitar(p.pgMilitar);
    setNomeMilitarBusca(p.nomeGuerra);
    setDataFATD(p.dataFATD);
    setRelatoFato(p.relatoFato);
    setBiPublicacao(p.biPublicacao);
    setTipoPunicao(p.tipoPunicao);
    setQuantidadeDias(p.quantidadeDias);
    setNomeParticipante(p.nomeParticipante || '');
    setPgParticipante(p.pgParticipante || '');
    setArroladoId(p.arroladoId || null);
    setParticipanteId(p.participanteId || null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedPunicaoId) {
        setIsSaving(true);
        const fatdId = Number(selectedPunicaoId);
        await api.post(`/fatd/${fatdId}/punicao`, {
          bi_publicacao: biPublicacao,
          tipo: tipoPunicao,
          dias: quantidadeDias ? Number(quantidadeDias) : 0
        });
        alert('Dados da punição salvos com sucesso no banco de dados!');
        setIsModalOpen(false);
        loadData();
      }
    } catch (err) {
      console.error('Erro ao salvar punição:', err);
      alert('Erro ao salvar os dados da punição.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja realmente excluir esta FATD e sua punição correspondente do banco de dados?')) {
      try {
        await api.delete(`/fatd/${Number(id)}`);
        alert('Registro de FATD excluído com sucesso!');
        loadData();
      } catch (err) {
        console.error('Erro ao excluir FATD:', err);
        alert('Erro ao excluir o registro.');
      }
    }
  };

  // Máscara do BI (xxx/xxxx)
  const handleBiPublicacaoChange = (val: string) => {
    let cleaned = val.replace(/[^0-9]/g, '');
    if (cleaned.length > 7) {
      cleaned = cleaned.slice(0, 7);
    }
    let formatted = cleaned;
    if (cleaned.length > 3) {
      formatted = `${cleaned.slice(0, 3)}/${cleaned.slice(3)}`;
    }
    setBiPublicacao(formatted);
  };

  // Helper para destacar nome de guerra
  function renderMilitarName(militar: any) {
    const nomeCompleto = militar.nome_completo || militar.nome || '';
    const nomeGuerra = militar.nome_guerra || '';

    if (!nomeGuerra) {
      return <span className="font-bold text-gray-900">{nomeCompleto}</span>;
    }

    const words = nomeGuerra.split(/\s+/).filter((w: string) => w.trim().length > 0);
    if (words.length === 0) {
      return <span className="font-bold text-gray-900">{nomeCompleto}</span>;
    }

    const escapedWords = words.map((w: string) => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
    const parts = nomeCompleto.split(regex);

    return (
      <span>
        {parts.map((part: string, index: number) => 
          regex.test(part) ? (
            <strong key={index} className="font-bold text-militar-main underline decoration-2 decoration-militar-light">
              {part}
            </strong>
          ) : (
            <span key={index} className="font-bold text-gray-500">
              {part}
            </span>
          )
        )}
      </span>
    );
  }

  // Componente de display não-editável do militar
  const RenderMilitarDisplay = ({ label, pg, militarId, fallbackName }: { label: string, pg: string, militarId?: number | null, fallbackName: string }) => {
    const mil = militarId ? militares.find(m => m.id === militarId) : null;
    return (
      <div className="space-y-1">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</label>
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-2.5 min-h-[42px]">
          <div className="bg-militar-main/10 text-militar-main px-2 py-1 rounded text-xs font-bold uppercase">
            {mil ? mil.posto : (pg || 'N/A')}
          </div>
          <div className="text-sm font-medium text-gray-800">
            {mil ? renderMilitarName(mil) : <span className="font-bold text-gray-950">{fallbackName}</span>}
          </div>
        </div>
      </div>
    );
  };

  // Filtros
  const filteredPunicoes = punicoes.filter(p => {
    const matchesSearch = 
      p.nomeGuerra.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.numProcesso.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'Todos' || 
      p.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const columns: any[] = [
    { header: 'Nº Processo', accessor: 'numProcesso' },
    { header: 'P/G', accessor: 'pgMilitar' },
    { 
      header: 'Nome de Guerra', 
      accessor: (row: Punicao) => (
        <span className="font-semibold text-militar-main hover:underline decoration-militar-main/30 cursor-pointer">
          {row.nomeGuerra}
        </span>
      ) 
    },
    { 
      header: 'Data da FATD', 
      accessor: (row: Punicao) => {
        if (!row.dataFATD) return '';
        const parts = row.dataFATD.split('-');
        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : row.dataFATD;
      }
    },
    { 
      header: 'Relato do Fato', 
      accessor: (row: Punicao) => (
        <div className="max-w-[200px] truncate font-normal text-xs text-gray-500">
          {row.relatoFato}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (row: Punicao) => {
        const isPublicado = row.status === 'Publicado em BI';
        return (
          <Badge variant={isPublicado ? 'success' : 'danger'}>
            <span className="flex items-center gap-1">
              {isPublicado ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              {row.status}
            </span>
          </Badge>
        );
      }
    },
    { 
      header: 'BI de Publicação', 
      accessor: (row: Punicao) => row.biPublicacao || <span className="text-gray-400 italic text-xs">Pendente</span>
    },
    {
      header: 'Tipo Punição',
      accessor: (row: Punicao) => {
        if (!row.tipoPunicao) return <span className="text-gray-400 italic text-xs">Pendente</span>;
        
        let variant: any = 'default';
        if (row.tipoPunicao === 'Advertido') variant = 'default';
        if (row.tipoPunicao === 'Impedimento') variant = 'warning';
        if (row.tipoPunicao === 'Repreensão') variant = 'warning';
        if (row.tipoPunicao === 'Detenção') variant = 'danger';
        if (row.tipoPunicao === 'Prisão') variant = 'danger';

        return <Badge variant={variant}>{row.tipoPunicao}</Badge>;
      }
    },
    {
      header: 'Qtd Dias',
      accessor: (row: Punicao) => {
        if (row.quantidadeDias === '' || row.quantidadeDias === undefined || row.quantidadeDias === null) {
          return <span className="text-gray-400 italic text-xs">-</span>;
        }
        return `${row.quantidadeDias} dia(s)`;
      }
    },
    {
      header: 'Ações',
      accessor: (row: Punicao) => (
        <div className="flex gap-2 text-gray-400" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => handleOpenEditModal(row)}
            className="p-1 hover:text-militar-main transition-colors border border-gray-200 rounded"
            title="Publicar ou Editar Punição"
          >
            <Edit2 size={15} />
          </button>
          <button 
            onClick={() => handleDelete(row.id)}
            className="p-1 hover:text-red-500 transition-colors border border-gray-200 rounded"
            title="Excluir Registro"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  const renderExpandedRow = (row: Punicao) => (
    <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 bg-gray-50 rounded-lg border border-gray-200 shadow-inner">
      <div className="md:col-span-1 border-r border-gray-200 pr-4 space-y-4">
        <div>
          <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Militar Participante
          </span>
          <span className="text-sm text-gray-800 font-semibold flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-militar-main" />
            {row.pgParticipante ? `${row.pgParticipante} ` : ''}{row.nomeParticipante || 'Não informado'}
          </span>
        </div>

        <div>
          <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Status de Publicação
          </span>
          <span className="text-sm font-semibold mb-3 block">
            {row.status === 'Publicado em BI' ? (
              <span className="text-green-700 flex items-center gap-1">
                <CheckCircle2 size={15} />
                Publicado no {row.biPublicacao}
              </span>
            ) : (
              <span className="text-amber-600 flex items-center gap-1">
                <AlertCircle size={15} />
                Aguardando publicação em BI
              </span>
            )}
          </span>
          
          <Button 
            onClick={() => handleOpenEditModal(row)}
            size="sm"
            variant={row.status === 'Publicado em BI' ? 'outline' : 'primary'}
            className="w-full flex justify-center items-center gap-1.5 text-xs py-2 mt-1"
          >
            <Edit2 size={13} />
            {row.status === 'Publicado em BI' ? 'Editar Dados da Publicação' : 'Publicar Punição (Lançar BI)'}
          </Button>
        </div>
      </div>
      
      <div className="md:col-span-2 pl-2 space-y-4">
        <div>
          <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Relato Completo do Fato
          </span>
          <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-4 rounded-lg border border-gray-200 leading-relaxed font-normal shadow-sm">
            {row.relatoFato}
          </p>
        </div>

        {row.documentoFatdUrl && (
          <div className="pt-1">
            <a 
              href={row.documentoFatdUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-2 bg-militar-main hover:bg-militar-dark text-white text-xs px-3.5 py-2 rounded font-semibold shadow transition-colors"
            >
              📄 Baixar PDF do Processo (FATD)
            </a>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Controle de Punições Disciplinares</h1>
          <Breadcrumb items={[{ label: 'Gestão de Pessoas' }, { label: 'Punições' }]} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
        {/* Filtros */}
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Buscar Punição</label>
            <Input 
              placeholder="Digite o nome de guerra, processo ou militar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>
          <div className="w-56">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Filtrar por Status</label>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="Todos">Todos</option>
              <option value="Não Publicado">Não Publicado</option>
              <option value="Publicado em BI">Publicado em BI</option>
            </Select>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
           <span className="text-sm text-gray-600">
             Total de <strong className="text-gray-900">{filteredPunicoes.length}</strong> punição(ões) registrada(s) — 
             <span className="text-xs text-gray-400 ml-1">Clique em uma linha para expandir os detalhes</span>
           </span>
        </div>

        {/* Tabela de Dados */}
        <div className="overflow-x-auto">
          <DataTable 
            columns={columns}
            data={filteredPunicoes}
            keyExtractor={(row) => row.id}
            renderExpandedRow={renderExpandedRow}
          />
        </div>
      </div>

      {/* Modal de Lançamento / Edição de Punição */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditMode ? "Atualizar / Publicar Punição" : "Lançar Punição Manual"}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Número do Processo"
              placeholder="Ex: 001/2026"
              disabled
              value={numProcesso}
              className="bg-gray-100 cursor-not-allowed"
            />
            <Input 
              label="Data da FATD"
              type="date"
              disabled
              value={dataFATD}
              className="bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div className="border-t border-gray-100 pt-3">
            <RenderMilitarDisplay
              label="Militar Arrolado (Transgressor)"
              pg={pgMilitar}
              militarId={arroladoId}
              fallbackName={nomeMilitarBusca}
            />
          </div>

          <div className="border-t border-gray-100 pt-3">
            <RenderMilitarDisplay
              label="Militar Participante"
              pg={pgParticipante}
              militarId={participanteId}
              fallbackName={nomeParticipante}
            />
          </div>

          <div className="border-t border-gray-100 pt-3">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Relato do Fato</label>
            <textarea
              rows={3}
              disabled
              className="w-full bg-gray-100 border border-gray-300 rounded-lg py-2 px-3 text-sm cursor-not-allowed transition-all"
              value={relatoFato}
            />
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-4">
            <h3 className="text-sm font-semibold text-militar-main flex items-center gap-1.5">
              <Scale size={16} />
              Dados da Publicação em Boletim Interno (BI)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input 
                label="BI Nº:"
                placeholder="Ex: 012/2026"
                value={biPublicacao}
                onChange={(e) => handleBiPublicacaoChange(e.target.value)}
              />
              <Select 
                label="Tipo de Punição"
                value={tipoPunicao}
                onChange={(e) => setTipoPunicao(e.target.value as any)}
              >
                <option value="">A definir / Sem punição</option>
                <option value="Advertido">Advertido</option>
                <option value="Impedimento">Impedimento</option>
                <option value="Repreensão">Repreensão</option>
                <option value="Detenção">Detenção</option>
                <option value="Prisão">Prisão</option>
              </Select>
              <Input 
                label="Quantidade de Dias"
                type="number"
                min={1}
                placeholder="Dias"
                value={quantidadeDias}
                onChange={(e) => setQuantidadeDias(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2.5 rounded border border-gray-100">
              <AlertCircle size={14} className="text-gray-400 flex-shrink-0" />
              <span>
                Preencher os campos de <strong>BI Nº:</strong> e <strong>Tipo de Punição</strong> alterará automaticamente o status do registro para <strong>Publicado em BI</strong>.
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving} className="flex items-center gap-1.5">
              {isSaving ? (
                <>
                  <RefreshCw className="animate-spin" size={15} />
                  Salvando...
                </>
              ) : (
                'Salvar Registro'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
