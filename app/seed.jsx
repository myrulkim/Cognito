import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Database, X } from 'lucide-react-native';
import { db } from '../src/config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import { Colors } from '../constants/Colors';


const EXTRA_QUESTIONS = [
  // LOGIC & PATTERNS
  { text: "Apakah nombor seterusnya: 2, 6, 12, 20, 30, ...?", options: ["40", "42", "44", "46"], answer: "42", points: 10, category: "Logic" },
  { text: "Jika semalam adalah hari Ahad, apakah hari bagi lusa?", options: ["Selasa", "Rabu", "Khamis", "Jumaat"], answer: "Rabu", points: 10, category: "Logic" },
  { text: "Manakah yang tidak tergolong dlm kumpulan ini?", options: ["Epel", "Pisang", "Lobak Merah", "Anggur"], answer: "Lobak Merah", points: 10, category: "Logic" },
  { text: "Buku kepada Penulis, seperti Simfoni kepada...?", options: ["Orkestra", "Penyanyi", "Penggubah", "Peminat"], answer: "Penggubah", points: 10, category: "Logic" },
  { text: "Seorang ayah berumur 3 kali ganda anaknya. Jika anak berumur 15, berapakah umur ayah?", options: ["45", "40", "50", "30"], answer: "45", points: 10, category: "Math" },
  
  // ANALOGI & SPATIAL
  { text: "TANGAN kepada SARUNG seperti KAKI kepada...?", options: ["Seluar", "Kasut", "Lantai", "Sarung Kaki"], answer: "Sarung Kaki", points: 10, category: "Logic" },
  { text: "Jika semua Mawar adalah bunga, dan semua bunga layu, maka semua Mawar layu?", options: ["Benar", "Salah", "Tidak Pasti", "Mungkin"], answer: "Benar", points: 10, category: "Logic" },
  { text: "Manakah nombor ganjil: 24, 68, 91, 102?", options: ["24", "68", "91", "102"], answer: "91", points: 10, category: "Math" },
  { text: "Berapakah bintik pada dadu jika semua permukaannya dijumlahkan?", options: ["21", "24", "18", "20"], answer: "21", points: 10, category: "Math" },
  { text: "Sudut tegak mempunyai berapa darjah?", options: ["45", "90", "180", "360"], answer: "90", points: 10, category: "Math" },

  // SPEED & REFLEX
  { text: "Manakah ejaan yang betul?", options: ["Cognito", "Conito", "Cognitoh", "Coknito"], answer: "Cognito", points: 10, category: "Logic" },
  { text: "12 - 4 + 8 = ...?", options: ["14", "16", "18", "12"], answer: "16", points: 10, category: "Math" },
  { text: "Satu jam mempunyai berapa saat?", options: ["360", "3600", "60", "600"], answer: "3600", points: 10, category: "Math" },
  { text: "Berapakah bilangan hari dlm tahun lompat?", options: ["365", "366", "364", "367"], answer: "366", points: 10, category: "Math" },
  { text: "Manakah haiwan mamalia?", options: ["Ikan Yu", "Penyu", "Ikan Lumba-lumba", "Helang"], answer: "Ikan Lumba-lumba", points: 10, category: "Logic" },

  // MASTER MATRIX
  { text: "Lengkapkan siri: J, F, M, A, M, ...", options: ["J", "S", "O", "N"], answer: "J", points: 10, category: "Logic" },
  { text: "Jika 1=5, 2=25, 3=125, maka 5 = ...?", options: ["625", "3125", "1", "5"], answer: "1", points: 10, category: "Logic" },
  { text: "Berapakah sisi bagi sebuah dekagon?", options: ["8", "10", "12", "14"], answer: "10", points: 10, category: "Logic" },
  { text: "Manakah benua terbesar?", options: ["Afrika", "Asia", "Eropah", "Amerika"], answer: "Asia", points: 10, category: "Logic" },
  { text: "Berapakah hasil darab 9 x 8?", options: ["71", "72", "73", "74"], answer: "72", points: 10, category: "Math" }
];

export default function Seeder() {
  const [seeding, setSeeding] = useState(false);

  const startSeeding = async () => {
    setSeeding(true);
    try {
      for (let q of EXTRA_QUESTIONS) {
        await addDoc(collection(db, "questions"), q);
      }
      Alert.alert("Berjaya!", "20 Soalan Masterclass telah ditambah ke Firestore!");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Gagal upload soalan.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <ThemedView safe style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <X size={24} color={Colors.text.primary} />
      </TouchableOpacity>
      
      <View style={styles.content}>
          <View style={styles.iconBox}>
             <Database size={48} color={Colors.accent.danger} />
          </View>
          <ThemedText style={styles.title}>Data Seeder V2</ThemedText>
          <ThemedText style={styles.desc}>Injects 20 Masterclass Neural questions directly into the central Firestore database.</ThemedText>
          <TouchableOpacity 
            style={[styles.btn, seeding && { opacity: 0.5 }]} 
            onPress={startSeeding} 
            disabled={seeding}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.btnText}>{seeding ? "INJECTING PROTOCOL..." : "EXECUTE INJECTION"}</ThemedText>
          </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 40 },
  backBtn: { alignSelf: 'flex-start', padding: 8, backgroundColor: Colors.bg.elevated, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.subtle, marginBottom: 40 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconBox: { width: 100, height: 100, borderRadius: 30, backgroundColor: 'rgba(239,68,68,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Colors.border.subtle },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.text.primary, marginBottom: 12, letterSpacing: -0.5 },
  desc: { color: Colors.text.secondary, marginBottom: 40, textAlign: 'center', paddingHorizontal: 20, lineHeight: 24 },
  btn: { backgroundColor: Colors.accent.danger, paddingHorizontal: 40, paddingVertical: 20, borderRadius: 20, elevation: 8, shadowColor: Colors.accent.danger, shadowOpacity: 0.4, shadowRadius: 15, shadowOffset: { height: 5, width: 0 } },
  btnText: { color: '#FFF', fontWeight: 'bold', letterSpacing: 1 }
});
