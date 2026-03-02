import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserResponse } from "../types/api";

interface AuthState {
  token: string | null;
  user: UserResponse | null;
  setToken: (token: string | null) => void;
  setUser: (user: UserResponse | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setToken: (token) => {
        set({
          token,
          user: token ? get().user : null,
        });
      },
      setUser: (user) => set({ user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    {
      name: "ecg-auth",
      partialize: (state) => ({ token: state.token }),
    },
  ),
);
