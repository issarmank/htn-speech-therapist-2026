import { useEffect, useState } from 'react';

import { loadSession, type SavedSession } from './session-store';

export function useSessionRestore(sessionId: string) {
  const [session, setSession] = useState<SavedSession | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let active = true;
    void loadSession(sessionId).then((saved) => {
      if (active) {
        setSession(saved);
        setRestoring(false);
      }
    }).catch(() => active && setRestoring(false));
    return () => { active = false; };
  }, [sessionId]);

  return { session, setSession, restoring };
}
