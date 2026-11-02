/** Motion tokens. Springs are Reanimated/Tamagui spring configs; every animation must also honour reduced motion. */
export const spring = {
  /** Buttons, chips, toggles. */
  snappy: { damping: 18, stiffness: 320, mass: 0.6 },
  /** Cards, sheets, layout changes. */
  gentle: { damping: 20, stiffness: 180, mass: 0.9 },
  /** Celebrations and hero entrances only. */
  bouncy: { damping: 10, stiffness: 200, mass: 0.8 },
  /** Press-in feedback on tiles and cards: fast, slightly springy release. */
  press: { damping: 14, stiffness: 420, mass: 0.5 },
  /** Sliding indicators (tab bar pill, page dots). */
  glide: { damping: 22, stiffness: 260, mass: 0.7 },
} as const;

export const motion = {
  pressScale: 0.96,
  hoverLift: -2,
  staggerMs: 50,
  entranceOffset: 12,
  /** Deeper press for large tiles and hero cards. */
  pressScaleDeep: 0.93,
  /** Loop length for ambient aurora drift (only with rich motion). */
  auroraMs: 9000,
  /** Gentle float loop for decorative chips. */
  floatMs: 2600,
  /** Auto-advance interval for promo carousels. */
  carouselMs: 4500,
} as const;

export type MotionPreference = 'full' | 'reduced' | 'off';
