import { Skeleton } from '@/components/primitives/Skeleton';
import { cn } from '@/lib/cn';

/**
 * Read-only Kanban board grouped by a status field.
 * - `columns`: [{ key, label, badgeClass? }, …]
 * - `groupBy`: function(item) → column key
 * - `renderCard`: function(item) → card body
 * - Clicking a card calls `onItemClick(item)`; transitions still happen on the detail page.
 */
export function KanbanBoard({
  items,
  columns,
  groupBy,
  renderCard,
  isLoading,
  onItemClick,
  rowKey = 'id',
  className,
}) {
  const grouped = (columns || []).map((col) => ({
    ...col,
    items: (items || []).filter((it) => groupBy(it) === col.key),
  }));

  return (
    <div
      className={cn(
        'flex gap-widget-gap overflow-x-auto pb-2',
        className
      )}
    >
      {grouped.map((col) => (
        <section
          key={col.key}
          className="flex min-w-[260px] flex-1 flex-col gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-3"
        >
          <header className="flex items-center justify-between">
            <h3 className="text-label-caps uppercase text-on-surface-variant">{col.label}</h3>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-label-caps uppercase',
                col.badgeClass || 'bg-surface-container-high text-on-surface'
              )}
            >
              {col.items.length}
            </span>
          </header>
          <div className="flex flex-col gap-2">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))
              : col.items.length === 0
                ? (
                  <div className="rounded-xl border border-dashed border-outline-variant p-3 text-center text-body-sm text-on-surface-variant">
                    Empty
                  </div>
                )
                : col.items.map((item, i) => {
                    const key = item?.[rowKey] ?? i;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={onItemClick ? () => onItemClick(item) : undefined}
                        className="w-full rounded-xl border border-outline-variant bg-surface p-3 text-left transition-colors hover:border-primary"
                      >
                        {renderCard ? renderCard(item) : null}
                      </button>
                    );
                  })}
          </div>
        </section>
      ))}
    </div>
  );
}
