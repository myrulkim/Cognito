import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Zap } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { db } from '../src/config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import { Colors } from '../constants/Colors';


export default function RapidFire() {
  const [gameState, setGameState] = useState('IDLE'); // IDLE, WAITING, READY, RESULT, DONE
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [rounds, setRounds] = useState([]);
  const [timerId, setTimerId] = useState(null);
  const { user } = useAuth();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (rounds.length === 5) {
      const avg = Math.round(rounds.reduce((a, b) => a + b, 0) / 5);
      saveScore(avg);
      setGameState('DONE');
    }
  }, [rounds]);

  const saveScore = async (finalScore) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "scores"), {
        userId: user.uid,
        userName: user.displayName || user.email.split('@')[0],
        gameType: "Rapid Fire",
        score: finalScore, // Lower is better for reaction time
        createdAt: serverTimestamp()
      });
    } catch (e) { console.error(e); }
  };

  const startRound = () => {
    setGameState('WAITING');
    const delay = Math.floor(Math.random() * 3000) + 2000; // 2-5 seconds
    const id = setTimeout(() => {
      setGameState('READY');
      setStartTime(Date.now());
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, delay);
    setTimerId(id);
  };

  const handleTap = () => {
    if (gameState === 'WAITING') {
      clearTimeout(timerId);
      setGameState('IDLE');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      alert("Too early! Don't cheat! 😂");
    } else if (gameState === 'READY') {
      const endTime = Date.now();
      const diff = endTime - startTime;
      setReactionTime(diff);
      setRounds(prev => [...prev, diff]);
      setGameState('RESULT');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  if (gameState === 'DONE') {
      const avg = Math.round(rounds.reduce((a, b) => a + b, 0) / 5);
      return (
        <ThemedView safe style={[styles.container, { backgroundColor: Colors.accent.success }]}>
            <View style={styles.center}>
                <Zap size={80} color={Colors.bg.primary} style={{ marginBottom: 20 }} />
                <ThemedText style={[styles.resultBig, { color: Colors.bg.primary }]}>{avg}ms</ThemedText>
                <ThemedText style={{ color: Colors.bg.primary, fontWeight: 'bold' }}>AVERAGE REACTION TIME</ThemedText>
                <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.bg.primary, marginTop: 40 }]} onPress={() => router.replace('/')}>
                    <ThemedText style={{ color: Colors.text.primary }}>Back to Menu</ThemedText>
                </TouchableOpacity>
            </View>
        </ThemedView>
      )
  }

  return (
    <ThemedView safe style={[
        styles.container, 
        gameState === 'READY' ? { backgroundColor: Colors.accent.success } : 
        gameState === 'WAITING' ? { backgroundColor: Colors.accent.danger } : 
        { backgroundColor: Colors.bg.primary }
    ]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.roundBox}>
            <ThemedText style={{ color: '#FFF', fontWeight: 'bold' }}>Round {rounds.length + 1} / 5</ThemedText>
        </View>
      </View>

      <TouchableOpacity 
        activeOpacity={1} 
        style={styles.gameArea} 
        onPress={handleTap}
      >
        {gameState === 'IDLE' && (
            <TouchableOpacity style={styles.btn} onPress={startRound}>
                <ThemedText style={styles.btnText}>START TEST</ThemedText>
            </TouchableOpacity>
        )}
        {gameState === 'WAITING' && (
            <ThemedText style={styles.statusText}>WAIT FOR GREEN...</ThemedText>
        )}
        {gameState === 'READY' && (
            <ThemedText style={styles.statusText}>TAP NOW!</ThemedText>
        )}
        {gameState === 'RESULT' && (
            <View style={styles.center}>
                <ThemedText style={styles.resultText}>{reactionTime}ms</ThemedText>
                <TouchableOpacity style={styles.btn} onPress={startRound}>
                    <ThemedText style={styles.btnText}>NEXT ROUND</ThemedText>
                </TouchableOpacity>
            </View>
        )}
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  backBtn: { padding: 10 },
  roundBox: { backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  gameArea: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  statusText: { fontSize: 28, fontWeight: '900', color: '#FFF', textAlign: 'center', letterSpacing: 1 },
  resultText: { fontSize: 72, fontWeight: '900', color: '#FFF', marginBottom: 20, letterSpacing: -2 },
  resultBig: { fontSize: 80, fontWeight: '900', letterSpacing: -2 },
  center: { alignItems: 'center', zIndex: 10 },
  btn: { backgroundColor: Colors.accent.primary, paddingHorizontal: 40, paddingVertical: 20, borderRadius: 20, elevation: 8, shadowColor: Colors.accent.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 }
});
