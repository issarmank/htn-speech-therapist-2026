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
    const durationMillis = recorder.currentTime * 1000;
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
      stoppingRef.current = false;
    }
  };

  useEffect(() => {
    if (status === 'recording' && recorderState.durationMillis >= MAX_RECORDING_MILLIS) {
      void stop();
    }
  }, [recorderState.durationMillis, status]);

  return {
    requestPermission,
    start,
    stop,
    status,
    durationMillis: recorderState.durationMillis,
    secondsRemaining: Math.max(0, Math.ceil((MAX_RECORDING_MILLIS - recorderState.durationMillis) / 1000)),
  };
}
