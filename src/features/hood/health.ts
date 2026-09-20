import { useCallback, useEffect, useRef, useState } from 'react';

import { api } from '@/features/api/client';

export type HealthState = {
  status: 'unknown' | 'online' | 'offline';
  roundTripMs: number | null;
  checkedAt: number | null;
  checking: boolean;
};

const POLL_MS = 20_000;

/**
 * `/health` is a bare liveness check — it does not touch Mongo, S3, ElevenLabs
 * or Gemini. Online here means the process is answering, nothing more. The
 * storage panel is what says whether the pipeline's side effects work.
 */
export function useHealth(active: boolean) {
  const [state, setState] = useState<HealthState>({
    status: 'unknown',
    roundTripMs: null,
    checkedAt: null,
    checking: false,
  });
  const inFlight = useRef(false);

  const check = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setState((prev) => ({ ...prev, checking: true }));

    const started = Date.now();
    try {
      await api.health();
      setState({
        status: 'online',
        roundTripMs: Date.now() - started,
        checkedAt: Date.now(),
        checking: false,
      });
    } catch {
      setState({
        status: 'offline',
        roundTripMs: null,
        checkedAt: Date.now(),
        checking: false,
      });
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const tick = () => {
      if (!cancelled) void check();
    };
    // The first check is deferred by a tick rather than called inline: `check`
    // flips `checking` synchronously, and doing that in an effect body forces a
    // second render before the first has committed.
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [active, check]);

  return { ...state, check };
}
