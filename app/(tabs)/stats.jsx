import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Text } from 'react-native';
import { TrendingUp, Activity, Calendar, Flame } from 'lucide-react-native';
import Svg, { Polygon, Line, Text as SvgText } from 'react-native-svg';
import { db } from '../../src/config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

// ─── Radar Chart ───────────────────────────────────────────────
const RadarChart = ({ dataValues }) => {
  const { t } = useLanguage();
  const size = width * 0.65;
  const center = size / 2;
  const radius = size * 0.38;
  const labels = [t('categories.logic'), t('categories.memory'), t('categories.math'), t('categories.spatial'), t('categories.speed')];
  const points = dataValues.map((val, i) => {
    const angle = (Math.PI * 2 * i) / dataValues.length - Math.PI / 2;
    return `${center + radius * val * Math.cos(angle)},${center + radius * val * Math.sin(angle)}`;
  }).join(' ');

  return (
    <View style={styles.chartContainer}>
      <Svg height={size} width={size}>
        {[0.25, 0.5, 0.75, 1].map((r, i) => (
          <Polygon key={i}
            points={[...Array(5)].map((_, j) => {
              const angle = (Math.PI * 2 * j) / 5 - Math.PI / 2;
              return `${center + radius * r * Math.cos(angle)},${center + radius * r * Math.sin(angle)}`;
            }).join(' ')}
            fill={i % 2 === 0 ? 'rgba(99,102,241,0.04)' : 'none'}
            stroke={Colors.border.light} strokeWidth="1"
          />
        ))}
        {[...Array(5)].map((_, i) => {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          return <Line key={i} x1={center} y1={center}
            x2={center + radius * Math.cos(angle)} y2={center + radius * Math.sin(angle)}
            stroke={Colors.border.light} strokeWidth="1" />;
        })}
        <Polygon points={points} fill={Colors.glow.indigo} stroke={Colors.accent.primary} strokeWidth="2.5" />
        {labels.map((label, i) => {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          return (
            <SvgText key={i}
              x={center + (radius + 26) * Math.cos(angle)}
              y={center + (radius + 22) * Math.sin(angle)}
              fill={Colors.text.secondary} fontSize="9" textAnchor="middle" fontWeight="bold">
              {label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
};

// ─── Heatmap Grid ──────────────────────────────────────────────
const HeatmapGrid = ({ data }) => {
  const { t, language } = useLanguage();
  const months = language === 'bm' 
    ? ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Og', 'Sep', 'Okt', 'Nov', 'Dis']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();

  const getColor = (val) => {
    if (val === 0) return Colors.bg.elevated;
    if (val === 1) return `${Colors.accent.primary}30`;
    if (val === 2) return `${Colors.accent.primary}60`;
    if (val === 3) return `${Colors.accent.primary}90`;
    return Colors.accent.primary;
  };

  return (
    <View style={styles.heatmapWrapper}>
      <Text style={styles.heatmapTitle}>{t('stats.monthly_consistency')}</Text>
      <Text style={styles.heatmapSub}>{t('stats.darker_active')}</Text>
      <View style={styles.heatmapGrid}>
        {months.map((month, mi) => {
          const isPast = mi <= currentMonth;
          const intensity = isPast ? data[mi] || 0 : 0;
          return (
            <View key={month} style={styles.heatmapCell}>
              <View style={[
                styles.heatmapBlock,
                { backgroundColor: getColor(intensity) },
                mi === currentMonth && { borderWidth: 1.5, borderColor: Colors.accent.primary }
              ]} />
              <Text style={styles.heatmapLabel}>{month}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.heatmapLegend}>
        <Text style={styles.legendText}>{t('stats.less')}</Text>
        {[0, 1, 2, 3, 4].map(v => (
          <View key={v} style={[styles.legendBlock, { backgroundColor: getColor(v) }]} />
        ))}
        <Text style={styles.legendText}>{t('stats.more')}</Text>
      </View>
    </View>
  );
};

// ─── Stats Screen ──────────────────────────────────────────────
export default function StatsScreen() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [chartData, setChartData] = useState([0.2, 0.2, 0.2, 0.2, 0.2]);
  const [heatmapData, setHeatmapData] = useState(Array(12).fill(0));
  const [summary, setSummary] = useState({ total: 0, best: 0, bestGame: '-', streak: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchRealStats();
    else setLoading(false);
  }, [user]);

  const fetchRealStats = async () => {
    try {
      const q = query(collection(db, 'scores'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      let categories = { 'Logic Test': [], 'Memory Flip': [], 'Mental Math': [], 'Spatial Vision': [], 'Rapid Fire': [] };
      let heatmap = Array(12).fill(0);
      let best = 0, bestGame = '-', total = 0;

      snap.forEach(doc => {
        const d = doc.data();
        total++;
        if (d.score > best) { best = d.score; bestGame = d.gameType || '-'; }
        if (categories[d.gameType]) categories[d.gameType].push(d.score);

        if (d.createdAt) {
          const dt = typeof d.createdAt.toDate === 'function'
            ? d.createdAt.toDate() : new Date(d.createdAt);
          const m = dt.getMonth();
          heatmap[m] = Math.min(heatmap[m] + 1, 4);
        }
      });

      setChartData([
        calcAvg(categories['Logic Test'], 150),
        calcAvg(categories['Memory Flip'], 200),
        calcAvg(categories['Mental Math'], 250),
        calcAvg(categories['Spatial Vision'], 100),
        calcSpeed(categories['Rapid Fire'])
      ]);
      setHeatmapData(heatmap);
      setSummary({ total, best, bestGame, streak: Math.min(total, 7) });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <Text style={styles.headerTitle}>{t('stats.title')}</Text>
        <Text style={styles.headerSub}>{t('stats.sub')}</Text>

        {/* ── Summary Stats Row ── */}
        <View style={styles.summaryRow}>
          {[
            { label: t('stats.summary.tests'), value: summary.total, icon: Activity, color: Colors.accent.primary },
            { label: t('stats.summary.best'), value: summary.best, icon: TrendingUp, color: Colors.accent.success },
            { label: t('stats.summary.streak'), value: summary.streak, icon: Flame, color: Colors.accent.warn },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <View key={i} style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: `${s.color}12` }]}>
                  <Icon size={16} color={s.color} />
                </View>
                <Text style={styles.summaryValue}>{s.value}</Text>
                <Text style={styles.summaryLabel}>{s.label}</Text>
              </View>
            );
          })}
        </View>

        {/* ── Radar Chart ── */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardBadge}>
              <Activity size={12} color={Colors.accent.primary} />
              <Text style={styles.cardBadgeText}>{t('stats.performance_engine')}</Text>
            </View>
          </View>
          <RadarChart dataValues={chartData} />
          <View style={styles.radarLegend}>
            {[t('categories.logic'), t('categories.memory'), t('categories.math'), t('categories.spatial'), t('categories.speed')].map((label, i) => (
              <View key={label} style={styles.radarLegendItem}>
                <View style={[styles.radarLegendDot, { backgroundColor: Colors.accent.primary, opacity: 0.4 + chartData[i] * 0.6 }]} />
                <Text style={styles.radarLegendLabel}>{label}</Text>
                <Text style={styles.radarLegendVal}>{Math.round(chartData[i] * 100)}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Heatmap ── */}
        <View style={[styles.card, { marginTop: 20 }]}>
          <HeatmapGrid data={heatmapData} />
        </View>

        {/* ── Best Score ── */}
        <View style={styles.bestCard}>
          <View style={[styles.bestIcon, { backgroundColor: Colors.glow.success }]}>
            <TrendingUp size={18} color={Colors.accent.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bestLabel}>{t('stats.all_time_high')}</Text>
            <Text style={styles.bestScore}>{summary.best} <Text style={styles.bestGame}>{language === 'bm' ? 'dalam' : 'in'} {summary.bestGame}</Text></Text>
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  content: { padding: 20, paddingTop: 16 },

  headerTitle: { fontSize: 30, fontWeight: '900', color: Colors.text.primary, letterSpacing: -1, marginBottom: 4 },
  headerSub: { fontSize: 13, color: Colors.text.secondary, marginBottom: 24 },

  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, padding: 14, alignItems: 'center', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: Colors.border.subtle },
  summaryIcon: { width: 34, height: 34, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  summaryValue: { fontSize: 20, fontWeight: '900', color: Colors.text.primary },
  summaryLabel: { fontSize: 9, fontWeight: '800', color: Colors.text.muted, letterSpacing: 0.5, marginTop: 2, textAlign: 'center' },

  card: { backgroundColor: '#FFF', borderRadius: 28, padding: 20, alignItems: 'center', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 3, borderWidth: 1, borderColor: Colors.border.subtle },
  cardTopRow: { alignSelf: 'stretch', marginBottom: 12 },
  cardBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.glow.indigo, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, alignSelf: 'flex-start' },
  cardBadgeText: { fontSize: 8, fontWeight: '900', color: Colors.accent.primary, letterSpacing: 1 },
  chartContainer: { marginVertical: 8 },

  radarLegend: { alignSelf: 'stretch', marginTop: 8 },
  radarLegendItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
  radarLegendDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8, backgroundColor: Colors.accent.primary },
  radarLegendLabel: { flex: 1, fontSize: 11, color: Colors.text.secondary, fontWeight: '600' },
  radarLegendVal: { fontSize: 11, fontWeight: '900', color: Colors.text.primary },

  // Heatmap
  heatmapWrapper: { alignSelf: 'stretch' },
  heatmapTitle: { fontSize: 14, fontWeight: '800', color: Colors.text.primary, marginBottom: 2 },
  heatmapSub: { fontSize: 10, color: Colors.text.muted, marginBottom: 16 },
  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  heatmapCell: { width: (width - 112) / 6, alignItems: 'center' },
  heatmapBlock: { width: '100%', aspectRatio: 1, borderRadius: 8 },
  heatmapLabel: { fontSize: 8, color: Colors.text.muted, marginTop: 4, fontWeight: '700' },
  heatmapLegend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 16, justifyContent: 'center' },
  legendBlock: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 9, color: Colors.text.muted, fontWeight: '700' },

  bestCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 14, shadowColor: Colors.accent.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: `${Colors.accent.success}20` },
  bestIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  bestLabel: { fontSize: 9, fontWeight: '900', color: Colors.text.muted, letterSpacing: 1, marginBottom: 4 },
  bestScore: { fontSize: 22, fontWeight: '900', color: Colors.text.primary },
  bestGame: { fontSize: 12, fontWeight: '600', color: Colors.text.secondary },
});
