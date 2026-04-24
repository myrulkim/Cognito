import React from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Linking, Alert } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Mail, MessageCircle, FileText } from 'lucide-react-native';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import { Colors } from '../constants/Colors';

export default function HelpSupportScreen() {
  return (
    <ThemedView safe style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={Colors.text.primary} size={20} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Help & Support</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
          <ThemedText style={styles.desc}>Need technical assistance or have questions about Cognito? Contact our support team via the link below.</ThemedText>

          <TouchableOpacity style={styles.contactCard} onPress={() => Linking.openURL('mailto:support@cognito.app')}>
              <View style={styles.iconBox}><Mail size={24} color={Colors.accent.primaryLight} /></View>
              <View style={styles.cardText}>
                  <ThemedText style={styles.cardTitle}>Email Support</ThemedText>
                  <ThemedText style={styles.cardSub}>support@cognito.app</ThemedText>
              </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={() => Alert.alert("FAQ", "Coming Soon!")}>
              <View style={[styles.iconBox, {backgroundColor: 'rgba(16,185,129,0.1)'}]}><FileText size={24} color={Colors.accent.success} /></View>
              <View style={styles.cardText}>
                  <ThemedText style={styles.cardTitle}>FAQ</ThemedText>
                  <ThemedText style={styles.cardSub}>Frequently Asked Questions</ThemedText>
              </View>
          </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16, paddingTop: 60 },
  backBtn: { padding: 10, backgroundColor: Colors.bg.elevated, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.subtle },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.text.primary, letterSpacing: -0.5 },
  content: { padding: 24 },
  desc: { color: Colors.text.secondary, fontSize: 15, lineHeight: 24, marginBottom: 30 },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg.card, padding: 20, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: Colors.border.subtle },
  iconBox: { width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(124,58,237,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text.primary, marginBottom: 4 },
  cardSub: { fontSize: 13, color: Colors.text.secondary }
});
