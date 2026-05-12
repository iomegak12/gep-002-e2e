import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Drawer({ open, onClose, title, side = 'right', width = 'w-96', children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const sideClass =
    side === 'right' ? 'right-0 border-l' : 'left-0 border-r';

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/50" onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose?.();
    }}>
      <aside
        className={cn(
          'absolute top-0 h-full bg-surface border-outline-variant flex flex-col',
          sideClass,
          width
        )}
      >
        <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
          <h2 className="text-title-sm text-on-surface">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container-high"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">{children}</div>
        {footer ? (
          <div className="border-t border-outline-variant px-4 py-3 flex items-center justify-end gap-2">
            {footer}
          </div>
        ) : null}
      </aside>
    </div>,
    document.body
  );
}
