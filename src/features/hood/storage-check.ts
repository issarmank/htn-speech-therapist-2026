import { api } from '@/features/api/client';
import type { SpeechReview } from '@/features/api/contracts';

/**
 * Verifies that the two side effects of `/analyze` actually happened.
 *
 * The endpoint uploads the clip to S3 and writes a review to Mongo *after*
 * the coaching succeeds, and swallows both failures — see routes/speech.py.
 * A 200 therefore proves nothing about storage. The only evidence available
 * to the client is reading `/reviews` back.
 */
export type StorageLight = 'pass' | 'fail' | 'unknown';

export type StorageCheck = {
  /** A new review row appeared for this user. */
  mongo: StorageLight;
  /** That row carries an S3 object key and a presigned URL. */
  s3: StorageLight;
  /** The presigned URL actually resolves. */
  playback: StorageLight;
  detail: string;
  at: number;
};

let current: StorageCheck | null = null;
const listeners = new Set<(check: StorageCheck | null) => void>();

export function lastStorageCheck(): StorageCheck | null {
  return current;
}

export function subscribeStorageCheck(fn: (check: StorageCheck | null) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function publish(check: StorageCheck) {
  current = check;
  listeners.forEach((fn) => fn(check));
}

/**
 * @param previousReviewId the newest review id captured *before* the analyze
 * call. Comparing ids rather than `created_at` avoids depending on the device
 * clock agreeing with the server's.
 */
export async function runStorageCheck(previousReviewId: string | null): Promise<StorageCheck> {
  let rows: SpeechReview[];
  try {
    rows = await api.reviews(1);
  } catch {
    const check: StorageCheck = {
      mongo: 'unknown',
      s3: 'unknown',
      playback: 'unknown',
      detail: 'Could not read history back, so storage could not be checked.',
      at: Date.now(),
    };
    publish(check);
    return check;
  }

  const row = rows[0];
  const isNew = !!row && row._id !== previousReviewId;

  if (!isNew) {
    const check: StorageCheck = {
      mongo: 'fail',
      s3: 'unknown',
      playback: 'unknown',
      detail:
        'No new review appeared. The coaching succeeded but the MongoDB write did not — ' +
        'check the server log for "Failed to save speech review".',
      at: Date.now(),
    };
    publish(check);
    return check;
  }

  const hasObject = !!row.audio?.key;
  const hasUrl = !!row.audio_url;

  if (!hasObject) {
    const check: StorageCheck = {
      mongo: 'pass',
      s3: 'fail',
      playback: 'unknown',
      detail:
        'Review saved, but with no audio. Either S3_BUCKET is unset on the server or the ' +
        'upload failed — check the log for "S3 upload failed".',
      at: Date.now(),
    };
    publish(check);
    return check;
  }

  let playback: StorageLight = 'unknown';
  let detail = `Saved ${formatBytes(row.audio?.size_bytes ?? 0)} to s3://${row.audio?.bucket}.`;

  if (hasUrl) {
    try {
      // A ranged GET, not a HEAD: the signature covers the HTTP method, so S3
      // answers HEAD on a URL signed for get_object with a 403. One byte is
      // enough to prove the object is there and readable.
      const response = await fetch(row.audio_url!, { headers: { Range: 'bytes=0-0' } });
      playback = response.ok ? 'pass' : 'fail';
      if (!response.ok) detail += ` Presigned URL returned ${response.status}.`;
    } catch {
      playback = 'fail';
      detail += ' Presigned URL could not be reached.';
    }
  }

  const check: StorageCheck = { mongo: 'pass', s3: 'pass', playback, detail, at: Date.now() };
  publish(check);
  return check;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
