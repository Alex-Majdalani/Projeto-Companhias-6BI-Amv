import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Badge } from '../../components/ui/Badge';
import {
  ArrowLeft, User, Shield, MapPin,
  AlertTriangle, Target, Stethoscope,
  Loader2, Calendar, BookOpen, Star,
  Award, Heart, Phone, Users, Download
} from 'lucide-react';
import { api } from '../../services/api';
import { exportarPerfilPDF } from '../../utils/exportarPDF';

// Comentário de organização: Formata datas do formato ISO para DD/MM/AAAA
function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const clean = dateStr.split('T')[0];
  const [y, m, d] = clean.split('-');
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

// Comentário de organização: Formata altura numérica com vírgula
function formatAltura(altura: any): string {
  if (!altura && altura !== 0) return '—';
  return String(altura).replace('.', ',') + ' m';
}

// Comentário de organização: Calcula a idade a partir da data de nascimento
function calcularIdade(dataNascimento: string): string {
  if (!dataNascimento) return '—';
  const nascimento = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return idade >= 0 ? `${idade} anos` : '—';
}

// Comentário de organização: Campo de detalhe com label e valor, estilizado com verde militar
function DetailField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg border border-gray-100">
      <span className="text-[10px] font-bold text-militar-main uppercase tracking-widest">{label}</span>
      <span className="text-sm font-semibold text-gray-800 leading-tight">{value || '—'}</span>
    </div>
  );
}

