import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Network, X } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import { Colors } from '../constants/Colors';


export default function TestNetScreen() {
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const runTest = async (name, url, options = {}) => {
    addLog(`Testing ${name}...`);
    try {
      const res = await fetch(url, { ...options, timeout: 5000 });
      addLog(`✅ ${name} SUCCESS (Status: ${res.status})`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      addLog(`❌ ${name} FAILED: ${e.message}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const startTests = async () => {
    setLogs([]);
    await runTest("GOOGLE (HTTPS)", "https://www.google.com", { method: 'HEAD' });
    await runTest("GROQ API (HTTPS)", "https://api.groq.com/openai/v1/chat/completions", { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) 
    });
    // Check if it can reach a non-https (unlikely to work but for diagnostic)
    await runTest("HTTP TEST (JSONPlaceholder)", "http://jsonplaceholder.typicode.com/posts/1");
  };

  return (
    <ThemedView safe style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.navRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <X size={24} color={Colors.text.primary} />
            </TouchableOpacity>
        </View>
        <Network size={40} color={Colors.accent.primaryLight} style={{ marginBottom: 16 }} />
        <ThemedText style={styles.title}>Network Status Node</ThemedText>
        <TouchableOpacity style={styles.btn} onPress={startTests}>
          <ThemedText style={styles.btnText}>INITIATE DIAGNOSTIC LINK</ThemedText>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.logBox} contentContainerStyle={{ padding: 16 }}>
        {logs.map((log, i) => (
          <ThemedText key={i} style={[styles.logText, log.includes('❌') && {color: Colors.accent.danger}, log.includes('✅') && {color: Colors.accent.success}]}>
            {log}
          </ThemedText>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 40 },
  header: { marginBottom: 20, alignItems: 'center' },
  navRow: { width: '100%', flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 24 },
  backBtn: { padding: 8, backgroundColor: Colors.bg.elevated, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.subtle },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.text.primary, marginBottom: 24, letterSpacing: -0.5 },
  btn: { backgroundColor: Colors.accent.primary, padding: 18, borderRadius: 16, width: '100%', alignItems: 'center', elevation: 8, shadowColor: Colors.accent.primary, shadowRadius: 15, shadowOpacity: 0.3, shadowOffset: { height: 5, width: 0 } },
  btnText: { color: '#FFF', fontWeight: 'bold', letterSpacing: 1 },
  logBox: { flex: 1, backgroundColor: Colors.bg.card, borderRadius: 16, marginTop: 10, borderWidth: 1, borderColor: Colors.border.subtle },
  logText: { color: Colors.text.secondary, fontSize: 13, marginBottom: 8, fontFamily: 'monospace' },
});
