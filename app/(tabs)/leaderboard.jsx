import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { User, Medal, Crown } from 'lucide-react-native';
import { db } from '../../src/config/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import ThemedText from '../../components/ThemedText';
import ThemedView from '../../components/ThemedView';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRankings = async () => {
    try {
      const q = query(collection(db, "scores"), orderBy("score", "desc"), limit(20));
      const querySnapshot = await getDocs(q);
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setLeaders(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchRankings(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchRankings(); };

  if (loading) return <ThemedView style={[styles.container, {justifyContent: 'center'}]}><ActivityIndicator color={Colors.accent.primary} size="large" /></ThemedView>;

  const getRankStyle = (idx) => {
    if (idx === 0) return { color: Colors.accent.warn, bg: 'rgba(251,191,36,0.1)', border: Colors.accent.warn, glow: Colors.accent.warn };
    if (idx === 1) return { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', border: '#94A3B8', glow: '#94A3B8' };
    if (idx === 2) return { color: '#B45309', bg: 'rgba(180,83,9,0.1)', border: '#B45309', glow: '#B45309' };
    return { color: Colors.text.secondary, bg: Colors.bg.elevated, border: 'transparent', glow: 'transparent' };
  };

  return (
    <ThemedView safe style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText title style={styles.headerText}>World Ranking</ThemedText>
        <ThemedText style={styles.subtitle}>Mind giants in the Cognito network.</ThemedText>

        <View style={styles.list}>
          {leaders.map((item, idx) => {
             const rankStyle = getRankStyle(idx);
             const isTop3 = idx < 3;
             const isCurrentUser = user && item.userId === user.uid;

             return (
              <View 
                key={item.id} 
                style={[
                    styles.rankItem, 
                    isTop3 && styles.topRankItem,
                    isTop3 && { borderColor: rankStyle.border, shadowColor: rankStyle.glow, shadowOpacity: 0.2, shadowRadius: 15, shadowOffset: {height: 5, width: 0} },
                    isCurrentUser && !isTop3 && { borderColor: Colors.accent.primaryLight, borderWidth: 1.5 }
                ]}
              >
                {isTop3 && (
                    <LinearGradient
                        colors={[rankStyle.bg, 'transparent']}
                        style={StyleSheet.absoluteFillObject}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    />
                )}
                {isCurrentUser && !isTop3 && (
                    <LinearGradient
                        colors={['rgba(124,58,237,0.05)', 'transparent']}
                        style={StyleSheet.absoluteFillObject}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    />
                )}
                
                <View style={styles.left}>
                  <ThemedText style={[styles.rankNumber, { color: rankStyle.color }]}>#{idx + 1}</ThemedText>
                  <View style={[styles.avatarBox, { backgroundColor: rankStyle.bg }]}>
                     {idx === 0 ? <Crown size={20} color={rankStyle.color} /> : <User size={20} color={isCurrentUser ? Colors.accent.primaryLight : rankStyle.color} />}
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <ThemedText style={[styles.name, isCurrentUser && { color: Colors.accent.primaryLight }]}>
                        {isCurrentUser ? "You" : `Explorer_${item.userId.substring(0, 4)}`}
                    </ThemedText>
                    <ThemedText style={[styles.gameType, { color: isTop3 ? rankStyle.color : Colors.text.secondary }]}>{item.gameType}</ThemedText>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 6 }}>
                  {isTop3 && <Medal size={16} color={rankStyle.color} />}
                  <ThemedText style={[styles.scoreText, isTop3 && { color: rankStyle.color }]}>{item.score}</ThemedText>
                </View>
              </View>
            )
          })}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 40 },
  headerText: { fontSize: 36, color: Colors.text.primary, letterSpacing: -1 },
  subtitle: { color: Colors.text.secondary, fontSize: 14, marginTop: 4, marginBottom: 30 },
  list: { gap: 12 },
  rankItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: Colors.bg.card, 
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden'
  },
  topRankItem: {
    elevation: 8,
  },
  left: { flexDirection: 'row', alignItems: 'center', zIndex: 2 },
  rankNumber: { fontWeight: '900', fontSize: 16, width: 35 },
  avatarBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  name: { color: Colors.text.primary, fontWeight: 'bold', fontSize: 15 },
  gameType: { fontSize: 10, textTransform: 'uppercase', fontWeight: '700', marginTop: 2, opacity: 0.8 },
  scoreText: { color: Colors.text.primary, fontWeight: '900', fontSize: 18, zIndex: 2 },
});
