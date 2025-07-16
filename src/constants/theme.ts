export const Colors = {
  light: {
    primary: '#1F2937', // Dark gray for primary text
    secondary: '#FFFFFF', // White for cards and surfaces
    accent: '#D97706', // Orange accent color from mockups
    muted: '#F9FAFB', // Very light gray for backgrounds
    border: '#E5E7EB', // Light gray for borders
    text: '#374151', // Dark gray for text
    background: '#F3F4F6', // Light gray for main background
    error: '#EF4444', // Red for errors
    success: '#10B981', // Green for success
    cardBackground: '#FFFFFF', // White for cards
    secondaryText: '#6B7280', // Medium gray for secondary text
  },
  dark: {
    primary: '#F9FAFB', // Light gray for primary text
    secondary: '#1F2937', // Dark gray for cards and surfaces
    accent: '#F59E0B', // Lighter orange for dark mode
    muted: '#111827', // Very dark gray for backgrounds
    border: '#374151', // Medium gray for borders
    text: '#F9FAFB', // Light gray for text
    background: '#0F172A', // Very dark blue-gray for main background
    error: '#F87171', // Lighter red for errors
    success: '#34D399', // Lighter green for success
    cardBackground: '#1F2937', // Dark gray for cards
    secondaryText: '#9CA3AF', // Light gray for secondary text
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  h4: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMedium: { fontSize: 16, fontWeight: '500' as const, lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  captionMedium: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  small: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  smallMedium: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
};

export const BorderRadius = {
  none: 0,
  small: 6,
  medium: 12,
  large: 16,
  xl: 24,
  round: 999,
};

export const Shadow = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
}; 