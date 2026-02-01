import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  Animated,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext'; // Assuming path
import { DarkTheme, LightTheme } from '../theme/color'; // Assuming path
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import Brand from '../../assets/Envy.png';
import AlertBox from './AlertBox';

// Mock User Data
const USER_DATA = {
  name: 'Envy',
  email: 'envy@example.com',
  role: 'Owner',
  avatar: Brand,
  // avatar:
  //   'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
};

const ProfileOption = ({
  icon,
  label,
  value,
  onPress,
  isDestructive,
  type = 'arrow',
  toggleValue,
  onToggle,
}) => {
  const { theme } = useTheme();
  const COLORS = theme === 'dark' ? DarkTheme : LightTheme;
  const styles = createStyles(COLORS);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.optionRow}
        onPress={type === 'toggle' ? onToggle : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        disabled={type === 'toggle'}
      >
        <View style={styles.optionLeft}>
          <View
            style={[styles.iconBox, isDestructive && styles.iconBoxDestructive]}
          >
            <Icon
              name={icon}
              size={22}
              color={isDestructive ? '#FF3B30' : COLORS.text}
            />
          </View>
          <Text
            style={[
              styles.optionLabel,
              isDestructive && styles.textDestructive,
            ]}
          >
            {label}
          </Text>
        </View>

        <View style={styles.optionRight}>
          {type === 'toggle' ? (
            <Switch
              trackColor={{ false: '#767577', true: COLORS.primary }}
              thumbColor={'#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={onToggle}
              value={toggleValue}
            />
          ) : (
            <>
              {value && <Text style={styles.optionValue}>{value}</Text>}
              <Icon name="chevron-forward" size={20} color={COLORS.gray} />
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ProfileScreen({ navigation }) {
  const { theme, toggleTheme } = useTheme(); // Assuming toggleTheme exists in context
  const COLORS = theme === 'dark' ? DarkTheme : LightTheme;
  const styles = createStyles(COLORS);
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState(USER_DATA.name);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({
    title: '',
    message: '',
    type: 'info',
    actionTextSuccess: '',
    actionTextDecline: '',
  });

  useEffect(() => {
    const loadUser = async () => {
      const name = await AsyncStorage.getItem('username');
      if (name) setUsername(name);
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    setModalData({
      title: 'Log Out',
      message: 'Are you sure you want to log out?',
      type: 'error',
      actionTextSuccess: 'Yes',
      actionTextDecline: 'No',
    });
    setModalVisible(true);

    await AsyncStorage.multiRemove([
      'token',
      'lastPasswordAuth',
      'biometricEnabled',
      'username',
    ]);

    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <View style={styles.safe}>
      {/* HEADER */}
      <Navbar title="Profile" page="profile" />

      <View style={[styles.container]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 160 },
          ]}
        >
          {/* PROFILE CARD */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              {/* If you don't have an image, use an Icon */}
              <Image source={Brand} style={styles.avatar} />
              <View style={styles.badgeContainer}>
                <Icon
                  name="checkmark-circle"
                  size={20}
                  color={COLORS.primary}
                />
              </View>
            </View>

            <Text style={styles.userName}>{username}</Text>
            <Text style={styles.userEmail}>{USER_DATA.email}</Text>

            <View style={styles.planBadge}>
              <Text style={styles.planText}>{USER_DATA.role}</Text>
            </View>
          </View>

          {/* SECTION: GENERAL */}
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.sectionContainer}>
            <ProfileOption
              icon="person-outline"
              label="Personal Info"
              onPress={() => {}}
            />
            <ProfileOption
              icon="card-outline"
              label="My Cards"
              onPress={() => {}}
            />
            <ProfileOption
              icon="moon-outline"
              label="Dark Mode"
              type="toggle"
              toggleValue={theme === 'dark'}
              onToggle={toggleTheme}
            />
          </View>

          {/* SECTION: PREFERENCES */}
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.sectionContainer}>
            {/* <ProfileOption
            icon="notifications-outline"
            label="Notifications"
            value="On"
            onPress={() => {}}
          /> */}
            <ProfileOption
              icon="language-outline"
              label="Language"
              value="English"
              onPress={() => {}}
            />
            <ProfileOption
              icon="shield-checkmark-outline"
              label="Security"
              onPress={() => {}}
            />
          </View>

          {/* SECTION: LOGOUT */}
          <View style={[styles.sectionContainer, { marginTop: 10 }]}>
            <ProfileOption
              icon="log-out-outline"
              label="Log Out"
              isDestructive
              onPress={handleLogout}
            />
          </View>

          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v1.0.2</Text>
          </View>
        </ScrollView>
      </View>

      <AlertBox
        visible={modalVisible}
        title={modalData.title}
        message={modalData.message}
        type={modalData.type}
        actionTextSuccess={modalData.actionTextSuccess}
        actionTextDecline={modalData.actionTextDecline}
        onClose={() => setModalVisible(false)}
      />

      <BottomNav navigation={navigation} active="profile" />
    </View>
  );
}

const createStyles = COLORS =>
  StyleSheet.create({
    safe: { flex: 1 },
    container: {
      backgroundColor: COLORS.bg, // Matches Home bg
      height: 'auto',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: COLORS.text,
    },
    backButton: {
      padding: 8,
      borderRadius: 50,
      backgroundColor: '#fff',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 5,
          shadowOffset: { width: 0, height: 2 },
        },
        android: { elevation: 2 },
      }),
    },
    editButton: {
      padding: 8,
    },
    editText: {
      fontSize: 16,
      fontWeight: '600',
      color: COLORS.primary, // Using primary color for actions
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 10,
    },

    // Profile Card Styles
    profileCard: {
      alignItems: 'center',
      marginBottom: 32,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: 16,
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 4,
      borderColor: '#fff',
    },
    badgeContainer: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 2,
    },
    userName: {
      fontSize: 24,
      fontWeight: '800',
      color: COLORS.text,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 14,
      color: 'gray',
      marginBottom: 16,
    },
    planBadge: {
      backgroundColor: '#E8EAFE', // Light purple
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
    },
    planText: {
      color: '#4B3F72',
      fontWeight: '700',
      fontSize: 12,
    },

    // Options Styles
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: 'gray',
      marginBottom: 12,
      marginTop: 8,
      marginLeft: 8,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    sectionContainer: {
      backgroundColor: '#fff',
      borderRadius: 24,
      padding: 8,
      marginBottom: 16,
      // Soft shadow like Home cards
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.03,
      shadowRadius: 10,
      elevation: 2,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: '#F5F7FF', // Very subtle blue/grey
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    iconBoxDestructive: {
      backgroundColor: '#FFF2F2',
    },
    optionLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: COLORS.text,
    },
    textDestructive: {
      color: '#FF3B30',
    },
    optionRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionValue: {
      fontSize: 14,
      color: 'gray',
      marginRight: 8,
    },
    versionBadge: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    versionText: {
      width: 100,
      borderRadius: 20,
      backgroundColor: '#E8EAFE',
      paddingHorizontal: 16,
      paddingVertical: 10,
      textAlign: 'center',
      color: '#4B3F72',
      fontWeight: '700',
      fontSize: 12,
    },
  });
