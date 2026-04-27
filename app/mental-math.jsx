import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Animated } from 'react-native';
import { router } from 'expo-router';
import { X, Trophy } from 'lucide-react-native';
import { db } from '../src/config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import { Colors } from '../constants/Colors';
import { playCorrect, playWrong, playTimerTick, playTimerCritical, playVictory } from '../src/utils/SoundEngine';


const OptionButton = ({ option, onPress, isSelected, isCorrectItem, showResults }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    let btnStyle = [styles.optBtn];
    let textStyle = [styles.optText];

    if (showResults) {
        if (isCorrectItem) {
            btnStyle.push(styles.optCorrect);
            textStyle.push({ color: '#FFF' });
        } else if (isSelected && !isCorrectItem) {
            btnStyle.push(styles.optWrong);
            textStyle.push({ color: '#FFF' });
        }
    }

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '47%' }}>
            <TouchableOpacity 
                activeOpacity={1}
                disabled={showResults}
                onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
                onPress={() => onPress(option)}
                style={btnStyle}
            >
                <ThemedText style={textStyle}>{option}</ThemedText>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function MentalMath() {
  const [currentQ, setCurrentQ] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [time, setTime] = useState(15);
  const [selectedOption, setSelectedOption] = useState(null);
  const { user } = useAuth();
  const timerRef = useRef(null);

  useEffect(() => {
    generateNewQuestion();
  }, []);

  // Timer with sound
  useEffect(() => {
    if (selectedOption !== null) return;
    timerRef.current = setInterval(() => {
      setTime(prev => {
        if (prev <= 3 && prev > 0) playTimerCritical();
        else if (prev <= 6) playTimerTick();
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [round, selectedOption]);

  useEffect(() => {
    Animated.timing(progWidth, {
        toValue: round / 10,
        duration: 300,
        useNativeDriver: false
    }).start();
  }, [round]);

  const generateNewQuestion = () => {
    const operators = ['+', '-', '*'];
    const op = operators[Math.floor(Math.random() * operators.length)];
    let n1, n2, ans;

    if (op === '*') {
      n1 = Math.floor(Math.random() * 12) + 2;
      n2 = Math.floor(Math.random() * 12) + 2;
    } else {
      n1 = Math.floor(Math.random() * 50) + 1;
      n2 = Math.floor(Math.random() * 50) + 1;
    }

    if (op === '+') ans = n1 + n2;
    if (op === '-') ans = n1 - n2;
    if (op === '*') ans = n1 * n2;

    // Create 4 random options
    const options = [ans];
    while (options.length < 4) {
      const wrong = ans + (Math.floor(Math.random() * 10) - 5);
      if (!options.includes(wrong)) options.push(wrong);
    }

    setCurrentQ({
      switchText: op === '*' ? 'x' : op,
      text: `${n1} ${op === '*' ? 'x' : op} ${n2}`,
      options: options.sort(() => Math.random() - 0.5),
      answer: ans
    });
  };

  const handleAnswer = (selected) => {
    if (selectedOption !== null) return;
    clearInterval(timerRef.current);
    setSelectedOption(selected);
    const isCorrect = selected === currentQ.answer;

    if (isCorrect) {
      playCorrect();
      setScore(prev => prev + 10);
    } else {
      playWrong();
    }

    setTimeout(() => {
        if (round < 10) {
          setRound(prev => prev + 1);
          setTime(15);
          generateNewQuestion();
          setSelectedOption(null);
        } else {
          playVictory();
          saveResult(score + (isCorrect ? 10 : 0));
        }
    }, 800);
  };

  const saveResult = async (finalScore) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "scores"), {
        userId: user.uid,
        userName: user.displayName || user.email.split('@')[0],
        gameType: "Mental Math",
        score: finalScore,
        createdAt: serverTimestamp()
      });
      router.replace('/');
      alert("Hebat! Skor Math anda: " + finalScore);
    } catch (e) { console.error(e); }
  };

  if (!currentQ) return <ThemedView style={{flex:1, justifyContent: 'center'}}><ActivityIndicator size="large" color={Colors.accent.primary} /></ThemedView>;

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

      <View style={styles.questionBox}>
        <ThemedText style={styles.mathText}>{currentQ.text}</ThemedText>
        <ThemedText style={styles.mathSubText}>=?</ThemedText>
      </View>

      <View style={styles.grid}>
        {currentQ.options.map((opt, i) => {
            const isCorrectItem = opt === currentQ.answer;
            const isSelected = opt === selectedOption;
            const showResults = selectedOption !== null;

            return (
              <OptionButton 
                  key={i} 
                  option={opt} 
                  onPress={handleAnswer} 
                  isSelected={isSelected}
                  isCorrectItem={isCorrectItem}
                  showResults={showResults}
              />
            );
        })}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, gap: 16 },
  backBtn: { padding: 8, backgroundColor: Colors.bg.elevated, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.subtle },
  progressContainer: { flex: 1, height: 8, backgroundColor: Colors.bg.elevated, borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#38BDF8' },
  scoreBox: { backgroundColor: '#38BDF8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6, elevation: 8, shadowColor: '#38BDF8', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: {height: 4, width: 0} },
  scoreText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  questionBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mathText: { fontSize: 72, fontWeight: '900', color: Colors.text.primary, letterSpacing: -2 },
  mathSubText: { fontSize: 48, fontWeight: '900', color: '#38BDF8', marginTop: -10, opacity: 0.8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', marginBottom: 40 },
  optBtn: { width: '100%', backgroundColor: Colors.bg.card, padding: 25, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: Colors.border.subtle, elevation: 8, shadowColor: '#38BDF8', shadowOpacity: 0.15, shadowRadius: 15, shadowOffset: { width: 0, height: 5 } },
  optText: { fontSize: 28, fontWeight: '900', color: Colors.text.primary },
  optCorrect: { backgroundColor: Colors.accent.success, borderColor: Colors.accent.success, shadowColor: Colors.accent.success },
  optWrong: { backgroundColor: Colors.accent.danger, borderColor: Colors.accent.danger, shadowColor: Colors.accent.danger }
});
