import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import Navbar from '../Navbar';

const COLORS = {
  bg: '#FAFBFC',
  card: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  primary: '#111827',
};

const About = () => {
  const translateAnim = useRef(new Animated.Value(12)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateAnim, {
        toValue: 0,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: translateAnim }],
        },
      ]}
    >
      <Navbar title="About" page="about" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* LOGO + APP INFO */}
        <Animated.View
          style={[styles.header, { transform: [{ scale: scaleAnim }] }]}
        >
          {/* 🔁 Replace with your app logo */}
          <Image
            source={require('../../../assets/bootsplash/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.appName}>Envy</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </Animated.View>

        {/* DESCRIPTION */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About the App</Text>
          <Text style={styles.description}>
            Envy is a modern business management application designed to help
            you manage clients, products, purchases, sales, and finances with
            clarity and confidence. Built with performance and simplicity in
            mind, Envy enables smarter decision-making through clean workflows
            and real-time insights.
          </Text>
        </View>

        {/* INFO */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Key Features</Text>

          <Bullet text="Client & Account Management" />
          <Bullet text="Purchase & Sales Tracking" />
          <Bullet text="Product Stock Monitoring" />
          <Bullet text="Ledger & Financial Records" />
          <Bullet text="Clean, fast & intuitive UI" />
        </View>

        {/* FOOTER */}
        <Text style={styles.footer}>
          © {new Date().getFullYear()} Envy. All rights reserved.
        </Text>
      </ScrollView>
    </Animated.View>
  );
};

/* ---------------- SMALL COMPONENT ---------------- */

const Bullet = ({ text }) => (
  <View style={styles.bulletRow}>
    <View style={styles.bulletDot} />
    <Text style={styles.bulletText}>{text}</Text>
  </View>
);

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginVertical: 30,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 16,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
  },
  version: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.muted,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 10,
  },
  bulletText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 30,
  },
});

export default About;
