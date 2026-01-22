/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  StatusBar,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../services/api';

export default function Signup({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const isNameValid = name.trim().length >= 2;
  const isEmailValid = email.includes('@') && email.includes('.');
  const isPasswordValid = password.length >= 6;

  const handleSignup = async () => {
    try {
      await api.signup({
        name,
        email,
        password,
      });

      Alert.alert('Success', 'Account created successfully');
      navigation.replace('Login'); // back to login
    } catch (err) {
      shake();
      Alert.alert(
        'Signup Failed',
        err?.response?.data?.message || 'Something went wrong',
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBFC" />

      <PulseCircle style={styles.bgCircleBlue} />
      <PulseCircle style={styles.bgCirclePurple} delay={800} />

      <Animated.View
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
          },
        ]}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start managing your finance</Text>
        </View>

        {/* NAME */}
        <Text style={styles.inputLabel}>Full Name</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />
          {isNameValid && (
            <View style={styles.checkCircle}>
              <Text style={styles.check}>✓</Text>
            </View>
          )}
        </View>

        {/* EMAIL */}
        <Text style={[styles.inputLabel, { marginTop: 14 }]}>
          Email Address
        </Text>
        <View style={styles.inputWrapper}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            style={styles.input}
          />
          {isEmailValid && (
            <View style={styles.checkCircle}>
              <Text style={styles.check}>✓</Text>
            </View>
          )}
        </View>

        {/* PASSWORD */}
        <Text style={[styles.inputLabel, { marginTop: 14 }]}>Password</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Create password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showPassword}
            style={styles.input}
          />
          <TouchableOpacity onPress={() => setShowPassword(p => !p)}>
            <Icon
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.helperText}>
          Password must be at least 6 characters
        </Text>

        {/* SIGNUP BUTTON */}
        <LinearGradient
          colors={['#4F46E5', '#4338CA']}
          style={[
            styles.primaryBtn,
            !(isNameValid && isEmailValid && isPasswordValid) && {
              opacity: 0.6,
            },
          ]}
        >
          <TouchableOpacity
            disabled={!(isNameValid && isEmailValid && isPasswordValid)}
            style={styles.primaryBtnInner}
            activeOpacity={0.9}
            onPress={handleSignup}
          >
            <Text style={styles.primaryText}>Create Account</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* FOOTER */}
        <Text style={styles.footer}>
          Already have an account?{' '}
          <Text style={styles.signup} onPress={() => navigation.goBack()}>
            Login
          </Text>
        </Text>
      </Animated.View>
    </View>
  );
}

/* ================= PULSE CIRCLE ================= */
const PulseCircle = ({ style, delay = 0 }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
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
            toValue: 0.6,
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

  return <Animated.View style={[style, { transform: [{ scale }], opacity }]} />;
};

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  bgCircleBlue: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#CDEAFE',
    top: -80,
    right: -100,
  },
  bgCirclePurple: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#DDD6FE',
    bottom: -100,
    left: -80,
  },

  card: { padding: 22 },

  header: { marginBottom: 26 },

  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { marginTop: 6, fontSize: 14, color: '#6B7280' },

  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFB',
    paddingHorizontal: 14,
  },

  input: { flex: 1, fontSize: 16, color: '#111827' },

  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: '#22C55E', fontWeight: '800' },

  helperText: { marginTop: 8, fontSize: 12, color: '#6B7280' },

  primaryBtn: {
    height: 56,
    borderRadius: 20,
    marginTop: 22,
    marginBottom: 24,
  },
  primaryBtnInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  footer: { textAlign: 'center', fontSize: 14, color: '#6B7280' },
  signup: { color: '#4338CA', fontWeight: '700' },
});
