/**
 * Design tokens for use in JS/TS (e.g. charts, programmatic styles).
 * Tailwind/CSS source of truth is globals.css @theme — keep values in sync.
 */
export const colors = {
  navy: {
    50: "#f0f4f8",
    100: "#d9e2ec",
    200: "#bcccdc",
    300: "#9fb3c8",
    400: "#829ab1",
    500: "#627d98",
    600: "#486581",
    700: "#334e68",
    800: "#243b53",
    900: "#102a43",
    950: "#0a1929",
  },

  gold: {
    50: "#fffbea",
    100: "#fff3c4",
    200: "#fce588",
    300: "#fadb5f",
    400: "#f7c948",
    500: "#f0b429",
    600: "#de911d",
    700: "#cb6e17",
    800: "#b44d12",
    900: "#8d2b0b",
  },

  confidence: {
    high: "#10B981",
    medium: "#F59E0B",
    low: "#EF4444",
    unknown: "#6B7280",
  },

  status: {
    draft: "#6B7280",
    active: "#3B82F6",
    scored: "#8B5CF6",
    pushed: "#10B981",
    rejected: "#EF4444",
    expired: "#9CA3AF",
  },

  bg: {
    primary: "#0a1929",
    secondary: "#102a43",
    tertiary: "#243b53",
    surface: "#334e68",
    overlay: "rgba(10,25,41,0.8)",
  },

  text: {
    primary: "#f0f4f8",
    secondary: "#9fb3c8",
    muted: "#627d98",
    inverse: "#102a43",
    gold: "#f0b429",
  },

  border: {
    default: "#334e68",
    hover: "#486581",
    focus: "#f0b429",
    error: "#EF4444",
  },
} as const;

export const typography = {
  fontFamily: {
    sans: '"Inter", "Noto Sans Arabic", system-ui, -apple-system, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
    arabic: '"Noto Sans Arabic", "Segoe UI", "Tahoma", sans-serif',
  },

  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
  },

  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },

  lineHeight: {
    tight: "1.25",
    normal: "1.5",
    relaxed: "1.75",
  },
} as const;

export const spacing = {
  px: "1px",
  0: "0",
  0.5: "0.125rem",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
} as const;

export const borderRadius = {
  none: "0",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  full: "9999px",
} as const;

export const shadows = {
  sm: "0 1px 2px rgba(0,0,0,0.3)",
  md: "0 4px 6px rgba(0,0,0,0.3)",
  lg: "0 10px 15px rgba(0,0,0,0.3)",
  glow: "0 0 20px rgba(240,180,41,0.15)",
} as const;

export const transitions = {
  fast: "150ms ease",
  normal: "250ms ease",
  slow: "350ms ease",
} as const;
