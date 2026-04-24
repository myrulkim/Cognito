import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Star, Zap, Shield, Crown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import { Colors } from '../constants/Colors';
import * as Haptics from 'expo-haptics';

export default function PremiumScreen() {
  const handleUpgrade = () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Payment Successful!", "Your account is now upgraded to Cognito Premium. 💎", [
          { text: "Awesome!", onPress: () => router.back() }
      ]);
  };

  return (
    <ThemedView safe style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={Colors.text.primary} size={20} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Upgrade</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.crownBox}>
              <Crown size={80} color={Colors.accent.warn} />
              <ThemedText style={styles.premiumTitle}>Cognito Premium</ThemedText>
              <ThemedText style={styles.premiumSub}>Unlock your mind's full potential.</ThemedText>
          </View>

          <View style={styles.featureList}>
              <FeatureItem icon={Zap} title="Advanced Analytics" desc="In-depth radar data and performance graphs." color={Colors.accent.primaryLight} />
              <FeatureItem icon={Star} title="Unlimited AI Quizzes" desc="Generate endless KSSM practices." color={Colors.accent.warn} />
              <FeatureItem icon={Shield} title="Ad-Free Experience" desc="Zero distractions, pure focus." color={Colors.accent.success} />
          </View>

          <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade}>
              <LinearGradient colors={[Colors.accent.warn, '#d97706']} style={styles.gradientBtn}>
                  <ThemedText style={styles.btnText}>Upgrade Now - RM9.90/mo</ThemedText>
              </LinearGradient>
          </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const FeatureItem = ({ icon: Icon, title, desc, color }) => (
    <View style={styles.fItem}>
        <View style={[styles.fIconBox, { backgroundColor: color + '20' }]}>
            <Icon size={24} color={color} />
        </View>
        <View style={styles.fText}>
            <ThemedText style={styles.fTitle}>{title}</ThemedText>
            <ThemedText style={styles.fDesc}>{desc}</ThemedText>
        </View>
    </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16, paddingTop: 60 },
  backBtn: { padding: 10, backgroundColor: Colors.bg.elevated, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.subtle },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.text.primary, letterSpacing: -0.5 },
  content: { padding: 24, alignItems: 'center' },
  crownBox: { alignItems: 'center', marginBottom: 40 },
  premiumTitle: { fontSize: 28, fontWeight: '900', color: Colors.accent.warn, marginTop: 16, letterSpacing: -0.5 },
  premiumSub: { color: Colors.text.secondary, marginTop: 8, fontSize: 16 },
  
  featureList: { width: '100%', marginBottom: 40, gap: 20 },
  fItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg.card, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: Colors.border.subtle },
  fIconBox: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  fText: { flex: 1 },
  fTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text.primary, marginBottom: 4 },
  fDesc: { fontSize: 13, color: Colors.text.secondary, lineHeight: 18 },
  
  upgradeBtn: { width: '100%', borderRadius: 20, overflow: 'hidden', elevation: 15, shadowColor: Colors.accent.warn, shadowOpacity: 0.4, shadowRadius: 15 },
  gradientBtn: { padding: 20, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }
});
