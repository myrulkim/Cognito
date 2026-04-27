import { Tabs } from 'expo-router';
import { StyleSheet, Platform, View } from 'react-native';
import { Home, BarChart2, Trophy, User } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

const TabIcon = ({ Icon, color, focused }) => (
  <View style={[styles.iconWrap, focused && { backgroundColor: `${Colors.accent.primary}10` }]}>
    <Icon size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
  </View>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent.primary,
        tabBarInactiveTintColor: Colors.tabIconDefault,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarBackground: () => (
          <View style={styles.tabBg} />
        ),
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Utama',
        tabBarIcon: ({ color, focused }) => <TabIcon Icon={Home} color={color} focused={focused} />
      }} />
      <Tabs.Screen name="stats" options={{ title: 'Statistik',
        tabBarIcon: ({ color, focused }) => <TabIcon Icon={BarChart2} color={color} focused={focused} />
      }} />
      <Tabs.Screen name="leaderboard" options={{ title: 'Kedudukan',
        tabBarIcon: ({ color, focused }) => <TabIcon Icon={Trophy} color={color} focused={focused} />
      }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil',
        tabBarIcon: ({ color, focused }) => <TabIcon Icon={User} color={color} focused={focused} />
      }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 88 : 68,
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 12,
    left: 20,
    right: 20,
    borderRadius: 26,
    borderTopWidth: 0,
    elevation: 0,
    backgroundColor: 'transparent',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
  },
  tabBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.08)',
  },
  tabBarLabel: { fontSize: 10, fontWeight: '700', marginBottom: 2 },
  iconWrap: { width: 40, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
});
