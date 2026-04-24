import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { router, Link } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import ThemedText from '../components/ThemedText';
import ThemedTextInput from '../components/ThemedTextInput';
import ThemedView from '../components/ThemedView';
import { Colors } from '../constants/Colors';
import { UserPlus, Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!email || !password) return Alert.alert("Error", "Please fill in all fields.");
    if (password !== confirmPassword) return Alert.alert("Error", "Passwords do not match.");
    
    setLoading(true);
    try {
      await register(email, password);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert("Registration Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView safe style={styles.container}>
      <LinearGradient
        colors={[Colors.glow.violet, 'transparent']}
        style={styles.topGlow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <View style={styles.content}>
        <View style={styles.header}>
            <View style={styles.logoRing}>
                <View style={styles.logoBox}>
                    <UserPlus size={48} color={Colors.accent.primaryLight} strokeWidth={1.5} />
                </View>
            </View>
            <ThemedText title style={styles.title}>Join Cognito</ThemedText>
            <ThemedText style={styles.subtitle}>Join the cognitive network today.</ThemedText>
        </View>

        <View style={styles.form}>
            <ThemedTextInput 
                placeholder="Email" 
                value={email} 
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <View style={styles.passwordContainer}>
                <ThemedTextInput 
                    placeholder="Password" 
                    value={password} 
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    style={{ paddingRight: 50 }}
                />
                <TouchableOpacity 
                    style={styles.eyeIcon} 
                    onPress={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? <EyeOff size={20} color={Colors.text.secondary} /> : <Eye size={20} color={Colors.text.secondary} />}
                </TouchableOpacity>
            </View>
            <View style={styles.passwordContainer}>
                <ThemedTextInput 
                    placeholder="Confirm Password" 
                    value={confirmPassword} 
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    style={{ paddingRight: 50 }}
                />
                <TouchableOpacity 
                    style={styles.eyeIcon} 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                    {showConfirmPassword ? <EyeOff size={20} color={Colors.text.secondary} /> : <Eye size={20} color={Colors.text.secondary} />}
                </TouchableOpacity>
            </View>
            
            <TouchableOpacity onPress={handleRegister} disabled={loading} style={styles.shadowWrapper}>
                <LinearGradient 
                    colors={[Colors.accent.primary, Colors.accent.secondary]} 
                    start={{x: 0, y: 0}} end={{x: 1, y: 1}} 
                    style={styles.button}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Sign Up</ThemedText>}
                </LinearGradient>
            </TouchableOpacity>
        </View>

        <View style={styles.footer}>
            <ThemedText style={{ color: Colors.text.secondary }}>Already have an account? </ThemedText>
            <Link href="/login">
                <ThemedText style={styles.link}>Log In</ThemedText>
            </Link>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 300, opacity: 0.5 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 50 },
  logoRing: { padding: 4, borderRadius: 40, backgroundColor: 'rgba(124,58,237,0.1)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)', marginBottom: 24, elevation: 15, shadowColor: Colors.accent.primary, shadowOpacity: 0.5, shadowRadius: 20 },
  logoBox: { width: 80, height: 80, backgroundColor: Colors.bg.card, borderRadius: 36, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border.subtle },
  title: { fontSize: 32, fontWeight: 'bold', color: Colors.text.primary, marginBottom: 8, letterSpacing: -1 },
  subtitle: { fontSize: 15, color: Colors.text.secondary, textAlign: 'center' },
  form: { gap: 16 },
  passwordContainer: { position: 'relative', justifyContent: 'center' },
  eyeIcon: { position: 'absolute', right: 20, padding: 5 },
  shadowWrapper: { marginTop: 10, shadowColor: Colors.accent.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10, borderRadius: 16 },
  button: { padding: 20, borderRadius: 16, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  link: { color: Colors.accent.primaryLight, fontWeight: 'bold' }
});
