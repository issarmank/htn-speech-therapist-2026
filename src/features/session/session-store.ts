import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DrillAttemptResult, FlowAttemptResult } from '@/features/api/contracts';

const key = (sessionId: string) => `vocalflow:session:${sessionId}`;

export type SavedSession = {
  sessionId: string;
  mission: 'clear_speak' | 'scenario_sprint';
  promptId: string;
  stress?: 'calm' | 'busy';
  intent?: FlowAttemptResult['next_intent'];
  attemptIds: string[];
  drillResult?: DrillAttemptResult;
  flowResult?: FlowAttemptResult;
  completed: boolean;
};

export async function loadSession(sessionId: string) {
  const value = await AsyncStorage.getItem(key(sessionId));
  return value ? (JSON.parse(value) as SavedSession) : null;
}

export async function saveSession(session: SavedSession) {
  await AsyncStorage.setItem(key(session.sessionId), JSON.stringify(session));
}

export const createSession = (sessionId: string, mission: SavedSession['mission']): SavedSession => ({
  sessionId,
  mission,
  promptId: mission === 'clear_speak' ? 'red-robin-runs-rapidly' : 'coffee-shop-order',
  attemptIds: [],
  completed: false,
});
