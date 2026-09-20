import { Easing } from 'react-native-reanimated';

export const Duration = {
  instant: 120,
  quick: 220,
  base: 360,
  slow: 560,
  hero: 900,
} as const;

export const Ease = {
  enter: Easing.out(Easing.cubic),
  loop: Easing.inOut(Easing.quad),
} as const;

export const Spring = { damping: 18, stiffness: 180, mass: 1 } as const;

/** Stagger step. Used only by the opening sequence and the Results reveal. */
export const STAGGER_STEP = 90;
