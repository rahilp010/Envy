/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

export default function LandingPage({ navigation }) {
  return (
    <View style={styles.container}>
      {/* BACKGROUND */}
      <View style={styles.bg}>
        <PulseCircle style={styles.circlePurple} delay={0} />
        <PulseCircle style={styles.circlePink} delay={800} />
        <PulseCircle style={styles.circleRed} delay={1600} />
        <PulseCircle style={styles.circleBlue} delay={2400} />
      </View>

      <View
        style={{
          position: 'absolute',
          top: 20, // Adjust distance from top
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <View style={styles.glassBadge}>
          <Text style={styles.badgeText}>Envy</Text>
        </View>
      </View>

      {/* FLOATING CARDS */}
      <View style={styles.cardStack}>
        <FinanceCard
          color="#FACC15"
          style={{ transform: [{ rotate: '-12deg' }], left: 20 }}
          amount="₹ 8,630.25"
        />

        <FinanceCard
          color="#34D399"
          style={{
            transform: [{ rotate: '6deg' }],
            top: 60,
            left: width / 4,
          }}
          amount="₹ 6,630.25"
        />

        <FinanceCard
          color="#111827"
          style={{
            transform: [{ rotate: '18deg' }],
            top: 120,
            right: 20,
          }}
          amount="₹ 2,630.25"
          dark
        />
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        <Text style={styles.heading}>The Best Way</Text>
        <Text style={styles.heading}>To Manage Your</Text>
        <Text style={[styles.heading, { marginLeft: 5 }]}>Finance</Text>

        <TouchableOpacity
          style={styles.cta}
          onPress={() => navigation.replace('Login')}
        >
          <Text style={styles.ctaText}>Get Started</Text>
          <View style={styles.ctaIcon}>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ================= CARD ================= */

const FinanceCard = ({ color, amount, style, dark }) => (
  <View
    style={[
      styles.card,
      {
        backgroundColor: color,
      },
      style,
    ]}
  >
    <Ionicons name="wifi" size={18} color={dark ? '#fff' : '#111827'} />

    <Text style={[styles.amount, { color: dark ? '#fff' : '#111827' }]}>
      {amount}
    </Text>

    <View style={styles.cardFooter}>
      <Text style={[styles.cardText, { color: dark ? '#E5E7EB' : '#111827' }]}>
        **** 5312
      </Text>

      <Text style={[styles.cardText, { color: dark ? '#E5E7EB' : '#111827' }]}>
        VISA
      </Text>
    </View>
  </View>
);

const PulseCircle = ({ style, delay = 0 }) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  const opacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.12,
            duration: 2600,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.65,
            duration: 2600,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 2600,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 2600,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  /* BACKGROUND */
  bg: {
    ...StyleSheet.absoluteFillObject,
  },

  glassBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0)',
    marginBottom: 25,
  },

  badgeText: {
    fontSize: 18,
    fontWeight: '600',
  },

  circlePurple: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#DDD6FE',
    top: -60,
    right: -80,
  },

  circlePink: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FBCFE8',
    top: 200,
    left: -60,
  },

  circleRed: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 120,
    backgroundColor: '#ffb1aaff',
    bottom: 180,
    right: -100,
  },

  circleBlue: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 120,
    backgroundColor: '#CDEAFE',
    bottom: -20,
    left: -80,
  },

  /* CARD STACK */
  cardStack: {
    height: 320,
    marginTop: 120,
  },

  card: {
    position: 'absolute',
    width: width * 0.7,
    height: 160,
    borderRadius: 22,
    padding: 18,
    justifyContent: 'space-between',
    elevation: 10,
  },

  amount: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 10,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  cardText: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* CONTENT */
  content: {
    paddingHorizontal: 24,
    marginTop: 40,
  },

  heading: {
    fontSize: 34,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 45,
  },

  /* CTA */
  cta: {
    marginTop: 36,
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  ctaText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  ctaIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
