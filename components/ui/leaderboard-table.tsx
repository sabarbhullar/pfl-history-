'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  width?: string;
}

interface LeaderboardTableProps<T> {
  data: T[];
  columns: Column<T>[];
  defaultSortKey?: keyof T | string;
  defaultSortDirection?: 'asc' | 'desc';
  linkBuilder?: (row: T) => string;
  className?: string;
}

export function LeaderboardTable<T extends Record<string, any>>({
  data,
  columns,
  defaultSortKey,
  defaultSortDirection = 'desc',
  linkBuilder,
  className,
}: LeaderboardTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<keyof T | string | undefined>(defaultSortKey);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(defaultSortDirection);

  const handleSort = (key: keyof T | string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortKey as keyof T];
      const bValue = b[sortKey as keyof T];

      if (aValue === bValue) return 0;

      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  const RowWrapper = ({ children, row }: { children: React.ReactNode; row: T }) => {
    if (linkBuilder) {
      return (
        <Link href={linkBuilder(row)} className="contents">
          {children}
        </Link>
      );
    }
    return <>{children}</>;
  };

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-accent-primary/30 shadow-[0_0_10px_rgba(0,212,255,0.1)]', className)}>
      <table className="w-full text-sm">
        <thead className="bg-bg-tertiary border-b border-accent-primary/20">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                style={column.width ? { width: column.width } : undefined}
                className={cn(
                  'px-3 py-3 font-semibold text-text-primary whitespace-nowrap',
                  column.sortable !== false && 'cursor-pointer hover:bg-bg-hover select-none',
                  column.headerClassName
                )}
                onClick={() => column.sortable !== false && handleSort(column.key)}
              >
                <div className={cn(
                  'flex items-center gap-1',
                  column.headerClassName?.includes('text-center') && 'justify-center',
                  column.headerClassName?.includes('text-right') && 'justify-end'
                )}>
                  <span>{column.label}</span>
                  {column.sortable !== false && sortKey === column.key && (
                    <span className="text-accent-primary text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-bg-secondary divide-y divide-accent-primary/10">
          {sortedData.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={cn(
                'hover:bg-bg-tertiary transition-colors',
                linkBuilder && 'cursor-pointer'
              )}
              onClick={linkBuilder ? () => window.location.href = linkBuilder(row) : undefined}
            >
              {columns.map((column) => {
                const value = row[column.key as keyof T];
                return (
                  <td
                    key={String(column.key)}
                    className={cn(
                      'px-3 py-3 text-text-secondary whitespace-nowrap',
                      column.className
                    )}
                  >
                    {column.render ? column.render(value, row) : String(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
