import { Card } from '@/components/primitives/Card';
import { Skeleton } from '@/components/primitives/Skeleton';
import { cn } from '@/lib/cn';

/**
 * Renders items as a responsive card grid.
 * Pass `renderCard(item)` to control card content. The wrapper supplies the Card chrome.
 */
export function CardView({
  items,
  renderCard,
  isLoading,
  emptyState,
  onItemClick,
  rowKey = 'id',
  className,
}) {
  if (!isLoading && (!items || items.length === 0)) {
    return emptyState || null;
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-widget-gap sm:grid-cols-2 xl:grid-cols-3',
        className
      )}
    >
      {isLoading
        ? Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))
        : items.map((item, i) => {
            const key = item?.[rowKey] ?? i;
            return (
              <Card
                key={key}
                onClick={onItemClick ? () => onItemClick(item) : undefined}
                className={cn(
                  'transition-colors',
                  onItemClick && 'cursor-pointer hover:border-primary'
                )}
              >
                {renderCard ? renderCard(item) : null}
              </Card>
            );
          })}
    </div>
  );
}
