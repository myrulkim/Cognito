import { Tabs } from 'expo-router';
import { StyleSheet, Platform, useColorScheme, View } from 'react-native';
import { Home, BarChart2, Trophy, User } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent.primaryLight,
        tabBarInactiveTintColor: Colors.tabIconDefault,
        tabBarStyle: [
            styles.tabBar, 
            { borderTopWidth: 0, elevation: 0, backgroundColor: 'transparent' }
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarBackground: () => (
          <View style={styles.tabBackgroundGlow}>
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: Colors.bg.card, borderRadius: 28, borderWidth: 1, borderColor: Colors.border.subtle }]} />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <BarChart2 size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Rank',
          tabBarIcon: ({ color, focused }) => (
            <Trophy size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <User size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 88 : 70,
    borderTopWidth: 1,
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 20,
    right: 20,
    borderRadius: 28,
    elevation: 0,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  tabBackgroundGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    backgroundColor: 'transparent',
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  }
});
