import { useEffect, useRef, useState } from 'react';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import type { AudioClip, PracticeRecorderStatus } from './types';

const MAX_RECORDING_MILLIS = 20_000;
const MIN_RECORDING_MILLIS = 650;

export function usePracticeRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [status, setStatus] = useState<PracticeRecorderStatus>('idle');
  const stoppingRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);
  const stopRef = useRef<() => Promise<AudioClip | null>>(() => Promise.resolve(null));

  const requestPermission = async () => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) setStatus('permission_denied');
    return permission.granted;
  };

  const start = async () => {
    try {
      if (!(await requestPermission())) return false;
      await recorder.prepareToRecordAsync();
      recorder.record();
      startedAtRef.current = Date.now();
      setStatus('recording');
      return true;
    } catch {
      setStatus('recording_failed');
      return false;
    }
  };

  const stop = async (): Promise<AudioClip | null> => {
    if (stoppingRef.current || !recorder.isRecording) return null;
    stoppingRef.current = true;
    setStatus('stopping');
    // `currentTime` is reported in different units by expo-audio's web and
    // native implementations. Measure this user interaction ourselves so a
    // complete spoken phrase is never rejected because of a stale recorder clock.
    const durationMillis = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri || durationMillis < MIN_RECORDING_MILLIS) {
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
  };

  stopRef.current = stop;

  useEffect(() => {
    if (status !== 'recording') return;
    const timeout = setTimeout(() => { void stopRef.current(); }, MAX_RECORDING_MILLIS);
    return () => clearTimeout(timeout);
  }, [status]);

  return {
    requestPermission,
    start,
    stop,
    status,
    durationMillis: recorderState.durationMillis,
    secondsRemaining: Math.max(0, Math.ceil((MAX_RECORDING_MILLIS - recorderState.durationMillis) / 1000)),
  };
}
