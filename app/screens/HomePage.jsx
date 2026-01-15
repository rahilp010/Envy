import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Animated } from 'react-native';
import { useRef, useState } from 'react';
import Report from '../../assets/report.svg';

const { width } = Dimensions.get('window');

function HomeScreenContent({ navigation }) {
  const insets = useSafeAreaInsets();
  const scaleHome = useRef(new Animated.Value(1)).current;
  const scaleProfile = useRef(new Animated.Value(1)).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  const [activeTab, setActiveTab] = useState('home');

  const animateTab = scaleRef => {
    Animated.sequence([
      Animated.spring(scaleRef, { toValue: 0.9, useNativeDriver: true }),
      Animated.spring(scaleRef, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateFab = () => {
    Animated.sequence([
      Animated.spring(fabScale, { toValue: 0.85, useNativeDriver: true }),
      Animated.spring(fabScale, {
        toValue: 1,
        friction: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 40 + insets.bottom }, // Extra padding at bottom so content isn't hidden behind the floating nav
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuCircle}>
            <Icon name="menu-outline" size={34} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconCircle}>
            <Icon name="notifications-outline" size={24} color="#000" />
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>

        {/* TITLE */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>
            Hi Envy,{'\n'}How can I help{'\n'}you today?
          </Text>
        </View>

        {/* GRID BUTTONS */}
        <View style={styles.grid}>
          <Card
            icon="cube-outline"
            label="Products"
            color="#DFF4FB"
            onPress={() => navigation.navigate('Product')}
          />
          <Card
            icon="people-outline"
            label="Clients"
            color="#FCE8E6"
            onPress={() => navigation.navigate('Client')}
          />
          <Card
            icon="cart-outline"
            label="Purchase"
            color="#E6F7E9"
            onPress={() => navigation.navigate('Purchase')}
          />
          <Card
            icon="cash-outline"
            label="Sales"
            color="#FFF2C6"
            onPress={() => navigation.navigate('Sales')}
          />

          {/* ✅ FULL WIDTH BANKING CARD */}
          <FullWidthCard
            icon="business-outline"
            label="Digital Banking Platform"
            color="#E8EAFE"
            onPress={() => navigation.navigate('BankSystem')}
          />
        </View>

        {/* SEARCH */}
        {/* KeyboardAvoidingView helps if you decide to focus the input */}
        {/* <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.searchBox}>
            <Icon name="search-outline" size={22} color="#888" />
            <TextInput
              placeholder="Ask or search for anything"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>
        </KeyboardAvoidingView> */}
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNavWrapper, { bottom: 20 + insets.bottom }]}>
        <View style={styles.navRow}>
          <View style={styles.navContent}>
            {/* HOME TAB */}
            <Animated.View style={{ transform: [{ scale: scaleHome }] }}>
              <TouchableOpacity
                style={
                  activeTab === 'home' ? styles.navIconActive : styles.navIcon
                }
                onPress={() => {
                  setActiveTab('home');
                  animateTab(scaleHome);
                }}
              >
                <Icon
                  name="home-outline"
                  size={24}
                  color={activeTab === 'home' ? '#000' : '#fff'}
                />
              </TouchableOpacity>
            </Animated.View>

            {/* PROFILE TAB */}
            <Animated.View style={{ transform: [{ scale: scaleProfile }] }}>
              <TouchableOpacity
                style={
                  activeTab === 'profile'
                    ? styles.navIconActive
                    : styles.navIcon
                }
                onPress={() => {
                  setActiveTab('profile');
                  animateTab(scaleProfile);
                  navigation.navigate('NotFound');
                }}
              >
                <Icon
                  name="settings-outline"
                  size={24}
                  color={activeTab === 'profile' ? '#000' : '#fff'}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* FAB */}
          <Animated.View style={{ transform: [{ scale: fabScale }] }}>
            <TouchableOpacity
              style={styles.fabInline}
              onPress={() => {
                // animateFab();
                navigation.navigate('Report');
              }}
              activeOpacity={0.9}
            >
              <Report width={32} height={32} fill="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

// Reusable Card Component for cleaner code
const Card = ({ icon, label, color, onPress }) => (
  <TouchableOpacity
    style={[styles.card, { backgroundColor: color }]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.iconWrapper}>
      <Icon name={icon} size={28} color="#000" />
    </View>
    <Text style={styles.cardText}>{label}</Text>
  </TouchableOpacity>
);

const FullWidthCard = ({ icon, label, color, onPress }) => (
  <TouchableOpacity
    style={[styles.fullWidthCard, { backgroundColor: color }]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.fullIconWrapper}>
      <Icon name={icon} size={25} color="#000" />
    </View>
    <Text style={styles.fullCardText}>{label}</Text>
  </TouchableOpacity>
);

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaProvider>
      <HomeScreenContent navigation={navigation} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 32,
  },
  iconCircle: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 50,
    // Modern shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  menuCircle: {
    padding: 12,
    borderRadius: 50,
    position: 'absolute',
    top: 0,
    left: -16,
  },
  badge: {
    width: 10,
    height: 10,
    backgroundColor: '#FF3B30',
    borderRadius: 5,
    position: 'absolute',
    right: 12,
    top: 10,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  titleSection: {
    marginBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 42,
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  card: {
    width: '48%', // Responsive width
    aspectRatio: 1.1, // Maintains square-ish shape regardless of screen width
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  iconWrapper: {
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.4)', // Subtle glass effect behind icon
    padding: 8,
    borderRadius: 16,
  },
  cardText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#1A1A1A',
  },
  fullWidthCard: {
    width: '100%', // ✅ FULL WIDTH
    height: 110,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  fullIconWrapper: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: 10,
    borderRadius: 18,
    marginRight: 16,
  },

  fullCardText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  searchBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 20,
    height: 60,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20, // Extra space at bottom of content
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  input: {
    flex: 1,
    height: '100%',
    marginLeft: 12,
    fontSize: 16,
    color: '#000',
  },
  fab: {
    position: 'absolute',
    right: 24,
    // bottom is handled dynamically in style prop
    backgroundColor: '#000',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  bottomNavWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 24,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fabInline: {
    backgroundColor: '#000',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  navContent: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 35,
    padding: 6,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  navIcon: {
    padding: 14,
    paddingHorizontal: 22,
  },
  navIconActive: {
    padding: 14,
    paddingHorizontal: 22,
    backgroundColor: '#fff',
    borderRadius: 28,
  },
});
