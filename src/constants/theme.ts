/**
 * VocalFlow design tokens. See DESIGN_SPEC §2.
 *
 * Light mode only for v1 — `app.json` pins `userInterfaceStyle: "light"`, so
 * nothing here branches on colour scheme.
 */

import type { TextStyle, ViewStyle } from 'react-native';

import {
  displaySize,
  isCompact,
  isShort,
  MAX_CONTENT_WIDTH,
  ms,
  msExact,
} from '@/constants/responsive';

export const Colors = {
  canvas: '#F7F5FF',
  surface: '#FFFFFF',
  violetTint: '#EEEAFE',
  blueTint: '#EAF2FF',
  line: '#E2DDF7',
  ink: '#1B1340',
  body: '#4A4570',
  muted: '#6B668F',
  violet: '#6A48F0',
  violetDeep: '#5B3FE0',
  blue: '#3F6FE8',
  blueText: '#1F5FD6',
  mint: '#0E7C66',
  mintTint: '#E4F7F1',
  amber: '#8A5A00',
  amberTint: '#FFF3D6',
  rose: '#B3245A',
  roseTint: '#FDEBF2',
  glowViolet: '#CBBFFF',
  glowBlue: '#A9C8FF',
} as const;

export const Gradients = {
  primary: [Colors.violet, Colors.blue] as const,
};

/**
 * The "blade corner": one nearly-square corner. Reserved for the primary CTA,
 * the Home hero card and the Results focus card. Nothing else gets it.
 */
export const Blade = {
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  borderBottomLeftRadius: 28,
  borderBottomRightRadius: 6,
} as const;

export const Radius = { card: 20, chip: 16, pill: 999, cta: 28 } as const;

export const Spacing = {
  xs: ms(4),
  sm: ms(8),
  md: ms(16),
  lg: ms(24),
  xl: ms(32),
  xxl: ms(48),
} as const;

/**
 * The gutter gives before anything else on a narrow phone, and the gap
 * between sections gives before anything else on a short one, so the CTA
 * stays where it was drawn (DESIGN_SPEC §S1: shrink the bars, never the
 * buttons).
 */
export const Layout = {
  page: isCompact ? 18 : ms(24),
  card: isCompact ? 16 : ms(20),
  gap: ms(16),
  section: isShort ? 24 : ms(32),
  /** Never scaled: 48 dp is the accessibility floor, not a preference. */
  minTouch: 48,
  /** Primary CTA height. Shrinks only on genuinely short screens. */
  cta: isShort ? 52 : 56,
} as const;

/**
 * Every screen's content column. Phones fill the width; on a tablet or an
 * unfolded foldable the column stops growing and centres instead, so a line
 * of body copy never runs the full 800 pt.
 */
export const ContentColumn: ViewStyle = {
  width: '100%',
  maxWidth: MAX_CONTENT_WIDTH,
  alignSelf: 'center',
};

/** Violet-tinted, never grey. Only the hero card, focus card and mic button. */
export const Shadow: ViewStyle = {
  shadowColor: Colors.violet,
  shadowOpacity: 0.12,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 10 },
  elevation: 4,
};

/**
 * Phase 5 swaps `fontFamily` in once the Google fonts load. Until then these
 * resolve to the system face, which is why every style also carries weight.
 */
export const Fonts = {
  display: 'BricolageGrotesque_800ExtraBold',
  title: 'BricolageGrotesque_700Bold',
  body: 'InstrumentSans_400Regular',
  bodyMedium: 'InstrumentSans_500Medium',
  bodyStrong: 'InstrumentSans_600SemiBold',
} as const;

type TypeScale =
  | 'display'
  | 'title1'
  | 'title2'
  | 'heading'
  | 'metric'
  | 'body'
  | 'bodyStrong'
  | 'caption';

export const Type: Record<TypeScale, TextStyle> = {
  // `display` steps down by breakpoint rather than by ratio: at 44 pt its
  // longest line ("We'll hear the rest.") overflows any phone under ~430 pt.
  display: {
    fontSize: displaySize,
    lineHeight: Math.round(displaySize * 1.05),
    letterSpacing: displaySize * -0.041,
    fontWeight: '800',
  },
  // Capped at `display`: on a 320 pt phone the display steps down further
  // than the moderate scale does, and title1 must never overtake it.
  title1: {
    fontSize: Math.min(ms(32), displaySize),
    lineHeight: Math.min(ms(36), Math.round(displaySize * 1.12)),
    letterSpacing: msExact(-1.0),
    fontWeight: '800',
  },
  title2: { fontSize: ms(24), lineHeight: ms(28), letterSpacing: msExact(-0.6), fontWeight: '700' },
  heading: { fontSize: ms(18), lineHeight: ms(24), letterSpacing: msExact(-0.2), fontWeight: '700' },
  metric: {
    fontSize: ms(40),
    lineHeight: ms(40),
    letterSpacing: msExact(-1.0),
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  body: { fontSize: ms(16), lineHeight: ms(24), fontWeight: '400' },
  bodyStrong: { fontSize: ms(16), lineHeight: ms(24), fontWeight: '600' },
  caption: { fontSize: ms(13), lineHeight: ms(18), letterSpacing: msExact(0.1), fontWeight: '500' },
};
