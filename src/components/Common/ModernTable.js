import React, { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react';

const ModernTable = ({ 
  columns, 
  data, 
  sortable = true, 
  className = '',
  onRowClick,
  loading = false 
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    if (!sortable) return;
    
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  if (loading) {
    return (
      <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl p-8 animate-pulse">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-white/20 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl overflow-hidden shadow-glass ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border-b border-white/20">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider ${
                    sortable && column.sortable !== false ? 'cursor-pointer hover:bg-white/10 transition-colors' : ''
                  }`}
                  onClick={() => sortable && column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {sortable && column.sortable !== false && (
                      <div className="flex flex-col">
                        <ChevronUpIcon 
                          className={`h-3 w-3 ${
                            sortConfig.key === column.key && sortConfig.direction === 'asc'
                              ? 'text-primary-600'
                              : 'text-gray-400'
                          }`}
                        />
                        <ChevronDownIcon 
                          className={`h-3 w-3 -mt-1 ${
                            sortConfig.key === column.key && sortConfig.direction === 'desc'
                              ? 'text-primary-600'
                              : 'text-gray-400'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {sortedData.map((row, index) => (
              <tr
                key={index}
                className={`transition-all duration-200 hover:bg-white/10 ${
                  onRowClick ? 'cursor-pointer' : ''
                } animate-fade-in`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sortedData.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No hay datos disponibles</div>
        </div>
      )}
    </div>
  );
};

export default ModernTable;