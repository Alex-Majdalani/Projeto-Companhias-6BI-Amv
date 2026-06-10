import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Save, X } from 'lucide-react';
import { api } from '../../services/api';

// Funções Helpers de Máscara e Formatação
const toTitleCase = (str: string) => {
  if (!str) return '';
  return str
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const formatCPF = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  let formatted = digits;
  if (digits.length > 3) formatted = `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length > 6) formatted = `${formatted.slice(0, 7)}.${digits.slice(6)}`;
  if (digits.length > 9) formatted = `${formatted.slice(0, 11)}-${digits.slice(9)}`;
  return formatted;
};

const formatIdtMil = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 10);
  let formatted = digits;
  if (digits.length > 9) {
    formatted = `${digits.slice(0, 9)}-${digits.slice(9)}`;
  }
  return formatted;
};

const formatIdtCivil = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 9);
  let formatted = digits;
  if (digits.length > 2) formatted = `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length > 5) formatted = `${formatted.slice(0, 6)}.${digits.slice(5)}`;
  if (digits.length > 8) formatted = `${formatted.slice(0, 10)}-${digits.slice(8)}`;
  return formatted;
};

const formatTelefone = (val: string, isCelular: boolean) => {
  const digits = val.replace(/\D/g, '');
  if (isCelular) {
    const sliced = digits.slice(0, 11);
    if (sliced.length <= 2) return sliced.length > 0 ? `(${sliced}` : '';
    if (sliced.length <= 7) return `(${sliced.slice(0, 2)}) ${sliced.slice(2)}`;
    return `(${sliced.slice(0, 2)}) ${sliced.slice(2, 7)}-${sliced.slice(7)}`;
  } else {
    const sliced = digits.slice(0, 10);
    if (sliced.length <= 2) return sliced.length > 0 ? `(${sliced}` : '';
    if (sliced.length <= 6) return `(${sliced.slice(0, 2)}) ${sliced.slice(2)}`;
    return `(${sliced.slice(0, 2)}) ${sliced.slice(2, 6)}-${sliced.slice(6)}`;
  }
};

const formatCEP = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 8);
  let formatted = digits;
  if (digits.length > 5) {
    formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return formatted;
};

const formatAltura = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 3);
  if (digits.length === 0) return '';
  if (digits.length === 1) return digits;
  if (digits.length === 2) return `${digits.slice(0, 1)},${digits.slice(1)}`;
  return `${digits.slice(0, 1)},${digits.slice(1, 3)}`;
};

const formatAtSign = (val: string) => {
  if (!val) return '';
  if (val.startsWith('@')) return val;
  return `@${val}`;
};

const calculateAge = (birthDateString: string): string => {
  if (!birthDateString) return '';
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? String(age) : '';
};

