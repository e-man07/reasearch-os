/**
 * Design System Tokens for ResearchOS
 * Dark monochromatic theme with consistent spacing and typography
 */

// Spacing System (4px grid)
export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem',  // 8px
  md: '1rem',    // 16px
  lg: '1.5rem',  // 24px
  xl: '2rem',    // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
} as const

// Typography Scale
export const typography = {
  hero: 'text-5xl font-bold',
  title: 'text-3xl font-semibold',
  subtitle: 'text-xl font-semibold',
  body: 'text-base',
  small: 'text-sm',
  tiny: 'text-xs',
} as const

// Layout Containers
export const containers = {
  page: 'max-w-6xl mx-auto px-6 py-12',
  section: 'max-w-6xl mx-auto px-6 py-6',
  narrow: 'max-w-4xl mx-auto px-6',
} as const

// Grid Gaps
export const gaps = {
  default: 'gap-6',
  tight: 'gap-4',
  loose: 'gap-8',
} as const

// Component Padding
export const padding = {
  card: 'p-6',
  button: 'px-6 py-3',
  input: 'px-4 py-3',
} as const

// Border Radius (from shadcn)
export const radius = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
} as const

// Shadow System
export const shadows = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
} as const

// Animation Durations
export const durations = {
  fast: 'duration-150',
  normal: 'duration-200',
  slow: 'duration-300',
} as const

// Consistent Component Classes
export const components = {
  // Card styles
  card: 'bg-card text-card-foreground border border-border rounded-lg shadow-sm',
  cardHover: 'hover:border-accent transition-colors',

  // Button variants (rely on shadcn Button component)
  buttonPrimary: 'bg-primary text-primary-foreground',
  buttonSecondary: 'bg-secondary text-secondary-foreground',
  buttonGhost: 'bg-transparent',

  // Input styles
  input: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',

  // Text colors
  textPrimary: 'text-foreground',
  textSecondary: 'text-muted-foreground',
  textMuted: 'text-muted-foreground/70',

  // Status colors
  statusPending: 'bg-muted text-muted-foreground',
  statusRunning: 'bg-accent text-accent-foreground',
  statusComplete: 'bg-primary/10 text-foreground',
  statusError: 'bg-destructive/10 text-destructive',
} as const

// Page Layout Patterns
export const layouts = {
  // Two-column layout
  twoColumn: 'grid lg:grid-cols-2 gap-8',

  // Three-column grid
  threeColumn: 'grid grid-cols-1 md:grid-cols-3 gap-6',

  // Stats grid
  statsGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',

  // Form layout
  form: 'space-y-6',

  // List layout
  list: 'space-y-4',
} as const

// Helper function to combine classes
export const cx = (...classes: (string | undefined | false)[]) => {
  return classes.filter(Boolean).join(' ')
}
