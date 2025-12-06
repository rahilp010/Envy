import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('screen');
const SPHERE_SIZE = width * 1.4;

export default function LandingPage({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* BACKGROUND GRADIENT */}
      <LinearGradient
        colors={['#1a001f', '#fff']}
        style={StyleSheet.absoluteFill}
      />

      {/* SPHERES */}
      <View style={styles.sphereContainer}>
        <LinearGradient
          colors={['#ffffffff', '#65b7ffff']}
          style={styles.sphereTop}
        />
        <LinearGradient
          colors={['#cbd4f0ff', '#006affff']}
          style={styles.sphereBottom}
        />
      </View>

      {/* LOGO */}
      <View style={styles.header}>
        <Text style={styles.logoText}>Electron</Text>
      </View>

      {/* HERO SECTION */}
      <View style={styles.contentWrapper}>
        <View style={styles.glassBadge}>
          <Text style={styles.badgeText}>Envy</Text>
        </View>

        <Text style={styles.title}>Elevate your{'\n'}Business</Text>

        <Text style={styles.subtitle}>
          Discover endless ways our Electron can enhance your business thinking
        </Text>

        {/* BUTTON */}
        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => navigation.replace('HomePage')}
        >
          <LinearGradient
            colors={['#cbd4f0ff', '#006affff']}
            style={styles.mainButtonInner}
          >
            <Text style={styles.mainButtonText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  header: {
    marginTop: 50,
    paddingHorizontal: 24,
    alignItems: 'flex-start',
  },

  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },

  sphereContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    top: -150,
  },

  sphereTop: {
    width: SPHERE_SIZE,
    height: SPHERE_SIZE,
    borderRadius: SPHERE_SIZE,
    opacity: 0.45,
    position: 'absolute',
    top: -100,
  },

  sphereBottom: {
    width: SPHERE_SIZE,
    height: SPHERE_SIZE,
    borderRadius: SPHERE_SIZE,
    opacity: 0.35,
    position: 'absolute',
    top: 160,
  },

  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 150,
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  title: {
    fontSize: 46,
    fontWeight: '800',
    textAlign: 'center',
    color: '#000',
    lineHeight: 56,
  },

  subtitle: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    color: '#000',
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  mainButton: {
    marginTop: 50,
    borderRadius: 30,
    width: width * 0.7,
    overflow: 'hidden',
  },

  mainButtonInner: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 30,
  },

  mainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
