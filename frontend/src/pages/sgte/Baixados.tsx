import { useState, useEffect } from 'react';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Input, Select } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import type { Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Search, XCircle } from 'lucide-react';
import { api } from '../../services/api';

interface VisitaMedica {
  id: number;
  militarId: number | null;
  pgMilitar: string;
  nomeCompletoMilitar: string;
  nomeGuerraMilitar: string;
  motivoVisita: string;
  dataVisita: string;
  baixado: 'Sim' | 'Não';
  medicoResponsavel: string;
  parecerMedico: string;
  obs: string;
  baixadoInfo?: {
    id: number;
    motivo: string;
    dataInicio: string;
    dataRetorno: string;
    csd: string[];
    outroCsd?: string;
  } | null;
}

const PG_FORMAT_MAP: Record<string, string> = {
  'cel': 'CEL',
  'tc': 'TC',
  'maj': 'MAJ',
  'cap': 'CAP',
  '1ten': '1º TEN',
  '2ten': '2º TEN',
  'asp': 'ASP',
  'st': 'ST',
  '1sgt': '1º SGT',
  '2sgt': '2º SGT',
  '3sgt': '3º SGT',
  'cb': 'CB',
  'sdep': 'SD EP',
  'sdev': 'SD EV'
};

function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
}

export function Baixados() {
  const [visitas, setVisitas] = useState<VisitaMedica[]>([]);
  const [militares, setMilitares] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pelotaoFilter, setPelotaoFilter] = useState('Todos');
  const [pgFilter, setPgFilter] = useState('Todos');
  const [dispensaFilter, setDispensaFilter] = useState('Todos');

  const handleClearFilters = () => {
    setSearchTerm('');
    setPelotaoFilter('Todos');
    setPgFilter('Todos');
    setDispensaFilter('Todos');
  };

  const loadData = async () => {
    try {
      const [visitasRes, milRes] = await Promise.all([
        api.get('/atendimentos/visitas'),
        api.get('/militares')
      ]);
      setVisitas(visitasRes.data || []);
      setMilitares(milRes.data || []);
    } catch (err) {
      console.error('Erro ao carregar dados dos baixados:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar apenas as visitas que resultaram em Baixa Médica (baixado === 'Sim')
  const baixadosList = visitas.filter(v => v.baixado === 'Sim');

  // Filtros aplicados
  const filteredBaixados = baixadosList.filter(v => {
    const mil = militares.find(m => m.id === v.militarId);
    const rawPg = mil ? mil.posto : v.pgMilitar;
    const formattedPg = PG_FORMAT_MAP[rawPg.toLowerCase()] || rawPg.toUpperCase();
    const nomeGuerra = mil ? (mil.nome_guerra || mil.nome) : v.nomeGuerraMilitar;
    const pelotao = mil ? mil.pelotao : 'Não informado';

    const matchesSearch = 
      nomeGuerra.toLowerCase().includes(searchTerm.toLowerCase()) || 
      formattedPg.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.baixadoInfo?.motivo || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPelotao = 
      pelotaoFilter === 'Todos' || 
      (pelotao || '').toLowerCase() === pelotaoFilter.toLowerCase();

    const matchesPg = 
      pgFilter === 'Todos' || 
      formattedPg === pgFilter;

    const matchesDispensa = 
      dispensaFilter === 'Todos' || 
      (v.baixadoInfo?.csd && v.baixadoInfo.csd.includes(dispensaFilter)) ||
      (dispensaFilter === 'Outro' && !!v.baixadoInfo?.outroCsd);

    return matchesSearch && matchesPelotao && matchesPg && matchesDispensa;
  });

  const PG_ORDER = [
    'CEL', 'TC', 'MAJ', 'CAP', '1º TEN', '2º TEN', 'ASP',
    'ST', '1º SGT', '2º SGT', '3º SGT', 'CB', 'SD EP', 'SD EV'
  ];

  // Obter P/G disponíveis para o filtro
  const pgOptions = Array.from(
    new Set(
      baixadosList.map(v => {
        const mil = militares.find(m => m.id === v.militarId);
        const rawPg = mil ? mil.posto : v.pgMilitar;
        return PG_FORMAT_MAP[rawPg.toLowerCase()] || rawPg.toUpperCase();
      })
    )
  ).sort((a, b) => {
    const idxA = PG_ORDER.indexOf(a);
    const idxB = PG_ORDER.indexOf(b);
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });

  // Obter pelotões disponíveis para o filtro
  const pelotaoOptions = Array.from(
    new Set(militares.map(m => m.pelotao).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const columns: Column<VisitaMedica>[] = [
    { 
      header: 'P/G NOME DE GUERRA', 
      accessor: (row: VisitaMedica) => {
        const mil = militares.find(m => m.id === row.militarId);
        const rawPg = mil ? mil.posto : row.pgMilitar;
        const formattedPg = PG_FORMAT_MAP[rawPg.toLowerCase()] || rawPg.toUpperCase();
        const nomeGuerra = mil ? (mil.nome_guerra || mil.nome) : row.nomeGuerraMilitar;
        return (
          <span className="font-semibold text-gray-900">
            {formattedPg} {nomeGuerra}
          </span>
        );
      }
    },
    {
      header: 'Pelotão',
      accessor: (row: VisitaMedica) => {
        const mil = militares.find(m => m.id === row.militarId);
        return mil?.pelotao || 'Não informado';
      }
    },
    { 
      header: 'Dia Inicio', 
      accessor: (row: VisitaMedica) => formatShortDate(row.dataVisita)
    },
    {
      header: 'Dia Retorno',
      accessor: (row: VisitaMedica) => {
        return row.baixadoInfo ? formatShortDate(row.baixadoInfo.dataRetorno) : '-';
      }
    },
    {
      header: 'Situação / Dias Restantes',
      accessor: (row: VisitaMedica) => {
        if (!row.baixadoInfo?.dataRetorno) return '-';
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const dataRetornoDate = new Date(row.baixadoInfo.dataRetorno + 'T00:00:00');
        dataRetornoDate.setHours(0, 0, 0, 0);
        
        const diffTime = dataRetornoDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          return (
            <Badge variant="success">
              Dispensa de militar finalizada
            </Badge>
          );
        } else if (diffDays === 0) {
          return (
            <Badge variant="danger" className="animate-pulse">
              Retorna hoje
            </Badge>
          );
        } else {
          return (
            <span className="text-sm font-bold text-amber-600">
              {diffDays} dia(s) restante(s)
            </span>
          );
        }
      }
    }
  ];

  const renderExpandedRow = (row: VisitaMedica) => {
    const dias = row.baixadoInfo && row.dataVisita && row.baixadoInfo.dataRetorno
      ? Math.ceil((new Date(row.baixadoInfo.dataRetorno + 'T12:00:00').getTime() - new Date(row.dataVisita + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return (
      <div className="p-4 bg-gray-50/60 rounded-xl border border-gray-200 space-y-4">
        {/* ENFASE AS DISPENSAS (CSD) */}
        {((row.baixadoInfo?.csd && row.baixadoInfo.csd.length > 0) || !!row.baixadoInfo?.outroCsd) && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Search size={14} className="text-amber-600" />
              DISPENSAS ATIVAS (CSD)
            </h4>
            <div className="flex flex-wrap gap-2">
              {row.baixadoInfo?.csd?.map(c => (
                <span key={c} className="px-3.5 py-1.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg text-amber-950 font-bold text-xs shadow-sm transition-all">
                  {c}
                </span>
              ))}
              {row.baixadoInfo?.outroCsd && (
                <span className="px-3.5 py-1.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg text-amber-950 font-bold text-xs shadow-sm transition-all">
                  {row.baixadoInfo.outroCsd}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Motivo da Baixa</h4>
              <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                <p className="text-sm text-gray-700 font-medium">{row.baixadoInfo?.motivo || 'Não informado.'}</p>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Parecer Médico</h4>
              <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm min-h-[60px]">
                <p className="text-sm text-gray-700 whitespace-pre-line">{row.parecerMedico || 'Nenhum parecer cadastrado.'}</p>
              </div>
            </div>
          </div>
          <div>
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Detalhes do Afastamento</h4>
              <div className="p-4 bg-red-50/50 border border-red-100 rounded-lg shadow-sm space-y-2">
                <div className="text-sm">
                  <span className="text-gray-600 font-medium">Médico Responsável:</span>{' '}
                  <strong className="text-gray-900">{row.medicoResponsavel}</strong>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600 font-medium">Dias Totais de Baixa:</span>{' '}
                  <strong className="text-gray-900">{dias} dia(s)</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Militares Baixados</h1>
          <Breadcrumb items={[{ label: 'Saúde' }, { label: 'Baixados' }]} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Buscar militar ou motivo</label>
            <Input 
              placeholder="Digite para filtrar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>
          <div className="w-40">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Filtrar por P/G</label>
            <Select value={pgFilter} onChange={(e) => setPgFilter(e.target.value)}>
              <option value="Todos">Todos</option>
              {pgOptions.map(pg => (
                <option key={pg} value={pg}>{pg}</option>
              ))}
            </Select>
          </div>
          <div className="w-48">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Filtrar por Pelotão</label>
            <Select value={pelotaoFilter} onChange={(e) => setPelotaoFilter(e.target.value)}>
              <option value="Todos">Todos</option>
              {pelotaoOptions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>
          </div>
          <div className="w-48">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Filtrar por Dispensa (CSD)</label>
            <Select value={dispensaFilter} onChange={(e) => setDispensaFilter(e.target.value)}>
              <option value="Todos">Todos</option>
              <option value="TFM">TFM</option>
              <option value="Formatura">Formatura</option>
              <option value="Serviço">Serviço</option>
              <option value="Outro">Outro</option>
            </Select>
          </div>
          {(searchTerm || pgFilter !== 'Todos' || pelotaoFilter !== 'Todos' || dispensaFilter !== 'Todos') && (
            <Button 
              variant="outline" 
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 h-10 border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 hover:bg-red-50/50"
            >
              <XCircle size={15} />
              Limpar Filtros
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <DataTable 
            columns={columns}
            data={filteredBaixados}
            keyExtractor={(row) => row.id}
            renderExpandedRow={renderExpandedRow}
          />
        </div>
      </div>
    </div>
  );
}
