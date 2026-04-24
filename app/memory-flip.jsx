import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { X, Trophy } from 'lucide-react-native';
import { db } from '../src/config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');
const GRID_SIZE = 16;
const TILE_SIZE = (width - 48 - 30) / 4; 

const AnimatedTile = ({ i, gameState, pattern, userInputs, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const isActive = gameState === 'MEMORIZE' && pattern.includes(i);
    const isSuccess = gameState === 'INPUT' && userInputs.includes(i);

    let bgColor = Colors.bg.card;
    let gColor = 'transparent';

    if (isActive) { bgColor = Colors.accent.primary; gColor = Colors.accent.primaryLight; }
    if (isSuccess) { bgColor = Colors.accent.success; gColor = Colors.accent.success; }

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity 
                activeOpacity={0.9}
                onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
                onPress={() => onPress(i)}
                style={[
                    styles.tile,
                    { backgroundColor: bgColor },
                    (isActive || isSuccess) && { shadowColor: gColor, shadowOpacity: 0.5, shadowRadius: 15, elevation: 8, borderColor: gColor, borderWidth: 1 }
                ]} 
            />
        </Animated.View>
    );
};

export default function MemoryFlip() {
  const [level, setLevel] = useState(1);
  const [pattern, setPattern] = useState([]);
  const [userInputs, setUserInputs] = useState([]);
  const [gameState, setGameState] = useState('MEMORIZE'); // MEMORIZE, INPUT, RESULT
  const [score, setScore] = useState(0);
  const { user } = useAuth();
  
  const progWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    generatePattern();
    Animated.timing(progWidth, {
        toValue: level / 10,
        duration: 300,
        useNativeDriver: false
    }).start();
  }, [level]);

  const generatePattern = () => {
    setGameState('MEMORIZE');
    setUserInputs([]);
    // Jumlah petak yang menyala ikut level (cth: Level 1 = 3 petak)
    const activeCount = level + 2;
    let newPattern = [];
    while (newPattern.length < activeCount) {
        let rand = Math.floor(Math.random() * GRID_SIZE);
        if (!newPattern.includes(rand)) newPattern.push(rand);
    }
    setPattern(newPattern);

    // Tempoh ingat (cth: 2 saat untuk Level 1)
    setTimeout(() => {
        setGameState('INPUT');
    }, 2000 + (level * 200)); 
  };

  const handleTilePress = (id) => {
    if (gameState !== 'INPUT') return;
    if (userInputs.includes(id)) return;

    const newInputs = [...userInputs, id];
    setUserInputs(newInputs);

    // Cek jika salah
    if (!pattern.includes(id)) {
        finishGame();
        return;
    }

    // Cek jika menang pusingan ni
    if (newInputs.length === pattern.length) {
        setScore(prev => prev + (level * 10));
        if (level < 10) {
            setLevel(prev => prev + 1);
        } else {
            finishGame(true);
        }
    }
  };

  const finishGame = async (won) => {
    const finalScore = score;
    setGameState('RESULT');
    if (!user) return;
    try {
        await addDoc(collection(db, "scores"), {
            userId: user.uid,
            userName: user.displayName || user.email.split('@')[0],
            gameType: "Memory Flip",
            score: finalScore,
            createdAt: serverTimestamp()
        });
        Alert.alert(won ? "Luar Biasa!" : "Game Over", `Skor Memory anda: ${finalScore}`);
        router.replace('/');
    } catch (e) { console.error(e); }
  };

  const widthInt = progWidth.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%']
  });

  return (
    <ThemedView safe style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <X size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
            <Animated.View style={[styles.progressBar, { width: widthInt }]} />
        </View>
        <View style={styles.scoreBox}>
            <Trophy size={14} color="#FFF" />
            <ThemedText style={styles.scoreText}>{score}</ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.infoBox}>
            <ThemedText style={styles.levelText}>Phase {level}</ThemedText>
            <ThemedText style={styles.instruction}>
                {gameState === 'MEMORIZE' ? "Focus & Memorize Pattern" : "Recall & Tap the Pattern"}
            </ThemedText>
        </View>
        
        <View style={styles.gridContainer}>
            <View style={styles.grid}>
                {[...Array(GRID_SIZE)].map((_, i) => (
                    <AnimatedTile 
                        key={i} 
                        i={i} 
                        gameState={gameState} 
                        pattern={pattern} 
                        userInputs={userInputs} 
                        onPress={handleTilePress} 
                    />
                ))}
            </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, gap: 16 },
  backBtn: { padding: 8, backgroundColor: Colors.bg.elevated, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.subtle },
  progressContainer: { flex: 1, height: 8, backgroundColor: Colors.bg.elevated, borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: Colors.accent.danger },
  scoreBox: { backgroundColor: Colors.accent.danger, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6, elevation: 8, shadowColor: Colors.accent.danger, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: {height: 4, width: 0} },
  scoreText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  content: { flex: 1, justifyContent: 'center' },
  infoBox: { alignItems: 'center', marginBottom: 50 },
  levelText: { fontSize: 32, fontWeight: '900', color: Colors.text.primary, letterSpacing: -1 },
  instruction: { fontSize: 16, color: Colors.text.secondary, marginTop: 8 },
  gridContainer: { alignItems: 'center' },
  grid: { width: TILE_SIZE * 4 + 30, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: TILE_SIZE, height: TILE_SIZE, borderRadius: 16, borderWidth: 1, borderColor: Colors.border.subtle },
});
