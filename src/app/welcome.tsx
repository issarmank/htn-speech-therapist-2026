import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientButton } from '@/components/gradient-button';
import { LevelMeter } from '@/components/level-meter';
import { BRAND } from '@/constants/brand';
import { MAX_BODY_SCALE, MAX_TITLE_SCALE, ms, useResponsive } from '@/constants/responsive';
import { Colors, ContentColumn, Layout, Type } from '@/constants/theme';

export default function Welcome() {
  const { isShort, isTablet } = useResponsive();

  // DESIGN_SPEC §S1: on short devices shrink the bar area, never the buttons.
  const heroHeight = isShort ? 64 : isTablet ? 132 : 104;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View style={styles.column}>
          <LevelMeter level={0.92} active height={heroHeight} style={styles.bars} />

          <View style={styles.copy}>
            <Text style={styles.headline} maxFontSizeMultiplier={MAX_TITLE_SCALE}>
              Say it out loud.{'\n'}We&apos;ll hear the rest.
            </Text>
            <Text style={styles.sub} maxFontSizeMultiplier={MAX_BODY_SCALE}>
              Record a few seconds. Get your pace, pauses and fillers, clearly identifying things to
              work on. 
            </Text>
          </View>

          <View style={styles.actions}>
            <GradientButton label="Create account" onPress={() => router.push('/(auth)/signup')} />
            <GradientButton
              label="Log in"
              variant="outline"
              onPress={() => router.push('/(auth)/login')}
            />
            <Text style={styles.caption} maxFontSizeMultiplier={MAX_BODY_SCALE}>
              {BRAND.tagline}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.canvas },
  /**
   * `flexGrow` + `justifyContent: 'center'` centres the whole column on a tall
   * screen and lets it scroll instead of clipping on a short one or at 130%
   * text size.
   */
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Layout.page,
    paddingVertical: Layout.section,
  },
  column: { ...ContentColumn, gap: Layout.section },
  bars: { marginBottom: ms(4) },
  copy: { gap: ms(16) },
  headline: { ...Type.display, color: Colors.ink },
  sub: { fontSize: ms(17), lineHeight: ms(26), color: Colors.body },
  actions: { gap: ms(12) },
  caption: { ...Type.caption, color: Colors.muted, textAlign: 'center', marginTop: 4 },
});
