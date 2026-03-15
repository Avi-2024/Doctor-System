export const designSystem = {
  colors: {
    primary: '#2563EB',
    secondary: '#0EA5E9',
    background: '#F1F5F9',
    card: '#FFFFFF',
    sidebar: '#0F172A',
    border: '#E2E8F0',
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  },
  typography: {
    pageTitle: { fontSize: '24px', fontWeight: 600, lineHeight: '32px' },
    sectionTitle: { fontSize: '18px', fontWeight: 600, lineHeight: '28px' },
    cardLabel: { fontSize: '14px', fontWeight: 500, lineHeight: '20px' },
    body: { fontSize: '14px', fontWeight: 400, lineHeight: '20px' },
    small: { fontSize: '12px', fontWeight: 400, lineHeight: '16px' },
  },
  spacing: [4, 8, 16, 24, 32, 40],
  radius: {
    card: 16,
    pill: 999,
  },
  shadows: {
    card: '0 10px 30px rgba(15, 23, 42, 0.08)',
    lift: '0 14px 36px rgba(15, 23, 42, 0.12)',
  },
  iconSystem: {
    library: 'lucide-react',
    defaultSize: 18,
    mutedColor: '#64748B',
    accentColor: '#2563EB',
  },
  componentStates: {
    hoverLift: 'translateY(-2px)',
    focusRing: '0 0 0 2px rgba(37, 99, 235, 0.30)',
    disabledOpacity: 0.6,
    pressedScale: 0.98,
  },
};

export const statusVariants = {
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
  neutral: 'neutral',
};
