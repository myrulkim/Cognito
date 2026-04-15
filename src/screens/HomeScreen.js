import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

const HomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Cognito</Text>
        <Text style={styles.subtitle}>Sistem Analisa Kognitif</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>• 10 Soalan Logik Rawak</Text>
          <Text style={styles.infoText}>• 30 Saat Per Soalan</Text>
          <Text style={styles.infoText}>• Skor & Kepantasan Dinilai</Text>
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Quiz')}
        >
          <Text style={styles.buttonText}>MULAKAN UJIAN IQ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A', // Deep pure black
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFFFFF', // High contrast
    marginBottom: 8,
    letterSpacing: 2.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 45,
    letterSpacing: 1,
  },
  infoBox: {
    backgroundColor: '#141414',
    padding: 24,
    borderRadius: 16,
    width: '100%',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#222222',
  },
  infoText: {
    color: '#E0E0E0',
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#6C48F5', // Premium Deep Purple
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#6C48F5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});

export default HomeScreen;
