import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, View, ActivityIndicator, TouchableOpacity, ScrollView, Dimensions, Alert, RefreshControl } from 'react-native';
import { Zap, User, HelpCircle, Star, LogOut, ChevronRight, Trophy, Shield, Medal, Flame, Ribbon } from 'lucide-react-native';
import Svg, { Circle, Text as SvgText, Polygon, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { db } from '../../src/config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import ThemedText from '../../components/ThemedText';
import ThemedView from '../../components/ThemedView';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

const RadarChart = ({ dataValues }) => {
  const size = width * 0.5;
  const center = size / 2;
  const radius = size * 0.35;
  const labels = ['Logic', 'Mem', 'Math', 'Spa', 'Spd'];

  const points = dataValues.map((val, i) => {
    const angle = (Math.PI * 2 * i) / dataValues.length - Math.PI / 2;
    return `${center + radius * val * Math.cos(angle)},${center + radius * val * Math.sin(angle)}`;
  }).join(' ');

  return (
    <View style={{ alignItems: 'center', marginVertical: 10 }}>
      <Svg height={size} width={size}>
        {[0.2, 0.4, 0.6, 0.8, 1].map((r, i) => (
          <Polygon
            key={i}
            points={[...Array(5)].map((_, j) => {
                const angle = (Math.PI * 2 * j) / 5 - Math.PI / 2;
                return `${center + radius * r * Math.cos(angle)},${center + radius * r * Math.sin(angle)}`;
            }).join(' ')}
            fill="none"
            stroke={Colors.border.subtle}
            strokeWidth="1"
            strokeDasharray={i % 2 === 0 ? "2" : "0"}
          />
        ))}
        <Polygon points={points} fill={Colors.glow.violet} stroke={Colors.accent.primary} strokeWidth="2" />
        {labels.map((label, i) => {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const x = center + (radius + 20) * Math.cos(angle);
            const y = center + (radius + 15) * Math.sin(angle);
            return <SvgText key={i} x={x} y={y} fill={Colors.text.secondary} fontSize="8" textAnchor="middle" fontWeight="bold">{label}</SvgText>;
        })}
      </Svg>
    </View>
  );
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState({
    iq: 100,
    highestScore: 0,
    highestScoreGame: 'None',
    totalTests: 0,
    testCounts: {},
    radar: [0.2, 0.2, 0.2, 0.2, 0.2],
    rankLabel: 'NOVICE'
  });

  useEffect(() => {
    if (user) fetchRealProfileData();
    else setLoading(false);
  }, [user]);

  const fetchRealProfileData = async () => {
    if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
    }
    try {
      const q = query(collection(db, "scores"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      let maxScore = 0;
      let maxScoreGame = 'None';
      let count = querySnapshot.size;
      let categories = { "Logic Test": [], "Memory Flip": [], "Mental Math": [], "Spatial Vision": [], "Rapid Fire": [], "Academic Quiz": [] };
      let testCounts = {};
      
      querySnapshot.forEach((doc) => {
        const d = doc.data();
        if (d.score > maxScore) {
            maxScore = d.score;
            maxScoreGame = d.gameType || 'Unknown Game';
        }
        if (categories[d.gameType]) categories[d.gameType].push(d.score);
        else categories[d.gameType] = [d.score];

        testCounts[d.gameType || 'Unknown'] = (testCounts[d.gameType || 'Unknown'] || 0) + 1;
      });

      // Normalize Radar Data
      const radar = [
        calculateAvg(categories["Logic Test"], 150),
        calculateAvg(categories["Memory Flip"], 200),
        calculateAvg(categories["Mental Math"], 250),
        calculateAvg(categories["Spatial Vision"], 100),
        calculateSpeedScore(categories["Rapid Fire"])
      ];

      // IQ Logic: Base 100 + (Avg of performance)
      const avgPerformance = radar.reduce((a, b) => a + b, 0) / 5;
      const iq = Math.floor(90 + (avgPerformance * 50));
      
      let rank = 'NOVICE';
      if (iq > 110) rank = 'SMART';
      if (iq > 125) rank = 'SUPERIOR';
      if (iq > 140) rank = 'GENIUS';

      setProfileData({
        iq,
        highestScore: maxScore,
        highestScoreGame: maxScoreGame,
        totalTests: count,
        testCounts: testCounts,
        radar,
        rankLabel: rank
      });

    } catch (e) { console.error(e); }
    finally { 
        setLoading(false); 
        setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRealProfileData();
  };

  const calculateAvg = (arr, max) => {
    if (!arr || arr.length === 0) return 0.2;
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    return Math.min(avg / max, 1);
  };

  const calculateSpeedScore = (arr) => {
    if (!arr || arr.length === 0) return 0.2;
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    let score = (1000 - avg) / 800;
    return Math.max(Math.min(score, 1), 0.1);
  };

  if (loading) return <ThemedView style={[styles.container, {justifyContent: 'center'}]}><ActivityIndicator color={Colors.accent.primary} size="large" /></ThemedView>;

  const BADGES = [
      { id: 'trophy', icon: Trophy },
      { id: 'ribbon', icon: Ribbon },
      { id: 'shield', icon: Shield },
      { id: 'medal', icon: Medal },
      { id: 'flame', icon: Flame },
  ];

  return (
    <ThemedView safe style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent.primary} />}
      >
        
        <View style={styles.userHeader}>
            <View style={styles.userAvatar}>
                <ThemedText style={styles.userAvatarText}>
                    {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </ThemedText>
            </View>
            <ThemedText style={styles.userName}>
                {user?.displayName || (user?.email ? user.email.split('@')[0] : 'Cognito User')}
            </ThemedText>
            <ThemedText style={styles.userEmail}>{user?.email}</ThemedText>
        </View>

        <View style={styles.heroSection}>
            <ThemedText style={styles.heroLabel}>CURRENT IQ INDEX</ThemedText>
            <View style={styles.iqGaugeBox}>
                <Svg height="160" width="160" viewBox="0 0 100 100">
                    <Circle cx="50" cy="50" r="45" stroke={Colors.border.subtle} strokeWidth="6" fill="none" />
                    <Circle 
                        cx="50" cy="50" r="45" 
                        stroke={Colors.accent.primary} strokeWidth="6" 
                        strokeDasharray="283" 
                        strokeDashoffset={283 - (283 * ((profileData.iq - 70) / 100))} 
                        fill="none" strokeLinecap="round" 
                    />
                    <SvgText x="50" y="55" fontSize="22" fontFamily="Roboto-Black" fill={Colors.text.primary} textAnchor="middle">{profileData.iq}</SvgText>
                    <SvgText x="50" y="68" fontSize="6" fontWeight="bold" fill={Colors.text.secondary} textAnchor="middle">{profileData.rankLabel}</SvgText>
                </Svg>
                <View style={[StyleSheet.absoluteFillObject, styles.glowBehindGauge]} />
                <LinearGradient colors={[Colors.accent.primary, Colors.accent.secondary]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.iqBadge}>
                    <Zap size={10} color="#FFF" fill="#fff" />
                    <ThemedText style={styles.iqBadgeText}>LIVE ENGINE SYNCED</ThemedText>
                </LinearGradient>
            </View>

            <View style={styles.quickStatsRow}>
                <TouchableOpacity 
                    style={[styles.miniStatCard, { marginRight: 12 }]}
                    onPress={() => Alert.alert("Best Score Breakdown", `You achieved your highest score of ${profileData.highestScore} points playing ${profileData.highestScoreGame}.`)}
                >
                    <ThemedText style={styles.miniStatValue}>{profileData.highestScore}</ThemedText>
                    <ThemedText style={styles.miniStatLabel}>Best Score</ThemedText>
                    <ThemedText style={{fontSize: 9, color: Colors.accent.primaryLight, marginTop: 6, fontWeight: 'bold', textAlign: 'center'}}>{profileData.highestScoreGame}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.miniStatCard}
                    onPress={() => {
                        const breakdown = Object.entries(profileData.testCounts).map(([game, count]) => `${game}: ${count} tests`).join('\n');
                        Alert.alert("Tests Breakdown", breakdown || "No tests completed yet.");
                    }}
                >
                    <ThemedText style={styles.miniStatValue}>{profileData.totalTests}</ThemedText>
                    <ThemedText style={styles.miniStatLabel}>Tests Done</ThemedText>
                    <ThemedText style={{fontSize: 9, color: Colors.accent.primaryLight, marginTop: 6, fontWeight: 'bold'}}>Tap for details</ThemedText>
                </TouchableOpacity>
            </View>
        </View>

        <ThemedText subtitle style={styles.sectionTitle}>Cognito Analytics</ThemedText>
        <View style={styles.analyticsCard}>
            <View style={{ flex: 1 }}>
                <RadarChart dataValues={profileData.radar} />
            </View>
            <View style={styles.radarInfo}>
                <ThemedText style={styles.radarInfoTitle}>Brain Integrity</ThemedText>
                <ThemedText style={styles.radarInfoDesc}>Data is synced directly from your cloud database.</ThemedText>
            </View>
        </View>

        <ThemedText subtitle style={styles.sectionTitle}>Cognito Master Badges</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeScroll}>
            {BADGES.map((b, i) => {
                const isEarned = i < 3;
                const IconComp = b.icon;
                return (
                    <View key={i} style={[
                        styles.badgeCircle, 
                        { backgroundColor: isEarned ? 'rgba(124,58,237,0.1)' : Colors.bg.elevated },
                        isEarned && { borderColor: Colors.accent.primary, shadowColor: Colors.accent.primary, elevation: 8, shadowOpacity: 0.3, shadowRadius: 10 }
                    ]}>
                        <IconComp size={24} color={isEarned ? Colors.accent.primaryLight : Colors.text.secondary} />
                    </View>
                )
            })}
        </ScrollView>

        <ThemedText subtitle style={styles.sectionTitle}>Account & Settings</ThemedText>
        <View style={styles.settingsCard}>
            <SettingItem 
                icon={User} 
                label="Edit Profile" 
                onPress={() => router.push('/edit-profile')}
            />
            <SettingItem 
                icon={HelpCircle} 
                label="Help & Support" 
                onPress={() => router.push('/help-support')}
            />
            <SettingItem 
                icon={Star} 
                label="Upgrade to Premium" 
                premium 
                onPress={() => router.push('/premium')}
            />
            <SettingItem 
                icon={LogOut} 
                label="Log Out" 
                color={Colors.accent.danger} 
                onPress={() => {
                    Alert.alert(
                      "Log Out",
                      "Are you sure you want to log out of Cognito?",
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Yes, Log Out", onPress: logout, style: "destructive" }
                      ]
                    );
                }} 
                last 
            />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ThemedView>
  );
}

