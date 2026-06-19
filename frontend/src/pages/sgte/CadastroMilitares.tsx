import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import {
  Plus, Download, Filter, Eye, Edit2, Trash2,
  Search, X, ChevronDown, ChevronUp, User,
  FileText, Users, History, Loader2, AlertTriangle,
  Shield, Phone, MapPin
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { exportarListaMilitaresPDF, exportarLotePerfisPDF } from '../../utils/exportarPDF';
import toast from 'react-hot-toast';
import { api } from '../../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes: opções de filtro
// ─────────────────────────────────────────────────────────────────────────────

/** Comentário de organização: Postos/Graduações disponíveis para filtro */
const POSTOS_GRADUACOES = [
  'Todos', 'CEL', 'TC', 'MAJ', 'CAP', '1º TEN', '2º TEN', 'ASP',
  'ST', '1º SGT', '2º SGT', '3º SGT', 'CB', 'SD EP', 'SD EV'
];

/** Comentário de organização: Situações disponíveis para filtro */
const SITUACOES = ['Todas', 'Ativo', 'Baixado', 'Transferido', 'Reserva', 'Licença', 'Afastado'];

/** Comentário de organização: Tipos de vínculo disponíveis */
const TIPOS_VINCULO = ['Todos', 'Militar Temporário', 'Militar de Carreira'];

// ─────────────────────────────────────────────────────────────────────────────
// Dados estáticos para as abas sem integração real
// ─────────────────────────────────────────────────────────────────────────────



/** Comentário de organização: Documentos estáticos por militar (demonstração visual) */
const documentosStatic = [
  { nome: 'Identidade Militar', numero: '—', validade: '—', status: 'Válido' },
  { nome: 'CPF', numero: '—', validade: '—', status: 'Regular' },
  { nome: 'Certificado de Reservista', numero: '—', validade: '—', status: 'Válido' },
  { nome: 'CNH', numero: '—', validade: '12/2027', status: 'Válido' },
  { nome: 'Comprovante de Residência', numero: '—', validade: '—', status: 'Atualizado' },
];

/** Comentário de organização: Dependentes estáticos por militar (demonstração visual) */
const dependentesStatic = [
  { nome: 'Maria da Silva Santos', parentesco: 'Cônjuge', cpf: '***.***.***-**', nascimento: '15/04/1998' },
  { nome: 'João Pedro Santos', parentesco: 'Filho(a)', cpf: '***.***.***-**', nascimento: '03/09/2020' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Componente de aviso de dados estáticos
// ─────────────────────────────────────────────────────────────────────────────
function StaticDataWarning() {
  return (
    <p className="text-xs text-amber-700 mt-4 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl flex items-center gap-2">
      <AlertTriangle size={13} className="flex-shrink-0" />
      Dados de exemplo — integração com banco em desenvolvimento.
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente Principal
// ─────────────────────────────────────────────────────────────────────────────
export function CadastroMilitares() {
  const [activeTab, setActiveTab] = useState('lista');
  const navigate = useNavigate();

  // ── Estado de dados ───────────────────────────────────────────────────────
  const [militares, setMilitares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companhias, setCompanhias] = useState<{ id: number; companhia: string }[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  // ── Estado de filtros principais ──────────────────────────────────────────
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroPostoGraduacao, setFiltroPostoGraduacao] = useState('Todos');
  const [filtroSituacao, setFiltroSituacao] = useState('Todas');

  // ── Estado de "Mais Filtros" ──────────────────────────────────────────────
  const [maisFiltrosAberto, setMaisFiltrosAberto] = useState(false);
  const [filtroCompanhia, setFiltroCompanhia] = useState('Todas');
  const [filtroPelotao, setFiltroPelotao] = useState('Todos');
  const [filtroTipoVinculo, setFiltroTipoVinculo] = useState('Todos');

  // ── Filtros do Histórico ──────────────────────────────────────────────────
  const [filtroHistoricoMilitar, setFiltroHistoricoMilitar] = useState('');
  const [filtroHistoricoTipo, setFiltroHistoricoTipo] = useState('Todos');

  // ── Estado de ações CRUD ──────────────────────────────────────────────────
  const [logSelecionado, setLogSelecionado] = useState<any | null>(null);
  const [deletandoId, setDeletandoId] = useState<number | null>(null);
  const [deletando, setDeletando] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [editandoMilitar, setEditandoMilitar] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [editError, setEditError] = useState('');
  const [dependenteSelecionado, setDependenteSelecionado] = useState<any | null>(null);
  const [modalExportacaoAberto, setModalExportacaoAberto] = useState(false);
  const [exportandoVarios, setExportandoVarios] = useState(false);

  // Paginação centralizada
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reseta a página ao mudar os filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filtroNome, filtroCompanhia, filtroPelotao, filtroTipoVinculo, filtroSituacao]);

  // ─────────────────────────────────────────────────────────────────────────
  // Abas de navegação
  // ─────────────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'lista',      label: 'Lista de Militares',  icon: <Shield size={13} /> },
    { id: 'dados',      label: 'Dados Pessoais',       icon: <User size={13} /> },
    { id: 'situacao',   label: 'Situação Funcional',   icon: <FileText size={13} /> },
    { id: 'documentos', label: 'Documentos',           icon: <FileText size={13} /> },
    { id: 'dependentes',label: 'Dependentes',          icon: <Users size={13} /> },
    { id: 'historico',  label: 'Histórico',            icon: <History size={13} /> },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // Carregamento de militares com filtros
  // ─────────────────────────────────────────────────────────────────────────
  const loadMilitares = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (params?.nome)            query.set('nome', params.nome);
      if (params?.postoGraduacao && params.postoGraduacao !== 'Todos') query.set('postoGraduacao', params.postoGraduacao);
      if (params?.companhia && params.companhia !== 'Todas') query.set('companhia', params.companhia);
      if (params?.pelotao && params.pelotao !== 'Todos') query.set('pelotao', params.pelotao);
      if (params?.tipoVinculo && params.tipoVinculo !== 'Todos') query.set('tipoVinculo', params.tipoVinculo);

      const url = `/militares${query.toString() ? '?' + query.toString() : ''}`;
      const response = await api.get(url);
      setMilitares(response.data);
    } catch (error) {
      console.error('Erro ao buscar militares:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Comentário de organização: Busca dinâmica ao alterar os filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      loadMilitares({
        nome: filtroNome,
        postoGraduacao: filtroPostoGraduacao,
        companhia: filtroCompanhia,
        pelotao: filtroPelotao,
        tipoVinculo: filtroTipoVinculo,
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [filtroNome, filtroPostoGraduacao, filtroCompanhia, filtroPelotao, filtroTipoVinculo, loadMilitares]);

  // Carrega companhias apenas uma vez ao montar
  useEffect(() => {
    api.get('/militares/companhias').then(r => setCompanhias(r.data)).catch(() => {});
  }, []);

  // Comentário de organização: Estado com debounce para a busca por nome de militar no histórico
  const [filtroHistoricoMilitarDebounced, setFiltroHistoricoMilitarDebounced] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setFiltroHistoricoMilitarDebounced(filtroHistoricoMilitar);
    }, 450);
    return () => clearTimeout(handler);
  }, [filtroHistoricoMilitar]);

  // Comentário de organização: Carrega o histórico do backend apenas quando a aba histórico é ativada ou filtros mudam
  useEffect(() => {
    if (activeTab !== 'historico') return;
    setLoadingHistorico(true);
    const params = new URLSearchParams();
    if (filtroHistoricoMilitarDebounced) params.set('militar', filtroHistoricoMilitarDebounced);
    if (filtroHistoricoTipo && filtroHistoricoTipo !== 'Todos') params.set('tipo', filtroHistoricoTipo);
    api.get(`/historico${params.toString() ? '?' + params.toString() : ''}`)
      .then(r => setHistorico(r.data))
      .catch(() => setHistorico([]))
      .finally(() => setLoadingHistorico(false));
  }, [activeTab, filtroHistoricoMilitarDebounced, filtroHistoricoTipo]);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers de filtros
  // ─────────────────────────────────────────────────────────────────────────
  const handleLimpar = () => {
    setFiltroNome('');
    setFiltroPostoGraduacao('Todos');
    setFiltroSituacao('Todas');
    setFiltroCompanhia('Todas');
    setFiltroPelotao('Todos');
    setFiltroTipoVinculo('Todos');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD: Excluir militar
  // ─────────────────────────────────────────────────────────────────────────
  const handleConfirmarDelete = async () => {
    if (!deletandoId) return;
    setDeletando(true);
    setDeleteError('');
    try {
      await api.delete(`/militares/${deletandoId}`);
      setMilitares(prev => prev.filter(m => m.id !== deletandoId));
      setDeletandoId(null);
      toast.success('Militar excluído com sucesso!');
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error || 'Não foi possível excluir. Tente novamente.';
      setDeleteError(msg);
      toast.error(msg);
    } finally {
      setDeletando(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD: Editar militar
  // ─────────────────────────────────────────────────────────────────────────
  const handleAbrirEdicao = (militar: any) => {
    setEditandoMilitar(militar);
    setEditForm({
      nomeGuerra: militar.nomeGuerra || militar.nome || '',
      postoGraduacao: militar.posto || '',
      pelotao: militar.pelotao || '',
      tipoVinculo: militar.tipoVinculo || '',
    });
    setEditError('');
  };

  const handleSalvarEdicao = async () => {
    if (!editandoMilitar) return;
    setSalvandoEdicao(true);
    setEditError('');
    try {
      await api.put(`/militares/${editandoMilitar.id}`, editForm);
      // Atualiza local
      setMilitares(prev => prev.map(m => m.id === editandoMilitar.id ? {
        ...m,
        nomeGuerra: editForm.nomeGuerra,
        nome: editForm.nomeGuerra,
        posto: editForm.postoGraduacao,
        pelotao: editForm.pelotao,
        tipoVinculo: editForm.tipoVinculo,
      } : m));
      setEditandoMilitar(null);
    } catch (err: any) {
      setEditError(err.response?.data?.error || 'Não foi possível salvar. Tente novamente.');
    } finally {
      setSalvandoEdicao(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Helper: Badge de situação com cor
  // ─────────────────────────────────────────────────────────────────────────
  function SituacaoBadge({ situacao }: { situacao: string }) {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      'Ativo': 'success', 'Baixado': 'danger', 'Transferido': 'warning',
      'Reserva': 'default', 'Licença': 'warning', 'Afastado': 'warning',
    };
    return <Badge variant={map[situacao] || 'default'}>{situacao || 'Ativo'}</Badge>;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Seleção de múltiplos militares
  // ─────────────────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(militaresFiltrados.map(m => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectMilitar = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Filtro local por situação (feito no frontend pois o campo é estático por ora)
  // ─────────────────────────────────────────────────────────────────────────
  const militaresFiltrados = filtroSituacao === 'Todas'
    ? militares
    : militares.filter(m => (m.situacao || 'Ativo') === filtroSituacao);

  // ─────────────────────────────────────────────────────────────────────────
  // Paginação centralizada (Depende de militaresFiltrados)
  // ─────────────────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(militaresFiltrados.length / itemsPerPage);
  const paginatedMilitares = militaresFiltrados.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportarPerfisJuntos = () => {
    // Comentário de organização: Usamos a lista geral para abranger militares selecionados pelo novo dropdown no modal
    const listToExport = selectedIds.length > 0 ? militares.filter(m => selectedIds.includes(m.id)) : militaresFiltrados;
    setExportandoVarios(true);
    setModalExportacaoAberto(false);
    
    const promise = (async () => {
      const perfis = [];
      for (const m of listToExport) {
        const res = await api.get(`/militares/${m.id}`);
        perfis.push(res.data);
      }
      await exportarLotePerfisPDF(perfis);
    })();

    toast.promise(promise, {
      loading: 'Gerando PDF consolidado com os militares, aguarde...',
      success: 'PDF gerado com sucesso!',
      error: 'Houve um erro ao exportar os PDFs.'
    }).finally(() => {
      setExportandoVarios(false);
    });
  };

  const handleExportarPerfisSeparados = () => {
    const listToExport = selectedIds.length > 0 ? militares.filter(m => selectedIds.includes(m.id)) : militaresFiltrados;
    setExportandoVarios(true);
    setModalExportacaoAberto(false);

    const promise = (async () => {
      for (const m of listToExport) {
        const res = await api.get(`/militares/${m.id}`);
        const module = await import('../../utils/exportarPDF');
        await module.exportarPerfilPDF(res.data);
      }
    })();

    toast.promise(promise, {
      loading: 'Gerando arquivos PDF separados, aguarde...',
      success: 'PDFs gerados e baixados com sucesso!',
      error: 'Houve um erro ao exportar os PDFs.'
    }).finally(() => {
      setExportandoVarios(false);
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Comentário de organização: Filtro local — os dados já chegam filtrados do backend, isso é uma camada adicional
  const historicoFiltrado = historico.filter(h => {
    const militar = (h.militar_envolvido || '').toLowerCase();
    const tipo = (h.tipo_alteracao || '').toLowerCase();
    const matchMilitar = !filtroHistoricoMilitar || militar.includes(filtroHistoricoMilitar.toLowerCase());
    const matchTipo = !filtroHistoricoTipo || filtroHistoricoTipo === 'Todos' || tipo === filtroHistoricoTipo.toLowerCase();
    return matchMilitar && matchTipo;
  });


  // ─────────────────────────────────────────────────────────────────────────
  // Seção de filtros (reutilizada em todas as abas)
  // ─────────────────────────────────────────────────────────────────────────
  const renderFiltros = () => (
    <div className="space-y-4 mb-6">
      {/* Filtros principais */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Filtro Nome */}
        <div className="flex-1 min-w-[300px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Buscar por Nome</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="filtro-nome"
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-militar-main bg-white transition-all"
              placeholder="Digite o nome de guerra ou nome completo..."
              value={filtroNome}
              onChange={e => setFiltroNome(e.target.value)}
            />
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 items-end">
          <button
            id="btn-mais-filtros"
            onClick={() => setMaisFiltrosAberto(v => !v)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all ${
              maisFiltrosAberto
                ? 'bg-gray-100 text-gray-900 border-gray-200'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
            }`}
          >
            <Filter size={14} />
            Mais opções
            {maisFiltrosAberto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          
          {(filtroNome || filtroPostoGraduacao !== 'Todos' || filtroSituacao !== 'Todas' || filtroCompanhia !== 'Todas' || filtroPelotao !== 'Todos' || filtroTipoVinculo !== 'Todos') && (
            <button
              onClick={handleLimpar}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 bg-white transition-all"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Painel de Mais Filtros */}
      {maisFiltrosAberto && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-wrap gap-4">
          <div className="w-40">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Posto/Graduação</label>
            <select
              value={filtroPostoGraduacao}
              onChange={e => setFiltroPostoGraduacao(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-militar-main bg-white"
            >
              {POSTOS_GRADUACOES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Situação</label>
            <select
              value={filtroSituacao}
              onChange={e => setFiltroSituacao(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-militar-main bg-white"
            >
              {SITUACOES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="w-44">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Companhia</label>
            <select
              value={filtroCompanhia}
              onChange={e => setFiltroCompanhia(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-militar-main bg-white"
            >
              <option>Todas</option>
              {companhias.map(c => (
                <option key={c.id} value={c.companhia}>{c.companhia}</option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pelotão</label>
            <select
              value={filtroPelotao}
              onChange={e => setFiltroPelotao(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-militar-main bg-white"
            >
              {['Todos', '1º PEL', '2º PEL', '3º PEL', '4º PEL', 'Pct'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="w-48">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tipo de Vínculo</label>
            <select
              value={filtroTipoVinculo}
              onChange={e => setFiltroTipoVinculo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-militar-main bg-white"
            >
              {TIPOS_VINCULO.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cadastro de Militares</h1>
          <Breadcrumb items={[{ label: 'Gestão de Pessoas' }, { label: 'Cadastro de Militares' }]} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* ── Abas ────────────────────────────────────────────────────────── */}
        <div className="flex px-6 border-b border-gray-200 gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 py-4 px-2 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-militar-main text-militar-main'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}

          <div className="ml-auto py-2 flex gap-2 items-center flex-shrink-0">
            <Button onClick={() => navigate('/sgte/cadastro-militares/novo')} icon={<Plus size={16} />} size="sm">
              Novo Militar
            </Button>
          </div>
        </div>

        {/* ── Conteúdo das Abas ────────────────────────────────────────────── */}
        <div className="p-6">

          {/* ====== ABA: LISTA DE MILITARES ====== */}
          {activeTab === 'lista' && (
            <div>
              {renderFiltros()}

              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">
                  Total de <strong className="text-gray-900">{militaresFiltrados.length}</strong> militares encontrados
                  {selectedIds.length > 0 && (
                    <span className="ml-2 pl-2 border-l border-gray-300 text-militar-main font-semibold">
                      {selectedIds.length} selecionado(s)
                    </span>
                  )}
                </span>
                {/* Comentário de organização: Botão de exportação da listagem em PDF com nova indicação */}
                <button
                  onClick={() => setModalExportacaoAberto(true)}
                  disabled={militaresFiltrados.length === 0 || exportandoVarios}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-militar-main hover:bg-militar-dark border border-militar-main rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download size={14} />
                  Exportar
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm">Carregando militares...</span>
                </div>
              ) : militaresFiltrados.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Shield size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Nenhum militar encontrado com os filtros aplicados.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-100">
                        <th className="py-3 px-3 w-10 text-center">
                          <input 
                            type="checkbox" 
                            onChange={toggleSelectAll} 
                            checked={selectedIds.length === militaresFiltrados.length && militaresFiltrados.length > 0} 
                            className="w-4 h-4 rounded border-gray-300 text-militar-main focus:ring-militar-main cursor-pointer" 
                          />
                        </th>
                        {['POSTO/GRAD.', 'NOME DE GUERRA', 'IDENTIDADE MIL.', 'CPF', 'SUBUNIDADE', 'SITUAÇÃO', 'AÇÕES'].map(h => (
                          <th key={h} className="text-left py-3 px-3 text-[11px] font-bold text-militar-main uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedMilitares.map(row => (
                        <tr key={row.id} className={`border-b border-gray-50 hover:bg-gray-50/70 transition-colors ${selectedIds.includes(row.id) ? 'bg-militar-main/5' : ''}`}>
                          <td className="py-3 px-3 text-center">
                            <input 
                              type="checkbox" 
                              checked={selectedIds.includes(row.id)} 
                              onChange={() => toggleSelectMilitar(row.id)} 
                              className="w-4 h-4 rounded border-gray-300 text-militar-main focus:ring-militar-main cursor-pointer" 
                            />
                          </td>
                          <td className="py-3 px-3 font-medium uppercase text-gray-700">{row.posto}</td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => navigate(`/sgte/militares/${row.id}`)}
                              className="text-militar-main font-semibold hover:underline text-left"
                            >
                              {row.nomeGuerra || row.nome}
                            </button>
                          </td>
                          <td className="py-3 px-3 text-gray-600">{row.identidade || '—'}</td>
                          <td className="py-3 px-3 text-gray-600">{row.cpf || '—'}</td>
                          <td className="py-3 px-3 text-gray-600">{row.subunidade || row.companhia || '—'}</td>
                          <td className="py-3 px-3"><SituacaoBadge situacao={row.situacao} /></td>
                          <td className="py-3 px-3">
                            <div className="flex gap-1.5 text-gray-400">
                              <button
                                title="Ver perfil"
                                onClick={() => navigate(`/sgte/militares/${row.id}`)}
                                className="p-1.5 hover:text-militar-main transition-colors border border-gray-200 rounded-lg hover:border-militar-main/30"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                title="Editar"
                                onClick={() => navigate(`/sgte/cadastro-militares/editar/${row.id}`)}
                                className="p-1.5 hover:text-militar-main transition-colors border border-gray-200 rounded-lg hover:border-militar-main/30"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                title="Excluir"
                                onClick={() => { setDeletandoId(row.id); setDeleteError(''); }}
                                className="p-1.5 hover:text-red-600 transition-colors border border-gray-200 rounded-lg hover:border-red-200"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ====== ABA: DADOS PESSOAIS ====== */}
          {activeTab === 'dados' && (
            <div>
              {renderFiltros()}
              <p className="text-sm text-gray-500 mb-4">
                {militaresFiltrados.length} militar(es) exibido(s)
              </p>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {paginatedMilitares.map(m => (
                    <div key={m.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col md:flex-row">
                      {/* Comentário de organização: Coluna da foto — exibe imagem ou silhueta */}
                      <div className="md:w-48 bg-gray-100 flex-shrink-0 relative flex flex-col">
                        {m.fotoUrl ? (
                          <img
                            src={m.fotoUrl}
                            alt={m.nome}
                            className="w-full h-full object-cover min-h-[160px] md:min-h-full"
                            onError={(e) => {
                              // Comentário de organização: Fallback visual quando a URL da foto é inválida ou inacessível
                              (e.target as HTMLImageElement).style.display = 'none';
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                const placeholder = document.createElement('div');
                                placeholder.className = 'w-full min-h-[160px] md:min-h-full flex items-center justify-center bg-gray-200 text-gray-400';
                                placeholder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
                                parent.appendChild(placeholder);
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full min-h-[160px] md:min-h-full flex items-center justify-center bg-gray-200 text-gray-400">
                            <User size={48} />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-militar-dark to-militar-main px-2 py-0.5 rounded shadow-sm">
                          <span className="text-white text-xs font-bold uppercase tracking-wider">{m.posto}</span>
                        </div>
                      </div>
                      
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <button
                              onClick={() => navigate(`/sgte/militares/${m.id}`)}
                              className="text-xl font-bold text-gray-900 hover:text-militar-main transition-colors text-left leading-tight"
                            >
                              {m.nomeGuerra || m.nome}
                            </button>
                            <p className="text-sm text-gray-500 mt-1">{m.nome} · {m.tipoVinculo || '—'}</p>
                          </div>
                          <SituacaoBadge situacao={m.situacao} />
                        </div>
                        
                        {/* Comentário de organização: Grade com dados militares mais usados no dia a dia
                            Substituiu os dados civis (Nome Pai, Nome Mãe, Religião, Altura, etc.) pelos
                            campos operacionais: IDT Militar, Nome de Guerra, Prec CP, Nº Campo Básico,
                            Nº EBCA, Tipo de Vínculo, Data de Praça e Companhia. */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4 flex-1">
                          {[
                            { label: 'IDT Militar',     value: m.identidade || m.idtMilitar },
                            { label: 'Nome de Guerra',  value: m.nomeGuerra },
                            { label: 'Prec CP',         value: m.precCP },
                            { label: 'Nº Campo Básico', value: m.numeroCampoBasico },
                            { label: 'Nº EBCA',         value: m.numeroEbca },
                            { label: 'Tipo Vínculo',    value: m.tipoVinculo },
                            { label: 'Data de Praça',   value: m.dataPraca ? new Date(m.dataPraca).toLocaleDateString('pt-BR') : '—' },
                            { label: 'Companhia',       value: m.companhia },
                          ].map(f => (
                            <div key={f.label} className="bg-gray-50 rounded-lg p-2">
                              <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">{f.label}</p>
                              <p className="font-semibold text-gray-700 mt-0.5">{f.value || '—'}</p>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-gray-100 mt-auto justify-end">
                          <button onClick={() => navigate(`/sgte/militares/${m.id}`)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-militar-main bg-militar-main/5 hover:bg-militar-main/10 rounded-xl transition-colors">
                            <Eye size={14} /> Ver Perfil
                          </button>
                          <button onClick={() => navigate(`/sgte/cadastro-militares/editar/${m.id}`)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200">
                            <Edit2 size={14} /> Editar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ====== ABA: SITUAÇÃO FUNCIONAL ====== */}
          {activeTab === 'situacao' && (
            <div>
              {renderFiltros()}
              <div className="grid grid-cols-1 gap-4 mt-4">
                {paginatedMilitares.map(m => {
                  return (
                    <div key={m.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col md:flex-row">
                      <div className="md:w-40 bg-gray-100 flex-shrink-0 relative flex flex-col">
                        {m.fotoUrl ? (
                          <img src={m.fotoUrl} alt={m.nome} className="w-full h-full object-cover min-h-[160px] md:min-h-full" />
                        ) : (
                          <div className="w-full h-full min-h-[160px] md:min-h-full flex items-center justify-center bg-gray-200 text-gray-400">
                            <User size={40} />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-militar-dark to-militar-main px-2 py-0.5 rounded shadow-sm">
                          <span className="text-white text-xs font-bold uppercase tracking-wider">{m.posto}</span>
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <button onClick={() => navigate(`/sgte/militares/${m.id}`)} className="text-xl font-bold text-gray-900 hover:text-militar-main transition-colors text-left leading-tight">
                              {m.nomeGuerra || m.nome}
                            </button>
                            <p className="text-sm text-gray-500 mt-1">{m.companhia || 'Sem Cia'} · {m.pelotao || 'Sem Pel'}</p>
                          </div>
                          <SituacaoBadge situacao={m.situacao} />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          {[
                            { label: 'Posto/Grad (Cargo)', value: m.posto },
                            { label: 'Situação', value: m.situacao || 'Ativo' },
                            { label: 'Função Principal', value: m.funcoesEfetivo?.length > 0 ? m.funcoesEfetivo.map((f: any) => f.funcao).join(', ') : 'Sem função' },
                            { label: 'Seu Substituto', value: m.funcoesEfetivo?.filter((f: any) => f.substituto).map((f: any) => f.substituto).join(', ') || 'Nenhum' },
                            { label: 'É Substituto De', value: m.funcoesSubstituto?.length > 0 ? m.funcoesSubstituto.map((f: any) => f.efetivo).join(', ') : '—' },
                            { label: 'Status da Função', value: m.funcoesEfetivo?.some((f: any) => f.ativa) ? 'Ativa' : (m.funcoesEfetivo?.length > 0 ? 'Inativa' : '—') },
                          ].map(f => (
                            <div key={f.label} className="bg-gray-50 rounded-lg p-2">
                              <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">{f.label}</p>
                              <p className="font-semibold text-gray-700 mt-0.5">{f.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ====== ABA: DOCUMENTOS ====== */}
          {activeTab === 'documentos' && (
            <div>
              {renderFiltros()}
              <div className="grid grid-cols-1 gap-4 mt-4">
                {paginatedMilitares.map(m => (
                  <div key={m.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col md:flex-row">
                    <div className="md:w-40 bg-gray-100 flex-shrink-0 relative flex flex-col">
                      {m.fotoUrl ? (
                        <img src={m.fotoUrl} alt={m.nome} className="w-full h-full object-cover min-h-[160px] md:min-h-full" />
                      ) : (
                        <div className="w-full h-full min-h-[160px] md:min-h-full flex items-center justify-center bg-gray-200 text-gray-400">
                          <User size={40} />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-militar-dark to-militar-main px-2 py-0.5 rounded shadow-sm">
                        <span className="text-white text-xs font-bold uppercase tracking-wider">{m.posto}</span>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <button onClick={() => navigate(`/sgte/militares/${m.id}`)} className="text-xl font-bold text-gray-900 hover:text-militar-main transition-colors text-left leading-tight">
                            {m.nomeGuerra || m.nome}
                          </button>
                        </div>
                        <SituacaoBadge situacao={m.situacao} />
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
                        {[
                          { label: 'Identidade Militar', value: m.identidade },
                          { label: 'CPF', value: m.cpf },
                          { label: 'Identidade Civil', value: m.idtCivil },
                          { label: 'CNH Categoria', value: m.cnh },
                        ].map(doc => (
                          <div key={doc.label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <div className="flex items-center gap-2 mb-1.5">
                              <FileText size={13} className="text-militar-main" />
                              <p className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">{doc.label}</p>
                            </div>
                            <p className="font-semibold text-gray-800">{doc.value || 'Não informado'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ====== ABA: DEPENDENTES ====== */}
          {activeTab === 'dependentes' && (
            <div>
              {renderFiltros()}
              <StaticDataWarning />
              <div className="grid grid-cols-1 gap-4 mt-4">
                {paginatedMilitares.map(m => (
                  <div key={m.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col md:flex-row">
                    <div className="md:w-40 bg-gray-100 flex-shrink-0 relative flex flex-col">
                      {m.fotoUrl ? (
                        <img src={m.fotoUrl} alt={m.nome} className="w-full h-full object-cover min-h-[160px] md:min-h-full" />
                      ) : (
                        <div className="w-full h-full min-h-[160px] md:min-h-full flex items-center justify-center bg-gray-200 text-gray-400">
                          <User size={40} />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-militar-dark to-militar-main px-2 py-0.5 rounded shadow-sm">
                        <span className="text-white text-xs font-bold uppercase tracking-wider">{m.posto}</span>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <button onClick={() => navigate(`/sgte/militares/${m.id}`)} className="text-xl font-bold text-gray-900 hover:text-militar-main transition-colors text-left leading-tight">
                            {m.nomeGuerra || m.nome}
                          </button>
                          <p className="text-sm text-gray-500 mt-1">{dependentesStatic.length} dependente(s) cadastrado(s)</p>
                        </div>
                        <SituacaoBadge situacao={m.situacao} />
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {dependentesStatic.map((dep, i) => (
                          <button 
                            key={i} 
                            onClick={() => setDependenteSelecionado(dep)}
                            className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl border border-gray-200 text-left min-w-[200px]"
                          >
                            <div className="w-10 h-10 rounded-lg bg-militar-main/10 flex items-center justify-center flex-shrink-0">
                              <Users size={18} className="text-militar-main" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800">{dep.nome}</p>
                              <p className="text-[11px] text-gray-500">{dep.parentesco} · Nasc: {dep.nascimento}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ====== ABA: HISTÓRICO ====== */}
          {activeTab === 'historico' && (
            <div>
              {/* Filtros do histórico */}
              <div className="flex flex-wrap gap-3 mb-5">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Buscar por Militar</label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-militar-main bg-white"
                      placeholder="Nome de guerra ou nome completo..."
                      value={filtroHistoricoMilitar}
                      onChange={e => setFiltroHistoricoMilitar(e.target.value)}
                    />
                  </div>
                </div>
                <div className="w-48">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tipo de Ação</label>
                  <select
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-militar-main bg-white"
                    value={filtroHistoricoTipo}
                    onChange={e => setFiltroHistoricoTipo(e.target.value)}
                  >
                    <option value="Todos">Todas as ações</option>
                    <option value="Criação">Criação</option>
                    <option value="Atualização">Atualização</option>
                    <option value="Exclusão">Exclusão</option>
                  </select>
                </div>
                {(filtroHistoricoMilitar || (filtroHistoricoTipo && filtroHistoricoTipo !== 'Todos')) && (
                  <div className="flex items-end">
                    <button
                      onClick={() => { setFiltroHistoricoMilitar(''); setFiltroHistoricoTipo('Todos'); }}
                      className="flex items-center gap-1 px-3 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                    >
                      <X size={14} /> Limpar
                    </button>
                  </div>
                )}
              </div>

              {loadingHistorico ? (
                <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
              ) : historicoFiltrado.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <History size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Nenhum registro encontrado.</p>
                  <p className="text-xs mt-1">As ações realizadas nos militares aparecerão aqui.</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold text-xs">
                          <th className="p-4 whitespace-nowrap">Data / Hora</th>
                          <th className="p-4 whitespace-nowrap">Ação</th>
                          <th className="p-4">Militar Envolvido</th>
                          <th className="p-4">Detalhes</th>
                          <th className="p-4">Responsável</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {historicoFiltrado.map((h, i) => {
                          const tipoCfg: Record<string, { bg: string; text: string; label: string }> = {
                            'Criação':    { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Criação' },
                            'Atualização': { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Atualização' },
                            'Exclusão':    { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Exclusão' },
                          };
                          const cfg = tipoCfg[h.tipo_alteracao] || { bg: 'bg-gray-100', text: 'text-gray-600', label: h.tipo_alteracao };
                          
                          return (
                            <tr
                              key={h.id || i}
                              onClick={() => setLogSelecionado(h)}
                              className="hover:bg-gray-50/50 cursor-pointer transition-colors group"
                            >
                              <td className="p-4 text-xs font-medium text-gray-500 whitespace-nowrap group-hover:text-militar-main transition-colors">
                                {h.data ? new Date(h.data).toLocaleString('pt-BR') : '—'}
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${cfg.bg} ${cfg.text}`}>
                                  {cfg.label}
                                </span>
                              </td>
                              <td className="p-4 font-semibold text-gray-800">
                                {h.militar_envolvido || '—'}
                              </td>
                              <td className="p-4 text-xs text-gray-600">
                                {h.tipo_alteracao === 'Atualização' ? (
                                  <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-medium line-clamp-1">
                                    Alterou: {h.campo_alteracao || 'Campos'}
                                  </span>
                                ) : h.tipo_alteracao === 'Criação' ? (
                                  <span className="text-green-700 font-medium">Novo registro</span>
                                ) : (
                                  <span className="text-red-700 font-medium">Registro removido</span>
                                )}
                              </td>
                              <td className="p-4 text-xs font-medium text-gray-500">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-600">
                                    {(typeof h.usuario_responsavel === 'object' ? h.usuario_responsavel.email?.[0] : h.usuario_responsavel?.[0]) || 'S'}
                                  </div>
                                  <span className="truncate max-w-[120px]">
                                    {typeof h.usuario_responsavel === 'object'
                                      ? (h.usuario_responsavel.email || JSON.stringify(h.usuario_responsavel))
                                      : h.usuario_responsavel || 'Sistema'}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PAGINAÇÃO ────────────────────────────────────────────── */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-white rounded-b-xl">
              <span className="text-sm text-gray-500">
                Página <span className="font-semibold">{currentPage}</span> de <span className="font-semibold">{totalPages}</span>
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  Anterior
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL DE DEPENDENTES (ESTÁTICO) ─────────────────────────────────── */}
      <Modal
        isOpen={dependenteSelecionado !== null}
        onClose={() => setDependenteSelecionado(null)}
        title="Detalhes do Dependente"
      >
        {dependenteSelecionado && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="w-16 h-16 rounded-full bg-militar-main/10 flex items-center justify-center">
                <Users size={32} className="text-militar-main" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{dependenteSelecionado.nome}</h3>
                <p className="text-sm font-medium text-gray-500">{dependenteSelecionado.parentesco}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs font-bold text-gray-400 uppercase">Data de Nascimento</p>
                <p className="text-sm font-semibold text-gray-800 mt-1">{dependenteSelecionado.nascimento}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs font-bold text-gray-400 uppercase">Idade Atual</p>
                <p className="text-sm font-semibold text-gray-800 mt-1">10 anos (Estático)</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3 col-span-2">
                <p className="text-xs font-bold text-gray-400 uppercase">Documentos Cadastrados</p>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-xs font-semibold text-gray-700">Certidão de Nascimento</span>
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Anexado</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-xs font-semibold text-gray-700">CPF do Dependente</span>
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Pendente</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setDependenteSelecionado(null)}>Fechar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL DE CONFIRMAÇÃO DE EXCLUSÃO ────────────────────────────────── */}
      <Modal
        isOpen={deletandoId !== null}
        onClose={() => !deletando && setDeletandoId(null)}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <AlertTriangle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800 font-medium">
              Tem certeza que deseja excluir este militar? Esta ação removerá permanentemente todos os dados relacionados (dados civis, endereço, contato, redes sociais e especialidades). Essa ação <strong>não pode ser desfeita</strong>.
            </p>
          </div>
          {deleteError && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              ⚠️ {deleteError}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletandoId(null)} disabled={deletando}>Cancelar</Button>
            <button
              onClick={handleConfirmarDelete}
              disabled={deletando}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              <Trash2 size={14} />
              {deletando ? 'Excluindo...' : 'Sim, Excluir'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL OPÇÕES DE EXPORTAÇÃO PDF ────────────────────────────────── */}
      <Modal
        isOpen={modalExportacaoAberto}
        onClose={() => !exportandoVarios && setModalExportacaoAberto(false)}
        title="Exportar Perfis"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Você está prestes a exportar <strong className="text-militar-main text-base bg-militar-main/10 px-2 py-0.5 rounded-full">{selectedIds.length > 0 ? selectedIds.length : militaresFiltrados.length}</strong> militar(es). Como deseja exportá-los?
          </p>

          {selectedIds.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto mb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Militares Selecionados</p>
              </div>
              <ul className="space-y-1 mb-3">
                {militares.filter(m => selectedIds.includes(m.id)).map(m => (
                  <li key={m.id} className="flex justify-between items-center text-sm text-gray-700 bg-white p-1.5 rounded border border-gray-100">
                    <span className="truncate pr-2">{m.posto} {m.nomeGuerra || m.nome}</span>
                    <button 
                      onClick={() => toggleSelectMilitar(m.id)}
                      className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                      title="Remover da exportação"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>

              {/* Comentário de organização: Input dropdown para selecionar outros militares no próprio modal */}
              <div className="mt-2 pt-2 border-t border-gray-200">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Adicionar mais militares à exportação:</label>
                <select 
                  className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-militar-main bg-white"
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    if (id && !selectedIds.includes(id)) {
                      toggleSelectMilitar(id);
                    }
                    e.target.value = "";
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Selecione um militar para adicionar...</option>
                  {militares.filter(m => !selectedIds.includes(m.id)).map(m => (
                    <option key={m.id} value={m.id}>{m.posto} {m.nomeGuerra || m.nome}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-3">
            <button
              disabled={exportandoVarios || (selectedIds.length === 0 && militaresFiltrados.length === 0)}
              onClick={handleExportarPerfisJuntos}
              className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 hover:border-militar-main hover:bg-militar-main/5 rounded-xl transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center group-hover:border-militar-main/30">
                <FileText size={20} className="text-gray-500 group-hover:text-militar-main transition-colors" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 group-hover:text-militar-main">Juntar todos em um único PDF</p>
                <p className="text-xs text-gray-500">Gera um PDF consolidado com o perfil de todos os selecionados (um por página).</p>
              </div>
            </button>
            
            <button
              disabled={exportandoVarios || (selectedIds.length === 0 && militaresFiltrados.length === 0)}
              onClick={handleExportarPerfisSeparados}
              className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 hover:border-militar-main hover:bg-militar-main/5 rounded-xl transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center group-hover:border-militar-main/30">
                <Users size={20} className="text-gray-500 group-hover:text-militar-main transition-colors" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800 group-hover:text-militar-main">Baixar arquivos separados</p>
                <p className="text-xs text-gray-500">Gera a ficha completa de cada militar separadamente (Vários PDFs).</p>
              </div>
              {exportandoVarios && <Loader2 size={16} className="animate-spin text-militar-main" />}
            </button>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setModalExportacaoAberto(false)} disabled={exportandoVarios}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL DE EDIÇÃO RÁPIDA ────────────────────────────────────────── */}
      <Modal
        isOpen={editandoMilitar !== null}
        onClose={() => !salvandoEdicao && setEditandoMilitar(null)}
        title={`Editar Militar — ${editandoMilitar?.nomeGuerra || editandoMilitar?.nome || ''}`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nome de Guerra</label>
              <input
                value={editForm.nomeGuerra || ''}
                onChange={e => setEditForm(f => ({ ...f, nomeGuerra: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-militar-main"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Posto/Graduação</label>
              <select
                value={editForm.postoGraduacao || ''}
                onChange={e => setEditForm(f => ({ ...f, postoGraduacao: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-militar-main bg-white"
              >
                {POSTOS_GRADUACOES.filter(p => p !== 'Todos').map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pelotão</label>
              <select
                value={editForm.pelotao || ''}
                onChange={e => setEditForm(f => ({ ...f, pelotao: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-militar-main bg-white"
              >
                {['', '1º PEL', '2º PEL', '3º PEL', '4º PEL', 'Pct'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tipo de Vínculo</label>
              <select
                value={editForm.tipoVinculo || ''}
                onChange={e => setEditForm(f => ({ ...f, tipoVinculo: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-militar-main bg-white"
              >
                {['', 'Militar Temporário', 'Militar de Carreira'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {editError && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              ⚠️ {editError}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditandoMilitar(null)} disabled={salvandoEdicao}>Cancelar</Button>
            <Button onClick={handleSalvarEdicao} disabled={salvandoEdicao}>
              {salvandoEdicao ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL DE DETALHES DO HISTÓRICO (DINÂMICO) ─────────────────────────────────── */}
      <Modal
        isOpen={logSelecionado !== null}
        onClose={() => setLogSelecionado(null)}
        title="Detalhes do Registro de Histórico"
      >
        {logSelecionado && (() => {
          const tipoCfg: Record<string, { bg: string; text: string; label: string }> = {
            'Criação':    { bg: 'bg-green-50 border-green-200',  text: 'text-green-700',  label: 'Criação' },
            'Atualização': { bg: 'bg-blue-50 border-blue-200',   text: 'text-blue-700',   label: 'Atualização' },
            'Exclusão':    { bg: 'bg-red-50 border-red-200',    text: 'text-red-700',    label: 'Exclusão' },
          };
          const cfg = tipoCfg[logSelecionado.tipo_alteracao] || { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700', label: logSelecionado.tipo_alteracao };
          
          // Comentário de organização: Parseia os campos alterados, valor anterior e valor novo se for do tipo 'Atualização'
          const parserCampos = (logSelecionado.campo_alteracao || '').split(',').map((c: string) => c.trim()).filter(Boolean);
          const parserOlds = (logSelecionado.valor_anterior || '').split('|').map((o: string) => o.trim()).filter(Boolean);
          const parserNews = (logSelecionado.valor_novo || '').split('|').map((n: string) => n.trim()).filter(Boolean);

          const alteracoesGrid = parserCampos.map((campo: string) => {
            // Busca o texto correspondente a esse campo nas strings
            const rawOld = parserOlds.find((o: string) => o.startsWith(`${campo}:`));
            const oldVal = rawOld ? rawOld.replace(`${campo}:`, '').trim() : '—';
            
            const rawNew = parserNews.find((n: string) => n.startsWith(`${campo}:`));
            const newVal = rawNew ? rawNew.replace(`${campo}:`, '').trim() : '—';

            return { campo, oldVal, newVal };
          });

          return (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-center justify-between ${cfg.bg}`}>
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border shadow-sm ${cfg.text}`}>
                    {cfg.label}
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mt-2">{logSelecionado.militar_envolvido || 'Militar não identificado'}</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-medium">Data / Hora</p>
                  <p className="text-sm font-semibold text-gray-700 mt-0.5">
                    {logSelecionado.data ? new Date(logSelecionado.data).toLocaleString('pt-BR') : '—'}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2.5">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Realizado por:</span>
                  <span className="font-semibold text-gray-700">
                    {typeof logSelecionado.usuario_responsavel === 'object'
                      ? (logSelecionado.usuario_responsavel.email || JSON.stringify(logSelecionado.usuario_responsavel))
                      : logSelecionado.usuario_responsavel || 'Sistema'}
                  </span>
                </div>
              </div>

              {logSelecionado.tipo_alteracao === 'Atualização' && alteracoesGrid.length > 0 ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
                        <th className="p-3">Campo Alterado</th>
                        <th className="p-3">Valor Anterior</th>
                        <th className="p-3">Novo Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {alteracoesGrid.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="p-3 font-semibold text-gray-800">{item.campo}</td>
                          <td className="p-3 text-red-600 line-through bg-red-50/20 italic">{item.oldVal}</td>
                          <td className="p-3 text-green-700 font-semibold bg-green-50/10">{item.newVal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : logSelecionado.tipo_alteracao === 'Exclusão' ? (
                <div className="p-4 bg-red-50 border border-red-100 text-red-800 rounded-xl text-xs flex flex-col gap-1.5">
                  <p className="font-bold">Informações da exclusão:</p>
                  <p className="leading-relaxed font-medium bg-white/70 p-2.5 rounded border border-red-200/50">
                    {logSelecionado.valor_anterior || 'Registro completo do militar foi excluído do sistema.'}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-green-50 border border-green-100 text-green-800 rounded-xl text-xs flex flex-col gap-1.5">
                  <p className="font-bold">Informações de criação:</p>
                  <p className="leading-relaxed font-medium bg-white/70 p-2.5 rounded border border-green-200/50">
                    Militar cadastrado no sistema com sucesso.
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-3">
                <Button variant="outline" onClick={() => setLogSelecionado(null)}>Fechar Detalhes</Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