export function NovoMilitar() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companhias, setCompanhias] = useState<{ id: number; companhia: string }[]>([]);
  const [showYearScroll, setShowYearScroll] = useState(false);

  const [formData, setFormData] = useState({
    postoGraduacao: '',
    numero: '',
    nomeGuerra: '',
    tipoMilitar: 'Militar Temporário',
    periodoObrigatorio: 'sim',
    secaoCompanhia: '',
    dataPraca: '',
    turmaFormacao: '',
    nomeCompleto: '',
    dataNascimento: '',
    idade: '',
    idtMil: '',
    cpf: '',
    idtCivil: '',
    altura: '',
    tipoSanguineo: 'A',
    fatorRh: '+',
    cutis: 'Branca',
    olhos: 'Castanhos',
    cabelos: 'Preto',
    religiao: '',
    nomePai: '',
    nomeMae: '',
    escolaridade: 'fundamental_inc',
    cnhCategoria: [] as string[],
    cursosProfissionais: '',
    cep: '',
    rua: '',
    numeroResidencial: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    telefoneTipo: 'celular',
    telefoneCelular: '',
    resideCom: [] as string[],
    telefoneEmergenciaTipo: 'celular',
    telefoneEmergencia: '',
    nomeEmergencia: '',
    grauParentesco: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    twitter: '',
    outrasRedes: '',
    pelotao: ''
  });

  const [pelotoes, setPelotoes] = useState<string[]>([]);

  // Carregar companhias dinamicamente da API
  useEffect(() => {
    async function loadCompanhias() {
      try {
        const response = await api.get('/militares/companhias');
        setCompanhias(response.data);
      } catch (err) {
        console.error('Erro ao buscar companhias:', err);
      }
    }
    async function loadPelotoes() {
      try {
        const response = await api.get('/militares/pelotoes');
        setPelotoes(response.data);
      } catch (err) {
        console.error('Erro ao buscar pelotões:', err);
      }
    }
    loadCompanhias();
    loadPelotoes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'telefoneTipo') {
      setFormData((prev) => ({
        ...prev,
        telefoneTipo: value,
        telefoneCelular: formatTelefone(prev.telefoneCelular, value === 'celular')
      }));
      return;
    }

    if (name === 'telefoneEmergenciaTipo') {
      setFormData((prev) => ({
        ...prev,
        telefoneEmergenciaTipo: value,
        telefoneEmergencia: formatTelefone(prev.telefoneEmergencia, value === 'celular')
      }));
      return;
    }

    let processedValue = value;
    if (name === 'cpf') processedValue = formatCPF(value);
    else if (name === 'idtMil') processedValue = formatIdtMil(value);
    else if (name === 'idtCivil') processedValue = formatIdtCivil(value);
    else if (name === 'telefoneCelular') {
      processedValue = formatTelefone(value, formData.telefoneTipo === 'celular');
    } else if (name === 'telefoneEmergencia') {
      processedValue = formatTelefone(value, formData.telefoneEmergenciaTipo === 'celular');
    } else if (name === 'cep') processedValue = formatCEP(value);
    else if (name === 'altura') processedValue = formatAltura(value);
    else if (name === 'instagram' || name === 'tiktok' || name === 'twitter') {
      processedValue = formatAtSign(value);
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: processedValue };
      if (name === 'dataNascimento') {
        updated.idade = calculateAge(processedValue);
      }
      return updated;
    });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'altura') {
      const val = value.trim();
      if (val.length === 3 && val.includes(',')) {
        setFormData((prev) => ({ ...prev, altura: `${val}0` }));
      }
      return;
    }

    const fieldsToTitleCase = [
      'nomeCompleto',
      'nomeGuerra',
      'rua',
      'bairro',
      'cidade',
      'nomePai',
      'nomeMae',
      'nomeEmergencia'
    ];
    if (fieldsToTitleCase.includes(name)) {
      setFormData((prev) => ({ ...prev, [name]: toTitleCase(value) }));
    }
  };

  const handleCnhChange = (category: string) => {
    setFormData((prev) => {
      const current = prev.cnhCategoria;
      if (category === 'Nenhum') {
        const next = current.includes('Nenhum') ? [] : ['Nenhum'];
        return { ...prev, cnhCategoria: next };
      } else {
        const next = current.includes(category)
          ? current.filter((c) => c !== category)
          : [...current, category].filter((c) => c !== 'Nenhum');
        return { ...prev, cnhCategoria: next };
      }
    });
  };

  const handleResideComChange = (option: string) => {
    setFormData((prev) => {
      const current = prev.resideCom;
      const next = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option];
      return { ...prev, resideCom: next };
    });
  };

  const handleOutrasRedesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ') {
      const val = formData.outrasRedes;
      if (val && !val.trim().endsWith(',')) {
        e.preventDefault();
        setFormData((prev) => ({ ...prev, outrasRedes: `${val.trim()}, ` }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validação de Envio para Altura (Impede envio de inteiros como "1" ou "2")
    if (formData.altura) {
      const hasComma = formData.altura.includes(',');
      const numericPart = formData.altura.replace(/\D/g, '');
      if (!hasComma || numericPart.length < 2) {
        setError('Altura inválida. A altura deve possuir pelo menos uma casa decimal (ex: 1,8 ou 1,80).');
        setLoading(false);
        return;
      }
    }

    // Validação de Tamanho das Máscaras (Bloqueio de Incompletos)
    if (formData.cpf && formData.cpf.length !== 14) {
      setError('CPF inválido. Deve possuir 11 dígitos.');
      setLoading(false);
      return;
    }
    if (formData.idtMil && formData.idtMil.length !== 11) {
      setError('Identidade Militar inválida. Deve possuir 10 dígitos.');
      setLoading(false);
      return;
    }
    if (formData.idtCivil && formData.idtCivil.length > 0 && formData.idtCivil.length !== 12) {
      setError('Identidade Civil inválida. Deve possuir 9 dígitos.');
      setLoading(false);
      return;
    }
    if (formData.cep && formData.cep.length > 0 && formData.cep.length !== 9) {
      setError('CEP inválido. Deve possuir 8 dígitos.');
      setLoading(false);
      return;
    }

    if (!formData.turmaFormacao) {
      setError('Por favor, selecione a Turma de Formação no seletor de ano.');
      setLoading(false);
      return;
    }

    // Validação de Telefone de Contato conforme o tipo selecionado
    if (formData.telefoneCelular) {
      const expectedLen = formData.telefoneTipo === 'celular' ? 15 : 14;
      if (formData.telefoneCelular.length !== expectedLen) {
        setError(`Telefone de Contato incompleto. Preencha completamente no formato de ${formData.telefoneTipo === 'celular' ? 'Celular: (XX) XXXXX-XXXX' : 'Telefone Fixo: (XX) XXXX-XXXX'}.`);
        setLoading(false);
        return;
      }
    }

    // Validação de Telefone de Emergência conforme o tipo selecionado
    if (formData.telefoneEmergencia) {
      const expectedLen = formData.telefoneEmergenciaTipo === 'celular' ? 15 : 14;
      if (formData.telefoneEmergencia.length !== expectedLen) {
        setError(`Telefone de Emergência incompleto. Preencha completamente no formato de ${formData.telefoneEmergenciaTipo === 'celular' ? 'Celular: (XX) XXXXX-XXXX' : 'Telefone Fixo: (XX) XXXX-XXXX'}.`);
        setLoading(false);
        return;
      }
    }

    // Validação de Redes Sociais
    if (formData.instagram && (formData.instagram === '@' || !formData.instagram.startsWith('@'))) {
      setError('Instagram inválido. Deve começar com @ e conter o nome de usuário.');
      setLoading(false);
      return;
    }
    if (formData.tiktok && (formData.tiktok === '@' || !formData.tiktok.startsWith('@'))) {
      setError('TikTok inválido. Deve começar com @ e conter o nome de usuário.');
      setLoading(false);
      return;
    }
    if (formData.twitter && (formData.twitter === '@' || !formData.twitter.startsWith('@'))) {
      setError('Rede X (Twitter) inválida. Deve começar com @ e conter o nome de usuário.');
      setLoading(false);
      return;
    }

    // Preparar payload normalizando campos
    const payload = {
      ...formData,
      nomeCompleto: toTitleCase(formData.nomeCompleto),
      nomeGuerra: toTitleCase(formData.nomeGuerra),
      rua: toTitleCase(formData.rua),
      bairro: toTitleCase(formData.bairro),
      cidade: toTitleCase(formData.cidade),
      uf: formData.uf.toUpperCase(),
      nomePai: toTitleCase(formData.nomePai),
      nomeMae: toTitleCase(formData.nomeMae),
      nomeEmergencia: toTitleCase(formData.nomeEmergencia),
      cutis: formData.cutis,
      olhos: formData.olhos,
      cabelos: formData.cabelos,
      resideCom: formData.resideCom.join(', ')
    };

    try {
      await api.post('/militares', payload);
      alert('Militar cadastrado com sucesso!');
      navigate('/sgte/cadastro-militares');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Erro ao realizar o cadastro do militar.');
    } finally {
      setLoading(false);
    }
  };

  // Gerar opções de anos para Turma de Formação
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1980 + 1 }, (_, i) => 1980 + i).reverse();

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <Breadcrumb
            items={[
              { label: 'Gestão de Pessoas' },
              { label: 'Cadastro de Militares', to: '/sgte/cadastro-militares' },
              { label: 'Novo Militar' }
            ]}
          />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Cadastrar Novo Militar</h1>
          <p className="text-sm text-gray-500 mt-1">
            Preencha as informações para registrar um novo militar no sistema.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/sgte/cadastro-militares')} icon={<X size={18} />}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} icon={<Save size={18} />}>
            {loading ? 'Salvando...' : 'Salvar Registro'}
          </Button>
        </div>
      </div>

      {/* Alerta de erro - TOPO */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Identificação Militar */}
      <Card className="!overflow-visible">
        <CardHeader>
          <CardTitle>Identificação Militar</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Select
            label="Posto/Graduação (P/G)"
            name="postoGraduacao"
            value={formData.postoGraduacao}
            onChange={handleChange}
            required
          >
            <option value="" disabled>Selecione...</option>
            <option value="cel">CEL</option>
            <option value="tc">TC</option>
            <option value="maj">MAJ</option>
            <option value="cap">CAP</option>
            <option value="1ten">1º TEN</option>
            <option value="2ten">2º TEN</option>
            <option value="asp">ASP</option>
            <option value="st">ST</option>
            <option value="1sgt">1º SGT</option>
            <option value="2sgt">2º SGT</option>
            <option value="3sgt">3º SGT</option>
            <option value="cb">CB</option>
            <option value="sdep">SD EP</option>
            <option value="sdev">SD EV</option>
          </Select>
          <Input
            label="Número"
            name="numero"
            placeholder="Ex: 123"
            value={formData.numero}
            onChange={handleChange}
          />
          <Input
            label="Nome de Guerra"
            name="nomeGuerra"
            placeholder="Ex: Silva"
            value={formData.nomeGuerra}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          <Select
            label="Tipo (Carreira/Temporário)"
            name="tipoMilitar"
            value={formData.tipoMilitar}
            onChange={handleChange}
          >
            <option value="Militar Temporário">Militar Temporário</option>
            <option value="Militar de Carreira">Militar de Carreira</option>
          </Select>

          <Select
            label="Período Obrigatório"
            name="periodoObrigatorio"
            value={formData.periodoObrigatorio}
            onChange={handleChange}
          >
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </Select>

          <Select
            label="Companhia"
            name="secaoCompanhia"
            value={formData.secaoCompanhia}
            onChange={handleChange}
            required
          >
            <option value="" disabled>Selecione...</option>
            {companhias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companhia}
              </option>
            ))}
          </Select>

          <Select
            label="Pelotão"
            name="pelotao"
            value={formData.pelotao}
            onChange={handleChange}
            required
          >
            <option value="" disabled>Selecione...</option>
            {pelotoes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>

          <Input
            label="Data de Praça"
            name="dataPraca"
            type="date"
            value={formData.dataPraca}
            onChange={handleChange}
          />

          <div className="flex flex-col gap-1.5 w-full relative">
            <label className="text-sm font-semibold text-gray-700">Turma de Formação</label>
            
            <button
              type="button"
              onClick={() => setShowYearScroll((prev) => !prev)}
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-sm text-left focus:outline-none focus:ring-2 focus:ring-militar-light transition-all flex justify-between items-center"
            >
              <span className={formData.turmaFormacao ? "text-gray-900 font-medium" : "text-gray-400"}>
                {formData.turmaFormacao || "Selecione o ano..."}
              </span>
              <span className="text-gray-500 text-xs">▼</span>
            </button>

            {showYearScroll && (
              <>
                <div className="fixed inset-0 z-[900]" onClick={() => setShowYearScroll(false)} />
                <div className="absolute top-[100%] left-0 z-[1000] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                  <div className="flex overflow-x-auto gap-2 py-2 px-2 bg-gray-50 rounded-md max-w-full scrollbar-thin scrollbar-thumb-gray-300">
                    {years.map((y) => {
                      const isSelected = formData.turmaFormacao === String(y);
                      return (
                        <button
                          key={y}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, turmaFormacao: String(y) }));
                            setShowYearScroll(false);
                          }}
                          className={`flex-shrink-0 px-4 py-1 text-base font-bold rounded-full transition-all border ${
                            isSelected
                              ? 'bg-militar-main text-white border-militar-main shadow-sm scale-105'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {y}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dados Pessoais & Físicos */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais e Físicos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <Input
                label="Nome Completo"
                name="nomeCompleto"
                placeholder="Nome completo do militar"
                value={formData.nomeCompleto}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
            </div>
            <Input
              label="Data de Nascimento"
              name="dataNascimento"
              type="date"
              value={formData.dataNascimento}
              onChange={handleChange}
            />
            <Input
              label="Idade"
              name="idade"
              type="number"
              placeholder="Preenchida automaticamente"
              value={formData.idade}
              readOnly
              className="bg-gray-100 cursor-not-allowed font-medium text-gray-700"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Idt Mil (Identidade Militar)"
              name="idtMil"
              placeholder="000000000-0"
              value={formData.idtMil}
              onChange={handleChange}
              required
            />
            <Input
              label="CPF"
              name="cpf"
              placeholder="000.000.000-00"
              value={formData.cpf}
              onChange={handleChange}
              required
            />
            <Input
              label="Idt Civil"
              name="idtCivil"
              placeholder="00.000.000-0"
              value={formData.idtCivil}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Input
              label="Altura (m)"
              name="altura"
              placeholder="Ex: 1,75"
              value={formData.altura}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <Select
              label="Tipo Sanguíneo (TS)"
              name="tipoSanguineo"
              value={formData.tipoSanguineo}
              onChange={handleChange}
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="AB">AB</option>
              <option value="O">O</option>
            </Select>
            <Select
              label="Fator RH"
              name="fatorRh"
              value={formData.fatorRh}
              onChange={handleChange}
            >
              <option value="+">Positivo (+)</option>
              <option value="-">Negativo (-)</option>
            </Select>
            <Select
              label="Cútis"
              name="cutis"
              value={formData.cutis}
              onChange={handleChange}
            >
              <option value="Branca">Branca</option>
              <option value="Parda">Parda</option>
              <option value="Preta">Preta</option>
              <option value="Indígena">Indígena</option>
              <option value="Amarela">Amarela</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Select
              label="Olhos"
              name="olhos"
              value={formData.olhos}
              onChange={handleChange}
            >
              <option value="Castanhos">Castanhos</option>
              <option value="Pretos">Pretos</option>
              <option value="Verdes">Verdes</option>
              <option value="Azuis">Azuis</option>
            </Select>

            <Select
              label="Cabelos"
              name="cabelos"
              value={formData.cabelos}
              onChange={handleChange}
            >
              <option value="Preto">Preto</option>
              <option value="Castanho">Castanho</option>
              <option value="Loiro">Loiro</option>
              <option value="Ruivo">Ruivo</option>
              <option value="Grisalho / Branco">Grisalho / Branco</option>
            </Select>

            <Input
              label="Religião"
              name="religiao"
              placeholder="Ex: Católica, Evangélica, etc."
              value={formData.religiao}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nome do Pai"
              name="nomePai"
              placeholder="Nome completo do pai"
              value={formData.nomePai}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <Input
              label="Nome da Mãe"
              name="nomeMae"
              placeholder="Nome completo da mãe"
              value={formData.nomeMae}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Select
              label="Escolaridade"
              name="escolaridade"
              value={formData.escolaridade}
              onChange={handleChange}
            >
              <option value="fundamental_inc">Fundamental Incompleto</option>
              <option value="fundamental_com">Fundamental Completo</option>
              <option value="medio_inc">Médio Incompleto</option>
              <option value="medio_com">Médio Completo</option>
              <option value="superior_inc">Superior Incompleto</option>
              <option value="superior_com">Superior Completo</option>
            </Select>

            {/* Grupo de Checkboxes de CNH */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-semibold text-gray-700">CNH Categorias</label>
              <div className="flex flex-wrap gap-3 items-center h-10">
                {['Nenhum', 'A', 'B', 'C', 'D', 'E'].map((cat) => {
                  const isDisabled = cat !== 'Nenhum' && formData.cnhCategoria.includes('Nenhum');
                  return (
                    <label key={cat} className={`flex items-center gap-1.5 text-sm cursor-pointer select-none ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="checkbox"
                        checked={formData.cnhCategoria.includes(cat)}
                        disabled={isDisabled}
                        onChange={() => handleCnhChange(cat)}
                        className="rounded border-gray-300 text-militar-main focus:ring-militar-light h-4 w-4"
                      />
                      <span>{cat}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <Input
              label="Cursos Profissionais/Militares"
              name="cursosProfissionais"
              placeholder="Ex: Paraquedista, Informática..."
              value={formData.cursosProfissionais}
              onChange={handleChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle>Endereço e Contato Residencial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-3">
              <Input
                label="CEP"
                name="cep"
                placeholder="00000-000"
                value={formData.cep}
                onChange={handleChange}
              />
            </div>
            <div className="md:col-span-7">
              <Input
                label="Rua / Logradouro"
                name="rua"
                placeholder="Ex: Av. Duque de Caxias"
                value={formData.rua}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Número"
                name="numeroResidencial"
                placeholder="Ex: 123"
                value={formData.numeroResidencial}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Complemento"
              name="complemento"
              placeholder="Apto, Bloco, etc."
              value={formData.complemento}
              onChange={handleChange}
            />
            <Input
              label="Bairro"
              name="bairro"
              placeholder="Ex: Centro"
              value={formData.bairro}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <Input
              label="Cidade"
              name="cidade"
              placeholder="Ex: Rio de Janeiro"
              value={formData.cidade}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            <Select
              label="Estado (UF)"
              name="uf"
              value={formData.uf}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Selecione...</option>
              {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map((sigla) => (
                <option key={sigla} value={sigla}>{sigla}</option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contato e Emergência */}
      <Card>
        <CardHeader>
          <CardTitle>Contato e Emergência</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seletor de Tipo de Telefone e Input */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-gray-700">Telefone de Contato</label>
            <div className="flex gap-4 items-center mb-1">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                <input
                  type="radio"
                  name="telefoneTipo"
                  value="celular"
                  checked={formData.telefoneTipo === 'celular'}
                  onChange={handleChange}
                  className="text-militar-main focus:ring-militar-light h-4 w-4"
                />
                <span>Celular</span>
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                <input
                  type="radio"
                  name="telefoneTipo"
                  value="fixo"
                  checked={formData.telefoneTipo === 'fixo'}
                  onChange={handleChange}
                  className="text-militar-main focus:ring-militar-light h-4 w-4"
                />
                <span>Telefone Fixo</span>
              </label>
            </div>
            <Input
              name="telefoneCelular"
              placeholder={formData.telefoneTipo === 'celular' ? "(00) 00000-0000" : "(00) 0000-0000"}
              value={formData.telefoneCelular}
              onChange={handleChange}
            />
          </div>

          {/* Grupo de Checkboxes de Reside com */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-gray-700">Reside com</label>
            <div className="flex flex-wrap gap-4 items-center min-h-[40px]">
              {['Pai', 'Mãe', 'Irmão(s)', 'Cônjuge', 'Filho(s)', 'Outros'].map((opt) => (
                <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.resideCom.includes(opt)}
                    onChange={() => handleResideComChange(opt)}
                    className="rounded border-gray-300 text-militar-main focus:ring-militar-light h-4 w-4"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Seletor de Tipo de Telefone de Emergência e Input */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-gray-700">Telefone de Emergência</label>
            <div className="flex gap-4 items-center mb-1">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                <input
                  type="radio"
                  name="telefoneEmergenciaTipo"
                  value="celular"
                  checked={formData.telefoneEmergenciaTipo === 'celular'}
                  onChange={handleChange}
                  className="text-militar-main focus:ring-militar-light h-4 w-4"
                />
                <span>Celular</span>
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                <input
                  type="radio"
                  name="telefoneEmergenciaTipo"
                  value="fixo"
                  checked={formData.telefoneEmergenciaTipo === 'fixo'}
                  onChange={handleChange}
                  className="text-militar-main focus:ring-militar-light h-4 w-4"
                />
                <span>Telefone Fixo</span>
              </label>
            </div>
            <Input
              name="telefoneEmergencia"
              placeholder={formData.telefoneEmergenciaTipo === 'celular' ? "(00) 00000-0000" : "(00) 0000-0000"}
              value={formData.telefoneEmergencia}
              onChange={handleChange}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                label="Nome para Emergência"
                name="nomeEmergencia"
                placeholder="Ex: Maria (Esposa)"
                value={formData.nomeEmergencia}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Grau de Parentesco"
                name="grauParentesco"
                placeholder="Ex: Mãe, Pai, Cônjuge"
                value={formData.grauParentesco}
                onChange={handleChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Redes Sociais */}
      <Card>
        <CardHeader>
          <CardTitle>Redes Sociais</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input
            label="Instagram"
            name="instagram"
            placeholder="@usuario"
            value={formData.instagram}
            onChange={handleChange}
          />
          <Input
            label="Facebook"
            name="facebook"
            placeholder="Link ou nome de usuário"
            value={formData.facebook}
            onChange={handleChange}
          />
          <Input
            label="TikTok"
            name="tiktok"
            placeholder="@usuario"
            value={formData.tiktok}
            onChange={handleChange}
          />
          <Input
            label="Rede X (Twitter)"
            name="twitter"
            placeholder="@usuario"
            value={formData.twitter}
            onChange={handleChange}
          />
          <div className="md:col-span-2">
            <Input
              label="Outras (LinkedIn, etc)"
              name="outrasRedes"
              placeholder="Links separados por vírgula"
              value={formData.outrasRedes}
              onChange={handleChange}
              onKeyDown={handleOutrasRedesKeyDown}
            />
          </div>
        </CardContent>
      </Card>

      {/* Alerta de erro - RODAPÉ */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" type="button" onClick={() => navigate('/sgte/cadastro-militares')}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} icon={<Save size={18} />}>
          {loading ? 'Salvando...' : 'Salvar Registro do Militar'}
        </Button>
      </div>
    </form>
  );
}
