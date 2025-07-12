export const Colors = {
  light: {
    primary: '#1a1a1a',
    secondary: '#ffffff',
    accent: '#dc2626', // News red
    muted: '#f8f8f8',
    border: '#e5e5e5',
    text: '#1a1a1a',
    background: '#f5f5f5',
    error: '#dc2626',
    success: '#16a34a',
  },
  dark: {
    primary: '#ffffff',
    secondary: '#1f1f1f',
    accent: '#ef4444', // Brighter red for dark mode
    muted: '#2a2a2a',
    border: '#404040',
    text: '#ffffff',
    background: '#121212',
    error: '#ef4444',
    success: '#22c55e',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Typography = {
  h1: { fontSize: 32, fontWeight: 'bold' as const },
  h2: { fontSize: 24, fontWeight: 'bold' as const },
  h3: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: 'normal' as const },
  caption: { fontSize: 14, fontWeight: 'normal' as const },
};

export const BorderRadius = {
  small: 4,
  medium: 8,
  large: 12,
  round: 50,
}; 