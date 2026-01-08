import { create } from "zustand";

const STORAGE_KEY = "towmech_token";

type AuthState = {
  token: string | null;
  isHydrated: boolean;
  setToken: (token: string) => void;
  logout: () => void;
  hydrate: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isHydrated: false,
  setToken: (token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, token);
    }
    set({ token });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({ token: null });
  },
  hydrate: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem(STORAGE_KEY);
      set({ token, isHydrated: true });
    } else {
      set({ isHydrated: true });
    }
  },
}));

export const authStorageKey = STORAGE_KEY;
