export const Colors = {
  light: {
    primary: '#222',
    secondary: '#fff',
    accent: '#e60000',
    muted: '#f5f5f5',
    border: '#e0e0e0',
    text: '#222',
    background: '#fff',
    error: '#d32f2f',
    success: '#388e3c',
  },
  dark: {
    primary: '#fff',
    secondary: '#181818',
    accent: '#e60000',
    muted: '#232323',
    border: '#333',
    text: '#fff',
    background: '#181818',
    error: '#f44336',
    success: '#4caf50',
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
  small: 5,
  medium: 10,
  large: 15,
  round: 50,
}; 