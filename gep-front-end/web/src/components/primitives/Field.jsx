import { cn } from '@/lib/cn';

let idCounter = 0;
function useFieldId(passed) {
  if (passed) return passed;
  // eslint-disable-next-line no-plusplus
  return `field-${++idCounter}`;
}

export function Field({ id, label, help, error, required, children, className }) {
  const fid = useFieldId(id);
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label ? (
        <label htmlFor={fid} className="text-label-caps uppercase text-on-surface-variant">
          {label}
          {required ? <span className="ml-1 text-error">*</span> : null}
        </label>
      ) : null}
      {typeof children === 'function' ? children({ id: fid, invalid: Boolean(error) }) : children}
      {error ? (
        <span className="text-body-sm text-error">{error}</span>
      ) : help ? (
        <span className="text-body-sm text-on-surface-variant">{help}</span>
      ) : null}
    </div>
  );
}
