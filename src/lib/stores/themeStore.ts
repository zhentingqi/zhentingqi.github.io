import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void; // toggles between light/dark (explicit override)
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      // Always use light theme
      theme: 'light',
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      setTheme: (_theme: Theme) => {
        // Force light theme regardless of input
        set({ theme: 'light' });
        updateTheme('light');
      },
      toggleTheme: () => {
        // Always stay on light theme
        set({ theme: 'light' });
        updateTheme('light');
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => { },
          removeItem: () => { },
        };
      }),
    }
  )
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function resolveTheme(_theme: Theme): 'light' | 'dark' {
  // Always return light theme
  return 'light';
}

function updateTheme(theme: Theme) {
  const effective = resolveTheme(theme);
  // Update DOM
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(effective);
  root.setAttribute('data-theme', effective);
}