const SettingItem = ({ icon: Icon, label, last, color, onPress, premium }) => (
    <TouchableOpacity onPress={onPress} style={[styles.settingItem, last && { borderBottomWidth: 0 }]}>
        <View style={[styles.settingIcon, premium && { backgroundColor: 'rgba(251,191,36,0.1)' }]}>
            <Icon size={20} color={premium ? Colors.accent.warn : color || Colors.text.primary} />
        </View>
        <ThemedText style={[styles.settingLabel, color && { color }]}>{label}</ThemedText>
        <ChevronRight size={16} color={Colors.text.secondary} />
    </TouchableOpacity>
)

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  
  userHeader: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  userAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(124,58,237,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: Colors.accent.primary },
  userAvatarText: { fontSize: 32, fontWeight: '900', color: Colors.accent.primaryLight },
  userName: { fontSize: 24, fontWeight: 'bold', color: Colors.text.primary, letterSpacing: -0.5 },
  userEmail: { fontSize: 13, color: Colors.text.secondary, marginTop: 4 },

  heroSection: { alignItems: 'center', marginBottom: 35 },
  heroLabel: { fontSize: 10, fontWeight: '900', color: Colors.text.secondary, letterSpacing: 2, marginBottom: 15 },
  iqGaugeBox: { alignItems: 'center', justifyContent: 'center', marginBottom: 25 },
  glowBehindGauge: {
      backgroundColor: Colors.accent.primary,
      width: 100, height: 100,
      borderRadius: 50,
      opacity: 0.1,
      top: 30,
      left: 30,
      filter: 'blur(30px)' // Note: blur effect not fully supported on all RN versions, but opacity works
  },
  iqBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, position: 'absolute', bottom: -10, elevation: 8, shadowColor: Colors.accent.primary, shadowOpacity: 0.5, shadowRadius: 10 },
  iqBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#FFF', marginLeft: 6, letterSpacing: 1 },
  
  quickStatsRow: { flexDirection: 'row', width: '100%', marginTop: 20 },
  miniStatCard: { flex: 1, backgroundColor: Colors.bg.card, padding: 16, borderRadius: 24, alignItems: 'center', elevation: 8, shadowColor: Colors.accent.primary, shadowOpacity: 0.1, shadowRadius: 15, borderWidth: 1, borderColor: Colors.border.subtle },
  miniStatValue: { fontSize: 24, fontWeight: '900', color: Colors.text.primary },
  miniStatLabel: { fontSize: 11, color: Colors.text.secondary, fontWeight: 'bold', marginTop: 4 },

  sectionTitle: { fontSize: 18, color: Colors.text.primary, marginBottom: 15, marginTop: 10 },
  analyticsCard: { backgroundColor: Colors.bg.card, borderRadius: 32, padding: 20, flexDirection: 'row', alignItems: 'center', elevation: 8, shadowColor: Colors.accent.primary, shadowOpacity: 0.1, shadowRadius: 15, borderWidth: 1, borderColor: Colors.border.subtle },
  radarInfo: { flex: 0.6, paddingLeft: 10 },
  radarInfoTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.accent.primaryLight, marginBottom: 6 },
  radarInfoDesc: { fontSize: 11, color: Colors.text.secondary, lineHeight: 18 },

  badgeScroll: { paddingLeft: 5, marginBottom: 30, gap: 15 },
  badgeCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border.subtle },

  settingsCard: { backgroundColor: Colors.bg.card, borderRadius: 32, padding: 8, elevation: 8, shadowColor: Colors.accent.primary, shadowOpacity: 0.1, shadowRadius: 15, borderWidth: 1, borderColor: Colors.border.subtle },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  settingIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bg.elevated, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  settingLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text.primary }
});
