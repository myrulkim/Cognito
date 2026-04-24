import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { TrendingUp, Activity } from 'lucide-react-native';
import Svg, { Polygon, Line, Text as SvgText } from 'react-native-svg';
import { db } from '../../src/config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import ThemedText from '../../components/ThemedText';
import ThemedView from '../../components/ThemedView';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

const RadarChart = ({ dataValues }) => {
  const size = width * 0.7;
  const center = size / 2;
  const radius = size * 0.4;
  const labels = ['Logic', 'Memory', 'Math', 'Spatial', 'Speed'];

  const points = dataValues.map((val, i) => {
    const angle = (Math.PI * 2 * i) / dataValues.length - Math.PI / 2;
    return `${center + radius * val * Math.cos(angle)},${center + radius * val * Math.sin(angle)}`;
  }).join(' ');

  return (
    <View style={styles.chartContainer}>
      <Svg height={size} width={size}>
        {[0.2, 0.4, 0.6, 0.8, 1].map((r, i) => (
          <Polygon
            key={i}
            points={dataValues.map((_, j) => {
                const angle = (Math.PI * 2 * j) / dataValues.length - Math.PI / 2;
                return `${center + radius * r * Math.cos(angle)},${center + radius * r * Math.sin(angle)}`;
            }).join(' ')}
            fill="none"
            stroke={Colors.border.subtle}
            strokeWidth="1"
            strokeDasharray={i % 2 === 0 ? "2" : "0"}
          />
        ))}

        {labels.map((_, i) => {
            const angle = (Math.PI * 2 * i) / dataValues.length - Math.PI / 2;
            return (
              <Line key={i} x1={center} y1={center} x2={center + radius * Math.cos(angle)} y2={center + radius * Math.sin(angle)} stroke={Colors.border.subtle} strokeWidth="1" />
            );
        })}

        <Polygon points={points} fill={Colors.glow.violet} stroke={Colors.accent.primary} strokeWidth="2" />

        {labels.map((label, i) => {
            const angle = (Math.PI * 2 * i) / dataValues.length - Math.PI / 2;
            const x = center + (radius + 25) * Math.cos(angle);
            const y = center + (radius + 20) * Math.sin(angle);
            return (
                <SvgText key={i} x={x} y={y} fill={Colors.text.primary} fontSize="10" textAnchor="middle" fontWeight="bold">
                    {label}
                </SvgText>
            );
        })}
      </Svg>
    </View>
  );
};

export default function StatsScreen() {
  const { user } = useAuth();
  const [chartData, setChartData] = useState([0.2, 0.2, 0.2, 0.2, 0.2]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRealStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchRealStats = async () => {
    try {
      const q = query(collection(db, "scores"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      let categories = { "Logic Test": [], "Memory Flip": [], "Mental Math": [], "Spatial Vision": [], "Rapid Fire": [] };
      querySnapshot.forEach((doc) => {
        const d = doc.data();
        if (categories[d.gameType]) categories[d.gameType].push(d.score);
      });

      const mappedData = [
        calculateAvg(categories["Logic Test"], 150),
        calculateAvg(categories["Memory Flip"], 200),
        calculateAvg(categories["Mental Math"], 250),
        calculateAvg(categories["Spatial Vision"], 100),
        calculateSpeedScore(categories["Rapid Fire"])
      ];
      setChartData(mappedData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const calculateAvg = (arr, max) => {
    if (arr.length === 0) return 0.2;
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    return Math.min(avg / max, 1);
  };

  const calculateSpeedScore = (arr) => {
    if (arr.length === 0) return 0.2;
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    let score = (1000 - avg) / 800;
    return Math.max(Math.min(score, 1), 0.1);
  };

  if (loading) return <ThemedView style={[styles.container, {justifyContent: 'center'}]}><ActivityIndicator color={Colors.accent.primary} size="large" /></ThemedView>;

  return (
    <ThemedView safe style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText title style={styles.headerText}>Cognitive Stats</ThemedText>
        <ThemedText style={styles.subtitle}>Your brain's performance in the neural network.</ThemedText>

        <View style={styles.chartCard}>
           <View style={styles.cardHeaderTop}>
              <Activity size={16} color={Colors.accent.primary} />
              <ThemedText style={styles.cardInfo}>LIVE PERFORMANCE ENGINE</ThemedText>
           </View>
           <RadarChart dataValues={chartData} />
        </View>

        <View style={styles.recentActivity}>
            <ThemedText subtitle style={{ marginBottom: 16 }}>Intelligence Feed</ThemedText>
            <View style={styles.activityRow}>
                <View style={styles.iconCircle}>
                    <TrendingUp size={24} color={Colors.accent.primaryLight} />
                </View>
                <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontWeight: 'bold' }}>Stats Synced</ThemedText>
                    <ThemedText style={{ fontSize: 12, color: Colors.text.secondary }}>Radar chart updated in real-time.</ThemedText>
                </View>
            </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24 },
  headerText: { fontSize: 36, color: Colors.text.primary, letterSpacing: -1 },
  subtitle: { color: Colors.text.secondary, fontSize: 14, marginTop: 4, marginBottom: 30 },
  
  chartCard: { backgroundColor: Colors.bg.card, borderRadius: 32, padding: 20, alignItems: 'center', elevation: 10, shadowColor: Colors.accent.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, borderWidth: 1, borderColor: Colors.border.subtle },
  cardHeaderTop: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, marginBottom: 10 },
  cardInfo: { color: Colors.accent.primary, fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  chartContainer: { marginTop: 10 },
  
  recentActivity: { marginTop: 35 },
  activityRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg.elevated, padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: Colors.border.subtle },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(124,58,237,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }
});
