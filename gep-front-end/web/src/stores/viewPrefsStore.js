import { create } from 'zustand';

const KEY = 'gep.viewPrefs';
const VALID_VIEWS = ['grid', 'card', 'kanban'];

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(map) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export const useViewPrefsStore = create((set, get) => ({
  prefs: readAll(),

  get: (screenKey, fallback = 'grid') => {
    const v = get().prefs[screenKey];
    return VALID_VIEWS.includes(v) ? v : fallback;
  },

  set: (screenKey, view) => {
    if (!VALID_VIEWS.includes(view)) return;
    const next = { ...get().prefs, [screenKey]: view };
    writeAll(next);
    set({ prefs: next });
  },
}));
