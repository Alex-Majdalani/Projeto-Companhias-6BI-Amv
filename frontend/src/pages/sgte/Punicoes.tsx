import React, { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { 
  Scale, Plus, Search, Edit2, Trash2, CheckCircle2, 
  AlertCircle, ShieldCheck 
} from 'lucide-react';
import { militaresMock } from './CadastroMilitares';

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
}

const postosGraduacoes = [
  'Maj', 'Cap', '1º Ten', '2º Ten', 'Asp', 'Subten', 
  '1º Sgt', '2º Sgt', '3º Sgt', 'Cb', 'Sd'
];

export function Punicoes() {
  const [punicoes, setPunicoes] = useState<Punicao[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [status, setStatus] = useState<'Publicado em BI' | 'Não Publicado'>('Não Publicado');
  const [biPublicacao, setBiPublicacao] = useState('');
  const [tipoPunicao, setTipoPunicao] = useState<'Advertido' | 'Impedimento' | 'Repreensão' | 'Detenção' | 'Prisão' | ''>('');
  const [quantidadeDias, setQuantidadeDias] = useState<number | string>('');
  
  // Participante Form State
  const [nomeParticipante, setNomeParticipante] = useState('');
  const [pgParticipante, setPgParticipante] = useState('');

  // Carregar dados iniciais do localStorage
  useEffect(() => {
    const rawData = localStorage.getItem('@SisGAdm:punicoes');
    if (rawData) {
      setPunicoes(JSON.parse(rawData));
    } else {
      // Mock inicial caso não exista nada no localStorage
      const mockInicial: Punicao[] = [
        {
          id: '1',
          numProcesso: '001/2026',
          pgMilitar: 'Cb',
          nomeGuerra: 'LIMA',
          dataFATD: '2026-05-10',
          relatoFato: 'Faltou ao serviço de guarda no dia 09 de maio de 2026 sem apresentar justificativa plausível.',
          status: 'Publicado em BI',
          biPublicacao: 'BI nº 15/2026',
          tipoPunicao: 'Impedimento',
          quantidadeDias: 2,
          nomeParticipante: 'ALEXNALDO MAJDALANI DE MELO JUNIOR',
          pgParticipante: '2º Sgt'
        },
        {
          id: '2',
          numProcesso: '002/2026',
          pgMilitar: 'Sd',
          nomeGuerra: 'SANTOS',
          dataFATD: '2026-06-02',
          relatoFato: 'Apresentou-se com atraso de 40 minutos para a instrução programada de tiro.',
          status: 'Não Publicado',
          biPublicacao: '',
          tipoPunicao: '',
          quantidadeDias: '',
          nomeParticipante: 'PEDRO HENRIQUE ALMEIDA',
          pgParticipante: '1º Ten'
        }
      ];
      setPunicoes(mockInicial);
      localStorage.setItem('@SisGAdm:punicoes', JSON.stringify(mockInicial));
    }
  }, []);

  const salvarPunicoesLocalStorage = (lista: Punicao[]) => {
    setPunicoes(lista);
    localStorage.setItem('@SisGAdm:punicoes', JSON.stringify(lista));
  };

  const handleNomeMilitarChange = (val: string) => {
    setNomeMilitarBusca(val);
    const encontrado = militaresMock.find(m => 
      m.nome.toLowerCase() === val.trim().toLowerCase() ||
      `${m.posto} ${m.nome}`.toLowerCase() === val.trim().toLowerCase()
    );
    if (encontrado) {
      setPgMilitar(encontrado.posto);
      setNomeMilitarBusca(encontrado.nome.split(' ').pop() || encontrado.nome); // Nome de guerra (último nome)
    }
  };

  const handleNomeParticipanteChange = (val: string) => {
    setNomeParticipante(val);
    const encontrado = militaresMock.find(m => 
      m.nome.toLowerCase() === val.trim().toLowerCase() ||
      `${m.posto} ${m.nome}`.toLowerCase() === val.trim().toLowerCase()
    );
    if (encontrado) {
      setPgParticipante(encontrado.posto);
      setNomeParticipante(encontrado.nome);
    }
  };

  const handleOpenNewModal = () => {
    setIsEditMode(false);
    setSelectedPunicaoId(null);
    // Reset Form
    setNumProcesso('');
    setPgMilitar('');
    setNomeMilitarBusca('');
    setDataFATD(new Date().toISOString().split('T')[0]);
    setRelatoFato('');
    setStatus('Não Publicado');
    setBiPublicacao('');
    setTipoPunicao('');
    setQuantidadeDias('');
    setNomeParticipante('');
    setPgParticipante('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Punicao) => {
    setIsEditMode(true);
    setSelectedPunicaoId(p.id);
    // Preenche Form
    setNumProcesso(p.numProcesso);
    setPgMilitar(p.pgMilitar);
    setNomeMilitarBusca(p.nomeGuerra);
    setDataFATD(p.dataFATD);
    setRelatoFato(p.relatoFato);
    setStatus(p.status);
    setBiPublicacao(p.biPublicacao);
    setTipoPunicao(p.tipoPunicao);
    setQuantidadeDias(p.quantidadeDias);
    setNomeParticipante(p.nomeParticipante || '');
    setPgParticipante(p.pgParticipante || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Se preencheu BI e Tipo de Punição, define automaticamente como Publicado
    let statusFinal = status;
    if (biPublicacao.trim() !== '' && tipoPunicao !== '') {
      statusFinal = 'Publicado em BI';
    }

    if (isEditMode && selectedPunicaoId) {
      const listaAtualizada = punicoes.map(p => {
        if (p.id === selectedPunicaoId) {
          return {
            ...p,
            numProcesso,
            pgMilitar,
            nomeGuerra: nomeMilitarBusca.toUpperCase(),
            dataFATD,
            relatoFato,
            status: statusFinal,
            biPublicacao,
            tipoPunicao,
            quantidadeDias,
            nomeParticipante,
            pgParticipante
          };
        }
        return p;
      });
      salvarPunicoesLocalStorage(listaAtualizada);
    } else {
      const novaPunicao: Punicao = {
        id: Date.now().toString(),
        numProcesso,
        pgMilitar,
        nomeGuerra: nomeMilitarBusca.toUpperCase(),
        dataFATD,
        relatoFato,
        status: statusFinal,
        biPublicacao,
        tipoPunicao,
        quantidadeDias,
        nomeParticipante: nomeParticipante || 'Não informado',
        pgParticipante: pgParticipante || ''
      };
      salvarPunicoesLocalStorage([...punicoes, novaPunicao]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Deseja realmente excluir esta punição do registro?')) {
      const listaFiltrada = punicoes.filter(p => p.id !== id);
      salvarPunicoesLocalStorage(listaFiltrada);
    }
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

  // Renderiza os detalhes da linha ao clicar na tabela
  const renderExpandedRow = (row: Punicao) => (
    <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 bg-gray-50 rounded-lg border border-gray-200 shadow-inner">
      <div className="md:col-span-1 border-r border-gray-200 pr-4 space-y-4">
        <div>
          <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Militar Participante (Quem reportou)
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
            variant={row.status === 'Publicado em BI' ? 'outline' : 'default'}
            className="w-full flex justify-center items-center gap-1.5 text-xs py-2 mt-1"
          >
            <Edit2 size={13} />
            {row.status === 'Publicado em BI' ? 'Editar Dados da Publicação' : 'Publicar Punição (Lançar BI)'}
          </Button>
        </div>
      </div>
      
      <div className="md:col-span-2 pl-2">
        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          Relato Completo do Fato
        </span>
        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-4 rounded-lg border border-gray-200 leading-relaxed font-normal shadow-sm">
          {row.relatoFato}
        </p>
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
        <Button onClick={handleOpenNewModal} icon={<Plus size={16} />}>
          Lançar Punição Manual
        </Button>
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
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Número do Processo"
              placeholder="Ex: 001/2026"
              required
              value={numProcesso}
              onChange={(e) => setNumProcesso(e.target.value)}
            />
            <Input 
              label="Data da FATD"
              type="date"
              required
              value={dataFATD}
              onChange={(e) => setDataFATD(e.target.value)}
            />
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Militar Arrolado (Transgressor)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input 
                  label="Nome do Militar"
                  list="militar-lista-punicoes"
                  placeholder="Busque o militar arrolado..."
                  required
                  value={nomeMilitarBusca}
                  onChange={(e) => handleNomeMilitarChange(e.target.value)}
                />
                <datalist id="militar-lista-punicoes">
                  {militaresMock.map(m => (
                    <option key={`m-${m.id}`} value={`${m.posto} ${m.nome}`} />
                  ))}
                </datalist>
              </div>
              <Select 
                label="Posto/Graduação"
                required
                value={pgMilitar}
                onChange={(e) => setPgMilitar(e.target.value)}
              >
                <option value="">Selecione...</option>
                {postosGraduacoes.map(pg => (
                  <option key={`modal-pg-${pg}`} value={pg}>{pg}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Militar Participante (Quem reportou)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input 
                  label="Nome do Participante"
                  list="participante-lista-punicoes"
                  placeholder="Busque o militar participante..."
                  value={nomeParticipante}
                  onChange={(e) => handleNomeParticipanteChange(e.target.value)}
                />
                <datalist id="participante-lista-punicoes">
                  {militaresMock.map(m => (
                    <option key={`part-${m.id}`} value={`${m.posto} ${m.nome}`} />
                  ))}
                </datalist>
              </div>
              <Select 
                label="Posto/Graduação"
                value={pgParticipante}
                onChange={(e) => setPgParticipante(e.target.value)}
              >
                <option value="">Selecione...</option>
                {postosGraduacoes.map(pg => (
                  <option key={`modal-part-pg-${pg}`} value={pg}>{pg}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Relato do Fato</label>
            <textarea
              rows={3}
              required
              placeholder="Fato que originou a punição..."
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-militar-light focus:border-transparent transition-all"
              value={relatoFato}
              onChange={(e) => setRelatoFato(e.target.value)}
            />
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-4">
            <h3 className="text-sm font-semibold text-militar-main flex items-center gap-1.5">
              <Scale size={16} />
              Dados da Publicação em Boletim Interno (BI)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input 
                label="BI de Publicação"
                placeholder="Ex: BI nº 12/2026"
                value={biPublicacao}
                onChange={(e) => setBiPublicacao(e.target.value)}
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
                Preencher os campos de <strong>BI de Publicação</strong> e <strong>Tipo de Punição</strong> alterará automaticamente o status do registro para <strong>Publicado em BI</strong>.
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Registro
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
