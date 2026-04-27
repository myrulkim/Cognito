import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { ArrowLeft, RefreshCcw, Share2, Target } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { db } from '../src/config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import { Colors } from '../constants/Colors';
import LevelSelectorModal from '../components/LevelSelectorModal';
import { playCorrect, playWrong, playTimerTick, playVictory } from '../src/utils/SoundEngine';

const { width } = Dimensions.get('window');

export default function FocusGrid() {
  const [level, setLevel] = useState(null);
  const [unlockedLevels, setUnlockedLevels] = useState([1]);
  const [showLevelModal, setShowLevelModal] = useState(true);
  const [gameState, setGameState] = useState('IDLE'); 
  const [numbers, setNumbers] = useState([]);
  const [nextNumber, setNextNumber] = useState(1);
  const [timer, setTimer] = useState(0);
  const { user } = useAuth();
  
  const timerRef = useRef(null);

  useEffect(() => {
    loadUnlockedLevels();
  }, []);

  const loadUnlockedLevels = async () => {
    try {
      const saved = await AsyncStorage.getItem('unlocked_focus_grid');
      if (saved) setUnlockedLevels(JSON.parse(saved));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (gameState === 'PLAYING') {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          // Timer tick sound every second when above 10s, faster sound after
          if (prev > 0) playTimerTick();
          return parseFloat((prev + 0.1).toFixed(1));
        });
      }, 100);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  const startGame = (selectedLevel) => {
    setLevel(selectedLevel);
    setShowLevelModal(false);
    setGameState('PLAYING');
    setNextNumber(1);
    setTimer(0);
    
    const gridSize = selectedLevel === 1 ? 3 : selectedLevel === 2 ? 4 : 5;
    const total = gridSize * gridSize;
    const nums = Array.from({ length: total }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    setNumbers(nums);
  };

  const handlePress = (num) => {
    if (gameState !== 'PLAYING') return;

    if (num === nextNumber) {
      playCorrect();
      const lastNum = level === 1 ? 9 : level === 2 ? 16 : 25;
      
      if (num === lastNum) {
        playVictory();
        endGame();
      } else {
        setNextNumber(prev => prev + 1);
      }
    } else {
      playWrong();
      setTimer(prev => prev + 1);
    }
  };

  const endGame = async () => {
    setGameState('DONE');
    saveScore();

    // Unlocking Logic (Time based: Level 1 < 15s, Level 2 < 40s)
    let newUnlocked = [...unlockedLevels];
    if (level === 1 && timer <= 15 && !unlockedLevels.includes(2)) {
        newUnlocked.push(2);
    } else if (level === 2 && timer <= 40 && !unlockedLevels.includes(3)) {
        newUnlocked.push(3);
    }
    
    if (newUnlocked.length !== unlockedLevels.length) {
        setUnlockedLevels(newUnlocked);
        await AsyncStorage.setItem('unlocked_focus_grid', JSON.stringify(newUnlocked));
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const saveScore = async () => {
    if (!user) return;
    // For Focus Grid, lower time is better, but we save as "score" maybe 10000 / time
    const finalScore = Math.round(10000 / timer);
    try {
      await addDoc(collection(db, "scores"), {
        userId: user.uid,
        userName: user.displayName || user.email.split('@')[0],
        gameType: "Focus Grid",
        level: level,
        score: finalScore,
        time: timer.toFixed(1),
        createdAt: serverTimestamp()
      });
    } catch (e) { console.error(e); }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Aku baru je 'Mastered' Level ${level} Focus Grid kat Cognito! Masa aku ${timer.toFixed(1)}s. Siapa lagi laju? 🎯⚡`,
      });
    } catch (error) { console.error(error.message); }
  };

  const gridSize = level === 1 ? 3 : level === 2 ? 4 : 5;
  const cellSize = (width - 60) / gridSize;

  if (gameState === 'DONE') {
    return (
      <ThemedView safe style={styles.container}>
        <View style={styles.resultCard}>
            <ThemedText style={styles.resultTitle}>LEVEL {level} MASTERED</ThemedText>
            <ThemedText style={styles.resultScore}>{timer.toFixed(1)}s</ThemedText>
            <ThemedText style={styles.resultLabel}>TOTAL TIME</ThemedText>
            
            <View style={styles.resultActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => { setGameState('IDLE'); setShowLevelModal(true); }}>
                    <RefreshCcw size={20} color="#FFF" />
                    <ThemedText style={styles.actionText}>Try Again</ThemedText>
                </TouchableOpacity>

                {level === 3 && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.accent.primary }]} onPress={handleShare}>
                        <Share2 size={20} color="#FFF" />
                        <ThemedText style={styles.actionText}>Viral kan!</ThemedText>
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity style={styles.backHome} onPress={() => router.replace('/')}>
                <ThemedText style={{ color: Colors.text.secondary }}>Back to Home</ThemedText>
            </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView safe style={styles.container}>
      <StatusBar style="light" />
      
      <LevelSelectorModal 
        visible={showLevelModal} 
        onSelect={startGame} 
        unlockedLevels={unlockedLevels}
        gameTitle="Focus Grid"
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.statsRow}>
            <View style={styles.statBox}>
                <ThemedText style={styles.statLabel}>NEXT</ThemedText>
                <ThemedText style={styles.statValue}>{nextNumber}</ThemedText>
            </View>
            <View style={styles.statBox}>
                <ThemedText style={styles.statLabel}>TIME</ThemedText>
                <ThemedText style={styles.statValue}>{timer.toFixed(1)}s</ThemedText>
            </View>
        </View>
      </View>

      <View style={styles.gameArea}>
        <View style={[styles.grid, { width: width - 40 }]}>
            {numbers.map((num, idx) => {
                const isFound = num < nextNumber;
                return (
                    <TouchableOpacity 
                        key={idx}
                        activeOpacity={0.6}
                        style={[
                            styles.cell, 
                            { width: cellSize, height: cellSize },
                            isFound && styles.cellFound,
                            !isFound && { borderColor: `${Colors.accent.primary}30` }
                        ]}
                        onPress={() => handlePress(num)}
                    >
                        <ThemedText style={[
                            styles.cellText, 
                            { fontSize: level === 3 ? 18 : 24 },
                            isFound && { color: 'rgba(255,255,255,0.2)' }
                        ]}>
                            {num}
                        </ThemedText>
                    </TouchableOpacity>
                );
            })}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: { backgroundColor: Colors.bg.card, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: Colors.border.subtle, alignItems: 'center', minWidth: 80 },
  statLabel: { fontSize: 9, fontWeight: '900', color: Colors.text.secondary, letterSpacing: 1 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: Colors.accent.warn },

  gameArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  cell: { backgroundColor: Colors.bg.card, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  cellFound: { backgroundColor: 'transparent', borderColor: 'transparent' },
  cellText: { fontWeight: 'bold', color: '#FFF' },

  resultCard: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  resultTitle: { fontSize: 14, fontWeight: '900', color: Colors.accent.warn, letterSpacing: 2, marginBottom: 10 },
  resultScore: { fontSize: 80, fontWeight: '900', color: '#FFF', letterSpacing: -4 },
  resultLabel: { fontSize: 12, fontWeight: 'bold', color: Colors.text.secondary, letterSpacing: 4, marginBottom: 40 },
  resultActions: { flexDirection: 'row', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  actionText: { color: '#FFF', fontWeight: 'bold' },
  backHome: { marginTop: 40, padding: 10 },
});
