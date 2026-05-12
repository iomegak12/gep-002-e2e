import { create } from 'zustand';

const TOKEN_KEY = 'gep.token';

function readToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export const useAuthStore = create((set, get) => ({
  token: readToken(),
  user: null,
  status: 'idle', // 'idle' | 'loading' | 'authenticated' | 'unauthenticated'

  setToken: (token) => {
    try {
      if (token) sessionStorage.setItem(TOKEN_KEY, token);
      else sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    set({ token });
  },

  setUser: (user) => set({ user, status: user ? 'authenticated' : 'unauthenticated' }),

  setStatus: (status) => set({ status }),

  clear: () => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    set({ token: null, user: null, status: 'unauthenticated' });
  },

  hasRole: (role) => {
    const u = get().user;
    return Boolean(u && u.roles && u.roles.includes(role));
  },

  hasAnyRole: (roles) => {
    const u = get().user;
    if (!u || !u.roles) return false;
    return roles.some((r) => u.roles.includes(r));
  },
}));
