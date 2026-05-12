import { cn } from '@/lib/cn';

export function RadioGroup({ name, value, onChange, options = [], className }) {
  return (
    <div className={cn('flex flex-col gap-2', className)} role="radiogroup">
      {options.map((opt) => (
        <label
          key={opt.value}
          className="flex items-center gap-2 text-body-base text-on-surface cursor-pointer"
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange?.(opt.value)}
            className="h-4 w-4 border-outline-variant text-secondary focus:ring-secondary"
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
