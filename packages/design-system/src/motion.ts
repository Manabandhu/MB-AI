/** Motion tokens. Springs are Reanimated/Tamagui spring configs; every animation must also honour reduced motion. */
export const spring = {
  /** Buttons, chips, toggles. */
  snappy: { damping: 18, stiffness: 320, mass: 0.6 },
  /** Cards, sheets, layout changes. */
  gentle: { damping: 20, stiffness: 180, mass: 0.9 },
  /** Celebrations and hero entrances only. */
  bouncy: { damping: 10, stiffness: 200, mass: 0.8 },
} as const;

export const motion = {
  pressScale: 0.96,
  hoverLift: -2,
  staggerMs: 50,
  entranceOffset: 12,
} as const;

export type MotionPreference = 'full' | 'reduced' | 'off';
