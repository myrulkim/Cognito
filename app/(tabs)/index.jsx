import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Animated, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Brain, Lock, Eye, Zap, Gamepad2, Blocks, Bug, CheckCircle2, Target } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import ThemedText from '../../components/ThemedText';
import { Colors } from '../../constants/Colors';
import ThemedView from '../../components/ThemedView';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../src/config/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { getBrainFuelAdvice } from '../../src/services/groq';
import { Coffee, RefreshCw } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const BrainFuelCard = ({ advice, onRefresh, loading }) => {
  return (
    <View style={styles.fuelCard}>
      <View style={styles.fuelHeader}>
        <View style={styles.fuelTitleRow}>
          <Coffee size={14} color={Colors.accent.primaryLight} />
          <ThemedText style={styles.fuelTitle}>DAILY BRAIN FUEL</ThemedText>
        </View>
        <TouchableOpacity onPress={onRefresh} disabled={loading}>
          <RefreshCw size={14} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>
      <ThemedText style={styles.fuelAdvice}>
        {loading ? "Menyediakan nutrisi otak..." : advice}
      </ThemedText>
    </View>
  );
};

const CORE_GAMES = [
  { id: 'logic', title: 'Logic Test', desc: 'Deductive IQ Test.', icon: Brain, color: Colors.accent.secondary, route: '/logic-test', difficulty: 'HARD', locked: false, glow: Colors.accent.secondary },
  { id: 'color-clash', title: 'Color Clash', desc: 'Stroop Effect Test.', icon: Sparkles, color: Colors.accent.danger, route: '/color-clash', difficulty: '3 LEVELS', locked: false, glow: Colors.accent.danger },
  { id: 'spatial', title: 'Spatial Vision', desc: 'Spatial Manipulation.', icon: Eye, color: Colors.accent.warn, route: '/spatial-vision', difficulty: 'HARD', locked: false, glow: Colors.accent.warn },
];

const TRAINING_GAMES = [
  { id: 'focus', title: 'Focus Grid', desc: 'Attention Speed.', icon: Target, color: Colors.accent.warn, route: '/focus-grid', difficulty: '3 LEVELS' },
  { id: 'flash', title: 'Flash Match', desc: 'Visual Memory.', icon: Zap, color: Colors.accent.primaryLight, route: '/flash-match', difficulty: '3 LEVELS' },
  { id: 'ai-quiz', title: 'Academic', desc: 'Dynamic KSSM Syllabus.', icon: Sparkles, color: Colors.accent.primaryLight, route: '/ai-quiz', difficulty: 'VARIED', locked: false, glow: Colors.accent.primary },
  { id: 'math', title: 'Mental Math', desc: 'Number Reflexes.', icon: Blocks, color: '#38BDF8', route: '/mental-math', difficulty: 'EASY' },
];

