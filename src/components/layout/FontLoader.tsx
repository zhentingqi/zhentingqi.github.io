'use client';

import { useEffect } from 'react';

export default function FontLoader() {
  useEffect(() => {
    // This runs only on the client after hydration
    const link = document.getElementById('gfonts-css') as HTMLLinkElement;
    if (link && link.media !== 'all') {
      // If already loaded, set immediately
      if (link.sheet) {
        link.media = 'all';
      } else {
        // Otherwise wait for load
        link.addEventListener('load', () => {
          link.media = 'all';
        });
      }
    }
  }, []);

  return null;
}

