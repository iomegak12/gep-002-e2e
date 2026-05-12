import { Chip } from '@/components/primitives/Chip';
import { cn } from '@/lib/cn';

/**
 * Strip of "applied" filter chips plus a right-side info slot.
 * `filters` is an array of `{ key, label, onRemove }`. `extras` renders to the right.
 */
export function FilterBar({ filters = [], extras, className }) {
  if (!filters.length && !extras) return null;
  return (
    <div
      className={cn(
        'mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-low px-3 py-2',
        className
      )}
    >
      {filters.map((f) => (
        <Chip key={f.key} onRemove={f.onRemove}>
          {f.label}
        </Chip>
      ))}
      {extras ? <div className="ml-auto flex items-center gap-3">{extras}</div> : null}
    </div>
  );
}
