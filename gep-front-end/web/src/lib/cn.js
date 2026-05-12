/** Minimal className joiner — keeps the dependency footprint small. */
export function cn(...parts) {
  const out = [];
  for (const p of parts) {
    if (!p) continue;
    if (typeof p === 'string') out.push(p);
    else if (Array.isArray(p)) out.push(cn(...p));
    else if (typeof p === 'object') {
      for (const k of Object.keys(p)) if (p[k]) out.push(k);
    }
  }
  return out.join(' ');
}