// Comentário de organização: Seção com título em verde e borda decorativa
function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        {icon && <span className="text-militar-main">{icon}</span>}
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// Comentário de organização: Badge de punição com cor por tipo
function PunicaoBadge({ tipo }: { tipo: string }) {
  const recebida = tipo === 'Recebida';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
      recebida ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
    }`}>
      {recebida ? '▼ Recebida' : '▲ Aplicada'}
    </span>
  );
}

// Comentário de organização: Aviso de dados estáticos (seções em desenvolvimento)
function StaticDataWarning() {
  return (
    <p className="text-xs text-amber-700 mt-5 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl flex items-center gap-2">
      <AlertTriangle size={13} className="flex-shrink-0" />
      Dados de exemplo — integração com banco em desenvolvimento.
    </p>
  );
}

// Comentário de organização: Barra de progresso para notas
function ProgressBar({ label, value, max = 100, colorClass = "bg-militar-main" }: { label: string, value: number, max?: number, colorClass?: string }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs font-bold mb-1">
        <span className="text-gray-700 uppercase tracking-wider text-[10px]">{label}</span>
        <span className="text-gray-900">{value}</span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

// Comentário de organização: Mini Card de Estatística
function StatCard({ title, value, subtitle, trend }: { title: string, value: string | number, subtitle: string, trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{title}</span>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-black text-gray-800 leading-none">{value}</span>
        {trend === 'up' && <span className="text-xs font-bold text-green-600 bg-green-100 px-1.5 rounded mb-0.5">↑</span>}
        {trend === 'down' && <span className="text-xs font-bold text-red-600 bg-red-100 px-1.5 rounded mb-0.5">↓</span>}
      </div>
      <span className="text-xs font-medium text-gray-500 mt-1">{subtitle}</span>
    </div>
  );
}

export function PerfilMilitar() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('resumo');

  // Comentário de organização: Carrega os dados completos do perfil do militar via API
  useEffect(() => {
    async function loadPerfil() {
      try {
        const res = await api.get(`/militares/${id}`);
        setPerfil(res.data);
      } catch (err: any) {
        setError('Erro ao carregar perfil do militar.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadPerfil();
  }, [id]);

  // Comentário de organização: Definição das abas de navegação do perfil
  const tabs = [
    { id: 'resumo',   label: 'Resumo',          icon: <User size={13} /> },
    { id: 'militar',  label: 'Dados Militares',  icon: <Shield size={13} /> },
    { id: 'civil',    label: 'Dados Civis',      icon: <BookOpen size={13} /> },
    { id: 'contato',  label: 'Contato',          icon: <MapPin size={13} /> },
    { id: 'ferias',   label: 'Férias',           icon: <Calendar size={13} /> },
    { id: 'funcoes',  label: 'Funções CIA',      icon: <Star size={13} /> },
    { id: 'punicoes', label: 'Punições',         icon: <AlertTriangle size={13} /> },
    { id: 'saude',    label: 'Saúde',            icon: <Stethoscope size={13} /> },
    { id: 'taf',      label: 'TAF / Tiro',       icon: <Target size={13} /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-72 gap-3 text-gray-500">
        <Loader2 size={24} className="animate-spin text-militar-main" />
        <span className="text-sm font-medium">Carregando perfil do militar...</span>
      </div>
    );
  }

  if (error || !perfil) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-4">
        <AlertTriangle size={36} className="text-red-400" />
        <p className="text-sm font-medium text-gray-600">{error || 'Militar não encontrado.'}</p>
        <button onClick={() => navigate(-1)} className="text-sm font-semibold text-militar-main hover:underline flex items-center gap-1">
          <ArrowLeft size={14} /> Voltar à lista
        </button>
      </div>
    );
  }

  // Comentário de organização: Dados de exemplo para seções ainda sem integração real com o banco

  const tafStatic = [
    { id: 1, data: '15/01/2026', mencao: 'E', resultado: 'Aprovado', corrida: '11:48', flexao: 38, abdominal: 42 },
    { id: 2, data: '15/07/2025', mencao: 'MB', resultado: 'Aprovado', corrida: '12:10', flexao: 35, abdominal: 40 },
  ];
  const tiroStatic = [
    { id: 1, data: '20/02/2026', tipo: 'Fuzil 7.62mm', mencao: 'Excelente', obs: 'Destaque no estande' },
    { id: 2, data: '20/08/2025', tipo: 'Pistola 9mm', mencao: 'Bom', obs: '-' },
  ];

  // Comentário de organização: Nome de exibição principal — prioriza nome completo civil, com fallback para nome de guerra
  const nomeCompleto = perfil.dadosCivil?.nomeCompleto;
  const nomeGuerra = perfil.nomeGuerra;
  // Título principal: nome completo se disponível, senão nome de guerra
  const nomeTitulo = nomeCompleto || nomeGuerra || '—';
  // Subtítulo: exibe nome de guerra entre parênteses apenas se for diferente do nome principal exibido
  const mostrarNomeGuerra = nomeCompleto && nomeGuerra && nomeCompleto !== nomeGuerra;

  return (
    <div className="space-y-5 pb-12">

      {/* Breadcrumb + Botão Voltar + Botão Exportar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/sgte/cadastro-militares')}
          className="p-2 rounded-xl border border-gray-200 hover:bg-militar-main hover:text-white hover:border-militar-main transition-all text-gray-500 shadow-sm"
        >
          <ArrowLeft size={16} />
        </button>
        <Breadcrumb items={[
          { label: 'Gestão de Pessoas' },
          { label: 'Cadastro de Militares', to: '/sgte/cadastro-militares' },
          { label: nomeGuerra || 'Perfil' }
        ]} />

        {/* Comentário de organização: Botão Exportar — gera PDF real com todos os dados do perfil do militar */}
        <div className="ml-auto">
          <button
            id="btn-exportar-perfil"
            onClick={() => exportarPerfilPDF(perfil)}
            className="flex items-center gap-2 px-4 py-2 bg-militar-main hover:bg-militar-dark text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <Download size={15} />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* ====== HERO CARD ====== */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Banner verde */}
        <div className="h-32 bg-gradient-to-r from-militar-dark via-militar-main to-militar-light relative">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)' }}
          />
        </div>

        {/* Corpo do hero */}
        <div className="px-8 pb-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16">

            {/* FOTO — maior */}
            <div className="relative flex-shrink-0">
              <div className="w-36 h-36 md:w-52 md:h-52 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-gray-100">
                {perfil.dadosCivil?.fotoUrl ? (
                  <img src={perfil.dadosCivil.fotoUrl} alt="Foto do militar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 gap-1">
                    <User size={52} className="text-gray-400" />
                    <span className="text-[10px] text-gray-400 font-medium">Sem foto</span>
                  </div>
                )}
              </div>
              {/* Indicador de status ativo */}
              {perfil.situacao === 'Ativo' && (
                <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm ring-2 ring-green-100"></div>
              )}
            </div>

            {/* Info do lado direito: Posto - Nome de Guerra e Badges */}
            {/* Info do lado direito: Posto - Nome de Guerra e Badges */}
            <div className="flex flex-col items-start md:items-end pb-2 mt-4 md:mt-0">
              <div className="flex flex-wrap items-center gap-2 mb-3 md:justify-end">
                <Badge variant={
                  perfil.situacao === 'Ativo' ? 'success' :
                  (perfil.situacao === 'Baixado' || perfil.situacao === 'Afastado' ? 'danger' :
                  (perfil.situacao === 'Transferido' || perfil.situacao === 'Licença' ? 'warning' : 'default'))
                }>
                  {perfil.situacao || 'Ativo'}
                </Badge>
                {perfil.tipoVinculo && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1 rounded-full shadow-sm">
                    <Shield size={12} className="text-gray-400" />
                    {perfil.tipoVinculo}
                  </span>
                )}
                {perfil.turmaFormacao && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-militar-dark bg-green-50 border border-green-200 px-3 py-1 rounded-full shadow-sm">
                    <BookOpen size={12} className="text-militar-main" />
                    Turma {perfil.turmaFormacao}
                  </span>
                )}
              </div>
              
              <span className="text-lg md:text-xl font-bold text-gray-800 bg-gray-50/80 backdrop-blur px-4 py-1.5 rounded-xl border border-gray-200 shadow-sm uppercase">
                {perfil.postoGraduacao} - {perfil.nomeGuerra}
              </span>
            </div>
          </div>

          {/* NOME COMPLETO E CHIPS (Linha de baixo) */}
          <div className="mt-6">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
              {nomeTitulo}
            </h1>

              {/* Chips de info rápida */}
              <div className="flex flex-wrap gap-2 mt-3">
                {perfil.companhia && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                    <Shield size={11} className="text-militar-main" /> {perfil.companhia}
                  </span>
                )}
                {perfil.pelotao && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                    <Users size={11} className="text-militar-main" /> Pelotão: {perfil.pelotao}
                  </span>
                )}
                {perfil.idtMilitar && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                    <Award size={11} className="text-militar-main" /> IDT: {perfil.idtMilitar}
                  </span>
                )}
              </div>

              {/* Barra de métricas horizontais */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-base font-black text-red-700">
                    {perfil.dadosCivil?.tipoSanguineo || '—'}{' '}
                    <span className="text-sm">{perfil.dadosCivil?.fatorRh || ''}</span>
                  </p>
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mt-0.5">Tipo Sang.</p>
                </div>
                <div className="bg-militar-main/5 border border-militar-main/20 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-base font-black text-militar-main">
                    {calcularIdade(perfil.dadosCivil?.dataNascimento).replace(' anos', '')}
                  </p>
                  <p className="text-[10px] font-bold text-militar-main/60 uppercase tracking-wider mt-0.5">Anos</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-base font-black text-gray-700">
                    {formatAltura(perfil.dadosCivil?.altura)}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Altura</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-base font-black text-gray-700">
                    {formatDate(perfil.dataPraca)}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Dt. de Praça</p>
                </div>
              </div>
            </div>
          </div>


        {/* Abas de navegação */}
        <div className="border-t border-gray-100 flex overflow-x-auto bg-gray-50/50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all -mb-px ${
                activeTab === tab.id
                  ? 'border-militar-main text-militar-main bg-white'
                  : 'border-transparent text-gray-400 hover:text-gray-700 hover:bg-white/60'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ====== ABA: RESUMO ====== */}
      {activeTab === 'resumo' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Coluna esquerda: Dados principais */}
          <div className="lg:col-span-2 space-y-5">
            <Section title="Identificação Militar" icon={<Shield size={15} />}>
              {/* Comentário de organização: Campo "Período Obrigatório" removido conforme solicitação */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <DetailField label="Posto/Graduação" value={perfil.postoGraduacao} />
                <DetailField label="Nome de Guerra" value={perfil.nomeGuerra} />
                <DetailField label="IDT Militar" value={perfil.idtMilitar} />
                {/* Comentário de organização: Adicionando exibição de precCP no resumo */}
                <DetailField label="Prec CP" value={perfil.precCP} />
                <DetailField label="Tipo de Vínculo" value={perfil.tipoVinculo} />
                <DetailField label="Companhia" value={perfil.companhia} />
                <DetailField label="Pelotão" value={perfil.pelotao} />
                <DetailField label="Data de Praça" value={formatDate(perfil.dataPraca)} />
                <DetailField label="Turma de Formação" value={perfil.turmaFormacao} />
              </div>
            </Section>

            <Section title="Dados Pessoais" icon={<User size={15} />}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="col-span-2 md:col-span-3">
                  <DetailField label="Nome Completo" value={perfil.dadosCivil?.nomeCompleto} />
                </div>
                <DetailField label="Data de Nascimento" value={formatDate(perfil.dadosCivil?.dataNascimento)} />
                <DetailField label="Sexo" value={perfil.dadosCivil?.sexo} />
                <DetailField label="Estado Civil" value={perfil.dadosCivil?.estadoCivil} />
                <DetailField label="Idade" value={calcularIdade(perfil.dadosCivil?.dataNascimento)} />
                <DetailField label="CPF" value={perfil.dadosCivil?.cpf} />
                <DetailField label="Tipo Sanguíneo" value={perfil.dadosCivil?.tipoSanguineo} />
                <DetailField label="Fator RH" value={perfil.dadosCivil?.fatorRh} />
                <DetailField label="Altura" value={formatAltura(perfil.dadosCivil?.altura)} />
                <DetailField label="Escolaridade" value={perfil.dadosCivil?.escolaridade} />
                <DetailField label="Religião" value={perfil.dadosCivil?.religiao} />
              </div>
            </Section>
          </div>

          {/* Coluna direita: Contato + Redes */}
          <div className="space-y-5">
            <Section title="Contato" icon={<Phone size={15} />}>
              <div className="space-y-3">
                <DetailField label="Telefone" value={perfil.contato?.telefone} />
                <DetailField label="Emergência" value={perfil.contato?.telefoneEmergencia} />
                <DetailField label="Nome Emergência" value={perfil.contato?.nomeEmergencia} />
                <DetailField label="Grau Parentesco" value={perfil.contato?.grauParentesco} />
                <DetailField label="Reside com" value={perfil.contato?.coabitacao} />
              </div>
            </Section>

            <Section title="Redes Sociais" icon={<Star size={15} />}>
              <div className="space-y-3">
                <DetailField label="Instagram" value={perfil.redesSociais?.instagram} />
                <DetailField label="Facebook" value={perfil.redesSociais?.facebook} />
                <DetailField label="TikTok" value={perfil.redesSociais?.tiktok} />
                <DetailField label="Twitter / X" value={perfil.redesSociais?.twitter} />
                {perfil.redesSociais?.outras && <DetailField label="Outras" value={perfil.redesSociais.outras} />}
              </div>
            </Section>
          </div>
        </div>
      )}

      {/* ====== ABA: DADOS MILITARES ====== */}
      {activeTab === 'militar' && (
        <div className="grid grid-cols-1 gap-5">
          <Section title="Identificação Militar" icon={<Shield size={15} />}>
            {/* Comentário de organização: Campo "Período Obrigatório" removido conforme solicitação */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <DetailField label="Posto/Graduação" value={perfil.postoGraduacao} />
              <DetailField label="Nome de Guerra" value={perfil.nomeGuerra} />
              <DetailField label="IDT Militar" value={perfil.idtMilitar} />
              {/* Comentário de organização: Adicionando exibição de precCP nos dados militares */}
              <DetailField label="Prec CP" value={perfil.precCP} />
              <DetailField label="Nº Campo Básico" value={perfil.numeroCampoBasico} />
              <DetailField label="Número EBCA" value={perfil.numeroEbca} />
              <DetailField label="Data de Praça" value={formatDate(perfil.dataPraca)} />
              <DetailField label="Turma de Formação" value={perfil.turmaFormacao} />
              <DetailField label="Tipo de Vínculo" value={perfil.tipoVinculo} />
              <DetailField label="Companhia" value={perfil.companhia} />
              <DetailField label="Pelotão" value={perfil.pelotao} />
            </div>
          </Section>
          <Section title="Cursos & Especialidades" icon={<Award size={15} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <DetailField label="Cursos Profissionais / Militares" value={perfil.especialidades?.cursos || 'Nenhum registrado'} />
              </div>
              <div className="md:col-span-2">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10px] font-bold text-militar-main uppercase tracking-widest">CNH Categorias</span>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {(Array.isArray(perfil.dadosCivil?.cnhCategoria) ? perfil.dadosCivil.cnhCategoria : [])
                      .filter((c: string) => c && c !== 'Nenhum')
                      .map((cat: string) => (
                        <span key={cat} className="px-3 py-1 text-xs font-bold bg-militar-main text-white rounded-lg">{cat}</span>
                      ))}
                    {(!perfil.dadosCivil?.cnhCategoria || perfil.dadosCivil.cnhCategoria.length === 0 || perfil.dadosCivil.cnhCategoria.includes('Nenhum')) && (
                      <span className="text-sm font-semibold text-gray-800">Nenhuma</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ====== ABA: DADOS CIVIS ====== */}
      {activeTab === 'civil' && (
        <div className="grid grid-cols-1 gap-5">
          <Section title="Dados Pessoais e Físicos" icon={<BookOpen size={15} />}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-2 md:col-span-4">
                <DetailField label="Nome Completo" value={perfil.dadosCivil?.nomeCompleto} />
              </div>
              <DetailField label="Data de Nascimento" value={formatDate(perfil.dadosCivil?.dataNascimento)} />
              <DetailField label="Sexo" value={perfil.dadosCivil?.sexo} />
              <DetailField label="Estado Civil" value={perfil.dadosCivil?.estadoCivil} />
              <DetailField label="Idade" value={calcularIdade(perfil.dadosCivil?.dataNascimento)} />
              <DetailField label="CPF" value={perfil.dadosCivil?.cpf} />
              <DetailField label="IDT Civil" value={perfil.dadosCivil?.idtCivil} />
              <DetailField label="Altura" value={formatAltura(perfil.dadosCivil?.altura)} />
              <DetailField label="Tipo Sanguíneo" value={perfil.dadosCivil?.tipoSanguineo} />
              <DetailField label="Fator RH" value={perfil.dadosCivil?.fatorRh} />
              <DetailField label="Cútis" value={perfil.dadosCivil?.cutis} />
              <DetailField label="Olhos" value={perfil.dadosCivil?.olhos} />
              <DetailField label="Cabelos" value={perfil.dadosCivil?.cabelos} />
              <DetailField label="Religião" value={perfil.dadosCivil?.religiao} />
              <DetailField label="Escolaridade" value={perfil.dadosCivil?.escolaridade} />
              <div className="col-span-2 md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 pt-2 border-t border-gray-100">
                <DetailField label="Nome da Mãe" value={perfil.dadosCivil?.nomeMae} />
                <DetailField label="Nome do Pai" value={perfil.dadosCivil?.nomePai} />
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ====== ABA: CONTATO & ENDEREÇO ====== */}
      {activeTab === 'contato' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Section title="Endereço Residencial" icon={<MapPin size={15} />}>
            <div className="grid grid-cols-2 gap-3">
              <DetailField label="CEP" value={perfil.endereco?.cep} />
              <DetailField label="Número" value={perfil.endereco?.numero} />
              <div className="col-span-2"><DetailField label="Rua / Logradouro" value={perfil.endereco?.rua} /></div>
              <DetailField label="Complemento" value={perfil.endereco?.complemento} />
              <DetailField label="Bairro" value={perfil.endereco?.bairro} />
              <DetailField label="Cidade" value={perfil.endereco?.cidade} />
              <DetailField label="Estado (UF)" value={perfil.endereco?.uf} />
            </div>
          </Section>

          <div className="space-y-5">
            <Section title="Contato" icon={<Phone size={15} />}>
              <div className="grid grid-cols-1 gap-3">
                <DetailField label="Telefone de Contato" value={perfil.contato?.telefone} />
                <DetailField label="Reside com" value={perfil.contato?.coabitacao} />
                <DetailField label="Telefone de Emergência" value={perfil.contato?.telefoneEmergencia} />
                <DetailField label="Nome para Emergência" value={perfil.contato?.nomeEmergencia} />
                <DetailField label="Grau de Parentesco" value={perfil.contato?.grauParentesco} />
              </div>
            </Section>

            <Section title="Redes Sociais" icon={<Star size={15} />}>
              <div className="grid grid-cols-2 gap-3">
                <DetailField label="Instagram" value={perfil.redesSociais?.instagram} />
                <DetailField label="Facebook" value={perfil.redesSociais?.facebook} />
                <DetailField label="TikTok" value={perfil.redesSociais?.tiktok} />
                <DetailField label="Twitter / X" value={perfil.redesSociais?.twitter} />
                {perfil.redesSociais?.outras && <div className="col-span-2"><DetailField label="Outras" value={perfil.redesSociais.outras} /></div>}
              </div>
            </Section>
          </div>
        </div>
      )}

      {/* ====== ABA: PLANO DE FÉRIAS ====== */}
      {activeTab === 'ferias' && (
        <Section title="Planos de Férias Cadastrados" icon={<Calendar size={15} />}>
          <div className="space-y-4">
            {perfil.planosFerias && perfil.planosFerias.length > 0 ? (
              perfil.planosFerias.map((plano: any) => (
                <div key={plano.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-gray-800 text-sm">{plano.titulo} - Ano Ref: {plano.anoReferencia}</h4>
                    <Badge variant={plano.status === 'Pendente' ? 'warning' : (plano.status === 'Aprovado' ? 'success' : 'default')}>{plano.status}</Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm bg-white rounded-lg border border-gray-100">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          {['Período', 'Data Início', 'Data Fim'].map(h => (
                            <th key={h} className="text-left py-2 px-3 text-[11px] font-bold text-militar-main uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {plano.periodos && plano.periodos.length > 0 ? (
                          plano.periodos.map((p: any) => (
                            <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                              <td className="py-2 px-3 font-semibold text-gray-800">{p.nome}</td>
                              <td className="py-2 px-3 text-gray-600">{formatDate(p.inicio)}</td>
                              <td className="py-2 px-3 text-gray-600">{formatDate(p.fim)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={3} className="py-3 text-center text-xs text-gray-500">Nenhum período cadastrado para este plano.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum plano de férias cadastrado para este militar.</p>
            )}
          </div>
        </Section>
      )}

      {/* ====== ABA: FUNÇÕES DA CIA ====== */}
      {activeTab === 'funcoes' && (
        <Section title="Funções e Cargos na Cia" icon={<Award size={15} />}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  {['Função', 'Vínculo', 'Status'].map(h => (
                    <th key={h} className="text-left pb-3 px-3 text-[11px] font-bold text-militar-main uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {perfil.funcoesCia && perfil.funcoesCia.length > 0 ? perfil.funcoesCia.map((f: any) => (
                  <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-gray-800">{f.funcao}</td>
                    <td className="py-3 px-3 text-gray-600">{f.vinculo}</td>
                    <td className="py-3 px-3"><Badge variant={f.ativa ? 'success' : 'default'}>{f.ativa ? 'Ativa' : 'Inativa'}</Badge></td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="py-4 text-center text-sm text-gray-500">Nenhuma função registrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ====== ABA: PUNIÇÕES E OCORRÊNCIAS ====== */}
      {activeTab === 'punicoes' && (
        <div className="grid grid-cols-1 gap-6">
          <Section title="Punições Recebidas" icon={<AlertTriangle size={15} />}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    {['Data do Fato', 'Processo / BI', 'Tipo', 'Dias', 'Fato Relatado'].map(h => (
                      <th key={h} className="text-left pb-3 px-3 text-[11px] font-bold text-militar-main uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {perfil.punicoesRecebidas && perfil.punicoesRecebidas.length > 0 ? perfil.punicoesRecebidas.map((p: any) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-gray-800">{formatDate(p.dataFato)}</td>
                      <td className="py-3 px-3 text-gray-600">
                        <div>{p.numeroProcesso}</div>
                        <div className="text-xs text-gray-400">BI: {p.biPublicacao}</div>
                      </td>
                      <td className="py-3 px-3"><Badge variant="danger">{p.tipo}</Badge></td>
                      <td className="py-3 px-3 font-bold text-red-600">{p.dias || '—'}</td>
                      <td className="py-3 px-3 text-gray-700 text-xs max-w-sm">{p.fatoRelatado}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="py-4 text-center text-sm text-gray-500">Nenhuma punição registrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>


        </div>
      )}

      {/* ====== ABA: SAÚDE ====== */}
      {activeTab === 'saude' && (
        <div className="grid grid-cols-1 gap-5">
          <Section title="Visitas Médicas" icon={<Stethoscope size={15} />}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    {['Data', 'Motivo', 'Médico', 'Parecer', 'Baixado?', 'Observações'].map(h => (
                      <th key={h} className="text-left pb-3 px-3 text-[11px] font-bold text-militar-main uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {perfil.visitasMedicas && perfil.visitasMedicas.length > 0 ? perfil.visitasMedicas.map((v: any) => (
                    <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-gray-800">{formatDate(v.data)}</td>
                      <td className="py-3 px-3 text-gray-700">{v.motivo}</td>
                      <td className="py-3 px-3 text-gray-600">{v.medico}</td>
                      <td className="py-3 px-3"><Badge variant={v.resultado.toLowerCase().includes('apto') ? 'success' : 'warning'}>{v.resultado}</Badge></td>
                      <td className="py-3 px-3 font-bold">{v.baixado ? <span className="text-red-600">Sim</span> : <span className="text-green-600">Não</span>}</td>
                      <td className="py-3 px-3 text-gray-500 text-xs max-w-xs">{v.obs}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="py-4 text-center text-sm text-gray-500">Nenhuma visita médica registrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Baixados / Licenças de Saúde" icon={<Heart size={15} />}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    {['Início', 'Retorno', 'Motivo', 'CSD / Situação'].map(h => (
                      <th key={h} className="text-left pb-3 px-3 text-[11px] font-bold text-militar-main uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {perfil.baixados && perfil.baixados.length > 0 ? perfil.baixados.map((b: any) => (
                    <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-gray-800">{formatDate(b.dataInicio)}</td>
                      <td className="py-3 px-3 text-gray-600">{formatDate(b.dataFim)}</td>
                      <td className="py-3 px-3 text-gray-700">{b.motivo}</td>
                      <td className="py-3 px-3"><Badge variant="danger">{b.csd}</Badge></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="py-4 text-center text-sm text-gray-500">Nenhum registro de baixa médica.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      )}

      {/* ====== ABA: TAF / TIRO ====== */}
      {activeTab === 'taf' && (
        <div className="grid grid-cols-1 gap-5">
          <Section title="Estatísticas e Teste de Aptidão Física (TAF)" icon={<Target size={15} />}>
            
            {/* Comentário de organização: Dashboard com gráficos simplificados para o TAF */}
            <div className="mb-8">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Evolução do Desempenho Físico</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard title="Última Menção TAF" value={tafStatic[0]?.mencao || '—'} subtitle={`Em ${tafStatic[0]?.data || '—'}`} trend="neutral" />
                <StatCard title="Média de Flexões" value={Math.round(tafStatic.reduce((acc, t) => acc + t.flexao, 0) / (tafStatic.length || 1))} subtitle="Últimos testes" />
                <StatCard title="Média de Abdominais" value={Math.round(tafStatic.reduce((acc, t) => acc + t.abdominal, 0) / (tafStatic.length || 1))} subtitle="Últimos testes" />
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Comparativo: Último TAF</h4>
                <div className="space-y-4">
                  <ProgressBar label="Flexões de Braço" value={tafStatic[0]?.flexao || 0} max={50} colorClass="bg-blue-500" />
                  <ProgressBar label="Abdominais" value={tafStatic[0]?.abdominal || 0} max={60} colorClass="bg-green-500" />
                </div>
              </div>
            </div>

            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Histórico de TAF</h4>
            <div className="overflow-x-auto border rounded-xl border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    {['Data', 'Corrida (m:ss)', 'Flexão', 'Abdominal', 'Menção', 'Resultado'].map(h => (
                      <th key={h} className="text-left pb-3 px-3 text-[11px] font-bold text-militar-main uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tafStatic.map(t => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-gray-800">{t.data}</td>
                      <td className="py-3 px-3 text-gray-700">{t.corrida}</td>
                      <td className="py-3 px-3 font-semibold">{t.flexao}</td>
                      <td className="py-3 px-3 font-semibold">{t.abdominal}</td>
                      <td className="py-3 px-3">
                        <span className="text-lg font-black text-militar-main">{t.mencao}</span>
                      </td>
                      <td className="py-3 px-3"><Badge variant="success">{t.resultado}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Teste de Tiro" icon={<Target size={15} />}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    {['Data', 'Tipo', 'Menção', 'Observações'].map(h => (
                      <th key={h} className="text-left pb-3 px-3 text-[11px] font-bold text-militar-main uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tiroStatic.map(t => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-gray-800">{t.data}</td>
                      <td className="py-3 px-3 text-gray-700">{t.tipo}</td>
                      <td className="py-3 px-3">
                        <span className="text-lg font-black text-militar-main">{t.mencao}</span>
                      </td>
                      <td className="py-3 px-3 text-gray-600">{t.obs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <StaticDataWarning />
          </Section>
        </div>
      )}
    </div>
  );
}
