import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  isVerified: boolean;
  authProvider?: string;
}

export interface Profile {
  displayName: string;
  currentLevels: {
    kana: string;
    kanji: string;
    vocabulary: string;
    grammar: string;
  };
  dailyGoalMinutes: number;
  timezone: string;
}

interface AuthStore {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setProfile: (profile) => set({ profile }),
      logout: () => set({ user: null, profile: null, isAuthenticated: false }),
    }),
    { name: 'sensai-auth' }
  )
);

interface UIStore {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
