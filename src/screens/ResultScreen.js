import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

const ResultScreen = ({ route, navigation }) => {
  const { score, maxScore } = route.params || { score: 0, maxScore: 400 };

  const getIQCategory = (currentScore, max) => {
    const percentage = (currentScore / max) * 100;
    if (percentage >= 80) return 'Genius';
    if (percentage >= 60) return 'Superior';
    if (percentage >= 40) return 'Average';
    return 'Novice';
  };

  const category = getIQCategory(score, maxScore);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.headerTitle}>ANALISIS KOGNITIF SELESAI</Text>
        
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreText}>{score}</Text>
          <Text style={styles.maxScoreText}>/ {maxScore}</Text>
        </View>

        <Text style={styles.categoryLabel}>Tahap Kognitif Anda:</Text>
        <Text style={[
          styles.categoryValue, 
          { color: category === 'Genius' ? '#FFD700' : category === 'Superior' ? '#00E5FF' : category === 'Average' ? '#6C48F5' : '#FF3B30' }
        ]}>{category}</Text>

        <View style={styles.explanationBox}>
          <Text style={styles.explanationText}>
            Skor ini dinilai berdasarkan ketepatan jawapan dan kepantasan masa (Speed Bonus Algorithm).
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
        >
          <Text style={styles.buttonText}>KEMBALI KE LAMAN UTAMA</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  headerTitle: {
    color: '#8E8E93',
    fontSize: 16,
    letterSpacing: 2.5,
    marginBottom: 40,
    fontWeight: '700',
    textAlign: 'center',
  },
  scoreCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: '#6C48F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: '#110C24', // Subtle glow background
  },
  scoreText: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  maxScoreText: {
    fontSize: 18,
    color: '#8E8E93',
    marginTop: -5,
  },
  categoryLabel: {
    color: '#E0E0E0',
    fontSize: 16,
    marginBottom: 8,
  },
  categoryValue: {
    fontSize: 42,
    fontWeight: '900',
    marginBottom: 30,
    letterSpacing: 1.5,
  },
  explanationBox: {
    backgroundColor: '#141414',
    padding: 16,
    borderRadius: 12,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#222',
  },
  explanationText: {
    color: '#8E8E93',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});

export default ResultScreen;
