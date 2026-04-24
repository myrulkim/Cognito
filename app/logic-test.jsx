import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Animated } from 'react-native';
import { router } from 'expo-router';
import { X, CheckCircle2, XCircle } from 'lucide-react-native';
import { db } from '../src/config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import { Colors } from '../constants/Colors';


const OptionButton = ({ option, onPress, isSelected, isCorrectItem, showResults }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    let btnStyle = [styles.optionBtn];
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

export default function LogicTest() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const { user } = useAuth();
  
  const progWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    generateLogicExam();
  }, []);
  
  useEffect(() => {
      if (questions.length > 0) {
          Animated.timing(progWidth, {
              toValue: (currentIndex + 1) / questions.length,
              duration: 300,
              useNativeDriver: false
          }).start();
      }
  }, [currentIndex, questions]);

  // MASTER LOGIC ENGINE - Bina soalan dlm aplikasi terus (Infinite)
  const generateLogicExam = () => {
    setLoading(true);
    let newExam = [];

    for (let i = 0; i < 10; i++) {
        const type = Math.floor(Math.random() * 4); // 4 Kategori Logik
        
        if (type === 0) {
            // Kategori: Siri Nombor (Arithmetic/Geometric)
            const start = Math.floor(Math.random() * 10) + 1;
            const diff = Math.floor(Math.random() * 5) + 2;
            const seq = [start, start + diff, start + (diff * 2), start + (diff * 3)];
            const ans = start + (diff * 4);
            newExam.push({
                text: `Lengkapkan siri nombor berikut:\n${seq.join(', ')}, ...?`,
                options: shuffle([String(ans), String(ans + 2), String(ans - 2), String(ans + 5)]),
                answer: String(ans)
            });
        } else if (type === 1) {
            // Kategori: Logik Masa
            const days = ["Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu", "Ahad"];
            const randIdx = Math.floor(Math.random() * 7);
            const targetDay = days[randIdx];
            newExam.push({
                text: `Jika hari ini adalah hari ${targetDay}, apakah hari bagi semalam kepada kelmarin?`,
                options: shuffle([days[(randIdx + 5) % 7], days[(randIdx + 1) % 7], days[(randIdx + 3) % 7], days[(randIdx + 4) % 7]]),
                answer: days[(randIdx + 5) % 7]
            });
        } else if (type === 2) {
            // Kategori: Perbandingan (Paling Besar/Kecil)
            const names = ["Ali", "Abu", "Siti", "Ah Chong", "Muthu"];
            const n1 = names[Math.floor(Math.random() * 5)];
            const n2 = names[Math.floor(Math.random() * 5)];
            if(n1 === n2) { i--; continue; } // Avoid same name
            newExam.push({
                text: `Jika ${n1} lebih tinggi daripada ${n2}, manakah kenyataan yang BENAR?`,
                options: shuffle([`${n2} lebih pendek`, `${n2} lebih tinggi`, `Kedua-duanya sama`, `Tiada kaitan`]),
                answer: `${n2} lebih pendek`
            });
        } else {
            // Kategori: Matematik Pantas (Logic Math)
            const val = Math.floor(Math.random() * 20) + 5;
            newExam.push({
                text: `Berapakah hasil 1/2 daripada ( ${val} x 2 )?`,
                options: shuffle([String(val), String(val * 2), String(val / 2), "10"]),
                answer: String(val)
            });
        }
    }

    setQuestions(newExam);
    setLoading(false);
  };

  const shuffle = (array) => array.sort(() => Math.random() - 0.5);

  const handleAnswer = (option) => {
    if (selectedOption !== null) return;
    
    const isCorrect = String(option) === String(questions[currentIndex].answer);
    setSelectedOption(option);

    let nextScore = score + (isCorrect ? 10 : 0);
    setScore(nextScore);

    setTimeout(() => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
        } else {
            finishGame(nextScore);
        }
    }, 1000); // 1 saat delay untuk tunjuk warna hijau/merah
  };

  const finishGame = async (finalTotal) => {
    if (user) {
        try {
            await addDoc(collection(db, "scores"), {
                userId: user.uid,
                gameType: "Logic Test",
                score: finalTotal,
                createdAt: serverTimestamp()
            });
        } catch (e) { console.error(e); }
    }
    Alert.alert("Ujian Tamat!", `Skor Logik anda: ${finalTotal}`);
    router.replace('/');
  };

  if (loading || questions.length === 0) return <ThemedView style={{flex:1, justifyContent: 'center'}}><ActivityIndicator size="large" color={Colors.accent.primary} /></ThemedView>;

  const currentQ = questions[currentIndex];

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
        <ThemedText style={styles.progressText}>{currentIndex + 1}/10</ThemedText>
      </View>

      <View style={styles.questionContainer}>
        <ThemedText style={styles.questionText}>
            {currentQ.text}
        </ThemedText>
      </View>

      <View style={styles.optionsArea}>
        {currentQ.options.map((option, index) => {
           const isCorrectItem = String(option) === String(currentQ.answer);
           const isSelected = option === selectedOption;
           const showResults = selectedOption !== null;

           return (
             <OptionButton 
                 key={index} 
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
  backBtn: { padding: 8, backgroundColor: Colors.bg.elevated, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.subtle },
  progressContainer: { flex: 1, height: 8, backgroundColor: Colors.bg.elevated, borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: Colors.accent.primary },
  progressText: { color: Colors.text.secondary, fontWeight: 'bold', width: 40, textAlign: 'right' },
  questionContainer: { flex: 1, justifyContent: 'center' },
  questionText: { fontSize: 28, color: Colors.text.primary, textAlign: 'center', lineHeight: 40, fontWeight: '700' },
  optionsArea: { gap: 16, paddingBottom: 40 },
  optionBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.bg.card, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: Colors.border.subtle, elevation: 8, shadowColor: Colors.accent.primary, shadowOpacity: 0.1, shadowRadius: 15, shadowOffset: { width: 0, height: 5 } },
  optionText: { color: Colors.text.primary, fontSize: 16, fontWeight: '600', textAlign: 'center', flex: 1 },
  optCorrect: { backgroundColor: Colors.accent.success, borderColor: Colors.accent.success, shadowColor: Colors.accent.success },
  optWrong: { backgroundColor: Colors.accent.danger, borderColor: Colors.accent.danger, shadowColor: Colors.accent.danger }
});
