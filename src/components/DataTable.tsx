'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Search, Filter, Download, Eye, EyeOff } from 'lucide-react';
import { cn, truncate } from '@/lib/utils';
import { CSVRow } from '@/types';

interface DataTableProps {
  headers: string[];
  rows: CSVRow[];
  title?: string;
  showPagination?: boolean;
  rowsPerPage?: number;
  searchable?: boolean;
  onRowClick?: (row: CSVRow, index: number) => void;
  className?: string;
}

export function DataTable({
  headers,
  rows,
  title,
  showPagination = true,
  rowsPerPage = 10,
  searchable = true,
  onRowClick,
  className,
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(headers);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  const filteredRows = useMemo(() => {
    if (!searchQuery) return rows;
    const query = searchQuery.toLowerCase();
    return rows.filter(row =>
      headers.some(header => 
        String(row[header] || '').toLowerCase().includes(query)
      )
    );
  }, [rows, headers, searchQuery]);

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const paginatedRows = showPagination
    ? filteredRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    : filteredRows;

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const toggleColumn = (column: string) => {
    setVisibleColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  if (rows.length === 0) {
    return (
      <div className={cn('rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center', className)}>
        <div className="mx-auto mb-4 p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
          <EyeOff className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
          No data available
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {searchQuery ? 'No rows match your search' : 'Upload a CSV file to see data'}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800', className)}>
      {(title || searchable || headers.length > 8) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          {title && (
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              {title}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({filteredRows.length}/{rows.length})
              </span>
            </h3>
          )}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            {searchable && (
              <div className="relative max-w-xs flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search rows..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            )}
            {headers.length > 8 && (
              <div className="relative">
                <button
                  onClick={() => setShowColumnPicker(!showColumnPicker)}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span>Columns ({visibleColumns.length}/{headers.length})</span>
                </button>
                {showColumnPicker && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 animate-fade-in">
                    {headers.map(header => (
                      <label key={header} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(header)}
                          onChange={() => toggleColumn(header)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{header}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto overflow-y-hidden">
        <table className="w-full min-w-max" role="grid">
          <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900/90 backdrop-blur-sm">
            <tr>
              {visibleColumns.map(header => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap border-b border-gray-200 dark:border-gray-700"
                  style={{ minWidth: '120px', maxWidth: '300px' }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedRows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row, rowIndex)}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50'
                )}
              >
                {visibleColumns.map(header => (
                  <td
                    key={header}
                    className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap border-b border-gray-100 dark:border-gray-800 max-w-[300px] overflow-hidden"
                    title={String(row[header] || '')}
                  >
                    {truncate(String(row[header] || ''), 50)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {(currentPage - 1) * rowsPerPage + 1} to{' '}
            {Math.min(currentPage * rowsPerPage, filteredRows.length)} of{' '}
            {filteredRows.length} rows
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={cn(
                'p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400',
                'hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              )}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={cn(
                'p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400',
                'hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              )}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}