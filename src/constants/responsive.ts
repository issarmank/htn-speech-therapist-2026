/**
 * Device metrics. The DESIGN_SPEC was drawn at 390 pt wide; real devices run
 * from 320 pt (iPhone SE, Android compacts) to 480 pt foldables and 700 pt+
 * tablets, and the OS text size can add another 30% on top.
 *
 * `app.json` pins `orientation: "portrait"`, so the window's shorter edge is
 * the width and reading it once at module load is stable enough for style
 * tokens. Anything that must survive a live resize — split screen, a device
 * being unfolded — reads `useResponsive()` instead.
 */

import { Dimensions, PixelRatio, useWindowDimensions } from 'react-native';

/** iPhone 14/15. Every size in `theme.ts` is authored against this width. */
const BASE_WIDTH = 390;

const window = Dimensions.get('window');
const shortEdge = Math.min(window.width, window.height);
const longEdge = Math.max(window.width, window.height);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** iPhone SE/8 and Android compacts: the page gutter has to give first. */
export const isCompact = shortEdge < 360;
/** 700, not 768: an iPad mini is 744 pt wide in portrait and reads as one. */
export const isTablet = shortEdge >= 700;
/** iPhone SE 1st gen (568 pt) and small Androids: vertical gaps tighten. */
export const isShort = longEdge < 700;

/**
 * Moderate scale. Type and spacing track device width but never one-for-one:
 * a tablet gets slightly roomier text, not twice the text.
 */
// The floor is 0.92, not the raw 0.82 a 320 pt screen would give: below that
// body copy drops under 15 pt and stops being comfortable to read. A narrow
// phone buys its room back from the gutter (`Layout.page`) instead.
const ratio = clamp(shortEdge / BASE_WIDTH, 0.92, 1.12);

/** Scaled and snapped to the device pixel grid. For sizes and spacing. */
export function ms(size: number): number {
  return PixelRatio.roundToNearestPixel(size * ratio);
}

/** Scaled without rounding. For letter spacing, where 0.25 pt matters. */
export function msExact(size: number): number {
  return size * ratio;
}

/**
 * The display headline is the one size the moderate scale cannot carry. The
 * landing headline's longest line is 20 characters; at the DESIGN_SPEC's
 * 44 pt that needs a ~530 pt screen, so on a phone it would wrap and turn the
 * deliberate two-line break into a four-line rag.
 *
 * These steps are the largest size whose longest line still clears the
 * content width at each breakpoint, so the authored break survives on every
 * device from a 320 pt SE upward.
 */
export const displaySize = isTablet
  ? 46
  : shortEdge >= 460
    ? 40
    : shortEdge >= 420
      ? 36
      : shortEdge >= 390
        ? 32
        : shortEdge >= 360
          ? 30
          : 27;

/** Past this a single column of body text stops being comfortable to read. */
export const MAX_CONTENT_WIDTH = 560;

/**
 * Caps for the OS text size. Headlines stop growing at 130% — the point
 * DESIGN_SPEC §8 requires layouts to survive — while body copy keeps scaling,
 * since every screen it lives on scrolls.
 */
export const MAX_TITLE_SCALE = 1.3;
export const MAX_BODY_SCALE = 1.8;

/** Live metrics. Use in components that must re-layout on a window change. */
export function useResponsive() {
  const { width, height, fontScale } = useWindowDimensions();
  const short = Math.min(width, height);

  return {
    width,
    height,
    fontScale,
    isCompact: short < 360,
    isTablet: short >= 700,
    isShort: height < 700,
    /** Side-by-side metric tiles stop fitting — stack them (DESIGN_SPEC §8). */
    stackTiles: fontScale >= 1.3 || short < 340,
  };
}
