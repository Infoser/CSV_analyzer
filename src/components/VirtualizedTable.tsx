'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { cn, truncate } from '@/lib/utils';
import { Search, Filter, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

interface VirtualizedTableProps {
  headers: string[];
  rows: Record<string, string>[];
  title?: string;
  rowsPerPage?: number;
  searchable?: boolean;
  onRowClick?: (row: Record<string, string>, index: number) => void;
  className?: string;
  itemHeight?: number;
  containerHeight?: number;
}

export function VirtualizedTable({
  headers,
  rows,
  title,
  rowsPerPage = 50,
  searchable = true,
  onRowClick,
  className,
  itemHeight = 48,
  containerHeight = 600,
}: VirtualizedTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(headers);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  
  const tableRef = useRef<HTMLDivElement>(null);

  const filteredRows = useMemo(() => {
    if (!searchQuery) return rows;
    const query = searchQuery.toLowerCase();
    return rows.filter(row =>
      headers.some(header => 
        String(row[header] || '').toLowerCase().includes(query)
      )
    );
  }, [rows, headers, searchQuery]);

  const visibleStartIndex = Math.floor(scrollTop / itemHeight);
  const visibleEndIndex = Math.min(
    visibleStartIndex + Math.ceil(containerHeight / itemHeight) + 1,
    filteredRows.length
  );

  const visibleRows = filteredRows.slice(visibleStartIndex, visibleEndIndex);
  const totalHeight = filteredRows.length * itemHeight;
  const offsetY = visibleStartIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const toggleColumn = useCallback((column: string) => {
    setVisibleColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  }, []);

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
                  onChange={(e) => setSearchQuery(e.target.value)}
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

      <div 
        ref={tableRef}
        className="relative"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
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
              <div 
                style={{ 
                  position: 'absolute', 
                  top: offsetY, 
                  left: 0, 
                  right: 0 
                }}
              >
                {visibleRows.map((row, rowIndex) => {
                  const actualIndex = visibleStartIndex + rowIndex;
                  return (
                    <tr
                      key={actualIndex}
                      onClick={() => onRowClick?.(row, actualIndex)}
                      className={cn(
                        'transition-colors',
                        onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      )}
                      style={{ height: itemHeight }}
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
                  );
                })}
              </div>
            </tbody>
          </table>
        </div>
      </div>

      {filteredRows.length > rowsPerPage && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {visibleStartIndex + 1} to {Math.min(visibleEndIndex, filteredRows.length)} of {filteredRows.length} rows
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const scrollContainer = tableRef.current;
                if (scrollContainer) {
                  scrollContainer.scrollTop = Math.max(0, scrollContainer.scrollTop - containerHeight);
                }
              }}
              className={cn(
                'p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400',
                'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
              )}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const scrollContainer = tableRef.current;
                if (scrollContainer) {
                  scrollContainer.scrollTop = Math.min(
                    scrollContainer.scrollHeight - scrollContainer.clientHeight,
                    scrollContainer.scrollTop + containerHeight
                  );
                }
              }}
              className={cn(
                'p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400',
                'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
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