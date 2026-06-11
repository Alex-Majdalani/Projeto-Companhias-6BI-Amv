import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Save, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export function NovoMilitar() {
  const navigate = useNavigate();
  const [fotoUrl, setFotoUrl] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    setFotoUrl('');

    const formData = new FormData();
    formData.append('foto', file);

    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.url) {
        setFotoUrl(response.data.url);
      }
    } catch (err: any) {
      console.error('Erro ao fazer upload da foto:', err);
      setUploadError(err.response?.data?.error || 'Erro ao enviar foto para o servidor.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
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
          <Button variant="outline" onClick={() => navigate('/sgte/cadastro-militares')} icon={<X size={18} />}>
            Cancelar
          </Button>
          <Button icon={<Save size={18} />}>
            Salvar Registro
          </Button>
        </div>
      </div>

      {/* Identificação Militar */}
      <Card>
        <CardHeader>
          <CardTitle>Identificação Militar</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Select label="Posto/Graduação (P/G)" defaultValue="">
            <option value="" disabled>Selecione...</option>
            <option value="cel">Coronel</option>
            <option value="tc">Tenente-Coronel</option>
            <option value="maj">Major</option>
            <option value="cap">Capitão</option>
            <option value="1ten">1º Tenente</option>
            <option value="2ten">2º Tenente</option>
            <option value="asp">Aspirante-a-Oficial</option>
            <option value="st">Subtenente</option>
            <option value="1sgt">1º Sargento</option>
            <option value="2sgt">2º Sargento</option>
            <option value="3sgt">3º Sargento</option>
            <option value="cb">Cabo</option>
            <option value="sd">Soldado</option>
          </Select>
          <Input label="Número" placeholder="Ex: 123" />
          <Input label="Nome de Guerra" placeholder="Ex: Silva" />
          <Select label="Tipo (Carreira/Temporário)">
            <option value="temporario">Militar Temporário</option>
            <option value="carreira">Militar de Carreira</option>
          </Select>

          <Select label="Período Obrigatório">
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </Select>
          <Input label="Seção / Companhia" placeholder="Ex: 1ª Cia Fuz" />
          
          <Input label="Data de Praça" type="date" />
          <Input label="Turma de Formação" placeholder="Ex: 2021" />
          <div className="space-y-2">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Input 
                  label="Foto do Militar" 
                  type="file" 
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="cursor-pointer file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
              </div>
              {fotoUrl && (
                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-300 shadow-inner flex-shrink-0 bg-gray-50 flex items-center justify-center">
                  <img src={fotoUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            
            <p className="text-[11px] text-gray-500 leading-tight">
              <strong>Nota:</strong> A foto deve ser tirada sem cobertura, de gandola com o fundo branco.
            </p>

            {uploading && (
              <div className="flex items-center gap-1.5 text-xs text-blue-600 animate-pulse font-medium">
                <Loader2 size={13} className="animate-spin" />
                <span>Enviando imagem para o MinIO (S3)...</span>
              </div>
            )}

            {fotoUrl && (
              <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                <CheckCircle2 size={13} />
                <span>Foto carregada e salva com sucesso no S3!</span>
              </div>
            )}

            {uploadError && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                <AlertCircle size={13} />
                <span>Erro: {uploadError}</span>
              </div>
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
              <Input label="Nome Completo" placeholder="Nome completo do militar" />
            </div>
            <Input label="Data de Nascimento" type="date" />
            <Input label="Idade" type="number" placeholder="Ex: 25" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input label="Idt Mil (Identidade Militar)" placeholder="000000000-0" />
            <Input label="CPF" placeholder="000.000.000-00" />
            <Input label="Idt Civil" placeholder="00.000.000-0" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Input label="Altura (m)" placeholder="Ex: 1.75" />
            <Select label="Tipo Sanguíneo (TS)">
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="AB">AB</option>
              <option value="O">O</option>
            </Select>
            <Select label="Fator RH">
              <option value="+">Positivo (+)</option>
              <option value="-">Negativo (-)</option>
            </Select>
            <Select label="Cútis">
              <option value="branca">Branca</option>
              <option value="parda">Parda</option>
              <option value="preta">Preta</option>
              <option value="indigena">Indígena</option>
              <option value="amarela">Amarela</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Select label="Olhos">
              <option value="castanhos">Castanhos</option>
              <option value="pretos">Pretos</option>
              <option value="verdes">Verdes</option>
              <option value="azuis">Azuis</option>
            </Select>
            <Select label="Cabelos">
              <option value="castanhos">Castanhos</option>
              <option value="pretos">Pretos</option>
              <option value="loiros">Loiros</option>
              <option value="ruivos">Ruivos</option>
            </Select>
            <Input label="Religião" placeholder="Ex: Católica, Evangélica, etc." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Nome do Pai" placeholder="Nome completo do pai" />
            <Input label="Nome da Mãe" placeholder="Nome completo da mãe" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Select label="Escolaridade">
              <option value="fundamental_inc">Fundamental Incompleto</option>
              <option value="fundamental_com">Fundamental Completo</option>
              <option value="medio_inc">Médio Incompleto</option>
              <option value="medio_com">Médio Completo</option>
              <option value="superior_inc">Superior Incompleto</option>
              <option value="superior_com">Superior Completo</option>
            </Select>
            <Select label="CNH Categoria">
              <option value="nenhuma">Nenhuma</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="AB">AB</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
            </Select>
            <Input label="Cursos Profissionais/Militares" placeholder="Ex: Paraquedista, Informática..." />
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
              <Input label="CEP" placeholder="00000-000" />
            </div>
            <div className="md:col-span-7">
              <Input label="Rua / Logradouro" placeholder="Ex: Av. Duque de Caxias" />
            </div>
            <div className="md:col-span-2">
              <Input label="Número" placeholder="Ex: 123" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input label="Complemento" placeholder="Apto, Bloco, etc." />
            <Input label="Bairro" placeholder="Ex: Centro" />
            <Input label="Cidade/UF" placeholder="Ex: Rio de Janeiro/RJ" />
          </div>
        </CardContent>
      </Card>

      {/* Contato e Emergência */}
      <Card>
        <CardHeader>
          <CardTitle>Contato e Emergência</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Telefone Celular" placeholder="(00) 00000-0000" />
          <Input label="Reside Com" placeholder="Ex: Pais, Esposa, Sozinho" />
          <Input label="Telefone de Emergência" placeholder="(00) 00000-0000" />
          <div className="flex gap-4">
            <div className="flex-1">
              <Input label="Nome para Emergência" placeholder="Ex: Maria (Esposa)" />
            </div>
            <div className="flex-1">
              <Input label="Grau de Parentesco" placeholder="Ex: Mãe, Pai, Cônjuge" />
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
          <Input label="Instagram" placeholder="@usuario" />
          <Input label="Facebook" placeholder="Link ou nome de usuário" />
          <Input label="TikTok" placeholder="@usuario" />
          <Input label="Rede X (Twitter)" placeholder="@usuario" />
          <div className="md:col-span-2">
            <Input label="Outras (LinkedIn, etc)" placeholder="Links separados por vírgula" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={() => navigate('/sgte/cadastro-militares')}>
          Cancelar
        </Button>
        <Button icon={<Save size={18} />}>
          Salvar Registro do Militar
        </Button>
      </div>
    </div>
  );
}
