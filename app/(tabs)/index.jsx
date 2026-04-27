import React, { useRef, useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Animated, Pressable, Text
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Brain, Eye, Zap, Blocks, Sparkles,
  Target, CheckCircle2, Lock, ChevronRight,
  Coffee, RefreshCw, BookOpen, Gamepad2
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../src/config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getBrainFuelAdvice } from '../../src/services/groq';
import ThemedText from '../../components/ThemedText';
import ThemedView from '../../components/ThemedView';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

// ─── Brain Fuel Card ───────────────────────────────────────────
const BrainFuelCard = ({ advice, onRefresh, loading }) => (
  <View style={styles.fuelCard}>
    <View style={styles.fuelInner}>
      <View style={styles.fuelLeft}>
        <View style={styles.fuelIconBox}>
          <Coffee size={18} color={Colors.accent.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.fuelLabel}>DAILY BRAIN FUEL</Text>
          <Text style={styles.fuelAdvice} numberOfLines={3}>
            {loading ? 'Menyediakan nasihat kognitif...' : advice}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={onRefresh} disabled={loading} style={styles.fuelRefresh}>
        <RefreshCw size={14} color={Colors.accent.primary} />
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Core Game Card (Large Horizontal) ─────────────────────────
const CoreCard = ({ item, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const Icon = item.icon;
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginRight: 16 }}>
      <Pressable
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
        onPress={item.locked ? null : onPress}
        style={[styles.coreCard, { shadowColor: item.color }]}
      >
        <LinearGradient
          colors={[`${item.color}15`, `${item.color}05`]}
          style={styles.coreGradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <View style={[styles.coreIconBox, { backgroundColor: `${item.color}18` }]}>
            <Icon size={28} color={item.locked ? Colors.text.muted : item.color} />
          </View>
          <Text style={styles.coreDiff}>{item.difficulty}</Text>
          <Text style={[styles.coreTitle, { color: item.locked ? Colors.text.muted : Colors.text.primary }]}>
            {item.title}
          </Text>
          <Text style={styles.coreDesc}>{item.locked ? 'Terkunci' : item.desc}</Text>
          {!item.locked && (
            <View style={[styles.coreCta, { backgroundColor: `${item.color}12` }]}>
              <Text style={[styles.coreCtaText, { color: item.color }]}>Main sekarang</Text>
              <ChevronRight size={12} color={item.color} />
            </View>
          )}
          {item.locked && <Lock size={16} color={Colors.text.muted} style={{ marginTop: 12 }} />}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

// ─── Training Game Card (Mini Square Grid) ─────────────────────
const TrainingCard = ({ item, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const Icon = item.icon;
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: (width - 56) / 2 }}>
      <Pressable
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
        onPress={item.locked ? null : onPress}
        style={[styles.trainingCard, item.locked && { opacity: 0.45 }]}
      >
        <View style={[styles.trainingIcon, { backgroundColor: `${item.color}12` }]}>
          <Icon size={22} color={item.color} />
        </View>
        <Text style={styles.trainingTitle}>{item.title}</Text>
        <View style={[styles.trainingBadge, { backgroundColor: `${item.color}10` }]}>
          <View style={[styles.badgeDot, { backgroundColor: item.color }]} />
          <Text style={[styles.trainingBadgeText, { color: item.color }]}>{item.difficulty}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ─── Academic Featured Section ────────────────────────────────
const AcademicSection = ({ onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  return (
    <View style={styles.academicWrapper}>
      <Text style={styles.sectionLabel}>PROGRAM AKADEMIK</Text>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start()}
          onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
          onPress={onPress}
          style={styles.academicCard}
        >
          <LinearGradient
            colors={[Colors.accent.sky, Colors.accent.skyLight]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.academicGradient}
          >
            <View style={styles.academicContent}>
              <View style={styles.academicBadge}>
                <BookOpen size={10} color={Colors.accent.sky} />
                <Text style={styles.academicBadgeText}>AI-POWERED</Text>
              </View>
              <Text style={styles.academicTitle}>Cognito Academic</Text>
              <Text style={styles.academicSub}>Silibus KSSM Dinamik dikuasakan oleh AI.</Text>
              <View style={styles.academicBtn}>
                <Text style={styles.academicBtnText}>Mula Belajar</Text>
                <ChevronRight size={14} color="#FFF" />
              </View>
            </View>
            <View style={styles.academicIconBox}>
              <BookOpen size={40} color="#FFF" opacity={0.9} />
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
};

// ─── Game Data ─────────────────────────────────────────────────
const CORE_GAMES = [
  {
    id: 'color-clash', title: 'Color Clash', desc: 'Ujian Stroop Effect.', icon: Sparkles,
    color: Colors.accent.rose, route: '/color-clash', difficulty: '3 TAHAP', locked: false,
  },
  {
    id: 'logic', title: 'Logic Test', desc: 'Ujian IQ Deduktif.', icon: Brain,
    color: Colors.accent.primary, route: '/logic-test', difficulty: 'SUSAH', locked: false,
  },
  {
    id: 'spatial', title: 'Spatial Vision', desc: 'Manipulasi Ruang 3D.', icon: Eye,
    color: Colors.accent.warn, route: '/spatial-vision', difficulty: 'SUSAH', locked: false,
  },
];

const TRAINING_GAMES = [
  { id: 'focus', title: 'Focus Grid', desc: 'Latihan Perhatian.', icon: Target, color: Colors.accent.warn, route: '/focus-grid', difficulty: '3 TAHAP' },
  { id: 'flash', title: 'Flash Match', desc: 'Memori Visual.', icon: Gamepad2, color: Colors.accent.primary, route: '/flash-match', difficulty: '3 TAHAP' },
  { id: 'math', title: 'Mental Math', desc: 'Refleks Nombor.', icon: Blocks, color: Colors.accent.sky, route: '/mental-math', difficulty: 'MUDAH' },
  { id: 'rapid', title: 'Rapid Fire', desc: 'Kelajuan Reaksi.', icon: Zap, color: Colors.accent.success, route: '/rapid-fire', difficulty: 'SEDANG' },
];

// ─── Home Screen ───────────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useAuth();
  const [dailyPoints, setDailyPoints] = useState(0);
  const [advice, setAdvice] = useState('');
  const [adviceLoading, setAdviceLoading] = useState(false);
  const TARGET_POINTS = 1200;

  useEffect(() => {
    if (user) {
      fetchDailyPoints();
      fetchAdvice();
    }
  }, [user]);

  const fetchAdvice = async () => {
    setAdviceLoading(true);
    const newAdvice = await getBrainFuelAdvice();
    setAdvice(newAdvice);
    setAdviceLoading(false);
  };

  const fetchDailyPoints = async () => {
    try {
      const q = query(collection(db, 'scores'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      let total = 0;
      const today = new Date().toDateString();
      snap.forEach(doc => {
        const d = doc.data();
        if (d.createdAt) {
          const dt = typeof d.createdAt.toDate === 'function'
            ? d.createdAt.toDate() : new Date(d.createdAt);
          if (dt.toDateString() === today) {
            total += d.gameType === 'Rapid Fire' ? 50 : (d.score || 0);
          }
        }
      });
      setDailyPoints(total);
    } catch (e) { console.error(e); }
  };

  const handlePress = (route) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route);
  };

  const progress = Math.min((dailyPoints / TARGET_POINTS) * 100, 100);
  const done = dailyPoints >= TARGET_POINTS;
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Pengguna';

  return (
    <ThemedView safe style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Selamat datang,</Text>
            <Text style={styles.username}>{userName} 👋</Text>
          </View>
          <View style={styles.pointsBadge}>
            <Zap size={12} color={Colors.accent.primary} />
            <Text style={styles.pointsText}>{dailyPoints} mata</Text>
          </View>
        </View>

        {/* ── Daily Mission Card ── */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => !done && handlePress('/logic-test')}
          style={styles.missionWrapper}
        >
          <LinearGradient
            colors={done
              ? ['#10B981', '#059669']
              : ['#6366F1', '#4F46E5']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.missionGradient}
          >
            <View style={styles.missionLeft}>
              <View style={styles.missionBadge}>
                <Sparkles size={10} color="#FFF" />
                <Text style={styles.missionBadgeText}>
                  {done ? 'MISI SELESAI' : 'MISI HARIAN'}
                </Text>
              </View>
              <Text style={styles.missionTitle}>Brain Workout</Text>
              <Text style={styles.missionSub}>{dailyPoints} / {TARGET_POINTS} Mata Kognitif</Text>
              <View style={styles.missionBarBg}>
                <View style={[styles.missionBarFill, { width: `${progress}%` }]} />
              </View>
            </View>
            <View style={styles.missionIconBox}>
              {done ? <CheckCircle2 size={30} color="#FFF" /> : <Zap size={30} color="#FFF" fill="#FFF" />}
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Brain Fuel ── */}
        <BrainFuelCard advice={advice} onRefresh={fetchAdvice} loading={adviceLoading} />

        {/* ── Academic Featured Card ── */}
        <AcademicSection onPress={() => handlePress('/ai-quiz')} />

        {/* ── Cognitive Core ── */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>TERAS KOGNITIF</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.coreList}
          style={{ marginHorizontal: -20 }}
        >
          <View style={{ width: 20 }} />
          {CORE_GAMES.map(game => (
            <CoreCard key={game.id} item={game} onPress={() => handlePress(game.route)} />
          ))}
          <View style={{ width: 4 }} />
        </ScrollView>

        {/* ── Brain Training ── */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>LATIHAN OTAK</Text>
        <View style={styles.trainingGrid}>
          {TRAINING_GAMES.map(game => (
            <TrainingCard key={game.id} item={game} onPress={() => handlePress(game.route)} />
          ))}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { paddingHorizontal: 20, paddingTop: 12 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 13, color: Colors.text.secondary, fontWeight: '600' },
  username: { fontSize: 22, fontWeight: '900', color: Colors.text.primary, letterSpacing: -0.5, marginTop: 2 },
  pointsBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.glow.indigo, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: `${Colors.accent.primary}20` },
  pointsText: { fontSize: 12, fontWeight: '800', color: Colors.accent.primary },

  // Mission
  missionWrapper: { borderRadius: 28, overflow: 'hidden', marginBottom: 20, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 12 },
  missionGradient: { padding: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  missionLeft: { flex: 1 },
  missionBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 5, marginBottom: 12, alignSelf: 'flex-start' },
  missionBadgeText: { fontSize: 9, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  missionTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  missionSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: '600' },
  missionBarBg: { width: '90%', height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3, marginTop: 14, overflow: 'hidden' },
  missionBarFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 3 },
  missionIconBox: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 16, borderRadius: 22, marginLeft: 16 },

  // Academic Featured
  academicWrapper: { marginBottom: 28 },
  academicCard: { borderRadius: 28, overflow: 'hidden', shadowColor: Colors.accent.sky, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  academicGradient: { padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  academicContent: { flex: 1 },
  academicBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 5, marginBottom: 12, alignSelf: 'flex-start' },
  academicBadgeText: { fontSize: 9, fontWeight: '900', color: '#FFF', letterSpacing: 1.2 },
  academicTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  academicSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4, fontWeight: '600', lineHeight: 18 },
  academicBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, gap: 6, marginTop: 16, alignSelf: 'flex-start' },
  academicBtnText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  academicIconBox: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 18, borderRadius: 24, marginLeft: 16 },

  // Brain Fuel
  fuelCard: { backgroundColor: '#FFF', borderRadius: 24, marginBottom: 28, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3, borderWidth: 1, borderColor: Colors.border.subtle },
  fuelInner: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12 },
  fuelLeft: { flex: 1, flexDirection: 'row', gap: 12 },
  fuelIconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.glow.indigo, justifyContent: 'center', alignItems: 'center' },
  fuelLabel: { fontSize: 9, fontWeight: '900', color: Colors.accent.primary, letterSpacing: 1.5, marginBottom: 5 },
  fuelAdvice: { fontSize: 13, color: Colors.text.primary, lineHeight: 19, fontWeight: '500', fontStyle: 'italic' },
  fuelRefresh: { padding: 8 },

  // Section Labels
  sectionLabel: { fontSize: 11, fontWeight: '900', color: Colors.text.muted, letterSpacing: 2.5, marginBottom: 14 },

  // Core Cards (Horizontal)
  coreList: { paddingBottom: 8, paddingTop: 4 },
  coreCard: { width: 180, borderRadius: 28, overflow: 'hidden', backgroundColor: '#FFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 6 },
  coreGradient: { padding: 20, minHeight: 200 },
  coreIconBox: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  coreDiff: { fontSize: 8, fontWeight: '900', color: Colors.text.muted, letterSpacing: 1.5, marginBottom: 6 },
  coreTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  coreDesc: { fontSize: 11, color: Colors.text.secondary, lineHeight: 16, marginBottom: 14 },
  coreCta: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start' },
  coreCtaText: { fontSize: 11, fontWeight: '700' },

  // Training Grid
  trainingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  trainingCard: { aspectRatio: 1, backgroundColor: '#FFF', borderRadius: 24, padding: 18, justifyContent: 'space-between', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: Colors.border.subtle },
  trainingIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  trainingTitle: { fontSize: 15, fontWeight: '800', color: Colors.text.primary, letterSpacing: -0.2, marginTop: 10 },
  trainingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  badgeDot: { width: 4, height: 4, borderRadius: 2 },
  trainingBadgeText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
});
