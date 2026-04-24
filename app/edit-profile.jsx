import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Save, User, Globe, ChevronDown, Moon, Sun, Smartphone } from 'lucide-react-native';
import { updateProfile } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import { Colors, changeAppTheme } from '../constants/Colors';
import * as Haptics from 'expo-haptics';

export default function EditProfileScreen() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!displayName.trim()) {
        Alert.alert("Error", "Please enter your name.");
        return;
    }
    setLoading(true);
    try {
        await updateProfile(user, { displayName: displayName.trim() });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "Profile updated successfully!", [
            { text: "OK", onPress: () => router.back() }
        ]);
    } catch (e) {
        Alert.alert("Error", "Failed to update profile.");
    } finally {
        setLoading(false);
    }
  };

  const handleThemeChange = (newTheme) => {
      setTheme(newTheme);
      changeAppTheme(newTheme);
  };

  return (
    <ThemedView safe style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={Colors.text.primary} size={20} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Edit Profile</ThemedText>
      </View>

      <View style={styles.content}>
          <View style={styles.avatarBox}>
              <View style={styles.avatarPlaceholder}>
                  <User size={40} color={Colors.accent.primaryLight} />
              </View>
              <ThemedText style={styles.emailText}>{user?.email}</ThemedText>
          </View>

          <ThemedText style={styles.label}>USERNAME</ThemedText>
          <View style={styles.inputBox}>
              <User size={20} color={Colors.text.secondary} />
              <TextInput 
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Enter your name"
                  placeholderTextColor={Colors.text.secondary}
              />
          </View>

          <ThemedText style={styles.label}>LANGUAGE PREFERENCE</ThemedText>
          <TouchableOpacity 
            style={[styles.inputBox, { marginBottom: 30 }]} 
            onPress={() => Alert.alert("Language", "Cognito has been standardized to English. Additional language packs coming soon!")}
          >
              <Globe size={20} color={Colors.text.secondary} />
              <ThemedText style={[styles.input, { paddingVertical: 18 }]}>English</ThemedText>
              <ChevronDown size={20} color={Colors.text.secondary} />
          </TouchableOpacity>

          <ThemedText style={styles.label}>APPEARANCE</ThemedText>
          <View style={styles.themeSelector}>
              <TouchableOpacity 
                 style={[styles.themeBtn, theme === 'system' && styles.themeBtnActive]} 
                 onPress={() => handleThemeChange('dark')} // Fallback to dark for system for now
              >
                 <Smartphone size={18} color={theme === 'system' ? '#FFF' : Colors.text.secondary} />
                 <ThemedText style={[styles.themeBtnText, theme === 'system' && {color: '#FFF'}]}>System</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                 style={[styles.themeBtn, theme === 'dark' && styles.themeBtnActive]} 
                 onPress={() => handleThemeChange('dark')}
              >
                 <Moon size={18} color={theme === 'dark' ? '#FFF' : Colors.text.secondary} />
                 <ThemedText style={[styles.themeBtnText, theme === 'dark' && {color: '#FFF'}]}>Dark</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                 style={[styles.themeBtn, theme === 'light' && styles.themeBtnActive]} 
                 onPress={() => handleThemeChange('light')}
              >
                 <Sun size={18} color={theme === 'light' ? '#FFF' : Colors.text.secondary} />
                 <ThemedText style={[styles.themeBtnText, theme === 'light' && {color: '#FFF'}]}>Light</ThemedText>
              </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : (
                  <>
                      <Save size={20} color="#FFF" />
                      <ThemedText style={styles.saveBtnText}>Save Changes</ThemedText>
                  </>
              )}
          </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16, paddingTop: 60 },
  backBtn: { padding: 10, backgroundColor: Colors.bg.elevated, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.subtle },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.text.primary, letterSpacing: -0.5 },
  content: { padding: 24 },
  avatarBox: { alignItems: 'center', marginBottom: 40 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(124,58,237,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: Colors.border.subtle },
  emailText: { color: Colors.text.secondary, fontSize: 14 },
  label: { fontSize: 12, fontWeight: '900', color: Colors.text.secondary, letterSpacing: 2, marginBottom: 12, marginLeft: 8 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg.card, paddingHorizontal: 16, height: 60, borderRadius: 16, borderWidth: 1, borderColor: Colors.border.subtle, marginBottom: 20 },
  input: { flex: 1, marginLeft: 12, color: Colors.text.primary, fontSize: 16, fontWeight: '600' },
  
  themeSelector: { flexDirection: 'row', backgroundColor: Colors.bg.elevated, borderRadius: 16, p: 4, padding: 4, marginBottom: 40, borderWidth: 1, borderColor: Colors.border.subtle },
  themeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  themeBtnActive: { backgroundColor: Colors.accent.primary, shadowColor: Colors.accent.primary, elevation: 5, shadowOpacity: 0.3, shadowRadius: 10 },
  themeBtnText: { fontSize: 13, fontWeight: 'bold', color: Colors.text.secondary },

  saveBtn: { flexDirection: 'row', backgroundColor: Colors.accent.primary, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 8, shadowColor: Colors.accent.primary, shadowOpacity: 0.4, shadowRadius: 10 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
