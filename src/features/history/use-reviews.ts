import { useCallback, useEffect, useState } from 'react';

import { api } from '@/features/api/client';
import { ApiError, type SpeechReview } from '@/features/api/contracts';

type State = {
  reviews: SpeechReview[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
};

/**
 * Server-side history. There is no local copy: `/reviews` is the record, and
 * `audio_url` inside it is presigned for an hour, so the list has to be
 * re-fetched rather than cached.
 */
export function useReviews(limit = 20) {
  const [state, setState] = useState<State>({
    reviews: [],
    loading: true,
    refreshing: false,
    error: null,
  });

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      setState((prev) => ({
        ...prev,
        loading: mode === 'initial' && prev.reviews.length === 0,
        refreshing: mode === 'refresh',
        error: null,
      }));

      try {
        const reviews = await api.reviews(limit);
        setState({ reviews, loading: false, refreshing: false, error: null });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          refreshing: false,
          // A 401 has already bounced us to the landing screen by this point.
          error:
            error instanceof ApiError ? error.message : 'Could not load your past sessions.',
        }));
      }
    },
    [limit],
  );

  useEffect(() => {
    void load('initial');
  }, [load]);

  return { ...state, reload: load };
}

/** Newest review id, used by the storage check to prove a write landed. */
export async function newestReviewId(): Promise<string | null> {
  try {
    const rows = await api.reviews(1);
    return rows[0]?._id ?? null;
  } catch {
    return null;
  }
}
