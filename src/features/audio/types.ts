export type RecorderIssue = 'permission_denied' | 'too_short' | 'recording_failed';

export type AudioClip = {
  uri: string;
  durationMillis: number;
  mimeType: string;
};

export type PracticeRecorderStatus = 'idle' | 'recording' | 'stopping' | RecorderIssue;
