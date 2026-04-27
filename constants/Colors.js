// ============================================================
// Colors.js — Cognito Design System (Pristine Light Mode)
// Alif's Palette: Soft Minimalism + Vibrant Indigo/Sky Accents
// ============================================================

export const Colors = {
  bg: {
    primary: '#F8FAFC',   // Pristine white-blue
    card: '#FFFFFF',      // alias for compatibility
    elevated: '#F1F5F9',  // Soft grey for inputs/elevation
    glass: 'rgba(255, 255, 255, 0.7)',
  },
  border: {
    subtle: 'rgba(99, 102, 241, 0.08)', // Indigo-tinted border
    light: 'rgba(0,0,0,0.06)',
  },
  accent: {
    primary: '#6366F1',       // Indigo — main CTA
    primaryLight: '#818CF8',  // Indigo light
    secondary: '#4F46E5',     // Deep Indigo
    sky: '#0EA5E9',           // Sky Blue — reaction/speed
    skyLight: '#38BDF8',      // Sky light
    success: '#10B981',       // Emerald
    danger: '#EF4444',        // Red
    warn: '#F59E0B',          // Amber
    rose: '#F43F5E',          // Rose
  },
  text: {
    primary: '#0F172A',    // Slate 900
    secondary: '#64748B',  // Slate 500
    muted: '#94A3B8',      // Slate 400
    accent: '#6366F1',     // Indigo
    white: '#FFFFFF',
  },
  glow: {
    indigo: 'rgba(99, 102, 241, 0.10)',
    violet: 'rgba(99, 102, 241, 0.10)', // alias — backward compat
    sky: 'rgba(14, 165, 233, 0.10)',
    success: 'rgba(16, 185, 129, 0.10)',
    danger: 'rgba(239, 68, 68, 0.10)',
    warm: 'rgba(245, 158, 11, 0.10)',
  },
  tabIconDefault: '#94A3B8',
  tabIconSelected: '#6366F1',
  statusBarStyle: 'dark',
};

// Stub kept for backward compat — _layout.jsx imports this
const _listeners = new Set();
export const registerThemeListener = (fn) => {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
};