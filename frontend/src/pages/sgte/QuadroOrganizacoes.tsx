import { useState } from 'react';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Calendar as CalendarIcon, List as ListIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { DataTable, type Column } from '../../components/ui/DataTable';

interface Activity {
  id: number;
  title: string;
  date: Date;
  type: string;
  description: string;
}

// Mock data for activities
const initialActivities: Activity[] = [
  { id: 1, title: 'TFM Centralizado', date: new Date(new Date().getFullYear(), new Date().getMonth(), 5), type: 'rotina', description: 'Treinamento Físico Militar com todo o batalhão.' },
  { id: 2, title: 'Formatura Geral', date: new Date(new Date().getFullYear(), new Date().getMonth(), 10), type: 'solenidade', description: 'Formatura de entrega de braçais.' },
  { id: 3, title: 'Inspeção de Armamento', date: new Date(new Date().getFullYear(), new Date().getMonth(), 15), type: 'inspecao', description: 'Inspeção inopinada de armamento leve da Cia.' },
  { id: 4, title: 'Campo de Instrução', date: new Date(new Date().getFullYear(), new Date().getMonth(), 20), type: 'instrucao', description: 'Exercício no terreno de 3 dias.' },
];

const typeColors: Record<string, string> = {
  rotina: 'bg-blue-50 text-blue-700',
  solenidade: 'bg-purple-50 text-purple-700',
  inspecao: 'bg-orange-50 text-orange-700',
  instrucao: 'bg-green-50 text-green-700',
};

export function QuadroOrganizacoes() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // State for activities and modal
  const [activities, setActivities] = useState(initialActivities);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState('rotina');
  const [newDesc, setNewDesc] = useState('');

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getActivitiesForDay = (day: number) => {
    return activities.filter(
      (a) =>
        a.date.getDate() === day &&
        a.date.getMonth() === currentDate.getMonth() &&
        a.date.getFullYear() === currentDate.getFullYear()
    );
  };

  const handleAddActivity = () => {
    if (!newTitle || !newDate) return;

    // Converte a string 'YYYY-MM-DD' gerada pelo input type="date" para objeto Date no timezone local
    const [year, month, day] = newDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);

    const newActivity = {
      id: Date.now(),
      title: newTitle,
      date: dateObj,
      type: newType,
      description: newDesc,
    };

    setActivities((prev) => [...prev, newActivity]);
    
    // Reset e Fechar
    setNewTitle('');
    setNewDate('');
    setNewType('rotina');
    setNewDesc('');
    setIsModalOpen(false);
  };

  const renderCalendar = () => {
    const days = [];
    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    // Empty slots for days before the 1st
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 border border-gray-100 bg-gray-50/50"></div>);
    }

    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const dayActivities = getActivitiesForDay(i);
      const isToday = 
        new Date().getDate() === i && 
        new Date().getMonth() === currentDate.getMonth() && 
        new Date().getFullYear() === currentDate.getFullYear();

      days.push(
        <div key={i} className={`h-32 border border-gray-200 p-2 flex flex-col overflow-y-auto ${isToday ? 'bg-militar-light/5' : 'bg-white'}`}>
          <div className="flex justify-between items-center mb-1">
            <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-militar-main text-white' : 'text-gray-700'}`}>
              {i}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {dayActivities.map(act => (
              <div 
                key={act.id} 
                className={`text-xs px-2 py-1 rounded-md truncate cursor-pointer hover:opacity-80 transition-opacity font-medium ${typeColors[act.type] || 'bg-gray-100 text-gray-700'}`}
                title={act.description}
              >
                {act.title}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800 capitalize">{monthName}</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={prevMonth} icon={<ChevronLeft size={18} />} />
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
            <Button variant="outline" size="sm" onClick={nextMonth} icon={<ChevronRight size={18} />} />
          </div>
        </div>
        <div className="grid grid-cols-7 bg-gray-100 border-b border-gray-200">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-r last:border-r-0 border-gray-200">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 bg-white">
          {days}
        </div>
      </div>
    );
  };

  const renderList = () => {
    const columns: Column<Activity>[] = [
      { header: 'Data', accessor: (row) => row.date.toLocaleDateString('pt-BR') },
      { header: 'Atividade', accessor: 'title' },
      { 
        header: 'Tipo', 
        accessor: (row) => {
          const dotColors: Record<string, string> = {
            rotina: 'bg-blue-500',
            solenidade: 'bg-purple-500',
            inspecao: 'bg-orange-500',
            instrucao: 'bg-green-500'
          };
          const dotColor = dotColors[row.type] || 'bg-gray-400';
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${typeColors[row.type] || 'bg-gray-100 text-gray-700'}`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColor}`}></span>
              {row.type}
            </span>
          );
        }
      },
      { header: 'Descrição', accessor: 'description' }
    ];

    return (
      <Card>
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={[...activities].sort((a, b) => a.date.getTime() - b.date.getTime())} 
            keyExtractor={(row) => row.id}
          />
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <Breadcrumb
            items={[
              { label: 'Gestão de Pessoas' },
              { label: 'Quadro de Organizações' }
            ]}
          />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Agenda da Companhia</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quadro de organizações, atividades e eventos planejados.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === 'calendar' ? 'bg-white text-militar-main shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarIcon size={16} />
              Calendário
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === 'list' ? 'bg-white text-militar-main shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ListIcon size={16} />
              Lista
            </button>
          </div>
          <Button icon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>
            Nova Atividade
          </Button>
        </div>
      </div>

      <div className="mt-6">
        {view === 'calendar' ? renderCalendar() : renderList()}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Cadastrar Nova Atividade"
      >
        <div className="space-y-4">
          <Input 
            label="Título da Atividade" 
            placeholder="Ex: TFM Centralizado" 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              type="date" 
              label="Data" 
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
            <Select 
              label="Tipo de Atividade" 
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
            >
              <option value="rotina">Rotina</option>
              <option value="solenidade">Solenidade</option>
              <option value="inspecao">Inspeção</option>
              <option value="instrucao">Instrução</option>
            </Select>
          </div>
          <Input 
            label="Descrição (Opcional)" 
            placeholder="Detalhes adicionais da atividade"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddActivity}>Salvar Atividade</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
