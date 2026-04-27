import React, { useState, useEffect } from 'react';
import {
  SafeAreaView, StyleSheet, View, ActivityIndicator,
  TouchableOpacity, ScrollView, Dimensions, Alert,
  RefreshControl, Text
} from 'react-native';
import { Zap, User, HelpCircle, Star, LogOut, ChevronRight, Trophy, Shield, Medal, Flame, Ribbon } from 'lucide-react-native';
import Svg, { Circle, Text as SvgText, Polygon, Line, Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { db } from '../../src/config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import ThemedText from '../../components/ThemedText';
import ThemedView from '../../components/ThemedView';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

// ─── Geometric Background Pattern ──────────────────────────────
const GeometricPattern = ({ color }) => (
  <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%" viewBox="0 0 300 120">
    <Defs>
      <SvgLinearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={color} stopOpacity="0.12" />
        <Stop offset="1" stopColor={color} stopOpacity="0.02" />
      </SvgLinearGradient>
    </Defs>
    <Polygon points="0,0 80,0 40,60" fill="url(#pg)" />
    <Polygon points="220,0 300,0 300,80" fill="url(#pg)" />
    <Polygon points="150,120 300,40 300,120" fill="url(#pg)" />
    <Polygon points="0,80 60,120 0,120" fill="url(#pg)" />
    <Circle cx="260" cy="20" r="35" fill="none" stroke={color} strokeWidth="0.5" strokeOpacity="0.15" />
    <Circle cx="30" cy="90" r="25" fill="none" stroke={color} strokeWidth="0.5" strokeOpacity="0.12" />
  </Svg>
);

// ─── Radar Chart ───────────────────────────────────────────────
const RadarChart = ({ dataValues }) => {
  const size = width * 0.45;
  const center = size / 2;
  const radius = size * 0.38;
  const labels = ['Logik', 'Mem', 'Mat', 'Ruang', 'Laju'];
  const points = dataValues.map((val, i) => {
    const angle = (Math.PI * 2 * i) / dataValues.length - Math.PI / 2;
    return `${center + radius * val * Math.cos(angle)},${center + radius * val * Math.sin(angle)}`;
  }).join(' ');

  return (
    <Svg height={size} width={size}>
      {[0.25, 0.5, 0.75, 1].map((r, i) => (
        <Polygon key={i}
          points={[...Array(5)].map((_, j) => {
            const angle = (Math.PI * 2 * j) / 5 - Math.PI / 2;
            return `${center + radius * r * Math.cos(angle)},${center + radius * r * Math.sin(angle)}`;
          }).join(' ')}
          fill="none" stroke={Colors.border.subtle} strokeWidth="1"
        />
      ))}
      {[...Array(5)].map((_, i) => {
        const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        return <Line key={i} x1={center} y1={center}
          x2={center + radius * Math.cos(angle)} y2={center + radius * Math.sin(angle)}
          stroke={Colors.border.subtle} strokeWidth="1" />;
      })}
      <Polygon points={points} fill={Colors.glow.indigo} stroke={Colors.accent.primary} strokeWidth="2" />
      {labels.map((label, i) => {
        const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        return (
          <SvgText key={i}
            x={center + (radius + 18) * Math.cos(angle)}
            y={center + (radius + 14) * Math.sin(angle)}
            fill={Colors.text.secondary} fontSize="8" textAnchor="middle" fontWeight="bold">
            {label}
          </SvgText>
        );
      })}
    </Svg>
  );
};

// ─── Identity Card ─────────────────────────────────────────────
const IdentityCard = ({ radar }) => {
  const titles = [
    { name: 'The Architect', desc: 'Pakar Logik & Penaakulan. Anda membina struktur mental yang kukuh.', color: Colors.accent.primary },
    { name: 'The Vault', desc: 'Master Memori Visual. Anda menyimpan setiap butiran dengan ketepatan.', color: Colors.accent.rose },
    { name: 'Human Calculator', desc: 'Tokoh Angka. Nombor mengalir melalui minda anda dengan mudah.', color: Colors.accent.sky },
    { name: 'The Visionary', desc: 'Pakar Ruang 3D. Anda boleh memanipulasi idea dalam dimensi.', color: Colors.accent.warn },
    { name: 'The Sonic Mind', desc: 'Lagenda Kelajuan Reaksi. Refleks anda melampaui kelajuan minda.', color: Colors.accent.success },
  ];
  const maxIndex = radar.indexOf(Math.max(...radar));
  const id = titles[maxIndex] || titles[0];

  return (
    <View style={[styles.identityCard, { borderColor: `${id.color}20` }]}>
      <GeometricPattern color={id.color} />
      <View style={styles.identityContent}>
        <View style={[styles.identityBadge, { backgroundColor: `${id.color}12` }]}>
          <Zap size={10} color={id.color} />
          <Text style={[styles.identityBadgeText, { color: id.color }]}>IDENTITI KOGNITIF</Text>
        </View>
        <Text style={[styles.identityName, { color: id.color }]}>{id.name}</Text>
        <Text style={styles.identityDesc}>{id.desc}</Text>
      </View>
    </View>
  );
};

// ─── Profile Screen ────────────────────────────────────────────
export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState({
    iq: 100, highestScore: 0, highestScoreGame: 'Tiada',
    totalTests: 0, testCounts: {}, radar: [0.2, 0.2, 0.2, 0.2, 0.2],
    rankLabel: 'NOVICE'
  });

  useEffect(() => {
    if (user) fetchRealProfileData();
    else setLoading(false);
  }, [user]);

  const fetchRealProfileData = async () => {
    if (!user) { setLoading(false); setRefreshing(false); return; }
    try {
      const q = query(collection(db, 'scores'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      let maxScore = 0, maxScoreGame = 'Tiada', count = snap.size;
      let categories = { 'Logic Test': [], 'Memory Flip': [], 'Mental Math': [], 'Spatial Vision': [], 'Rapid Fire': [] };
      let testCounts = {};

      snap.forEach(doc => {
        const d = doc.data();
        if (d.score > maxScore) { maxScore = d.score; maxScoreGame = d.gameType || 'Unknown'; }
        if (categories[d.gameType]) categories[d.gameType].push(d.score);
        else categories[d.gameType] = [d.score];
        testCounts[d.gameType || 'Unknown'] = (testCounts[d.gameType || 'Unknown'] || 0) + 1;
      });

      const radar = [
        calcAvg(categories['Logic Test'], 150),
        calcAvg(categories['Memory Flip'], 200),
        calcAvg(categories['Mental Math'], 250),
        calcAvg(categories['Spatial Vision'], 100),
        calcSpeed(categories['Rapid Fire'])
      ];
      const avg = radar.reduce((a, b) => a + b, 0) / 5;
      const iq = Math.floor(90 + avg * 50);
      let rank = 'NOVICE';
      if (iq > 110) rank = 'SMART';
      if (iq > 125) rank = 'SUPERIOR';
      if (iq > 140) rank = 'GENIUS';

      setProfileData({ iq, highestScore: maxScore, highestScoreGame: maxScoreGame, totalTests: count, testCounts, radar, rankLabel: rank });
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const calcAvg = (arr, max) => {
    if (!arr || arr.length === 0) return 0.2;
    return Math.min(arr.reduce((a, b) => a + b, 0) / arr.length / max, 1);
  };
  const calcSpeed = (arr) => {
    if (!arr || arr.length === 0) return 0.2;
    return Math.max(Math.min((1000 - arr.reduce((a, b) => a + b, 0) / arr.length) / 800, 1), 0.1);
  };

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator color={Colors.accent.primary} size="large" />
    </View>
  );

  const BADGES = [
    { id: 'trophy', icon: Trophy }, { id: 'ribbon', icon: Ribbon },
    { id: 'shield', icon: Shield }, { id: 'medal', icon: Medal },
    { id: 'flame', icon: Flame },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRealProfileData(); }} tintColor={Colors.accent.primary} />}
      >
        {/* ── Avatar Header ── */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarRing}>
            <LinearGradient colors={['#6366F1', '#818CF8']} style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </Text>
            </LinearGradient>
          </View>
          <Text style={styles.profileName}>
            {user?.displayName || user?.email?.split('@')[0] || 'Pengguna Cognito'}
          </Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>

        {/* ── Cognitive Identity Card ── */}
        <IdentityCard radar={profileData.radar} />

        {/* ── IQ Gauge ── */}
        <Text style={styles.sectionLabel}>INDEKS IQ SEMASA</Text>
        <View style={styles.iqCard}>
          <View style={styles.iqLeft}>
            <Svg height={140} width={140} viewBox="0 0 100 100">
              <Circle cx="50" cy="50" r="42" stroke={Colors.bg.elevated} strokeWidth="8" fill="none" />
              <Circle cx="50" cy="50" r="42"
                stroke={Colors.accent.primary} strokeWidth="8"
                strokeDasharray="264" strokeDashoffset={264 - (264 * ((profileData.iq - 70) / 100))}
                fill="none" strokeLinecap="round" transform="rotate(-90 50 50)"
              />
              <SvgText x="50" y="46" fontSize="20" fontWeight="900" fill={Colors.text.primary} textAnchor="middle">{profileData.iq}</SvgText>
              <SvgText x="50" y="60" fontSize="6" fontWeight="bold" fill={Colors.text.secondary} textAnchor="middle">{profileData.rankLabel}</SvgText>
            </Svg>
          </View>
          <View style={styles.iqRight}>
            <TouchableOpacity style={styles.miniStat}
              onPress={() => Alert.alert('Skor Terbaik', `${profileData.highestScore} mata dalam ${profileData.highestScoreGame}`)}>
              <Text style={styles.miniStatValue}>{profileData.highestScore}</Text>
              <Text style={styles.miniStatLabel}>Skor Terbaik</Text>
              <Text style={styles.miniStatGame} numberOfLines={1}>{profileData.highestScoreGame}</Text>
            </TouchableOpacity>
            <View style={styles.miniStatDivider} />
            <TouchableOpacity style={styles.miniStat}
              onPress={() => Alert.alert('Ujian Selesai', Object.entries(profileData.testCounts).map(([g, c]) => `${g}: ${c}`).join('\n') || 'Tiada lagi.')}>
              <Text style={styles.miniStatValue}>{profileData.totalTests}</Text>
              <Text style={styles.miniStatLabel}>Ujian Selesai</Text>
              <Text style={styles.miniStatGame}>Ketuk untuk butiran</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Brain Radar ── */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>ANALITIK OTAK</Text>
        <View style={styles.radarCard}>
          <RadarChart dataValues={profileData.radar} />
          <View style={styles.radarInfo}>
            <Text style={styles.radarTitle}>Integriti Otak</Text>
            <Text style={styles.radarDesc}>Data disegerakkan terus dari pangkalan data awan anda.</Text>
            {['Logik', 'Memori', 'Matematik', 'Ruang', 'Laju'].map((label, i) => (
              <View key={label} style={styles.radarRow}>
                <View style={[styles.radarDot, { backgroundColor: Colors.accent.primary, opacity: 0.4 + profileData.radar[i] * 0.6 }]} />
                <Text style={styles.radarRowLabel}>{label}</Text>
                <Text style={styles.radarRowVal}>{Math.round(profileData.radar[i] * 100)}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Badges ── */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>LENCANA PENCAPAIAN</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeList}>
          {BADGES.map((b, i) => {
            const earned = i < 3;
            const Icon = b.icon;
            return (
              <View key={i} style={[styles.badge, earned && styles.badgeEarned]}>
                <Icon size={22} color={earned ? Colors.accent.primary : Colors.text.muted} />
              </View>
            );
          })}
        </ScrollView>

        {/* ── Settings ── */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>AKAUN & TETAPAN</Text>
        <View style={styles.settingsCard}>
          {[
            { icon: User, label: 'Edit Profil', onPress: () => router.push('/edit-profile') },
            { icon: HelpCircle, label: 'Bantuan & Sokongan', onPress: () => router.push('/help-support') },
            { icon: Star, label: 'Naik Taraf ke Premium', premium: true, onPress: () => router.push('/premium') },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity key={i} onPress={item.onPress}
                style={[styles.settingItem, i < 2 && styles.settingBorder]}>
                <View style={[styles.settingIcon, item.premium && styles.settingIconPremium]}>
                  <Icon size={18} color={item.premium ? Colors.accent.warn : Colors.accent.primary} />
                </View>
                <Text style={[styles.settingLabel, item.premium && { color: Colors.accent.warn }]}>{item.label}</Text>
                <ChevronRight size={16} color={Colors.text.muted} />
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity onPress={() => Alert.alert('Log Keluar', 'Anda pasti mahu log keluar?', [
          { text: 'Batal', style: 'cancel' },
          { text: 'Ya, Log Keluar', onPress: logout, style: 'destructive' }
        ])} style={styles.logoutBtn}>
          <LogOut size={16} color={Colors.accent.danger} />
          <Text style={styles.logoutText}>Log Keluar</Text>
        </TouchableOpacity>

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

const SettingItem = () => null; // kept for compat, unused

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },

  profileHeader: { alignItems: 'center', marginBottom: 24 },
  avatarRing: { padding: 3, borderRadius: 46, borderWidth: 2, borderColor: `${Colors.accent.primary}40`, marginBottom: 14 },
  avatar: { width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 30, fontWeight: '900', color: '#FFF' },
  profileName: { fontSize: 22, fontWeight: '800', color: Colors.text.primary, letterSpacing: -0.3 },
  profileEmail: { fontSize: 12, color: Colors.text.secondary, marginTop: 3 },

  identityCard: { borderRadius: 28, overflow: 'hidden', backgroundColor: '#FFF', marginBottom: 24, borderWidth: 1, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  identityContent: { padding: 22 },
  identityBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 10 },
  identityBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  identityName: { fontSize: 26, fontWeight: '900', letterSpacing: -0.8, marginBottom: 8 },
  identityDesc: { fontSize: 13, color: Colors.text.secondary, lineHeight: 20 },

  sectionLabel: { fontSize: 10, fontWeight: '900', color: Colors.text.muted, letterSpacing: 2.5, marginBottom: 12 },

  iqCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 3, borderWidth: 1, borderColor: Colors.border.subtle },
  iqLeft: { marginRight: 16 },
  iqRight: { flex: 1 },
  miniStat: { paddingVertical: 8 },
  miniStatDivider: { height: 1, backgroundColor: Colors.border.subtle, marginVertical: 4 },
  miniStatValue: { fontSize: 26, fontWeight: '900', color: Colors.text.primary },
  miniStatLabel: { fontSize: 11, color: Colors.text.secondary, fontWeight: '700', marginTop: 2 },
  miniStatGame: { fontSize: 9, color: Colors.accent.primaryLight, fontWeight: '800', marginTop: 3 },

  radarCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3, borderWidth: 1, borderColor: Colors.border.subtle },
  radarInfo: { flex: 1, paddingLeft: 12 },
  radarTitle: { fontSize: 14, fontWeight: '800', color: Colors.accent.primary, marginBottom: 4 },
  radarDesc: { fontSize: 10, color: Colors.text.secondary, lineHeight: 15, marginBottom: 10 },
  radarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  radarDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  radarRowLabel: { flex: 1, fontSize: 10, fontWeight: '700', color: Colors.text.secondary },
  radarRowVal: { fontSize: 10, fontWeight: '900', color: Colors.text.primary },

  badgeList: { paddingBottom: 4, gap: 12 },
  badge: { width: 54, height: 54, borderRadius: 27, backgroundColor: Colors.bg.elevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border.subtle },
  badgeEarned: { backgroundColor: Colors.glow.indigo, borderColor: `${Colors.accent.primary}30`, shadowColor: Colors.accent.primary, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },

  settingsCard: { backgroundColor: '#FFF', borderRadius: 24, overflow: 'hidden', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3, borderWidth: 1, borderColor: Colors.border.subtle },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  settingIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.glow.indigo, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  settingIconPremium: { backgroundColor: 'rgba(245,158,11,0.1)' },
  settingLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text.primary },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.08)', padding: 16, borderRadius: 20, marginTop: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)' },
  logoutText: { fontSize: 14, fontWeight: '800', color: Colors.accent.danger },
});