const FloatingCard = ({ item, onPress, type = 'large' }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const IconComponent = item.icon;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: type === 'large' ? '100%' : (width - 56) / 2, marginBottom: 16 }}>
      <Pressable
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
        onPress={item.locked ? null : onPress}
        style={[
            styles.card, 
            type === 'mini' && styles.miniCard, 
            item.locked && styles.lockedCard,
            item.glow && !item.locked && { shadowColor: item.glow, shadowOpacity: 0.1, shadowRadius: 15 }
        ]}
      >
        <View style={styles.cardHeader}>
             <View style={[styles.diffBadge, { backgroundColor: item.locked ? 'rgba(255,255,255,0.05)' : `${item.color}15` }]}>
                <View style={[styles.dot, { backgroundColor: item.locked ? Colors.text.secondary : item.color }]} />
                <ThemedText style={[styles.diffText, { color: item.locked ? Colors.text.secondary : item.color }]}>{item.difficulty}</ThemedText>
             </View>
             {item.locked && <Lock size={12} color={Colors.text.secondary} />}
        </View>
        
        <View style={type === 'large' ? styles.cardContent : styles.miniContent}>
          <View style={[styles.iconBox, { backgroundColor: item.locked ? 'rgba(255,255,255,0.03)' : `${item.color}10`, marginBottom: type === 'mini' ? 12 : 0, borderColor: item.locked ? 'transparent' : `${item.color}20` }]}>
              <IconComponent size={type === 'large' ? 26 : 22} color={item.locked ? Colors.text.secondary : item.color} />
          </View>
          <View style={{ flex: 1, alignItems: type === 'mini' ? 'center' : 'flex-start' }}>
              <ThemedText style={[styles.cardTitle, type === 'mini' && { textAlign: 'center', fontSize: 15 }]}>{item.title}</ThemedText>
              {type === 'large' && <ThemedText style={styles.cardDesc}>{item.locked ? 'Locked' : item.desc}</ThemedText>}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const { user } = useAuth();
  const [dailyPoints, setDailyPoints] = useState(0);
  const [advice, setAdvice] = useState("");
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
        const q = query(collection(db, "scores"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        let todayPoints = 0;
        const today = new Date().toDateString();
        
        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.createdAt) {
                // Safely handle both Timestamp object or string
                const createdAtDate = typeof data.createdAt.toDate === 'function' 
                    ? data.createdAt.toDate() 
                    : new Date(data.createdAt);
                
                if (createdAtDate.toDateString() === today) {
                    if (data.gameType === "Rapid Fire") {
                        todayPoints += 50; // Flat reward for playing rapid fire
                    } else {
                        todayPoints += (data.score || 0);
                    }
                }
            }
        });
        setDailyPoints(todayPoints);
    } catch (e) {
        console.error("Error fetching daily points:", e);
    }
  };

  const handlePress = (route) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route);
  };

  const isMissionComplete = dailyPoints >= TARGET_POINTS;

  return (
    <ThemedView safe style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <ThemedText title style={styles.titleText}>Cognito</ThemedText>
          </View>
          <ThemedText style={styles.subtitle}>Mastery Through Cognitive Excellence</ThemedText>
        </View>

        <TouchableOpacity 
          activeOpacity={0.9}
          style={styles.dailyWrapper}
          onPress={() => {
              fetchDailyPoints(); // Refresh points on tap
              if (!isMissionComplete) handlePress('/logic-test');
          }}
        >
          <LinearGradient 
            colors={isMissionComplete ? [Colors.accent.success, '#059669'] : [Colors.accent.primary, Colors.accent.secondary]} 
            start={{x: 0, y: 0}} end={{x: 1, y: 1}} 
            style={styles.dailyGradient}
          >
             <View style={styles.dailyLeft}>
               <View style={styles.badge}>
                  <Sparkles size={12} color="#FFF" />
                  <ThemedText style={styles.badgeText}>{isMissionComplete ? 'MISSION COMPLETE' : 'DAILY MISSION'}</ThemedText>
               </View>
               <ThemedText style={styles.dailyTitle}>Brain Workout</ThemedText>
               <ThemedText style={styles.dailySubtitle}>{dailyPoints} / {TARGET_POINTS} Cognitive Pts</ThemedText>
               
               <View style={{ width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginTop: 12, overflow: 'hidden' }}>
                   <View style={{ width: `${Math.min((dailyPoints/TARGET_POINTS)*100, 100)}%`, height: '100%', backgroundColor: '#FFF' }} />
               </View>
             </View>
             <View style={styles.dailyIconBox}>
                {isMissionComplete ? <CheckCircle2 size={32} color="#FFFFFF" /> : <Zap size={32} color="#FFFFFF" fill="#fff" />}
             </View>
          </LinearGradient>
        </TouchableOpacity>

        <BrainFuelCard advice={advice} onRefresh={fetchAdvice} loading={adviceLoading} />

        <ThemedText style={styles.sectionHeading}>COGNITIVE CORE</ThemedText>
        <View style={styles.grid}>
          {CORE_GAMES.map(game => (
            <FloatingCard key={game.id} item={game} onPress={() => handlePress(game.route)} type="large" />
          ))}
        </View>

        <ThemedText style={[styles.sectionHeading, { marginTop: 20 }]}>BRAIN TRAINING</ThemedText>
        <View style={styles.miniGrid}>
          {TRAINING_GAMES.map(game => (
            <FloatingCard key={game.id} item={game} onPress={() => handlePress(game.route)} type="mini" />
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 10 },
  header: { marginBottom: 35, paddingHorizontal: 5 },
  titleText: { fontSize: 42, color: Colors.text.primary, letterSpacing: -2, fontWeight: '900' },
  bugBtn: { padding: 8, backgroundColor: Colors.bg.elevated, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.subtle },
  subtitle: { color: Colors.text.secondary, fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginTop: 4, opacity: 0.8 },
  
  dailyWrapper: { marginBottom: 40, borderRadius: 32, overflow: 'hidden', elevation: 20, shadowColor: Colors.accent.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 20 },
  dailyGradient: { padding: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, gap: 6, marginBottom: 12, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1.5 },
  dailyTitle: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  dailySubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: '600' },
  dailyIconBox: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 18, borderRadius: 24 },

  fuelCard: { backgroundColor: 'rgba(124, 58, 237, 0.05)', padding: 16, borderRadius: 24, marginBottom: 35, borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.1)' },
  fuelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  fuelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fuelTitle: { fontSize: 10, fontWeight: '900', color: Colors.accent.primaryLight, letterSpacing: 1.5 },
  fuelAdvice: { fontSize: 13, color: Colors.text.primary, lineHeight: 20, fontWeight: '500', fontStyle: 'italic' },

  sectionHeading: { fontSize: 11, fontWeight: '900', color: Colors.text.secondary, letterSpacing: 3, marginBottom: 20, marginLeft: 5, opacity: 0.6 },
  
  card: { backgroundColor: Colors.bg.card, padding: 24, borderRadius: 28, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  miniCard: { width: '100%', aspectRatio: 1, justifyContent: 'space-between', padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  diffBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 5 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  diffText: { fontSize: 8, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  miniContent: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  iconBox: { padding: 14, borderRadius: 18, marginRight: 18, borderWidth: 1 },
  cardTitle: { fontSize: 19, color: Colors.text.primary, fontWeight: '800', letterSpacing: -0.2 },
  cardDesc: { fontSize: 12, color: Colors.text.secondary, marginTop: 4, lineHeight: 18 },
  
  grid: { gap: 16 },
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' },
  lockedCard: { opacity: 0.5 },
});
