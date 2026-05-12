import { create } from 'zustand';

const THEME_KEY = 'gep.theme';
const VALID = ['light', 'dark', 'system'];

function readStored() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return VALID.includes(v) ? v : 'system';
  } catch {
    return 'system';
  }
}

function systemPrefersDark() {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

function applyTheme(theme) {
  const effective = theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme;
  const root = document.documentElement;
  if (effective === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  return effective;
}

export const useThemeStore = create((set, get) => ({
  theme: readStored(),
  effective: readStored() === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : readStored(),

  setTheme: (next) => {
    if (!VALID.includes(next)) return;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
    const effective = applyTheme(next);
    set({ theme: next, effective });
  },

  /** Called once on app boot. Returns an unsubscribe fn. */
  bootstrap: () => {
    const current = get().theme;
    const effective = applyTheme(current);
    set({ effective });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (get().theme === 'system') {
        const eff = applyTheme('system');
        set({ effective: eff });
      }
    };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  },
}));
