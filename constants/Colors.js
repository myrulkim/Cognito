const DarkTheme = {
  bg: {
    primary: '#0A0A12',
    card: '#13131F',
    elevated: '#1A1A2E',
  },
  border: {
    subtle: 'rgba(255,255,255,0.06)',
  },
  accent: {
    primary: '#7C3AED',
    primaryLight: '#A78BFA',
    secondary: '#6366F1',
    secondaryLight: '#818CF8',
    success: '#34D399',
    danger: '#F87171',
    warn: '#FBBF24',
  },
  text: {
    primary: '#F1F5F9',
    secondary: '#8E8E93',
    accent: '#A78BFA',
  },
  glow: {
    violet: 'rgba(124,58,237,0.3)',
    success: 'rgba(52,211,153,0.3)',
    danger: 'rgba(248,113,113,0.3)',
  },
  tabIconDefault: '#64748B',
  tabIconSelected: '#A78BFA',
  statusBarStyle: 'light',
};

const LightTheme = {
  bg: {
    primary: '#F8FAFC',
    card: '#FFFFFF',
    elevated: '#F1F5F9',
  },
  border: {
    subtle: 'rgba(0,0,0,0.1)',
  },
  accent: {
    primary: '#7C3AED',
    primaryLight: '#8B5CF6',
    secondary: '#4F46E5',
    secondaryLight: '#6366F1',
    success: '#10B981',
    danger: '#EF4444',
    warn: '#F59E0B',
  },
  text: {
    primary: '#0F172A',
    secondary: '#64748B',
    accent: '#7C3AED',
  },
  glow: {
    violet: 'rgba(124,58,237,0.15)',
    success: 'rgba(16,185,129,0.15)',
    danger: 'rgba(239,68,68,0.15)',
  },
  tabIconDefault: '#94A3B8',
  tabIconSelected: '#7C3AED',
  statusBarStyle: 'dark',
};

export const Colors = { ...DarkTheme };

const listeners = [];

export const registerThemeListener = (callback) => {
  listeners.push(callback);
  return () => {
      const idx = listeners.indexOf(callback);
      if (idx > -1) listeners.splice(idx, 1);
  };
};

export const changeAppTheme = (mode) => {
  const newTheme = mode === 'light' ? LightTheme : DarkTheme;
  Object.assign(Colors, newTheme);
  listeners.forEach(cb => cb(mode));
};