import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Phase = 'ready' | 'recording' | 'analysing' | 'feedback' | 'reveal';

export default function HomeScreen() {
  const [phase, setPhase] = useState<Phase>('ready');
  const [improved, setImproved] = useState(false);
  const score = improved ? 84 : 61;

  const record = () => {
    if (phase === 'ready' || phase === 'feedback') return setPhase('recording');
    if (phase === 'recording') {
      setPhase('analysing');
      setTimeout(() => setPhase('feedback'), 850);
    }
  };

  if (phase === 'reveal') return <Reveal onRestart={() => { setImproved(false); setPhase('ready'); }} />;

  return <ScrollView contentInsetAdjustmentBehavior="automatic" style={s.page} contentContainerStyle={s.content}>
    <View style={s.header}><View><Text style={s.brand}>VOCALFLOW</Text><Text style={s.mission}>Today’s voice mission</Text></View><Text style={s.streak}>✦ 3 day streak</Text></View>
    <Text style={s.eyebrow}>CLEARSPEAK · R SOUND</Text>
    <Text style={s.title}>Make your R sound{`\n`}land clearly.</Text>
    <Text style={s.subhead}>Say the phrase at a comfortable pace. Your coach will show you one thing to try.</Text>
    <View style={s.rail}><Text style={s.railText}>Attempt {improved ? 2 : 1} of 2</Text><View style={s.track}><View style={[s.fill, { width: improved ? '100%' : '50%' }]} /></View></View>
    <View style={s.mirror}><View style={s.mirrorHeader}><Text style={s.mirrorLabel}>SPEECH MIRROR</Text><Text style={s.listening}>{phase === 'recording' ? '● LISTENING' : '◌ READY'}</Text></View>
      <Text style={s.phrase}>Red robin runs <Text style={phase === 'feedback' ? (improved ? s.good : s.retry) : undefined}>rapidly</Text>.</Text>
      {phase === 'feedback' && <Text style={improved ? s.goodPill : s.retryPill}>{improved ? '✓ Nailed it · R practice feedback 84' : '↻ Try again · R practice feedback 61'}</Text>}
      <View style={s.wave}>{[20, 42, 28, 58, 34, 64, 27, 45, 22].map((h, i) => <View key={i} style={[s.bar, { height: phase === 'recording' ? h : 10 + i % 3 * 5 }]} />)}</View>
    </View>
    {phase === 'feedback' ? <View style={s.coach}><View style={s.avatar}><Text style={s.avatarText}>V</Text></View><View style={s.coachCopy}><Text style={s.coachName}>VocalFlow Coach</Text><Text style={s.coachText}>{improved ? 'That was clearer. Keep that smooth R sound.' : 'Round the start of rapidly, then release it smoothly.'}</Text><Text style={s.coachNote}>{improved ? 'Your pacing was steadier, too.' : 'Strong start. Let’s make that R more rounded.'}</Text></View></View> : <Text style={s.hint}>{phase === 'analysing' ? 'Finding your clearest sound…' : 'Tap the microphone when you are ready.'}</Text>}
    <Pressable disabled={phase === 'analysing'} onPress={record} style={({ pressed }) => [s.record, pressed && s.pressed, phase === 'analysing' && s.disabled]} accessibilityRole="button" accessibilityState={{ disabled: phase === 'analysing' }} accessibilityLabel={phase === 'recording' ? 'Stop and score your phrase' : 'Start speaking'}><Text style={s.recordText}>{phase === 'recording' ? '■  Stop and score' : phase === 'analysing' ? '···  Analysing' : '◉  Hold to speak'}</Text></Pressable>
    {phase === 'feedback' && <Pressable onPress={() => improved ? setPhase('reveal') : (setImproved(true), setPhase('ready'))} style={s.cta} accessibilityRole="button"><Text style={s.ctaText}>{improved ? 'See your improvement  →' : 'Try rapidly again  →'}</Text></Pressable>}
  </ScrollView>;
}

function Reveal({ onRestart }: { onRestart: () => void }) { return <ScrollView contentInsetAdjustmentBehavior="automatic" style={s.page} contentContainerStyle={[s.content, s.reveal]}><Text style={s.brand}>VOCALFLOW</Text><Text style={s.eyebrow}>MISSION COMPLETE</Text><Text style={s.revealTitle}>Your R clarity{`\n`}improved.</Text><View style={s.scores}><Text style={s.before}>61</Text><Text style={s.arrow}>→</Text><Text style={s.after}>84</Text></View><Text style={s.subhead}>You found a clearer start to “rapidly.” That’s real progress in one session.</Text><View style={s.metric}><Text style={s.metricLabel}>BEST PRACTICE FEEDBACK</Text><Text style={s.metricValue}>+23 points</Text><Text style={s.metricNote}>Red robin runs rapidly.</Text></View><Pressable onPress={onRestart} style={s.cta}><Text style={s.ctaText}>Practice another phrase  →</Text></Pressable></ScrollView>; }

