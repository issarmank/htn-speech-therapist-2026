import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Accordion } from '@/components/accordion';
import { BRAND } from '@/constants/brand';
import { config } from '@/constants/config';
import { MAX_TITLE_SCALE } from '@/constants/responsive';
import { Colors, ContentColumn, Layout, Radius, Type } from '@/constants/theme';
import { useHealth } from '@/features/hood/health';
import { lastRunTimings, serverTimeMs, type LastRunTimings } from '@/features/hood/last-run';
import { GLOSSARY, GUARDRAILS, PIPELINE_STAGES } from '@/features/hood/stages';
import {
  lastStorageCheck,
  subscribeStorageCheck,
  type StorageCheck,
  type StorageLight,
} from '@/features/hood/storage-check';

export default function Hood() {
  const [focused, setFocused] = useState(false);
  const health = useHealth(focused);

  const [run, setRun] = useState<LastRunTimings | null>(() => lastRunTimings());
  const [storage, setStorage] = useState<StorageCheck | null>(() => lastStorageCheck());

  // Both stores are written from other screens, so re-read on every focus.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      setRun(lastRunTimings());
      setStorage(lastStorageCheck());
      return () => setFocused(false);
    }, []),
  );

  useEffect(() => subscribeStorageCheck(setStorage), []);

  const timings = run?.timings ?? {};
  const totalMs = serverTimeMs(timings);
  const slowest = Math.max(1, ...Object.values(timings).map((ms) => ms ?? 0));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={health.checking}
            onRefresh={() => void health.check()}
            tintColor={Colors.violet}
          />
        }>
        <View style={styles.headerBlock}>
          <Text style={styles.title} maxFontSizeMultiplier={MAX_TITLE_SCALE}>
            Under the hood
          </Text>
          <Text style={styles.sub}>How your voice becomes feedback.</Text>
        </View>

        {/* --- liveness ------------------------------------------------- */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View
                style={[
                  styles.dot,
                  health.status === 'online' && styles.dotOnline,
                  health.status === 'offline' && styles.dotOffline,
                ]}
              />
              <Text style={styles.statusText}>
                {health.status === 'online'
                  ? 'Online'
                  : health.status === 'offline'
                    ? "Can't reach the server"
                    : 'Checking…'}
              </Text>
            </View>
            {health.roundTripMs !== null ? (
              <Text style={styles.meta}>{health.roundTripMs} ms round trip</Text>
            ) : null}
          </View>

          <Text style={styles.meta}>
            {config.isDemoMode ? 'Demo fixtures — no backend' : config.apiUrl}
          </Text>
          <Text style={styles.caveat}>
            This only checks that the API is answering. It does not test MongoDB, S3, ElevenLabs
            or Gemini.
          </Text>
        </View>

        {/* --- storage --------------------------------------------------- */}
        <View style={styles.section}>
          <Text style={styles.heading}>Where your last recording went</Text>
          <View style={styles.card}>
            {storage ? (
              <>
                <LightRow
                  light={storage.mongo}
                  label="Review saved to MongoDB"
                  hint="A new row appeared in speech_reviews."
                />
                <LightRow
                  light={storage.s3}
                  label="Clip uploaded to S3"
                  hint="The review carries an object key."
                />
                <LightRow
                  light={storage.playback}
                  label="Presigned URL resolves"
                  hint="The stored clip can actually be played back."
                />
                <Text style={styles.caveat}>{storage.detail}</Text>
              </>
            ) : (
              <Text style={styles.meta}>
                Record something to check that it reaches MongoDB and S3.
              </Text>
            )}
            <Text style={styles.caveat}>
              Analyze returns 200 even when the database write or the upload fails, so this is
              read back from history rather than taken on trust.
            </Text>
          </View>
        </View>

        {/* --- pipeline -------------------------------------------------- */}
        <View style={styles.section}>
          <Text style={styles.heading}>The pipeline</Text>
          {PIPELINE_STAGES.map((stage) => {
            const ms = timings[stage.key];
            const used = ms !== undefined;
            return (
              <Accordion
                key={stage.key}
                title={`${stage.index}. ${stage.title}`}
                subtitle={stage.summary}>
                <View style={styles.tagRow}>
                  <Text style={[styles.tag, stage.kind === 'ai' ? styles.tagAi : styles.tagCode]}>
                    {stage.kind === 'ai' ? 'AI' : 'Plain code'}
                  </Text>
                  <Text style={styles.meta}>{stage.provider}</Text>
                  {stage.optional ? <Text style={styles.meta}>optional</Text> : null}
                </View>

                <Text style={styles.body}>{stage.detail}</Text>

                {run ? (
                  used ? (
                    <View style={styles.barRow}>
                      <View style={[styles.bar, { flex: Math.max(0.02, (ms ?? 0) / slowest) }]} />
                      <Text style={styles.meta}>Last run {ms} ms</Text>
                    </View>
                  ) : (
                    <Text style={styles.meta}>Not used last run</Text>
                  )
                ) : null}
              </Accordion>
            );
          })}
        </View>

        {/* --- last run -------------------------------------------------- */}
        <View style={styles.section}>
          <Text style={styles.heading}>Last run</Text>
          {run ? (
            <View style={styles.card}>
              <View style={styles.stack}>
                {PIPELINE_STAGES.map((stage) => {
                  const ms = timings[stage.key] ?? 0;
                  if (!ms) return null;
                  return (
                    <View
                      key={stage.key}
                      style={[
                        styles.stackSegment,
                        { flex: ms },
                        stage.kind === 'code' ? styles.stackCode : styles.stackAi,
                      ]}
                    />
                  );
                })}
              </View>
              <Text style={styles.meta}>
                {(totalMs / 1000).toFixed(1)} s server time · {Math.round(run.durationS)} s of audio ·{' '}
                {run.wordCount} words
              </Text>
              <Text style={styles.caveat}>
                Server time only — it excludes the upload and the download.
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.meta}>Record something to see how it ran.</Text>
            </View>
          )}
        </View>

        {/* --- glossary -------------------------------------------------- */}
        <View style={styles.section}>
          <Text style={styles.heading}>What we measure</Text>
          {GLOSSARY.map((entry) => (
            <Accordion key={entry.term} title={entry.term}>
              <Text style={styles.body}>{entry.meaning}</Text>
            </Accordion>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Guardrails</Text>
          {GUARDRAILS.map((line) => (
            <Text key={line} style={styles.bullet}>
              •  {line}
            </Text>
          ))}
          <Text style={styles.caveat}>{BRAND.disclaimer}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LightRow({
  light,
  label,
  hint,
}: {
  light: StorageLight;
  label: string;
  hint: string;
}) {
  const glyph = light === 'pass' ? '✓' : light === 'fail' ? '✕' : '–';
  return (
    <View
      style={styles.lightRow}
      accessibilityLabel={`${label}: ${
        light === 'pass' ? 'passed' : light === 'fail' ? 'failed' : 'not checked'
      }`}>
      <Text
        style={[
          styles.lightGlyph,
          light === 'pass' && styles.lightPass,
          light === 'fail' && styles.lightFail,
        ]}>
        {glyph}
      </Text>
      <View style={styles.lightText}>
        <Text style={styles.body}>{label}</Text>
        <Text style={styles.meta}>{hint}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.canvas },
  content: { ...ContentColumn, padding: Layout.page, gap: Layout.section, paddingBottom: 40 },
  headerBlock: { gap: 6 },
  title: { ...Type.title1, color: Colors.ink },
  sub: { ...Type.body, color: Colors.body },

  section: { gap: 12 },
  heading: { ...Type.heading, color: Colors.ink },
  card: {
    padding: Layout.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.surface,
    gap: 10,
  },
  body: { ...Type.body, color: Colors.body },
  meta: { ...Type.caption, color: Colors.muted },
  caveat: { ...Type.caption, color: Colors.muted, fontStyle: 'italic' },
  bullet: { ...Type.body, color: Colors.body },

  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  dot: { width: 10, height: 10, borderRadius: Radius.pill, backgroundColor: Colors.line },
  dotOnline: { backgroundColor: Colors.mint },
  dotOffline: { backgroundColor: Colors.rose },
  statusText: { ...Type.bodyStrong, color: Colors.ink },

  lightRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  lightGlyph: { ...Type.bodyStrong, color: Colors.muted, width: 18 },
  lightPass: { color: Colors.mint },
  lightFail: { color: Colors.rose },
  lightText: { flex: 1, gap: 2 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  tag: { ...Type.caption, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagAi: { backgroundColor: Colors.blueTint, color: Colors.blueText },
  tagCode: { backgroundColor: Colors.mintTint, color: Colors.mint },

  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bar: { height: 8, borderRadius: Radius.pill, backgroundColor: Colors.violet },

  stack: { flexDirection: 'row', height: 12, borderRadius: Radius.pill, overflow: 'hidden', gap: 2 },
  stackSegment: { height: 12 },
  stackAi: { backgroundColor: Colors.violet },
  stackCode: { backgroundColor: Colors.mint },
});
