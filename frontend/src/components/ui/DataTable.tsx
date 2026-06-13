import React, { useState, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';


export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  renderExpandedRow?: (row: T) => React.ReactNode;
  // Propriedades opcionais para controlar checkboxes de seleção externamente
  selectedRows?: Set<string | number>;
  onSelectedRowsChange?: (selected: Set<string | number>) => void;
}

export function DataTable<T>({ 
  columns, 
  data, 
  keyExtractor, 
  renderExpandedRow,
  selectedRows: externalSelectedRows,
  onSelectedRowsChange
}: DataTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());
  const [animatingRows, setAnimatingRows] = useState<Set<string | number>>(new Set());
  
  // ── ESTADO INTERNO DE SELEÇÃO (USADO APENAS CASO NÃO FOR CONTROLADO) ──────
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string | number>>(new Set());

  // Define se usa os dados externos ou o estado interno
  const selectedRows = externalSelectedRows ?? internalSelectedRows;
  const updateSelectedRows = (newSet: Set<string | number>) => {
    if (onSelectedRowsChange) {
      onSelectedRowsChange(newSet);
    } else {
      setInternalSelectedRows(newSet);
    }
  };

  // ── ESTADO PARA CONTROLE DE PAGINAÇÃO ──────────────────────────────────────
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10; // Limite de 10 registros por página

  const toggleRow = (key: string | number) => {
    const newExpanded = new Set(expandedRows);
    const newAnimating = new Set(animatingRows);
    if (newExpanded.has(key)) {
      newAnimating.add(key);
      newExpanded.delete(key);
      setExpandedRows(newExpanded);
      setAnimatingRows(newAnimating);
      
      setTimeout(() => {
        setAnimatingRows((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, 250);
    } else {
      newExpanded.add(key);
      setExpandedRows(newExpanded);
    }
  };

  // ── PAGINAÇÃO: CÁLCULOS ────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  
  // Garante que a página atual não fique fora do limite caso os dados mudem
  const activePage = Math.min(currentPage, totalPages);

  // Filtra os dados exibidos com base na página atual
  const paginatedData = useMemo(() => {
    const startIndex = (activePage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  }, [data, activePage]);

  const startIndex = (activePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, data.length);

  // ── CONTROLE DO CHECKBOX DE SELECIONAR TODAS ──────────────────────────────
  // Verifica se todas as linhas da página ATUAL estão selecionadas
  const isAllSelected = useMemo(() => {
    if (paginatedData.length === 0) return false;
    return paginatedData.every((row) => selectedRows.has(keyExtractor(row)));
  }, [paginatedData, selectedRows, keyExtractor]);

  // Manipulador para marcar/desmarcar todas as linhas da página atual
  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSelected = new Set(selectedRows);
    if (e.target.checked) {
      // Adiciona todos os itens da página atual
      paginatedData.forEach((row) => {
        newSelected.add(keyExtractor(row));
      });
    } else {
      // Remove todos os itens da página atual
      paginatedData.forEach((row) => {
        newSelected.delete(keyExtractor(row));
      });
    }
    updateSelectedRows(newSelected);
  };

  // Manipulador para alternar seleção de uma linha individual
  const handleRowSelectChange = (key: string | number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    updateSelectedRows(newSelected);
  };

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 1000px;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 1;
            transform: translateY(0);
            max-height: 1000px;
          }
          to {
            opacity: 0;
            transform: translateY(-8px);
            max-height: 0;
          }
        }
        .animate-slide-down {
          animation: slideDown 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          overflow: hidden;
        }
        .animate-slide-up {
          animation: slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          overflow: hidden;
        }
      `}} />
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
          <tr>
            {renderExpandedRow ? (
              <th className="px-6 py-4 w-12" />
            ) : (
              <th className="px-6 py-4 w-12">
                <input 
                  type="checkbox" 
                  checked={isAllSelected}
                  onChange={handleSelectAllChange}
                  className="rounded border-gray-300 text-militar-main focus:ring-militar-main cursor-pointer" 
                />
              </th>
            )}
            {columns.map((col, idx) => (
              <th key={idx} className={`px-6 py-4 font-semibold ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {paginatedData.map((row) => {
            const rowKey = keyExtractor(row);
            const isExpanded = expandedRows.has(rowKey);
            const isChecked = selectedRows.has(rowKey);

            return (
              <React.Fragment key={rowKey}>
                <tr 
                  className={`transition-colors ${renderExpandedRow ? 'cursor-pointer hover:bg-gray-50' : 'hover:bg-gray-50'} ${isExpanded ? 'bg-gray-50' : ''}`}
                  onClick={() => renderExpandedRow && toggleRow(rowKey)}
                >
                  {renderExpandedRow ? (
                    <td className="px-6 py-4 w-12 text-center">
                      <ChevronRight 
                        size={16} 
                        className={`text-gray-400 transition-transform duration-200 inline-block ${isExpanded ? 'rotate-90 text-militar-main' : ''}`}
                      />
                    </td>
                  ) : (
                    <td className="px-6 py-4 w-12" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => handleRowSelectChange(rowKey)}
                        className="rounded border-gray-300 text-militar-main focus:ring-militar-main cursor-pointer" 
                      />
                    </td>
                  )}
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={`px-6 py-4 text-gray-900 ${col.className || ''}`}>
                      {typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : (row[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
                 {renderExpandedRow && (isExpanded || animatingRows.has(rowKey)) && (
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <td colSpan={columns.length + 1} className="px-6 py-4 overflow-hidden">
                      <div className={isExpanded ? 'animate-slide-down' : 'animate-slide-up'}>
                        {renderExpandedRow(row)}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
          {paginatedData.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-gray-500">
                Nenhum registro encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      
      {/* ── PAGINAÇÃO INTELIGENTE ────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
        <span className="text-sm text-gray-500">
          Exibindo {data.length > 0 ? startIndex + 1 : 0} a {endIndex} de {data.length} registros
        </span>
        <div className="flex gap-1">
          {/* Botão Anterior: só aparece se houver página anterior */}
          {activePage > 1 && (
            <button 
              onClick={() => setCurrentPage(activePage - 1)}
              className="px-3 py-1 border border-gray-200 rounded bg-white text-gray-600 hover:bg-gray-50 text-sm cursor-pointer"
            >
              Anterior
            </button>
          )}

          {/* Números das páginas: exibidos de forma dinâmica e coerente */}
          {Array.from({ length: totalPages }, (_, idx) => {
            const pageNum = idx + 1;
            const isCurrent = pageNum === activePage;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1 text-sm rounded cursor-pointer ${
                  isCurrent 
                    ? 'bg-militar-main text-white hover:bg-militar-hover font-semibold' 
                    : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {/* Botão Próximo: só aparece se houver página posterior */}
          {activePage < totalPages && (
            <button 
              onClick={() => setCurrentPage(activePage + 1)}
              className="px-3 py-1 border border-gray-200 rounded bg-white text-gray-600 hover:bg-gray-50 text-sm cursor-pointer"
            >
              Próxima
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