const s = StyleSheet.create({ page:{flex:1,backgroundColor:'#F7F7F1'},content:{padding:24,gap:18,alignSelf:'center',width:'100%',maxWidth:620},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},brand:{color:'#172540',fontSize:14,fontWeight:'900',letterSpacing:2},mission:{color:'#6E7785',fontSize:13,marginTop:4},streak:{color:'#805A00',backgroundColor:'#FFF1CB',paddingHorizontal:12,paddingVertical:8,borderRadius:18,fontSize:12,fontWeight:'700'},eyebrow:{color:'#246B69',fontSize:12,fontWeight:'800',letterSpacing:1.3,marginTop:18},title:{color:'#172540',fontSize:38,lineHeight:43,fontWeight:'800',letterSpacing:-1},subhead:{color:'#647083',fontSize:16,lineHeight:23},rail:{gap:7},railText:{color:'#4D596B',fontSize:13,fontWeight:'700'},track:{height:7,borderRadius:7,backgroundColor:'#DFE6E0',overflow:'hidden'},fill:{height:'100%',backgroundColor:'#FF8565'},mirror:{backgroundColor:'#172540',borderRadius:28,padding:24,gap:20,boxShadow:'0 15px 30px rgba(23,37,64,.15)'},mirrorHeader:{flexDirection:'row',justifyContent:'space-between'},mirrorLabel:{color:'#B9D7D4',fontSize:11,fontWeight:'800',letterSpacing:1.2},listening:{color:'#9EE4D9',fontSize:11,fontWeight:'800'},phrase:{color:'#FFF',fontSize:28,lineHeight:39,fontWeight:'700'},retry:{color:'#FFCA7B',textDecorationLine:'underline'},good:{color:'#8FE0C5',textDecorationLine:'underline'},retryPill:{color:'#FFF',alignSelf:'flex-start',backgroundColor:'#5F4828',padding:9,borderRadius:12,fontSize:12,fontWeight:'700'},goodPill:{color:'#FFF',alignSelf:'flex-start',backgroundColor:'#1F6258',padding:9,borderRadius:12,fontSize:12,fontWeight:'700'},wave:{height:65,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},bar:{width:8,borderRadius:8,backgroundColor:'#75CEC5'},hint:{textAlign:'center',color:'#687587',fontSize:14},coach:{flexDirection:'row',gap:13,backgroundColor:'#FFF',borderRadius:20,padding:16,boxShadow:'0 4px 14px rgba(23,37,64,.08)'},avatar:{width:38,height:38,borderRadius:19,backgroundColor:'#FF8565',alignItems:'center',justifyContent:'center'},avatarText:{color:'#FFF',fontWeight:'900'},coachCopy:{flex:1,gap:4},coachName:{color:'#172540',fontSize:13,fontWeight:'800'},coachText:{color:'#27364D',fontSize:15,lineHeight:21},coachNote:{color:'#246B69',fontSize:13},record:{minHeight:66,borderRadius:22,backgroundColor:'#246B69',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 16px rgba(36,107,105,.22)'},recordText:{color:'#FFF',fontSize:15,fontWeight:'800'},pressed:{transform:[{scale:.98}]},disabled:{opacity:.65},cta:{minHeight:58,borderRadius:20,backgroundColor:'#FF8565',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 16px rgba(255,133,101,.22)'},ctaText:{color:'#FFF',fontSize:15,fontWeight:'900'},reveal:{flexGrow:1,justifyContent:'center',paddingVertical:48},revealTitle:{color:'#172540',fontSize:42,lineHeight:47,fontWeight:'900',letterSpacing:-1.3},scores:{flexDirection:'row',alignItems:'baseline',gap:18},before:{color:'#9AA5B2',fontSize:56,fontWeight:'800',textDecorationLine:'line-through'},arrow:{color:'#FF8565',fontSize:34},after:{color:'#246B69',fontSize:72,fontWeight:'900'},metric:{borderRadius:22,padding:20,backgroundColor:'#E7F4F1',gap:5},metricLabel:{color:'#246B69',fontSize:11,fontWeight:'900',letterSpacing:1},metricValue:{color:'#172540',fontSize:30,fontWeight:'900'},metricNote:{color:'#5A6A75',fontSize:14} });
