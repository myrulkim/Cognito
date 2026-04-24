import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';
import { X, Box, CheckCircle2, XCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { db } from '../src/config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import { Colors } from '../constants/Colors';


const QUESTIONS = [
  {
    text: "Which is the 90° (CLOCKWISE) rotation of this pattern?\n[ ▲ ● ]\n[ ■ ★ ]",
    options: ["[ ■ ▲ ]\n[ ★ ● ]", "[ ★ ■ ]\n[ ● ▲ ]", "[ ▲ ★ ]\n[ ● ■ ]", "[ ● ★ ]\n[ ▲ ■ ]"],
    answer: "[ ■ ▲ ]\n[ ★ ● ]"
  },
  {
    text: "Complete the compass direction series:\nNorth ⮕ East ⮕ South ⮕ ...?",
    options: ["Northeast", "West", "Southwest", "Southeast"],
    answer: "West"
  },
  {
    text: "If a cube is flipped upside down, the 'Top' face becomes...?",
    options: ["Bottom", "Right Side", "Left Side", "Front"],
    answer: "Bottom"
  },
  {
      text: "Which shape cannot be formed by folding a 2D paper net (Cube)?",
      options: ["L-Shape", "T-Shape", "Star-Shape", "Cross-Shape"],
      answer: "Star-Shape"
  }
];

const OptionButton = ({ option, onPress, isSelected, isCorrectItem, showResults }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    let btnStyle = [styles.optionButton];
    let textStyle = [styles.optionText];

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
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity 
                activeOpacity={1}
                disabled={showResults}
                onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
                onPress={() => onPress(option)}
                style={btnStyle}
            >
                <ThemedText style={textStyle}>{option}</ThemedText>
                {showResults && isCorrectItem && <CheckCircle2 size={18} color="#FFF" />}
                {showResults && isSelected && !isCorrectItem && <XCircle size={18} color="#FFF" />}
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function SpatialVision() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const { user } = useAuth();
  const progWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progWidth, {
        toValue: (currentIndex + 1) / QUESTIONS.length,
        duration: 300,
        useNativeDriver: false
    }).start();
  }, [currentIndex]);

  const handleAnswer = (selected) => {
    if (selectedOption !== null) return;
    
    setSelectedOption(selected);
    const isCorrect = selected === QUESTIONS[currentIndex].answer;
    
    let newScore = score;
    if (isCorrect) {
      newScore += 25;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setScore(newScore);

    setTimeout(() => {
        if (currentIndex < QUESTIONS.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setSelectedOption(null);
        } else {
          saveScore(newScore);
          setDone(true);
        }
    }, 1000);
  };

  const saveScore = async (finalScore) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "scores"), {
        userId: user.uid,
        gameType: "Spatial Vision",
        score: finalScore,
        createdAt: serverTimestamp()
      });
    } catch (e) { console.error(e); }
  };

  if (done) {
    return (
      <ThemedView safe style={styles.container}>
        <View style={styles.resultContainer}>
          <Box size={80} color={Colors.accent.warn} strokeWidth={1.5} style={{ marginBottom: 20 }} />
          <ThemedText style={styles.doneScore}>{score}%</ThemedText>
          <ThemedText style={styles.doneLabel}>Spatial Mastery Accuracy</ThemedText>
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
            <ThemedText style={{ color: Colors.bg.primary, fontWeight: 'bold' }}>Back to Menu</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const currentQ = QUESTIONS[currentIndex];

  const widthInt = progWidth.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%']
  });

  return (
    <ThemedView safe style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={() => router.back()}>
           <X size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
            <Animated.View style={[styles.progressBar, { width: widthInt }]} />
        </View>
        <ThemedText style={styles.progressText}>{currentIndex + 1}/{QUESTIONS.length}</ThemedText>
      </View>

      <View style={styles.questionContainer}>
        <ThemedText style={styles.questionText}>{currentQ.text}</ThemedText>
      </View>

      <View style={styles.optionsContainer}>
        {currentQ.options.map((option, idx) => {
           const isCorrectItem = option === currentQ.answer;
           const isSelected = option === selectedOption;
           const showResults = selectedOption !== null;
           
           return (
             <OptionButton 
                 key={idx} 
                 option={option} 
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
  container: { flex: 1, padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, gap: 16 },
  navButton: { padding: 8, backgroundColor: Colors.bg.elevated, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.subtle },
  progressContainer: { flex: 1, height: 8, backgroundColor: Colors.bg.elevated, borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: Colors.accent.warn },
  progressText: { color: Colors.text.secondary, fontWeight: 'bold', width: 40, textAlign: 'right' },
  questionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  questionText: { color: Colors.text.primary, fontSize: 28, fontWeight: 'bold', textAlign: 'center', lineHeight: 40 },
  optionsContainer: { flex: 1.5, justifyContent: 'flex-end', paddingBottom: 20, gap: 16 },
  optionButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.bg.card, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: Colors.border.subtle, elevation: 8, shadowColor: Colors.accent.warn, shadowOpacity: 0.15, shadowRadius: 15, shadowOffset: { width: 0, height: 5 } },
  optionText: { color: Colors.text.primary, fontSize: 16, textAlign: 'center', fontWeight: '600', flex: 1 },
  optCorrect: { backgroundColor: Colors.accent.success, borderColor: Colors.accent.success, shadowColor: Colors.accent.success },
  optWrong: { backgroundColor: Colors.accent.danger, borderColor: Colors.accent.danger, shadowColor: Colors.accent.danger },
  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  doneScore: { fontSize: 80, fontWeight: '900', color: Colors.accent.warn, marginBottom: 10, letterSpacing: -2 },
  doneLabel: { fontSize: 18, color: Colors.text.secondary, marginBottom: 40 },
  backButton: { backgroundColor: Colors.accent.warn, padding: 16, borderRadius: 20, paddingHorizontal: 30, elevation: 10, shadowColor: Colors.accent.warn, shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: {height: 5, width: 0} }
});
