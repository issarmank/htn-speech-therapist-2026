import { Colors } from '@/constants/theme';
import type { PrimaryFocus } from '@/features/api/contracts';

/**
 * Focus is never conveyed by colour alone — every badge carries a glyph and a
 * label too. See DESIGN_SPEC §8.
 */
const FOCUS: Record<PrimaryFocus, { label: string; glyph: string }> = {
  pacing: { label: 'Pace', glyph: '◑' },
  pauses: { label: 'Pauses', glyph: '◔' },
  fillers: { label: 'Fillers', glyph: '◌' },
  repetition: { label: 'Repeats', glyph: '◎' },
  sentence_length: { label: 'Sentence length', glyph: '▤' },
  confidence: { label: 'Confidence', glyph: '✦' },
};

export function focusLabel(focus: PrimaryFocus): string {
  return FOCUS[focus]?.label ?? 'Focus';
}

export function focusGlyph(focus: PrimaryFocus): string {
  return FOCUS[focus]?.glyph ?? '✦';
}

/** Which metric tile gets the emphasis border. `null` means none of them. */
export function emphasisedTile(focus: PrimaryFocus): string | null {
  switch (focus) {
    case 'pacing':
      return 'pace';
    case 'pauses':
      return 'pauses';
    case 'fillers':
      return 'fillers';
    case 'repetition':
      return 'repeats';
    case 'sentence_length':
      return 'sentence';
    default:
      return null;
  }
}

export const FOCUS_TINT = Colors.violetTint;
