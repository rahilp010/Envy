import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { LightTheme, DarkTheme } from '../theme/color';

const BottomNav = ({ navigation, active }) => {
  const { theme } = useTheme();
  const COLORS = theme === 'dark' ? DarkTheme : LightTheme;
  const styles = createStyles(COLORS);
  return (
    <View style={styles.wrapper}>
      <View style={styles.nav}>
        <TouchableOpacity
          style={active === 'home' ? styles.active : styles.item}
          onPress={() => navigation.navigate('HomePage')}
        >
          <Icon
            name="home-outline"
            size={22}
            color={active === 'home' ? COLORS.text : COLORS.bg}
          />
        </TouchableOpacity>

        {active === 'profile' && (
          <TouchableOpacity
            style={active === 'analytics' ? styles.active : styles.item}
            onPress={() => navigation.navigate('Analytics')}
          >
            <Icon
              name="analytics-outline"
              size={22}
              color={active === 'analytics' ? COLORS.text : '#fff'}
            />
          </TouchableOpacity>
        )}

        {active === 'profile' && (
          <TouchableOpacity
            style={active === 'bank' ? styles.active : styles.item}
            onPress={() => navigation.navigate('BankSystem')}
          >
            <Icon
              name="business-outline"
              size={22}
              color={active === 'bank' ? COLORS.text : '#fff'}
            />
          </TouchableOpacity>
        )}

        {active === 'bank' && (
          <TouchableOpacity
            style={active === 'setting' ? styles.active : styles.item}
            onPress={() => navigation.navigate('Settings')}
          >
            <Icon
              name="settings-outline"
              size={22}
              color={active === 'setting' ? COLORS.text : '#fff'}
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={
            active === 'product' ||
            active === 'client' ||
            active === 'purchase' ||
            active === 'sales' ||
            active === 'bank' ||
            active === 'analytics' ||
            active === 'report' ||
            active === 'settings' ||
            active === 'profile' ||
            active === 'about'
              ? styles.active
              : styles.item
          }
        >
          <Icon
            name={
              active === 'product'
                ? 'cube-outline'
                : active === 'client'
                ? 'people-outline'
                : active === 'purchase'
                ? 'cart-outline'
                : active === 'sales'
                ? 'cash-outline'
                : active === 'bank'
                ? 'business-outline'
                : active === 'analytics'
                ? 'analytics-outline'
                : active === 'report'
                ? 'pie-chart-outline'
                : active === 'settings'
                ? 'settings-outline'
                : active === 'profile'
                ? 'person-outline'
                : active === 'about'
                ? 'information-circle-outline'
                : 'cash-outline'
            }
            size={22}
            color={
              active === 'product' ||
              active === 'client' ||
              active === 'purchase' ||
              active === 'sales' ||
              active === 'bank' ||
              active === 'analytics' ||
              active === 'report' ||
              active === 'settings' ||
              active === 'profile' ||
              active === 'about'
                ? COLORS.text
                : '#fff'
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default BottomNav;

const createStyles = COLORS =>
  StyleSheet.create({
    wrapper: {
      position: 'absolute',
      bottom: 20,
      left: 0,
      right: 0,
      alignItems: 'center',
    },

    nav: {
      flexDirection: 'row',
      backgroundColor: COLORS.text,
      borderRadius: 40,
      padding: 6,
    },

    item: {
      padding: 14,
    },

    active: {
      padding: 14,
      backgroundColor: COLORS.bg,
      borderRadius: 30,
    },
  });
