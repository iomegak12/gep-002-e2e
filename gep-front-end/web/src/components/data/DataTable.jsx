import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Skeleton } from '@/components/primitives/Skeleton';
import { cn } from '@/lib/cn';

/**
 * Headless TanStack Table wrapper. Pagination, filtering and KPIs live OUTSIDE the table —
 * this component only knows about column rendering and sorting.
 *
 * - `columns` follows TanStack column-def shape (header, accessorKey/accessorFn, cell, meta).
 * - Pass `meta: { align: 'right' | 'mono' }` on a column to right-align or render mono.
 * - `onRowClick(row)` makes rows clickable.
 */
export function DataTable({
  columns,
  data,
  isLoading,
  emptyState,
  errorState,
  onRowClick,
  rowKey = 'id',
  className,
}) {
  const [sorting, setSorting] = useState([]);
  const table = useReactTable({
    data: data || [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row, i) => String(row?.[rowKey] ?? i),
  });

  if (errorState) return errorState;

  return (
    <div className={cn('overflow-x-auto rounded-2xl border border-outline-variant bg-surface', className)}>
      <table className="w-full border-collapse text-body-base">
        <thead className="sticky top-0 bg-surface-container-low">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-outline-variant">
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sortDir = header.column.getIsSorted();
                const align = header.column.columnDef.meta?.align;
                return (
                  <th
                    key={header.id}
                    className={cn(
                      'select-none px-3 py-2 text-label-caps uppercase text-on-surface-variant',
                      align === 'right' ? 'text-right' : 'text-left'
                    )}
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        disabled={!canSort}
                        className={cn(
                          'inline-flex items-center gap-1',
                          canSort ? 'cursor-pointer hover:text-on-surface' : 'cursor-default',
                          align === 'right' ? 'flex-row-reverse' : ''
                        )}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort ? (
                          sortDir === 'asc' ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : sortDir === 'desc' ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 opacity-40" />
                          )
                        ) : null}
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b border-outline-variant/50">
                {columns.map((_c, j) => (
                  <td key={j} className="px-3 py-2">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-0">
                {emptyState || (
                  <div className="p-8 text-center text-body-base text-on-surface-variant">
                    No results
                  </div>
                )}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                className={cn(
                  'border-b border-outline-variant/50 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-surface-container-low'
                )}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta || {};
                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        'px-3 py-2 text-on-surface',
                        meta.align === 'right' && 'text-right',
                        meta.mono && 'font-mono'
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
