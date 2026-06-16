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
  const punicoesStatic = [
    { id: 1, tipo: 'Recebida', descricao: 'Repreensão verbal por atraso em serviço', data: '10/03/2026', aplicador: '1º SGT Torres', status: 'Cumprida' },
    { id: 2, tipo: 'Aplicada', descricao: 'Advertência oral a SD sob seu comando', data: '22/04/2026', aplicador: `Em nome de ${perfil.nomeGuerra || '—'}`, status: 'Registrada' },
  ];
  const visitasMedicasStatic = [
    { id: 1, data: '05/01/2026', motivo: 'Consulta de rotina', medico: 'Cap Médico Faria', resultado: 'Apto', obs: 'Exames normais' },
    { id: 2, data: '14/03/2026', motivo: 'Dor lombar', medico: 'Cap Médico Faria', resultado: 'Apto c/ restrição', obs: 'Afastado de atividades de campo por 7 dias' },
  ];
  const baixasStatic = [
    { id: 1, dataInicio: '14/03/2026', dataFim: '21/03/2026', dias: 7, motivo: 'Dor lombar aguda', tipo: 'Licença Saúde', medico: 'Cap Médico Faria' },
  ];
  const tafStatic = [
    { id: 1, data: '15/01/2026', nota: 82, resultado: 'Aprovado', corrida: '11:48', flexao: 38, abdominal: 42 },
    { id: 2, data: '15/07/2025', nota: 78, resultado: 'Aprovado', corrida: '12:10', flexao: 35, abdominal: 40 },
  ];
  const tiroStatic = [
    { id: 1, data: '20/02/2026', arma: 'FAL 7.62mm', pontuacao: 92, classificacao: 'Atirador de 1ª Classe' },
    { id: 2, data: '20/08/2025', arma: 'FAL 7.62mm', pontuacao: 88, classificacao: 'Atirador de 2ª Classe' },
  ];
  const funcoesStatic = [
    { id: 1, funcao: 'Atirador', secao: '2ª Seção', desde: '01/03/2026', ate: null, atual: true },
    { id: 2, funcao: 'Operador de Rádio', secao: 'Estado-Maior', desde: '01/01/2025', ate: '28/02/2026', atual: false },
  ];
  const planoFeriasStatic = [
    { id: 1, periodo: '1º Período', dataInicio: '10/03/2026', dataFim: '09/04/2026', dias: 30, status: 'Pendente' },
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
          {/* Label de posto no banner */}
          <div className="absolute top-4 right-6">
            <span className="text-white/80 text-xs font-bold uppercase tracking-widest border border-white/30 px-3 py-1 rounded-full bg-white/10">
              {perfil.postoGraduacao || '—'}
            </span>
          </div>
        </div>

        {/* Corpo do hero */}
        <div className="px-8 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16">

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
              <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-green-500 border-[3px] border-white shadow-md flex items-center justify-center" title="Ativo">
                <span className="w-2 h-2 rounded-full bg-white" />
              </span>
            </div>

            {/* Info principal */}
            <div className="flex-1 pt-2 md:pt-6">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge variant="success">Ativo</Badge>
                {perfil.tipoVinculo && (
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                    {perfil.tipoVinculo}
                  </span>
                )}
                {perfil.turmaFormacao && (
                  <span className="text-xs font-semibold text-militar-main bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full">
                    Turma {perfil.turmaFormacao}
                  </span>
                )}
              </div>

              {/* Comentário de organização: Nome completo como título principal do hero card */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                {nomeTitulo}
              </h1>

              {/* Comentário de organização: Linha de posto + nome de guerra (só exibe nome de guerra se diferente do nome completo) */}
              <p className="text-base text-militar-main font-bold mt-0.5">
                {perfil.postoGraduacao || '—'}
                {mostrarNomeGuerra && (
                  <span className="text-gray-400 font-normal text-sm"> · {nomeGuerra}</span>
                )}
              </p>

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
        <Section title="Plano de Férias" icon={<Calendar size={15} />}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  {['Período', 'Data Início', 'Data Fim', 'Dias', 'Status'].map(h => (
                    <th key={h} className="text-left pb-3 px-3 text-[11px] font-bold text-militar-main uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {planoFeriasStatic.map(f => (
                  <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-gray-800">{f.periodo}</td>
                    <td className="py-3 px-3 text-gray-600">{f.dataInicio}</td>
                    <td className="py-3 px-3 text-gray-600">{f.dataFim}</td>
                    <td className="py-3 px-3 font-bold text-gray-800">{f.dias}</td>
                    <td className="py-3 px-3"><Badge variant="warning">{f.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <StaticDataWarning />
          </div>
        </Section>
      )}

      {/* ====== ABA: FUNÇÕES CIA ====== */}
      {activeTab === 'funcoes' && (
        <Section title="Funções Exercidas na CIA" icon={<Star size={15} />}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  {['Função', 'Seção', 'Desde', 'Até', 'Situação'].map(h => (
                    <th key={h} className="text-left pb-3 px-3 text-[11px] font-bold text-militar-main uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {funcoesStatic.map(f => (
                  <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-3 font-bold text-gray-800">{f.funcao}</td>
                    <td className="py-3 px-3 text-gray-600">{f.secao}</td>
                    <td className="py-3 px-3 text-gray-600">{f.desde}</td>
                    <td className="py-3 px-3 text-gray-500">{f.atual ? '—' : f.ate}</td>
                    <td className="py-3 px-3">
                      <Badge variant={f.atual ? 'success' : 'default'}>{f.atual ? 'Atual' : 'Encerrada'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <StaticDataWarning />
          </div>
        </Section>
      )}

      {/* ====== ABA: PUNIÇÕES ====== */}
      {activeTab === 'punicoes' && (
        <Section title="Histórico de Punições" icon={<AlertTriangle size={15} />}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  {['Tipo', 'Descrição', 'Data', 'Aplicador / Registro', 'Status'].map(h => (
                    <th key={h} className="text-left pb-3 px-3 text-[11px] font-bold text-militar-main uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {punicoesStatic.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-3"><PunicaoBadge tipo={p.tipo} /></td>
                    <td className="py-3 px-3 text-gray-700 max-w-xs">{p.descricao}</td>
                    <td className="py-3 px-3 text-gray-600">{p.data}</td>
                    <td className="py-3 px-3 text-gray-600">{p.aplicador}</td>
                    <td className="py-3 px-3">
                      <Badge variant={p.status === 'Cumprida' ? 'success' : 'default'}>{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <StaticDataWarning />
          </div>
        </Section>
      )}

      {/* ====== ABA: SAÚDE ====== */}
      {activeTab === 'saude' && (
        <div className="grid grid-cols-1 gap-5">
          <Section title="Visitas Médicas" icon={<Stethoscope size={15} />}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    {['Data', 'Motivo', 'Médico', 'Resultado', 'Observações'].map(h => (
                      <th key={h} className="text-left pb-3 px-3 text-[11px] font-bold text-militar-main uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visitasMedicasStatic.map(v => (
                    <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-gray-800">{v.data}</td>
                      <td className="py-3 px-3 text-gray-700">{v.motivo}</td>
                      <td className="py-3 px-3 text-gray-600">{v.medico}</td>
                      <td className="py-3 px-3"><Badge variant={v.resultado === 'Apto' ? 'success' : 'warning'}>{v.resultado}</Badge></td>
                      <td className="py-3 px-3 text-gray-500 text-xs">{v.obs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Baixas / Licenças de Saúde" icon={<Heart size={15} />}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    {['Início', 'Fim', 'Dias', 'Motivo', 'Tipo', 'Médico'].map(h => (
                      <th key={h} className="text-left pb-3 px-3 text-[11px] font-bold text-militar-main uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {baixasStatic.map(b => (
                    <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-gray-800">{b.dataInicio}</td>
                      <td className="py-3 px-3 text-gray-600">{b.dataFim}</td>
                      <td className="py-3 px-3 font-bold text-red-600">{b.dias}</td>
                      <td className="py-3 px-3 text-gray-700">{b.motivo}</td>
                      <td className="py-3 px-3"><Badge variant="warning">{b.tipo}</Badge></td>
                      <td className="py-3 px-3 text-gray-600">{b.medico}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <StaticDataWarning />
          </Section>
        </div>
      )}

      {/* ====== ABA: TAF / TIRO ====== */}
      {activeTab === 'taf' && (
        <div className="grid grid-cols-1 gap-5">
          <Section title="Teste de Aptidão Física (TAF)" icon={<Target size={15} />}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    {['Data', 'Corrida (m:ss)', 'Flexão', 'Abdominal', 'Nota', 'Resultado'].map(h => (
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
                        <span className="text-lg font-black text-militar-main">{t.nota}</span>
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
                    {['Data', 'Arma', 'Pontuação', 'Classificação'].map(h => (
                      <th key={h} className="text-left pb-3 px-3 text-[11px] font-bold text-militar-main uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tiroStatic.map(t => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-gray-800">{t.data}</td>
                      <td className="py-3 px-3 text-gray-700">{t.arma}</td>
                      <td className="py-3 px-3">
                        <span className="text-lg font-black text-militar-main">{t.pontuacao}</span>
                      </td>
                      <td className="py-3 px-3"><Badge variant="success">{t.classificacao}</Badge></td>
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
