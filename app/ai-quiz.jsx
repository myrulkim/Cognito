import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Animated, ScrollView, Alert, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Brain, ArrowLeft, CheckCircle2, XCircle, Info, Sparkles, Timer } from 'lucide-react-native';
import { generateAcademicQuiz } from '../src/services/groq';
import { db } from '../src/config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import { Colors } from '../constants/Colors';
import * as Haptics from 'expo-haptics';

const { height } = Dimensions.get('window');

// Pengecaman Jawapan Robust (Mengatasi masalah AI kasi 'C' tapi option 'C) ...')
const checkIsMatch = (optStr, ansStr) => {
    if (!optStr || !ansStr) return false;
    const cleanOpt = String(optStr).trim().toLowerCase();
    const cleanAns = String(ansStr).trim().toLowerCase();
    
    if (cleanOpt === cleanAns) return true;
    if (cleanAns.length === 1 && (cleanOpt.startsWith(cleanAns + ")") || cleanOpt.startsWith(cleanAns + ". "))) return true;
    if (cleanAns.length === 2 && cleanOpt.startsWith(cleanAns)) return true;
    
    return false;
};

export default function AIQuizScreen() {
  const { user } = useAuth();
  // State Management
  const [step, setStep] = useState('setup'); // 'setup', 'loading', 'quiz', 'result'
  const [form, setForm] = useState('1');
  const [subject, setSubject] = useState('Sains');
  const [level, setLevel] = useState('Medium');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  const timerRef = useRef(null);

  // START AI GENERATION
  const startAI = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStep('loading');
    
    // RESET STATE UNTUK SESSION BARU
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setShowExplanation(false);
    try {
      const gennedQuestions = await generateAcademicQuiz(form, subject, level);
      if (!gennedQuestions || gennedQuestions.length === 0) {
          throw new Error("No questions generated");
      }
      setQuestions(gennedQuestions);
      setStep('quiz');
      startTimer();
    } catch (e) {
      console.log(e);
      Alert.alert(
        "Engine Stalled!", 
        e.message || "Sila pastikan API Key anda sah.",
        [{ text: "OK", onPress: () => setStep('setup') }]
      );
    }
  };

  const startTimer = () => {
    setTimeLeft(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAnswer(null); // Time's up!
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAnswer = (option) => {
    if (selectedOption !== null) return;
    
    clearInterval(timerRef.current);
    setSelectedOption(option);
    setShowExplanation(true);
    
    const isCorrect = checkIsMatch(option, questions[currentIndex].answer);

    if (isCorrect) {
      setScore(prev => prev + 20);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const nextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
      startTimer();
    } else {
      if (user) {
        try {
            await addDoc(collection(db, "scores"), {
                userId: user.uid,
                gameType: "Academic Quiz",
                score: score + (checkIsMatch(selectedOption, questions[currentIndex].answer) ? 20 : 0), // Include last score if correct
                subject: subject,
                form: form,
                level: level,
                createdAt: serverTimestamp()
            });
        } catch (e) {
            console.log("Error saving score:", e);
        }
      }
      setStep('result');
    }
  };

  // UI: Setup Screen
  if (step === 'setup') return (
    <ThemedView safe style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={Colors.text.primary} size={20} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Academic Setup</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.setupScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
            <View style={styles.heroIconBox}>
                <Sparkles size={32} color={Colors.accent.primaryLight} />
            </View>
            <ThemedText style={styles.heroTitle}>AI-Powered Synthesis</ThemedText>
            <ThemedText style={styles.heroSubtitle}>Dynamic module generation via neural network.</ThemedText>
        </View>

        <ThemedText style={styles.sectionLabel}>FORM / LEVEL</ThemedText>
        <View style={styles.chipGrid}>
          {['1', '2', '3'].map(f => (
            <TouchableOpacity key={f} onPress={() => setForm(f)} style={[styles.chip, form === f && styles.chipActive]}>
              <ThemedText style={[styles.chipText, form === f && styles.chipTextActive]}>Form {f}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <ThemedText style={styles.sectionLabel}>SUBJECT PARAMETER</ThemedText>
        <View style={styles.subjectList}>
          {['Sains', 'Matematik', 'ASK', 'Sejarah', 'B. Inggeris', 'Geografi', 'P. Islam', 'B. Melayu'].map(s => (
            <TouchableOpacity key={s} onPress={() => setSubject(s)} style={[styles.subjectItem, subject === s && styles.subjectActive]}>
                <ThemedText style={[styles.subjectText, subject === s && styles.subjectTextActive]}>{s}</ThemedText>
                <View style={[styles.radio, subject === s && styles.radioActive]}>
                    {subject === s && <View style={styles.radioInner} />}
                </View>
            </TouchableOpacity>
          ))}
        </View>

        <ThemedText style={styles.sectionLabel}>DIFFICULTY LEVEL</ThemedText>
        <View style={styles.chipGrid}>
          {['Easy', 'Medium', 'Hard'].map(l => (
            <TouchableOpacity key={l} onPress={() => setLevel(l)} style={[styles.chip, level === l && styles.chipActive]}>
              <ThemedText style={[styles.chipText, level === l && styles.chipTextActive]}>{l}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.generateBtn} onPress={startAI}>
           <ThemedText style={styles.generateBtnText}>Generate Questions</ThemedText>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );

  // UI: Loading State
  if (step === 'loading') return (
    <ThemedView style={styles.loadingContainer}>
      <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.accent.primaryLight} />
      </View>
      <ThemedText style={styles.loadingText}>Establishing Neural Link...</ThemedText>
      <ThemedText style={styles.loadingSub}>Synthesizing Form {form} {subject} protocol.</ThemedText>
    </ThemedView>
  );

  // UI: Quiz Flow
  if (step === 'quiz') {
    let q = questions[currentIndex];
    
    // SAFETY CHECK: Kalau AI hantar semua options dlm satu string, kita split kan.
    let displayOptions = q.options;
    if (displayOptions.length === 1 && displayOptions[0].includes(',')) {
        displayOptions = displayOptions[0].split(',').map(s => s.trim());
    }

    const isUserCorrect = checkIsMatch(selectedOption, q.answer);

    return (
      <ThemedView safe style={styles.container}>
        <View style={styles.quizHeader}>
            <View style={styles.timerBox}>
                <Timer size={16} color={timeLeft < 10 ? Colors.accent.danger : Colors.accent.primaryLight} />
                <ThemedText style={[styles.timerText, timeLeft < 10 && {color: Colors.accent.danger}]}>{timeLeft}s</ThemedText>
            </View>
            <ThemedText style={styles.progressText}>SEQUENCE {currentIndex + 1} / 5</ThemedText>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: showExplanation ? 320 : 40 }} showsVerticalScrollIndicator={false}>
            <View style={styles.questionBox}>
                <ThemedText style={styles.questionText}>{q.question}</ThemedText>
            </View>

            <View style={styles.optionsGrid}>
                {displayOptions.map((opt, i) => {
                    const isCorrect = checkIsMatch(opt, q.answer);
                    const isSelected = selectedOption !== null && opt === selectedOption;
                    const showResults = selectedOption !== null;
                    
                    // Styling Dynamic
                    let btnStyle = [styles.optionBtn];
                    let textStyle = [styles.optionText];

                    if (showResults) {
                        if (isCorrect) {
                            btnStyle.push(styles.optCorrect);
                            textStyle.push({ color: '#FFF' });
                        } else if (isSelected && !isCorrect) {
                            btnStyle.push(styles.optWrong);
                            textStyle.push({ color: '#FFF' });
                        }
                    }

                    return (
                        <TouchableOpacity 
                            key={i} 
                            disabled={showResults}
                            onPress={() => handleAnswer(opt)}
                            style={btnStyle}
                        >
                            <ThemedText style={textStyle}>
                                {opt}
                            </ThemedText>
                            {showResults && isCorrect && <CheckCircle2 size={18} color="#FFF" />}
                            {showResults && isSelected && !isCorrect && <XCircle size={18} color="#FFF" />}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </ScrollView>

        {showExplanation && (
            <Animated.View style={styles.explanationBox}>
                <View style={styles.exHeader}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                        <Info size={16} color={Colors.accent.primaryLight} />
                        <ThemedText style={styles.exTitle}>NEURAL ANALYSIS</ThemedText>
                    </View>
                    <View style={[styles.ansBadge, { backgroundColor: isUserCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                        <ThemedText style={[styles.ansBadgeText, { color: isUserCorrect ? Colors.accent.success : Colors.accent.danger }]}>
                            {isUserCorrect ? 'Spot On!' : `Correct Answer: ${q.answer}`}
                        </ThemedText>
                    </View>
                </View>
                <ScrollView style={{maxHeight: height * 0.15}} showsVerticalScrollIndicator={false}>
                    <ThemedText style={styles.exContent}>{q.explanation}</ThemedText>
                </ScrollView>
                <TouchableOpacity style={styles.nextBtn} onPress={nextQuestion}>
                    <ThemedText style={styles.nextBtnText}>Continue Sequence</ThemedText>
                </TouchableOpacity>
            </Animated.View>
        )}
      </ThemedView>
    );
  }

  // UI: Results
  if (step === 'result') {
      const correctAnswers = score / 20;
      const totalQuestions = questions.length || 5;
      const percentage = Math.round((correctAnswers / totalQuestions) * 100);

      return (
        <ThemedView safe style={styles.resultContainer}>
            <View style={styles.resultIconBox}>
                <Brain size={60} color={Colors.accent.primaryLight} />
            </View>
            <ThemedText style={styles.resultTitle}>QUIZ COMPLETED</ThemedText>
            <ThemedText style={styles.scoreNumber}>{correctAnswers}/{totalQuestions}</ThemedText>
            <ThemedText style={styles.scorePercentage}>{percentage}% Accuracy</ThemedText>
            <ThemedText style={styles.resultDesc}>Module {subject} (Form {form}) synthesis finalized. Neural connection successfully mapped.</ThemedText>
            
            <TouchableOpacity style={styles.generateBtn} onPress={() => setStep('setup')}>
               <ThemedText style={styles.generateBtnText}>Try Again</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/')}>
               <ThemedText style={styles.homeBtnText}>Back to Home</ThemedText>
            </TouchableOpacity>
        </ThemedView>
      );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16, paddingTop: 60 },
  backBtn: { padding: 10, backgroundColor: Colors.bg.elevated, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.subtle },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.text.primary, letterSpacing: -0.5 },
  setupScroll: { padding: 24 },
  
  heroCard: { backgroundColor: Colors.bg.card, padding: 30, borderRadius: 30, marginBottom: 30, alignItems: 'center', borderWidth: 1, borderColor: Colors.border.subtle, elevation: 10, shadowColor: Colors.accent.primary, shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: {height: 5, width: 0} },
  heroIconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(124,58,237,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.text.primary, letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center', marginTop: 8 },

  sectionLabel: { fontSize: 12, fontWeight: '900', color: Colors.text.secondary, letterSpacing: 2, marginVertical: 16, marginLeft: 8 },
  chipGrid: { flexDirection: 'row', gap: 12 },
  chip: { flex: 1, padding: 16, backgroundColor: Colors.bg.card, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.border.subtle },
  chipActive: { backgroundColor: Colors.accent.primary, borderColor: Colors.accent.primaryLight, elevation: 8, shadowColor: Colors.accent.primary, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: {width: 0, height: 4} },
  chipText: { fontWeight: 'bold', color: Colors.text.secondary, fontSize: 14 },
  chipTextActive: { color: '#FFF' },
  
  subjectList: { gap: 12 },
  subjectItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: Colors.bg.card, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: Colors.border.subtle },
  subjectActive: { backgroundColor: Colors.bg.elevated, borderColor: Colors.accent.primaryLight, elevation: 8, shadowColor: Colors.accent.primary, shadowOpacity: 0.3, shadowRadius: 12 },
  subjectText: { fontWeight: '700', color: Colors.text.primary, fontSize: 16 },
  subjectTextActive: { color: Colors.accent.primaryLight },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border.subtle, justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: Colors.accent.primaryLight },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent.primaryLight },

  generateBtn: { backgroundColor: Colors.accent.primary, padding: 22, borderRadius: 24, alignItems: 'center', marginTop: 40, elevation: 15, shadowColor: Colors.accent.primary, shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: {height: 8, width: 0} },
  generateBtnText: { color: '#FFF', fontWeight: '800', fontSize: 18, letterSpacing: 0.5 },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingBox: { width: 80, height: 80, borderRadius: 24, backgroundColor: Colors.bg.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border.subtle, marginBottom: 24 },
  loadingText: { fontSize: 20, fontWeight: 'bold', color: Colors.text.primary, letterSpacing: -0.5 },
  loadingSub: { color: Colors.text.secondary, marginTop: 8, textAlign: 'center' },
  
  quizHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, paddingTop: 60, alignItems: 'center' },
  timerBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.bg.elevated, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.subtle },
  timerText: { fontWeight: '900', color: Colors.accent.primaryLight, fontSize: 14 },
  progressText: { fontWeight: '900', color: Colors.text.secondary, fontSize: 12, letterSpacing: 1 },
  
  questionBox: { paddingHorizontal: 24, paddingVertical: 40, minHeight: 250, justifyContent: 'center' },
  questionText: { fontSize: 28, textAlign: 'center', fontWeight: 'bold', color: Colors.text.primary, lineHeight: 40, letterSpacing: -0.5 },
  
  optionsGrid: { padding: 24, gap: 16 },
  optionBtn: { padding: 22, backgroundColor: Colors.bg.card, borderRadius: 24, borderWidth: 1, borderColor: Colors.border.subtle, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionText: { flex: 1, fontWeight: '700', color: Colors.text.primary, fontSize: 16, lineHeight: 24 },
  optCorrect: { backgroundColor: Colors.accent.success, borderColor: Colors.accent.success, elevation: 10, shadowColor: Colors.accent.success, shadowOpacity: 0.4, shadowRadius: 15 },
  optWrong: { backgroundColor: Colors.accent.danger, borderColor: Colors.accent.danger, elevation: 10, shadowColor: Colors.accent.danger, shadowOpacity: 0.4, shadowRadius: 15 },
  
  explanationBox: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: Colors.bg.elevated, borderTopLeftRadius: 36, borderTopRightRadius: 36, borderWidth: 1, borderColor: Colors.border.subtle, paddingBottom: 40, elevation: 20, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20 },
  exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  ansBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  ansBadgeText: { fontSize: 12, fontWeight: 'bold' },
  exTitle: { fontSize: 13, fontWeight: '900', color: Colors.accent.primaryLight, letterSpacing: 1 },
  exContent: { fontSize: 16, color: Colors.text.secondary, marginTop: 8, lineHeight: 26, fontWeight: '500' },
  nextBtn: { backgroundColor: Colors.accent.primary, padding: 20, borderRadius: 20, marginTop: 24, alignItems: 'center' },
  nextBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  
  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  resultIconBox: { backgroundColor: 'rgba(124,58,237,0.1)', padding: 30, borderRadius: 40, borderWidth: 1, borderColor: Colors.border.subtle, marginBottom: 24 },
  resultTitle: { fontSize: 14, fontWeight: '900', color: Colors.text.secondary, letterSpacing: 2 },
  scoreNumber: { fontSize: 80, fontWeight: '900', color: Colors.text.primary, marginTop: 20, marginBottom: 5, letterSpacing: -2 },
  scorePercentage: { fontSize: 24, fontWeight: '700', color: Colors.accent.primaryLight, marginBottom: 30 },
  resultDesc: { textAlign: 'center', color: Colors.text.secondary, marginBottom: 40, lineHeight: 24, fontSize: 16 },
  homeBtn: { marginTop: 20, padding: 15 },
  homeBtnText: { color: Colors.text.secondary, fontWeight: '700' }
});
