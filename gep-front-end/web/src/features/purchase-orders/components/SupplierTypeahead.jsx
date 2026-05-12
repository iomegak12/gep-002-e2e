import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Check, X } from 'lucide-react';
import { Input } from '@/components/primitives/Input';
import { Skeleton } from '@/components/primitives/Skeleton';
import { supplierApi } from '@/api/supplierApi';
import { qk } from '@/api/queryKeys';
import { SUPPLIER_CATEGORY_LABELS } from '@/constants/supplierCatalog';
import { cn } from '@/lib/cn';

/**
 * Async combobox for picking an ACTIVE supplier.
 * - `value` is a supplier id (string). `onChange(id, supplier)` reports both.
 * - Calls supplierApi.search(q) with a 250 ms debounce.
 */
export function SupplierTypeahead({ value, onChange, placeholder = 'Search suppliers…', error }) {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(id);
  }, [q]);

  // Hydrate selected display when value is passed in initially (edit flow).
  const detail = useQuery({
    queryKey: qk.suppliers.detail(value),
    queryFn: () => supplierApi.get(value),
    enabled: Boolean(value) && !selected,
  });
  useEffect(() => {
    if (detail.data && !selected) setSelected(detail.data);
  }, [detail.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const search = useQuery({
    queryKey: qk.suppliers.search(debounced),
    queryFn: () => supplierApi.search({ q: debounced }),
    enabled: open && debounced.length >= 1,
    staleTime: 30_000,
  });

  // Backend search may not enforce ACTIVE-only — apply on the client too.
  const results = useMemo(() => {
    const raw = search.data;
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.items)
          ? raw.items
          : Array.isArray(raw?.results)
            ? raw.results
            : [];
    return list.filter((s) => s.status === 'ACTIVE');
  }, [search.data]);

  useEffect(() => {
    function onClick(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function pick(supplier) {
    setSelected(supplier);
    setQ('');
    setOpen(false);
    onChange?.(supplier.id, supplier);
  }
  function clear() {
    setSelected(null);
    setQ('');
    onChange?.('', null);
  }

  return (
    <div className="relative" ref={wrapRef}>
      {selected ? (
        <div
          className={cn(
            'flex items-center justify-between gap-3 rounded-lg border bg-surface-container-low px-3 py-2',
            error ? 'border-error' : 'border-outline-variant'
          )}
        >
          <div className="min-w-0">
            <div className="truncate text-body-base text-on-surface">
              {selected.display_name || selected.legal_name}
            </div>
            <div className="truncate font-mono text-body-sm text-on-surface-variant">
              {selected.supplier_code} ·{' '}
              {SUPPLIER_CATEGORY_LABELS[selected.category] || selected.category} ·{' '}
              {selected.country}
            </div>
          </div>
          <button
            type="button"
            onClick={clear}
            aria-label="Clear supplier"
            className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container-high"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <Input
            type="text"
            value={q}
            placeholder={placeholder}
            invalid={Boolean(error)}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="pl-9"
          />
        </div>
      )}

      {open && !selected ? (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-auto rounded-lg border border-outline-variant bg-surface shadow-lg">
          {debounced.length < 1 ? (
            <div className="p-3 text-body-sm text-on-surface-variant">
              Type to search active suppliers.
            </div>
          ) : search.isLoading ? (
            <div className="flex flex-col gap-2 p-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="p-3 text-body-sm text-on-surface-variant">
              No active suppliers match "{debounced}".
            </div>
          ) : (
            <ul role="listbox">
              {results.slice(0, 12).map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    role="option"
                    onClick={() => pick(s)}
                    className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left hover:bg-surface-container-low"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-body-base text-on-surface">
                        {s.display_name || s.legal_name}
                      </div>
                      <div className="truncate font-mono text-body-sm text-on-surface-variant">
                        {s.supplier_code} ·{' '}
                        {SUPPLIER_CATEGORY_LABELS[s.category] || s.category} · {s.country}
                      </div>
                    </div>
                    <Check className="mt-1 h-4 w-4 text-primary opacity-0 group-hover:opacity-100" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
