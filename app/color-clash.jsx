import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Animated, Dimensions, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { ArrowLeft, Zap, RefreshCcw, Share2 } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { db } from '../src/config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import { Colors } from '../constants/Colors';
import LevelSelectorModal from '../components/LevelSelectorModal';

const { width } = Dimensions.get('window');

const COLOR_OPTIONS = [
  { name: 'Red', hex: '#F87171' },
  { name: 'Blue', hex: '#60A5FA' },
  { name: 'Green', hex: '#34D399' },
  { name: 'Yellow', hex: '#FBBF24' },
  { name: 'Purple', hex: '#A78BFA' },
  { name: 'Orange', hex: '#FB923C' },
];

export default function ColorClash() {
  const [level, setLevel] = useState(null);
  const [unlockedLevels, setUnlockedLevels] = useState([1]);
  const [showLevelModal, setShowLevelModal] = useState(true);
  const [gameState, setGameState] = useState('IDLE'); // IDLE, PLAYING, DONE
  const [target, setTarget] = useState({ text: '', color: '' });
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const { user } = useAuth();
  
  const timerRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadUnlockedLevels();
  }, []);

  const loadUnlockedLevels = async () => {
    try {
      const saved = await AsyncStorage.getItem('unlocked_color_clash');
      if (saved) setUnlockedLevels(JSON.parse(saved));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (gameState === 'PLAYING' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      endGame();
    }
    return () => clearInterval(timerRef.current);
  }, [gameState, timeLeft]);

  const startGame = (selectedLevel) => {
    setLevel(selectedLevel);
    setShowLevelModal(false);
    setGameState('PLAYING');
    setScore(0);
    // Set time based on level
    const timePerLevel = { 1: 30, 2: 25, 3: 20 };
    setTimeLeft(timePerLevel[selectedLevel]);
    generateRound(selectedLevel);
  };

  const generateRound = (currentLevel) => {
    const randomText = COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)];
    const randomColor = COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)];
    
    // Stroop Effect: In Level 2 and 3, mismatch occurs more often
    let finalColor = randomColor.hex;
    if (currentLevel === 3) {
        // Force mismatch in level 3
        while (randomColor.name === randomText.name) {
             const newColor = COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)];
             if (newColor.name !== randomText.name) {
                 finalColor = newColor.hex;
                 break;
             }
        }
    }

    setTarget({ text: randomText.name, color: finalColor });

    // Determine option count based on level
    const optionCount = currentLevel === 1 ? 4 : currentLevel === 2 ? 6 : 9;
    const shuffled = [...COLOR_OPTIONS].sort(() => 0.5 - Math.random());
    setOptions(shuffled.slice(0, optionCount));

    // Reset animation
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  };

  const handlePress = (selected) => {
    if (gameState !== 'PLAYING') return;

    // The goal is to match the COLOR of the text, not the word
    const isCorrect = selected.hex === target.color;

    if (isCorrect) {
      setScore(prev => prev + (level * 10));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      generateRound(level);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Penalty for wrong answer in higher levels
      if (level > 1) setTimeLeft(prev => Math.max(0, prev - 2));
    }
  };

  const endGame = async () => {
    setGameState('DONE');
    clearInterval(timerRef.current);
    saveScore();
    
    // Unlocking Logic
    let newUnlocked = [...unlockedLevels];
    if (level === 1 && score >= 100 && !unlockedLevels.includes(2)) {
        newUnlocked.push(2);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (level === 2 && score >= 250 && !unlockedLevels.includes(3)) {
        newUnlocked.push(3);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    if (newUnlocked.length !== unlockedLevels.length) {
        setUnlockedLevels(newUnlocked);
        await AsyncStorage.setItem('unlocked_color_clash', JSON.stringify(newUnlocked));
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const saveScore = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, "scores"), {
        userId: user.uid,
        userName: user.displayName || user.email.split('@')[0],
        gameType: "Color Clash",
        level: level,
        score: score,
        createdAt: serverTimestamp()
      });
    } catch (e) { console.error(e); }
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Aku baru je 'Mastered' Level ${level} Color Clash kat Cognito! Skor aku ${score}. Siapa lagi laju? 🧠🔥`,
      });
    } catch (error) { console.error(error.message); }
  };

  if (gameState === 'DONE') {
    return (
      <ThemedView safe style={styles.container}>
        <View style={styles.resultCard}>
            <ThemedText style={styles.resultTitle}>LEVEL {level} COMPLETE</ThemedText>
            <ThemedText style={styles.resultScore}>{score}</ThemedText>
            <ThemedText style={styles.resultLabel}>TOTAL SCORE</ThemedText>
            
            <View style={styles.resultActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => { setGameState('IDLE'); setShowLevelModal(true); }}>
                    <RefreshCcw size={20} color="#FFF" />
                    <ThemedText style={styles.actionText}>Play Again</ThemedText>
                </TouchableOpacity>

                {level === 3 && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.accent.primary }]} onPress={handleShare}>
                        <Share2 size={20} color="#FFF" />
                        <ThemedText style={styles.actionText}>Share Result</ThemedText>
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
        gameTitle="Color Clash"
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.statsRow}>
            <View style={styles.statBox}>
                <ThemedText style={styles.statLabel}>SCORE</ThemedText>
                <ThemedText style={styles.statValue}>{score}</ThemedText>
            </View>
            <View style={[styles.statBox, timeLeft < 5 && { borderColor: Colors.accent.danger }]}>
                <ThemedText style={styles.statLabel}>TIME</ThemedText>
                <ThemedText style={[styles.statValue, timeLeft < 5 && { color: Colors.accent.danger }]}>{timeLeft}s</ThemedText>
            </View>
        </View>
      </View>

      <View style={styles.gameArea}>
        <ThemedText style={styles.instruction}>Identify the COLOR of the word:</ThemedText>
        
        <Animated.View style={[styles.targetBox, { opacity: fadeAnim }]}>
            <ThemedText style={[styles.targetText, { color: target.color }]}>
                {target.text}
            </ThemedText>
        </Animated.View>

        <View style={[styles.grid, level === 1 ? styles.grid2 : level === 2 ? styles.grid2 : styles.grid3]}>
            {options.map((opt, idx) => (
                <TouchableOpacity 
                    key={idx}
                    style={[styles.optionBtn, { backgroundColor: opt.hex }]}
                    onPress={() => handlePress(opt)}
                />
            ))}
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
  statValue: { fontSize: 18, fontWeight: 'bold', color: Colors.accent.primaryLight },

  gameArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  instruction: { color: Colors.text.secondary, marginBottom: 20, fontSize: 14, fontWeight: '600' },
  targetBox: { marginBottom: 60 },
  targetText: { fontSize: 64, fontWeight: '900', letterSpacing: -2, textTransform: 'uppercase' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  grid2: { width: width * 0.7 },
  grid3: { width: width * 0.9 },
  optionBtn: { width: 80, height: 80, borderRadius: 24, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 8 },

  resultCard: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  resultTitle: { fontSize: 14, fontWeight: '900', color: Colors.accent.success, letterSpacing: 2, marginBottom: 10 },
  resultScore: { fontSize: 100, fontWeight: '900', color: '#FFF', letterSpacing: -4 },
  resultLabel: { fontSize: 12, fontWeight: 'bold', color: Colors.text.secondary, letterSpacing: 4, marginBottom: 40 },
  resultActions: { flexDirection: 'row', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  actionText: { color: '#FFF', fontWeight: 'bold' },
  backHome: { marginTop: 40, padding: 10 },
});
