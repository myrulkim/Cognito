import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

// Fisher-Yates Shuffle Algorithm
const shuffleArray = (array) => {
  let shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const QuizScreen = ({ navigation }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    let timer;
    if (timeLeft > 0 && !loading) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && !loading) {
      handleAnswer(null); // Time's up, incorrect answer
    }
    return () => clearInterval(timer);
  }, [timeLeft, loading]);

  const fetchQuestions = async () => {
    try {
      // NOTE: Menggunakan dummy data sementara Firestore dimuat naik.
      // Uncomment the below lines to fetch real data from Firestore Collection "questions".
      
      /*
      const querySnapshot = await getDocs(collection(db, "questions"));
      const fetchedQuestions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      */
      
      const firestoreMockData = [
        { id: '1', question: 'Jika 3 kucing boleh menangkap 3 tikus dalam 3 minit, berapa minit yang diperlukan oleh 100 kucing untuk menangkap 100 tikus?', options: ['100', '3', '300', '10'], answer: '3' },
        { id: '2', question: 'Berapakah bilangan bulan yang mempunyai 28 hari dalam setahun?', options: ['1', '12', 'Bulan Februari sahaja', '6'], answer: '12' },
        { id: '3', question: 'Bahagikan 30 dengan setengah, kemudian tambah 10. Apakah jawapannya?', options: ['25', '70', '40', '15'], answer: '70' },
        { id: '4', question: 'Epal yang manakah berlainan dari kumpulan ini secara biologi?', options: ['Epal Merah', 'Epal Hijau', 'Tomato', 'Epal Fuji'], answer: 'Tomato' },
        { id: '5', question: 'Apakah abjad yang seterusnya: O, T, T, F, F, S, S, E, _?', options: ['N', 'T', 'O', 'E'], answer: 'N' },
        { id: '6', question: 'Saya ganjil, tapi jika buang satu huruf, saya jadi genap. Nombor apakah saya (Bahasa Inggeris)?', options: ['Seven', 'Nine', 'Eleven', 'Three'], answer: 'Seven' },
      ];

      // Fisher-Yates implementation applied here (Cap to 10 max if data is large)
      let selectedQuestions = shuffleArray(firestoreMockData).slice(0, 10);
      setQuestions(selectedQuestions);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching questions: ", error);
      setLoading(false);
    }
  };

  const handleAnswer = (selectedOption) => {
    const currentQ = questions[currentIndex];
    let newScore = score;
    
    // Algorithm: Base Score + Time Bonus
    // 10 base points + remaining seconds as bonus points. Max per question = 40.
    if (selectedOption !== null && selectedOption === currentQ?.answer) {
      newScore += 10 + timeLeft; 
    }
    
    setScore(newScore);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setTimeLeft(30); // Reset timer 30 seconds
    } else {
      navigation.replace('Result', { score: newScore, maxScore: questions.length * 40 });
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6C48F5" />
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Error: Tiada soalan dijumpai di Firestore.</Text>
      </View>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.progressText}>Soalan {currentIndex + 1} / {questions.length}</Text>
        <View style={styles.timerBox}>
          <Text style={[styles.timerText, timeLeft <= 5 && { color: '#FF3B30' }]}>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</Text>
        </View>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQ.question}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {currentQ.options.map((option, idx) => (
          <TouchableOpacity 
            key={idx} 
            style={styles.optionButton}
            onPress={() => handleAnswer(option)}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: 24 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 40 },
  progressText: { color: '#8E8E93', fontSize: 16, fontWeight: '600' },
  timerBox: { backgroundColor: '#1C1C1E', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  timerText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
  questionContainer: { flex: 1, justifyContent: 'center' },
  questionText: { color: '#FFFFFF', fontSize: 24, fontWeight: '700', lineHeight: 34, textAlign: 'center' },
  optionsContainer: { flex: 1.5, justifyContent: 'flex-end', paddingBottom: 20 },
  optionButton: { backgroundColor: '#141414', padding: 20, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2A2A2A', activeOpacity: 0.7 },
  optionText: { color: '#E0E0E0', fontSize: 16, textAlign: 'center', fontWeight: '500' },
  title: { color: '#8E8E93' }
});

export default QuizScreen;
