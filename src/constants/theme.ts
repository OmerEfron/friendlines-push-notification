export const Colors = {
  light: {
    primary: '#000000',
    secondary: '#ffffff',
    accent: '#d62828', // News red
    muted: '#f7f7f7',
    border: '#dddddd',
    text: '#1a1a1a',
    background: '#ffffff',
    error: '#d62828',
    success: '#2d6a4f',
  },
  dark: {
    primary: '#ffffff',
    secondary: '#1a1a1a',
    accent: '#f77f7f',
    muted: '#2a2a2a',
    border: '#404040',
    text: '#ffffff',
    background: '#121212',
    error: '#f77f7f',
    success: '#52b788',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: 'bold' as const },
  h2: { fontSize: 22, fontWeight: 'bold' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: 'normal' as const },
  caption: { fontSize: 13, fontWeight: 'normal' as const },
};

export const BorderRadius = {
  small: 3,
  medium: 6,
  large: 10,
  round: 50,
}; 