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
import { api } from '../../services/api';
import { exportarListaMilitaresPDF } from '../../utils/exportarPDF';

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

/** Comentário de organização: Dados estáticos de situação funcional por militar (demonstração visual) */
function situacaoFuncionalStatic(militar: any) {
  return {
    funcao: 'Atirador',
    cargo: 'Soldado de 2ª Classe',
    companhia: militar.companhia || '—',
    pelotao: militar.pelotao || '—',
    setor: '2ª Seção de Combate',
    escala: 'Escala de Guarda',
    ultimaPromocao: '01/03/2026',
    situacaoFuncional: 'Ativo',
  };
}

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
  const [filtroHistoricoTipo, setFiltroHistoricoTipo] = useState('');

  // ── Estado de ações CRUD ──────────────────────────────────────────────────
  const [deletandoId, setDeletandoId] = useState<number | null>(null);
  const [deletando, setDeletando] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [editandoMilitar, setEditandoMilitar] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [editError, setEditError] = useState('');

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

  // Comentário de organização: Carrega companhias e militares ao montar o componente
  useEffect(() => {
    loadMilitares();
    api.get('/militares/companhias').then(r => setCompanhias(r.data)).catch(() => {});
  }, [loadMilitares]);

  // ─────────────────────────────────────────────────────────────────────────
  // Carrega histórico quando a aba for selecionada
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'historico') {
      setLoadingHistorico(true);
      api.get('/historico').then(r => setHistorico(r.data || [])).catch(() => setHistorico([])).finally(() => setLoadingHistorico(false));
    }
  }, [activeTab]);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers de filtros
  // ─────────────────────────────────────────────────────────────────────────
  const handleFiltrar = () => {
    loadMilitares({
      nome: filtroNome,
      postoGraduacao: filtroPostoGraduacao,
      situacao: filtroSituacao,
      companhia: filtroCompanhia,
      pelotao: filtroPelotao,
      tipoVinculo: filtroTipoVinculo,
    });
  };

  const handleLimpar = () => {
    setFiltroNome('');
    setFiltroPostoGraduacao('Todos');
    setFiltroSituacao('Todas');
    setFiltroCompanhia('Todas');
    setFiltroPelotao('Todos');
    setFiltroTipoVinculo('Todos');
    loadMilitares();
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
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || 'Não foi possível excluir. Tente novamente.');
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
  // Filtro local por situação (feito no frontend pois o campo é estático por ora)
  // ─────────────────────────────────────────────────────────────────────────
  const militaresFiltrados = filtroSituacao === 'Todas'
    ? militares
    : militares.filter(m => (m.situacao || 'Ativo') === filtroSituacao);

  // ─────────────────────────────────────────────────────────────────────────
  // Filtro do Histórico
  // ─────────────────────────────────────────────────────────────────────────
  const historicoFiltrado = historico.filter(h => {
    const militar = (h.militar_envolvido || '').toLowerCase();
    const tipo = (h.tipo_alteracao || '').toLowerCase();
    const matchMilitar = !filtroHistoricoMilitar || militar.includes(filtroHistoricoMilitar.toLowerCase());
    const matchTipo = !filtroHistoricoTipo || tipo.includes(filtroHistoricoTipo.toLowerCase());
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
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nome</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="filtro-nome"
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-militar-main bg-white transition-all"
              placeholder="Buscar por nome..."
              value={filtroNome}
              onChange={e => setFiltroNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFiltrar()}
            />
          </div>
        </div>

        {/* Filtro Posto/Graduação */}
        <div className="w-44">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Posto/Graduação</label>
          <select
            id="filtro-posto"
            value={filtroPostoGraduacao}
            onChange={e => setFiltroPostoGraduacao(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-militar-main bg-white transition-all"
          >
            {POSTOS_GRADUACOES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        {/* Filtro Situação */}
        <div className="w-40">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Situação</label>
          <select
            id="filtro-situacao"
            value={filtroSituacao}
            onChange={e => setFiltroSituacao(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-militar-main bg-white transition-all"
          >
            {SITUACOES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Ações */}
        <div className="flex gap-2 items-end">
          <button
            id="btn-mais-filtros"
            onClick={() => setMaisFiltrosAberto(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold rounded-xl border transition-all ${
              maisFiltrosAberto
                ? 'bg-militar-main text-white border-militar-main'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
            }`}
          >
            <Filter size={14} />
            Mais filtros
            {maisFiltrosAberto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={handleLimpar}
            className="px-3 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:border-gray-300 bg-white transition-all"
          >
            Limpar
          </button>
          <button
            id="btn-filtrar"
            onClick={handleFiltrar}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl bg-militar-main hover:bg-militar-dark text-white transition-all"
          >
            <Search size={14} />
            Filtrar
          </button>
        </div>
      </div>

      {/* Painel de Mais Filtros */}
      {maisFiltrosAberto && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-wrap gap-4">
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
                </span>
                {/* Comentário de organização: Botão de exportação da listagem em PDF (todos os militares filtrados) */}
                <button
                  onClick={() => exportarListaMilitaresPDF(militaresFiltrados)}
                  disabled={militaresFiltrados.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-militar-main hover:bg-militar-dark border border-militar-main rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download size={14} />
                  Exportar PDF
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
                        {['POSTO/GRAD.', 'NOME DE GUERRA', 'IDENTIDADE MIL.', 'CPF', 'SUBUNIDADE', 'SITUAÇÃO', 'AÇÕES'].map(h => (
                          <th key={h} className="text-left py-3 px-3 text-[11px] font-bold text-militar-main uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {militaresFiltrados.map(row => (
                        <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                          <td className="py-3 px-3 font-medium uppercase text-gray-700">{row.posto}</td>
                          <td className="py-3 px-3">
                            {/* Comentário de organização: Nome clicável navega para o perfil completo */}
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
                              {/* Ver perfil */}
                              <button
                                title="Ver perfil"
                                onClick={() => navigate(`/sgte/militares/${row.id}`)}
                                className="p-1.5 hover:text-militar-main transition-colors border border-gray-200 rounded-lg hover:border-militar-main/30"
                              >
                                <Eye size={14} />
                              </button>
                              {/* Editar */}
                              <button
                                title="Editar"
                                onClick={() => handleAbrirEdicao(row)}
                                className="p-1.5 hover:text-militar-main transition-colors border border-gray-200 rounded-lg hover:border-militar-main/30"
                              >
                                <Edit2 size={14} />
                              </button>
                              {/* Excluir */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {militaresFiltrados.map(m => (
                    <div key={m.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      {/* Header card verde */}
                      <div className="bg-gradient-to-r from-militar-dark to-militar-main px-4 py-3 flex items-center justify-between">
                        <span className="text-white text-xs font-bold uppercase tracking-wider">{m.posto}</span>
                        <SituacaoBadge situacao={m.situacao} />
                      </div>
                      <div className="p-4 space-y-3">
                        {/* Nome + avatar */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-militar-main/10 flex items-center justify-center flex-shrink-0">
                            <User size={18} className="text-militar-main" />
                          </div>
                          <div>
                            <button
                              onClick={() => navigate(`/sgte/militares/${m.id}`)}
                              className="font-bold text-gray-900 hover:text-militar-main transition-colors text-left leading-tight"
                            >
                              {m.nomeGuerra || m.nome}
                            </button>
                            <p className="text-xs text-gray-500">{m.tipoVinculo || '—'}</p>
                          </div>
                        </div>
                        {/* Dados pessoais */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">CPF</p>
                            <p className="font-semibold text-gray-700 mt-0.5">{m.cpf || '—'}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Identidade</p>
                            <p className="font-semibold text-gray-700 mt-0.5">{m.identidade || '—'}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Companhia</p>
                            <p className="font-semibold text-gray-700 mt-0.5">{m.companhia || '—'}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Pelotão</p>
                            <p className="font-semibold text-gray-700 mt-0.5">{m.pelotao || '—'}</p>
                          </div>
                        </div>
                        {/* Ações */}
                        <div className="flex gap-2 pt-1 border-t border-gray-100">
                          <button onClick={() => navigate(`/sgte/militares/${m.id}`)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-militar-main hover:bg-militar-main/5 rounded-lg transition-colors">
                            <Eye size={12} /> Ver Perfil
                          </button>
                          <button onClick={() => handleAbrirEdicao(m)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">
                            <Edit2 size={12} /> Editar
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
              <StaticDataWarning />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                {militaresFiltrados.map(m => {
                  const sf = situacaoFuncionalStatic(m);
                  return (
                    <div key={m.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <div className="bg-gradient-to-r from-militar-dark to-militar-main px-4 py-3">
                        <p className="text-white font-bold text-sm">{m.nomeGuerra || m.nome}</p>
                        <p className="text-white/70 text-xs">{m.posto} · {sf.companhia} · {sf.pelotao}</p>
                      </div>
                      <div className="p-4 grid grid-cols-2 gap-2">
                        {[
                          { label: 'Função Atual', value: sf.funcao },
                          { label: 'Cargo', value: sf.cargo },
                          { label: 'Setor', value: sf.setor },
                          { label: 'Escala', value: sf.escala },
                          { label: 'Última Promoção', value: sf.ultimaPromocao },
                          { label: 'Situação', value: sf.situacaoFuncional },
                        ].map(f => (
                          <div key={f.label} className="bg-gray-50 rounded-lg p-2">
                            <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">{f.label}</p>
                            <p className="font-semibold text-gray-700 mt-0.5 text-xs">{f.value}</p>
                          </div>
                        ))}
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
              <StaticDataWarning />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                {militaresFiltrados.map(m => (
                  <div key={m.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="bg-gradient-to-r from-militar-dark to-militar-main px-4 py-3">
                      <p className="text-white font-bold text-sm">{m.nomeGuerra || m.nome}</p>
                      <p className="text-white/70 text-xs">{m.posto}</p>
                    </div>
                    <div className="p-4 space-y-2">
                      {documentosStatic.map(doc => (
                        <div key={doc.nome} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText size={13} className="text-militar-main flex-shrink-0" />
                            <span className="text-xs font-semibold text-gray-700">{doc.nome}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            doc.status === 'Válido' || doc.status === 'Regular' || doc.status === 'Atualizado'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                      ))}
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                {militaresFiltrados.map(m => (
                  <div key={m.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="bg-gradient-to-r from-militar-dark to-militar-main px-4 py-3">
                      <p className="text-white font-bold text-sm">{m.nomeGuerra || m.nome}</p>
                      <p className="text-white/70 text-xs">{m.posto} · {dependentesStatic.length} dependente(s)</p>
                    </div>
                    <div className="p-4 space-y-2">
                      {dependentesStatic.map((dep, i) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                          <div className="w-8 h-8 rounded-lg bg-militar-main/10 flex items-center justify-center flex-shrink-0">
                            <Users size={14} className="text-militar-main" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800">{dep.nome}</p>
                            <p className="text-[10px] text-gray-500">{dep.parentesco} · Nasc: {dep.nascimento}</p>
                          </div>
                        </div>
                      ))}
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
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Militar</label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-militar-main bg-white"
                      placeholder="Buscar por militar..."
                      value={filtroHistoricoMilitar}
                      onChange={e => setFiltroHistoricoMilitar(e.target.value)}
                    />
                  </div>
                </div>
                <div className="w-44">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tipo de Alteração</label>
                  <input
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-militar-main bg-white"
                    placeholder="Ex: atualização..."
                    value={filtroHistoricoTipo}
                    onChange={e => setFiltroHistoricoTipo(e.target.value)}
                  />
                </div>
                {(filtroHistoricoMilitar || filtroHistoricoTipo) && (
                  <div className="flex items-end">
                    <button
                      onClick={() => { setFiltroHistoricoMilitar(''); setFiltroHistoricoTipo(''); }}
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
                  <p className="text-sm font-medium">Nenhum registro de alteração encontrado.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historicoFiltrado.map((h, i) => (
                    <div key={h.id || i} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100/50 transition-colors">
                      {/* Ícone de linha do tempo */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-7 h-7 rounded-full bg-militar-main/10 flex items-center justify-center">
                          <History size={13} className="text-militar-main" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Descrição da alteração */}
                        <p className="text-sm text-gray-800 leading-snug">
                          <span className="font-bold text-militar-main">
                            {h.data ? new Date(h.data).toLocaleString('pt-BR') : '—'}
                          </span>
                          {' — '}
                          <span className="font-semibold">{h.usuario_responsavel || 'Usuário'}</span>
                          {' alterou o campo '}
                          <span className="font-bold text-gray-900">"{h.campo_alterado || '—'}"</span>
                          {h.militar_envolvido ? <> do militar <span className="font-semibold">{h.militar_envolvido}</span></> : ''}
                          {h.valor_anterior && <> de <span className="italic text-gray-600">"{h.valor_anterior}"</span></>}
                          {h.valor_novo && <> para <span className="italic text-gray-900 font-semibold">"{h.valor_novo}"</span></>}.
                        </p>
                        {/* Tags de tipo e observação */}
                        <div className="flex items-center gap-2 mt-2">
                          {h.tipo_alteracao && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-militar-main/10 text-militar-main capitalize">
                              {h.tipo_alteracao}
                            </span>
                          )}
                          {h.observacao && (
                            <span className="text-xs text-gray-500 italic">{h.observacao}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

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
    </div>
  );
}
