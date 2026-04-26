import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Share, FlatList } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, RefreshCcw, Share2, Brain } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate, withSequence, withDelay } from 'react-native-reanimated';
import { db } from '../src/config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import { Colors } from '../constants/Colors';
import LevelSelectorModal from '../components/LevelSelectorModal';

const { width } = Dimensions.get('window');

const EMOJIS = ['🧠', '⚡', '🎯', '🔥', '💎', '🚀', '🌈', '🌙', '⭐', '🍀', '🍎', '🎨', '🎸', '⚽', '🍕', '🍦'];

const Card = ({ emoji, isFlipped, isMatched, onPress, size }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withTiming(isFlipped || isMatched ? 180 : 0, { duration: 300 });
  }, [isFlipped, isMatched]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotation.value}deg` }],
    backfaceVisibility: 'hidden',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotation.value + 180}deg` }],
    backfaceVisibility: 'hidden',
  }));

  return (
    <TouchableOpacity onPress={onPress} disabled={isFlipped || isMatched} activeOpacity={0.8}>
      <View style={[styles.cardContainer, { width: size, height: size }]}>
        <Animated.View style={[styles.card, styles.cardFront, frontStyle]}>
            <Brain size={size/2} color={`${Colors.accent.primary}40`} />
        </Animated.View>
        <Animated.View style={[styles.card, styles.cardBack, backStyle, isMatched && styles.matchedCard]}>
            <ThemedText style={{ fontSize: size/2 }}>{emoji}</ThemedText>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

export default function FlashMatch() {
  const [level, setLevel] = useState(null);
  const [showLevelModal, setShowLevelModal] = useState(true);
  const [gameState, setGameState] = useState('IDLE');
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const { user } = useAuth();
  
  const timerRef = useRef(null);

  useEffect(() => {
    if (gameState === 'PLAYING' && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(p => p - 1), 1000);
    } else if (timeLeft === 0) {
      endGame();
    }
    return () => clearInterval(timerRef.current);
  }, [gameState, timeLeft]);

  const startGame = (selectedLevel) => {
    setLevel(selectedLevel);
    setShowLevelModal(false);
    setGameState('PLAYING');
    setMatched([]);
    setFlipped([]);
    setScore(0);
    
    const timeMap = { 1: 45, 2: 30, 3: 20 };
    setTimeLeft(timeMap[selectedLevel]);

    const pairCount = selectedLevel === 1 ? 6 : selectedLevel === 2 ? 8 : 10;
    const selectedEmojis = EMOJIS.slice(0, pairCount);
    const gameCards = [...selectedEmojis, ...selectedEmojis]
        .sort(() => Math.random() - 0.5)
        .map((emoji, index) => ({ id: index, emoji }));
    
    setCards(gameCards);
  };

  const handleCardPress = (id) => {
    if (flipped.length === 2) return;
    
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (cards[first].emoji === cards[second].emoji) {
        setMatched([...matched, first, second]);
        setFlipped([]);
        setScore(s => s + (level * 20));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        if (matched.length + 2 === cards.length) {
          endGame();
        }
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  const endGame = () => {
    setGameState('DONE');
    saveScore();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const saveScore = async () => {
    if (!user) return;
    const finalScore = score + (timeLeft * 5); // Bonus for time
    try {
      await addDoc(collection(db, "scores"), {
        userId: user.uid,
        userName: user.displayName || user.email.split('@')[0],
        gameType: "Flash Match",
        level: level,
        score: finalScore,
        createdAt: serverTimestamp()
      });
    } catch (e) { console.error(e); }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Aku baru je 'Mastered' Level ${level} Flash Match kat Cognito! IQ aku makin padu. 🔥🚀`,
      });
    } catch (error) { console.error(error.message); }
  };

  const numColumns = level === 1 ? 3 : level === 2 ? 4 : 4;
  const cardSize = (width - 60) / numColumns;

  if (gameState === 'DONE') {
    return (
      <ThemedView safe style={styles.container}>
        <View style={styles.resultCard}>
            <ThemedText style={styles.resultTitle}>LEVEL {level} COMPLETE</ThemedText>
            <ThemedText style={styles.resultScore}>{score + (timeLeft * 5)}</ThemedText>
            <ThemedText style={styles.resultLabel}>MEMORY SCORE</ThemedText>
            
            <View style={styles.resultActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => { setGameState('IDLE'); setShowLevelModal(true); }}>
                    <RefreshCcw size={20} color="#FFF" />
                    <ThemedText style={styles.actionText}>Replay</ThemedText>
                </TouchableOpacity>

                {level === 3 && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.accent.primary }]} onPress={handleShare}>
                        <Share2 size={20} color="#FFF" />
                        <ThemedText style={styles.actionText}>Flex ke IG</ThemedText>
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
        gameTitle="Flash Match"
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
            <View style={styles.statBox}>
                <ThemedText style={styles.statLabel}>TIME</ThemedText>
                <ThemedText style={[styles.statValue, timeLeft < 10 && { color: Colors.accent.danger }]}>{timeLeft}s</ThemedText>
            </View>
        </View>
      </View>

      <FlatList
        data={cards}
        numColumns={numColumns}
        key={numColumns} // Force re-render when column count changes
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
            <Card 
                emoji={item.emoji}
                isFlipped={flipped.includes(item.id)}
                isMatched={matched.includes(item.id)}
                onPress={() => handleCardPress(item.id)}
                size={cardSize - 10}
            />
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: { backgroundColor: Colors.bg.card, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: Colors.border.subtle, alignItems: 'center', minWidth: 80 },
  statLabel: { fontSize: 9, fontWeight: '900', color: Colors.text.secondary, letterSpacing: 1 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: Colors.accent.primaryLight },

  grid: { alignItems: 'center', paddingBottom: 40 },
  cardContainer: { margin: 5, position: 'relative' },
  card: { ...StyleSheet.absoluteFillObject, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  cardFront: { backgroundColor: Colors.bg.elevated, borderColor: 'rgba(255,255,255,0.1)' },
  cardBack: { backgroundColor: Colors.accent.primary, borderColor: 'rgba(255,255,255,0.2)' },
  matchedCard: { backgroundColor: Colors.accent.success, borderColor: 'rgba(255,255,255,0.3)' },

  resultCard: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  resultTitle: { fontSize: 14, fontWeight: '900', color: Colors.accent.primaryLight, letterSpacing: 2, marginBottom: 10 },
  resultScore: { fontSize: 80, fontWeight: '900', color: '#FFF', letterSpacing: -4 },
  resultLabel: { fontSize: 12, fontWeight: 'bold', color: Colors.text.secondary, letterSpacing: 4, marginBottom: 40 },
  resultActions: { flexDirection: 'row', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  actionText: { color: '#FFF', fontWeight: 'bold' },
  backHome: { marginTop: 40, padding: 10 },
});
