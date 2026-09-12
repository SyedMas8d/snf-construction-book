export const colors = {
  bg: '#f6f7f9',
  surface: '#ffffff',
  border: '#e4e7ec',
  borderStrong: '#d0d5dd',
  text: '#0f172a',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  onPrimary: '#ffffff',
  primary: 'rgb(237, 81, 91)',
  primaryDark: '#c33d47',
  primaryMuted: '#fdecee',
  success: '#16a34a',
  successMuted: '#ecfdf3',
  danger: '#dc2626',
  dangerMuted: '#fef2f2',
  warning: '#b45309',
  warningMuted: '#fffaeb',
  chipBg: '#eef1f5',
  chipText: '#374151',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, fontWeight: '500', color: colors.textMuted },
  heading: { fontSize: 17, fontWeight: '700', color: colors.text },
  body: { fontSize: 14, fontWeight: '400', color: colors.text },
  bodyStrong: { fontSize: 14, fontWeight: '600', color: colors.text },
  label: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  caption: { fontSize: 12, fontWeight: '500', color: colors.textMuted },
} as const;

export const cardShadow = {
  shadowColor: '#0f172a',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 2,
} as const;
