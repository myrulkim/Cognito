import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Trophy, Lock, Zap, Target, Gauge } from 'lucide-react-native';
import ThemedText from './ThemedText';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');

const LEVEL_DATA = [
  { 
    level: 1, 
    title: 'Level 1: Novice', 
    desc: 'Perfect for warm-up. Standard speed and layout.', 
    color: Colors.accent.success, 
    icon: Target,
    glow: 'rgba(52, 211, 153, 0.4)'
  },
  { 
    level: 2, 
    title: 'Level 2: Expert', 
    desc: 'Faster timers and more complex patterns.', 
    color: Colors.accent.warn, 
    icon: Gauge,
    glow: 'rgba(251, 191, 36, 0.4)'
  },
  { 
    level: 3, 
    title: 'Level 3: Master', 
    desc: 'Maximum difficulty. No room for errors!', 
    color: Colors.accent.danger, 
    icon: Zap,
    glow: 'rgba(248, 113, 113, 0.4)'
  },
];

export default function LevelSelectorModal({ visible, onSelect, unlockedLevels = [1], gameTitle = "Cognito" }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={styles.container}>
          <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
            <ThemedText style={styles.gameTitle}>{gameTitle}</ThemedText>
            <ThemedText title style={styles.mainTitle}>Select Difficulty</ThemedText>
          </Animated.View>

          <View style={styles.levelList}>
            {LEVEL_DATA.map((item, index) => {
              const isLocked = !unlockedLevels.includes(item.level);
              const Icon = item.icon;

              return (
                <Animated.View 
                  key={item.level} 
                  entering={FadeInDown.delay(200 + index * 100)}
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => !isLocked && onSelect(item.level)}
                    style={[
                      styles.levelCard,
                      { borderColor: isLocked ? Colors.border.subtle : `${item.color}40` },
                      !isLocked && { shadowColor: item.color, shadowOpacity: 0.15, shadowRadius: 15 }
                    ]}
                  >
                    <View style={[styles.iconBox, { backgroundColor: isLocked ? 'rgba(255,255,255,0.05)' : `${item.color}15` }]}>
                      {isLocked ? (
                        <Lock size={24} color={Colors.text.secondary} />
                      ) : (
                        <Icon size={24} color={item.color} />
                      )}
                    </View>

                    <View style={styles.content}>
                      <View style={styles.titleRow}>
                        <ThemedText style={[styles.levelTitle, { color: isLocked ? Colors.text.secondary : item.color }]}>
                          {item.title}
                        </ThemedText>
                        {!isLocked && item.level === 3 && (
                          <View style={styles.hotBadge}>
                            <ThemedText style={styles.hotText}>HARD</ThemedText>
                          </View>
                        )}
                      </View>
                      <ThemedText style={styles.levelDesc}>{item.desc}</ThemedText>
                    </View>

                    {isLocked && (
                      <View style={styles.lockOverlay}>
                         <ThemedText style={styles.lockText}>LOCKED</ThemedText>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          <Animated.View entering={FadeInUp.delay(600)} style={styles.footer}>
            <Trophy size={16} color={Colors.accent.warn} />
            <ThemedText style={styles.footerText}>Unlock next level by getting high scores!</ThemedText>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  container: {
    width: width * 0.9,
    padding: 24,
    borderRadius: 32,
    backgroundColor: 'rgba(19, 19, 31, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  gameTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.accent.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 28,
    textAlign: 'center',
  },
  levelList: {
    gap: 16,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  levelTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  levelDesc: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  hotBadge: {
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hotText: {
    fontSize: 8,
    fontWeight: '900',
    color: Colors.accent.danger,
  },
  lockOverlay: {
    position: 'absolute',
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lockText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.text.secondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    gap: 8,
  },
  footerText: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
});
