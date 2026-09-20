import { useAudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { useRef, useState } from 'react';

/**
 * Plays either the coach cue (base64 mp3, written to cache on first play) or a
 * stored clip from its presigned S3 URL. Only one is ever present: /analyze
 * returns the cue and no S3 link, /reviews returns the link and no cue.
 *
 * The file write happens in the play handler rather than an effect — there is
 * nothing to synchronise until someone actually asks to hear it.
 */
export function useCueAudio(cueBase64: string | null, clipUrl: string | null) {
  const player = useAudioPlayer(clipUrl ?? null);
  const cueUriRef = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);

  function play() {
    try {
      if (cueBase64 && !cueUriRef.current) {
        // A fresh name per cue: reusing one path can serve the previous mp3
        // back out of the player's cache.
        const file = new File(Paths.cache, `cue-${Date.now()}.mp3`);
        file.write(cueBase64, { encoding: 'base64' });
        cueUriRef.current = file.uri;
        player.replace(file.uri);
      }
      player.seekTo(0);
      player.play();
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }

  return { available: !!(cueBase64 || clipUrl) && !failed, failed, play };
}
