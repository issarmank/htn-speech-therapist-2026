import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  MAX_RECORD_SECONDS,
  MIN_RECORD_SECONDS,
  WARN_RECORD_SECONDS,
} from '@/constants/backend';

import type { AudioClip, PracticeRecorderStatus } from './types';

const MAX_MILLIS = MAX_RECORD_SECONDS * 1_000;
const MIN_MILLIS = MIN_RECORD_SECONDS * 1_000;

/** 10 Hz. The default 500 ms poll is far too coarse to drive a level meter. */
const POLL_INTERVAL_MS = 100;

const OPTIONS = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

export function usePracticeRecorder() {
  const recorder = useAudioRecorder(OPTIONS);
  const recorderState = useAudioRecorderState(recorder, POLL_INTERVAL_MS);

  const [status, setStatus] = useState<PracticeRecorderStatus>('idle');
  const stoppingRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);

  const requestPermission = useCallback(async () => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) setStatus('permission_denied');
    return permission.granted;
  }, []);

  const start = useCallback(async () => {
    if (stoppingRef.current) return false;
    try {
      if (!(await requestPermission())) return false;

      // Without this iOS routes recording to the wrong session and playback of
      // the coach cue afterwards comes out near-silent.
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

      await recorder.prepareToRecordAsync();
      recorder.record();
      startedAtRef.current = Date.now();
      setStatus('recording');
      return true;
    } catch {
      setStatus('recording_failed');
      return false;
    }
  }, [recorder, requestPermission]);

  const stop = useCallback(async (): Promise<AudioClip | null> => {
    // The analyze endpoint has no idempotency key, so a double tap must never
    // be able to produce two clips and two requests.
    if (stoppingRef.current || !recorder.isRecording) return null;
    stoppingRef.current = true;
    setStatus('stopping');

    // `currentTime` is reported in different units by expo-audio's web and
    // native implementations. Measure this user interaction ourselves so a
    // complete spoken phrase is never rejected because of a stale recorder clock.
    const durationMillis = startedAtRef.current ? Date.now() - startedAtRef.current : 0;

    try {
      await recorder.stop();
      // Hand the audio session back so the cue plays at a normal volume.
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });

      const uri = recorder.uri;
      if (!uri || durationMillis < MIN_MILLIS) {
        setStatus('too_short');
        return null;
      }
      setStatus('idle');
      return { uri, durationMillis, mimeType: 'audio/m4a' };
    } catch {
      setStatus('recording_failed');
      return null;
    } finally {
      startedAtRef.current = null;
      stoppingRef.current = false;
    }
  }, [recorder]);

  /** Clears a sticky `too_short` / `permission_denied` so hints do not linger. */
  const resetIssue = useCallback(() => {
    setStatus((current) =>
      current === 'too_short' || current === 'permission_denied' || current === 'recording_failed'
        ? 'idle'
        : current,
    );
  }, []);

  useEffect(() => {
    if (status !== 'recording') return;
    const timeout = setTimeout(() => {
      void stop();
    }, MAX_MILLIS);
    return () => clearTimeout(timeout);
  }, [status, stop]);

  const durationMillis = recorderState.durationMillis ?? 0;

  return {
    requestPermission,
    start,
    stop,
    resetIssue,
    status,
    durationMillis,
    /** 0..1, smoothed from dBFS. Drives the voice bars. */
    level: normalizeMetering(recorderState.metering),
    canStop: durationMillis >= MIN_MILLIS,
    nearingLimit: durationMillis >= WARN_RECORD_SECONDS * 1_000,
    progress: Math.min(1, durationMillis / MAX_MILLIS),
    secondsElapsed: Math.floor(durationMillis / 1_000),
  };
}

/**
 * expo-audio reports metering in dBFS (roughly -160 silent, 0 peak). Anything
 * below -60 is room tone, so the usable band is compressed into 0..1.
 */
function normalizeMetering(metering: number | undefined): number {
  if (metering === undefined || Number.isNaN(metering)) return 0;
  const FLOOR = -60;
  if (metering <= FLOOR) return 0;
  if (metering >= 0) return 1;
  return (metering - FLOOR) / -FLOOR;
}
