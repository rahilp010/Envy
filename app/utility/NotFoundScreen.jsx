import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

export default function NotFoundScreen({ navigation }) {
  return (
    <LinearGradient colors={['#ffffffff', '#ffffffff']} style={styles.container}>
      {/* ICON */}
      <View style={styles.iconWrapper}>
        <Ionicons name="alert-circle-outline" size={80} color="#f472b6" />
      </View>

      {/* TEXT */}
      <Text style={styles.code}>404</Text>
      <Text style={styles.title}>Page Not Found</Text>
      <Text style={styles.subtitle}>
        Oops! The screen you’re looking for doesn’t exist or was moved.
      </Text>

      {/* BUTTON */}
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={() => navigation.replace('HomePage')}
      >
        <Ionicons name="home-outline" size={18} color="#fff" />
        <Text style={styles.buttonText}>Go to Home</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  iconWrapper: {
    marginBottom: 20,
  },

  code: {
    fontSize: 72,
    fontWeight: '800',
    color: '#111',
    letterSpacing: 2,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginTop: 4,
  },

  subtitle: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginTop: 30,
    shadowColor: '#6366f1',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
