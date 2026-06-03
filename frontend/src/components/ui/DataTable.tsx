import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
}

export function DataTable<T>({ columns, data, keyExtractor }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 w-12">
              <input type="checkbox" className="rounded border-gray-300 text-militar-main focus:ring-militar-main" />
            </th>
            {columns.map((col, idx) => (
              <th key={idx} className={`px-6 py-4 font-semibold ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, rowIndex) => (
            <tr key={keyExtractor(row)} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <input type="checkbox" className="rounded border-gray-300 text-militar-main focus:ring-militar-main" />
              </td>
              {columns.map((col, colIndex) => (
                <td key={colIndex} className={`px-6 py-4 text-gray-900 ${col.className || ''}`}>
                  {typeof col.accessor === 'function'
                    ? col.accessor(row)
                    : (row[col.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-gray-500">
                Nenhum registro encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {/* Paginação simples mockada */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
        <span className="text-sm text-gray-500">
          Exibindo 1 a {Math.min(10, data.length)} de {data.length} registros
        </span>
        <div className="flex gap-1">
          <button className="px-3 py-1 border border-gray-200 rounded bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 text-sm">
            Anterior
          </button>
          <button className="px-3 py-1 bg-militar-main text-white rounded hover:bg-militar-hover text-sm">
            1
          </button>
          <button className="px-3 py-1 border border-gray-200 rounded bg-white text-gray-600 hover:bg-gray-50 text-sm">
            2
          </button>
          <button className="px-3 py-1 border border-gray-200 rounded bg-white text-gray-600 hover:bg-gray-50 text-sm">
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
