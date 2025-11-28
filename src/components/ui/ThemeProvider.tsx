'use client';

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/lib/stores/themeStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    const apply = () => {
      // Always use light theme
      root.classList.remove('light', 'dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    };

    apply();

    // No need to listen to system preference changes - always use light
  }, [theme, mounted]);

  // Prevent flash of unstyled content
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return <>{children}</>;
} 
