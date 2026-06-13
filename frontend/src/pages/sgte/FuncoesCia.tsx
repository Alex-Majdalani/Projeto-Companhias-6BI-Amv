import React, { useState, useEffect, useCallback } from 'react';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Plus, Search, Edit2, Trash2, Settings, Check, X } from 'lucide-react';
import { militaresMock } from './CadastroMilitares';
import { api } from '../../services/api';

interface FunctionType {
  id: number;
  name: string;
}

interface FunctionAssignment {
  id: number;
  functionName: string;
  effective: string;
  substitute: string;
}

const initialAssignments: FunctionAssignment[] = [
  { id: 1, functionName: 'Of TFM', effective: '1º Ten Rafael', substitute: '2º Ten Marcos' },
  { id: 2, functionName: 'Sgt TFM', effective: '3º Sgt Nogueira', substitute: 'Cb Lucas' },
];

export function FuncoesCia() {
  // States
  const [functionTypes, setFunctionTypes] = useState<FunctionType[]>([]);
  const [assignments, setAssignments] = useState<FunctionAssignment[]>(initialAssignments);
  
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State - Config Function Types
  const [newFunctionTypeName, setNewFunctionTypeName] = useState('');

  // Form State - New Assignment
  const [selectedFunction, setSelectedFunction] = useState('');
  const [effective, setEffective] = useState('');
  const [substitute, setSubstitute] = useState('');

  // Função utilitária para garantir a primeira letra maiúscula conforme regras solicitadas
  const capitalizeFirstLetter = (str: string): string => {
    const match = str.match(/[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/);
    if (match && match.index !== undefined) {
      const idx = match.index;
      return str.slice(0, idx) + str.charAt(idx).toUpperCase() + str.slice(idx + 1);
    }
    return str;
  };

  // Carrega os tipos de funções do banco de dados NocoDB
  const fetchFunctionTypes = useCallback(async () => {
    try {
      const res = await api.get('/funcoes');
      const mapped = res.data.map((f: any) => ({
        id: f.id,
        name: f.funcao
      }));
      setFunctionTypes(mapped);
    } catch (err) {
      console.error('Erro ao carregar tipos de funções:', err);
    }
  }, []);

  useEffect(() => {
    fetchFunctionTypes();
  }, [fetchFunctionTypes]);

  // Estado para controle de edição inline das funções no modal
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  // Handlers for Function Types
  const handleSaveFunctionType = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedName = capitalizeFirstLetter(newFunctionTypeName.trim());
    if (!formattedName) return;

    try {
      const res = await api.post('/funcoes', { funcao: formattedName });
      const newType: FunctionType = {
        id: res.data.id,
        name: res.data.funcao
      };
      
      setFunctionTypes(prev => [...prev, newType]);
      setNewFunctionTypeName('');
    } catch (err) {
      console.error('Erro ao salvar nova função:', err);
      alert('Não foi possível salvar a função no banco de dados.');
    }
  };

  const handleUpdateFunctionType = async (id: number) => {
    const formattedName = capitalizeFirstLetter(editingName.trim());
    if (!formattedName) return;

    try {
      const res = await api.put(`/funcoes/${id}`, { funcao: formattedName });
      setFunctionTypes(prev => prev.map(f => f.id === id ? { ...f, name: res.data.funcao } : f));
      setEditingId(null);
      setEditingName('');
    } catch (err) {
      console.error('Erro ao atualizar função:', err);
      alert('Não foi possível atualizar o nome da função.');
    }
  };

  const handleDeleteFunctionType = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta função?')) {
      try {
        await api.delete(`/funcoes/${id}`);
        setFunctionTypes(prev => prev.filter(f => f.id !== id));
      } catch (err) {
        console.error('Erro ao excluir função:', err);
        alert('Não foi possível excluir a função.');
      }
    }
  };

  // Handlers for Assignments
  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFunction) return;

    const newAssignment: FunctionAssignment = {
      id: assignments.length > 0 ? Math.max(...assignments.map(a => a.id)) + 1 : 1,
      functionName: selectedFunction,
      effective: effective.trim(),
      substitute: substitute.trim()
    };

    setAssignments([...assignments, newAssignment]);
    setIsAssignmentModalOpen(false);

    // Reset Form
    setSelectedFunction('');
    setEffective('');
    setSubstitute('');
  };

  const handleDeleteAssignment = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta designação?')) {
      setAssignments(assignments.filter(a => a.id !== id));
    }
  };

  // Derived state
  const filteredAssignments = assignments.filter(a => 
    a.functionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.effective.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.substitute.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: any[] = [
    { header: 'Função', accessor: 'functionName' },
    { header: 'Militar Efetivo', accessor: 'effective' },
    { header: 'Militar Substituto', accessor: 'substitute' },
    {
      header: 'Ações',
      accessor: (row: FunctionAssignment) => (
        <div className="flex gap-2 text-gray-400">
          <button className="p-1 hover:text-militar-main transition-colors border border-gray-200 rounded">
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => handleDeleteAssignment(row.id)}
            className="p-1 hover:text-red-500 transition-colors border border-gray-200 rounded"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Funções Cia</h1>
          <Breadcrumb items={[{ label: 'Gestão de Pessoas' }, { label: 'Funções Cia' }]} />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsConfigModalOpen(true)} variant="outline" icon={<Settings size={16} />}>
            Configurar Funções
          </Button>
          <Button onClick={() => {
            if (!selectedFunction && functionTypes.length > 0) {
              setSelectedFunction(functionTypes[0].name);
            }
            setIsAssignmentModalOpen(true);
          }} icon={<Plus size={16} />}>
            Nova Designação
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Buscar</label>
            <Input 
              placeholder="Digite função ou nome..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button icon={<Search size={16} />} size="md">Filtrar</Button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
           <span className="text-sm text-gray-600">Total de <strong className="text-gray-900">{filteredAssignments.length}</strong> designações encontradas</span>
        </div>

        {/* Table */}
        <DataTable 
          columns={columns}
          data={filteredAssignments}
          keyExtractor={(row) => row.id}
        />
      </div>

      {/* Modal - Nova Designação */}
      <Modal 
        isOpen={isAssignmentModalOpen} 
        onClose={() => setIsAssignmentModalOpen(false)} 
        title="Cadastrar Designação de Função"
      >
        <form onSubmit={handleSaveAssignment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Função
            </label>
            <Select 
              required
              value={selectedFunction}
              onChange={(e) => setSelectedFunction(e.target.value)}
            >
              <option value="" disabled>Selecione uma função</option>
              {functionTypes.map(f => (
                <option key={f.id} value={f.name}>
                  {f.name}
                </option>
              ))}
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Militar Efetivo
            </label>
            <Input 
              required
              list="militares-list"
              placeholder="Digite para buscar..." 
              value={effective}
              onChange={(e) => setEffective(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Militar Substituto
            </label>
            <Input 
              list="militares-list"
              placeholder="Digite para buscar (Opcional)" 
              value={substitute}
              onChange={(e) => setSubstitute(e.target.value)}
            />
          </div>

          <datalist id="militares-list">
            {militaresMock.map(m => (
              <option key={m.id} value={`${m.posto} ${m.nome}`} />
            ))}
          </datalist>

          <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setIsAssignmentModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Designação
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal - Configurar Funções */}
      <Modal 
        isOpen={isConfigModalOpen} 
        onClose={() => setIsConfigModalOpen(false)} 
        title="Configurar Tipos de Função"
      >
        <div className="space-y-6">
          <form onSubmit={handleSaveFunctionType} className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800">Adicionar Nova Função</h3>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome da Função</label>
                <Input 
                  required 
                  placeholder="Ex: Sargenteante" 
                  value={newFunctionTypeName} 
                  onChange={e => setNewFunctionTypeName(e.target.value)} 
                  onBlur={() => setNewFunctionTypeName(capitalizeFirstLetter(newFunctionTypeName))}
                />
              </div>
              <Button type="submit" size="md" icon={<Plus size={16} />}>Adicionar</Button>
            </div>
          </form>

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Funções Cadastradas</h3>
            {functionTypes.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma função cadastrada.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto pr-2">
                <ul className="space-y-2">
                  {functionTypes.map(f => {
                    const isEditing = editingId === f.id;
                    return (
                      <li key={f.id} className="flex justify-between items-center bg-white border border-gray-200 p-3 rounded-lg shadow-sm gap-2">
                        {isEditing ? (
                          <Input 
                            value={editingName} 
                            onChange={e => setEditingName(e.target.value)} 
                            onBlur={() => setEditingName(capitalizeFirstLetter(editingName))}
                            className="flex-1 text-sm py-1"
                            autoFocus
                          />
                        ) : (
                          <span className="block text-sm font-medium text-gray-900">{f.name}</span>
                        )}
                        <div className="flex gap-1.5">
                          {isEditing ? (
                            <>
                              <button 
                                onClick={() => handleUpdateFunctionType(f.id)}
                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                title="Salvar"
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingId(null);
                                  setEditingName('');
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                title="Cancelar"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => {
                                  setEditingId(f.id);
                                  setEditingName(f.name);
                                }}
                                className="p-2 text-gray-400 hover:text-militar-main hover:bg-militar-light/10 rounded-md transition-colors"
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteFunctionType(f.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button 
              onClick={() => setIsConfigModalOpen(false)}
              disabled={editingId !== null}
            >
              Concluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
