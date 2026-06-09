import { useState } from 'react';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FileText, Search, Printer, CheckCircle } from 'lucide-react';

interface EngajamentoMilitar {
  id: number;
  postoGraduacao: string;
  nomeGuerra: string;
  status: 'Aguardando' | 'Apto' | 'Inapto';
  justificativa: string;
}

const initialData: EngajamentoMilitar[] = [
  { id: 3, postoGraduacao: '1º Ten', nomeGuerra: 'ALMEIDA', status: 'Aguardando', justificativa: '' },
  { id: 5, postoGraduacao: 'Cb', nomeGuerra: 'LIMA', status: 'Apto', justificativa: 'Comportamento Excelente' },
  { id: 6, postoGraduacao: 'Sd', nomeGuerra: 'SANTOS', status: 'Inapto', justificativa: 'Punições disciplinares no período' },
  { id: 8, postoGraduacao: '1º Ten', nomeGuerra: 'MARTINS', status: 'Aguardando', justificativa: '' },
  { id: 10, postoGraduacao: 'Cb', nomeGuerra: 'RIBEIRO', status: 'Apto', justificativa: '' },
];

export function Engajamento() {
  const [militares, setMilitares] = useState<EngajamentoMilitar[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedMilitar, setSelectedMilitar] = useState<EngajamentoMilitar | null>(null);

  const handleStatusChange = (id: number, newStatus: string) => {
    setMilitares(militares.map(m => m.id === id ? { ...m, status: newStatus as any } : m));
  };

  const handleJustificativaChange = (id: number, newText: string) => {
    setMilitares(militares.map(m => m.id === id ? { ...m, justificativa: newText } : m));
  };

  const handleGenerateContract = (militar: EngajamentoMilitar) => {
    if (militar.status !== 'Apto') {
      alert('Contrato só pode ser gerado para militares APTOS.');
      return;
    }
    setSelectedMilitar(militar);
    setIsContractModalOpen(true);
  };

  const filteredData = militares.filter(m => 
    m.nomeGuerra.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.postoGraduacao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: any[] = [
    { 
      header: 'Militar', 
      accessor: (row: EngajamentoMilitar) => (
        <span className="font-semibold text-gray-900">{row.postoGraduacao} {row.nomeGuerra}</span>
      )
    },
    { 
      header: 'Situação', 
      accessor: (row: EngajamentoMilitar) => (
        <Select 
          value={row.status} 
          onChange={(e) => handleStatusChange(row.id, e.target.value)}
          className={`w-36 text-sm ${row.status === 'Apto' ? 'text-green-700 bg-green-50 border-green-200' : row.status === 'Inapto' ? 'text-red-700 bg-red-50 border-red-200' : 'text-yellow-700 bg-yellow-50 border-yellow-200'}`}
        >
          <option value="Aguardando">Aguardando</option>
          <option value="Apto">Apto</option>
          <option value="Inapto">Inapto</option>
        </Select>
      )
    },
    { 
      header: 'Justificativa', 
      accessor: (row: EngajamentoMilitar) => (
        <Input 
          value={row.justificativa} 
          onChange={(e) => handleJustificativaChange(row.id, e.target.value)}
          placeholder="Motivo..."
        />
      )
    },
    {
      header: 'Ações',
      accessor: (row: EngajamentoMilitar) => (
        <Button 
          size="sm" 
          variant={row.status === 'Apto' ? 'primary' : 'outline'}
          disabled={row.status !== 'Apto'}
          onClick={() => handleGenerateContract(row)}
          icon={<FileText size={16} />}
        >
          Gerar Contrato
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Engajamento</h1>
          <Breadcrumb items={[{ label: 'Gestão de Pessoas' }, { label: 'Engajamento' }]} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
        <div className="mb-4 bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3 border border-blue-100">
           <CheckCircle className="mt-0.5 text-blue-600" size={18} />
           <div className="text-sm">
             Esta lista exibe apenas os <strong>Militares Temporários</strong>. Avalie o engajamento alterando a situação para "Apto" ou "Inapto", preencha a justificativa se necessário, e gere o contrato de renovação para os militares aptos.
           </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Buscar</label>
            <Input 
              placeholder="Digite P/G ou Nome de Guerra..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button icon={<Search size={16} />} size="md">Filtrar</Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <DataTable 
            columns={columns}
            data={filteredData}
            keyExtractor={(row) => row.id}
          />
        </div>
      </div>

      {/* Modal - Gerar Contrato */}
      <Modal 
        isOpen={isContractModalOpen} 
        onClose={() => setIsContractModalOpen(false)} 
        title="Gerar Contrato de Engajamento"
      >
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 leading-relaxed font-mono">
            <strong>MINISTÉRIO DA DEFESA</strong><br />
            EXÉRCITO BRASILEIRO<br /><br />
            <strong>TERMO DE PRORROGAÇÃO DE TEMPO DE SERVIÇO</strong><br /><br />
            O(A) {selectedMilitar?.postoGraduacao} {selectedMilitar?.nomeGuerra}, tendo sido julgado(a) APTA(O) para a prorrogação do tempo de serviço militar, nos termos da legislação vigente...
            <br /><br />
            <em>[Documento demonstrativo de contrato gerado automaticamente pelo sistema SIGE-EB para o militar selecionado]</em>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setIsContractModalOpen(false)}>
              Fechar
            </Button>
            <Button icon={<Printer size={16} />} onClick={() => {
              alert('Impressão do contrato enviada!');
              setIsContractModalOpen(false);
            }}>
              Imprimir Contrato
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
