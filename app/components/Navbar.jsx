import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { DarkTheme, LightTheme } from '../theme/color';

const Navbar = ({ title = 'Title', onSearch, onFilter, page }) => {
  const { theme } = useTheme();
  const COLORS = theme === 'dark' ? DarkTheme : LightTheme;
  const styles = createStyles(COLORS);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        {/* ✅ LEFT: TITLE */}
        <View style={styles.left}>
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* ✅ RIGHT: QUICK TOGGLES */}
        <View style={styles.right}>
          {page === 'bank' ||
          page === 'ledger' ||
          page === 'transfer' ||
          page === 'analytics' ||
          page === 'report' ||
          page === 'settings' ||
          page === 'profile' ||
          page === 'about' ? (
            ''
          ) : (
            <TouchableOpacity style={styles.iconBtn} onPress={onSearch}>
              <Icon name="search-outline" size={20} color="#111" />
            </TouchableOpacity>
          )}
          {page === 'bank' ||
          page === 'ledger' ||
          page === 'transfer' ||
          page === 'analytics' ||
          page === 'report' ||
          page === 'settings' ||
          page === 'profile' ||
          page === 'about' ? (
            ''
          ) : (
            <TouchableOpacity style={styles.iconBtn} onPress={onFilter}>
              <Icon name="filter-outline" size={20} color="#111" />
            </TouchableOpacity>
          )}

          {/* 
          <TouchableOpacity style={styles.iconBtn} onPress={onNotify}>
            <Icon name="notifications-outline" size={20} color="#111" />
            <View style={styles.badge} />
          </TouchableOpacity> */}

          {/* <TouchableOpacity style={styles.iconBtn} onPress={onMenu}>
            <Icon name="ellipsis-vertical" size={20} color="#111" />
          </TouchableOpacity> */}
        </View>
      </View>
    </View>
  );
};

export default Navbar;

const createStyles = COLORS =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: COLORS.bg, // ✅ blends with page
    },

    nav: {
      height: 80,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
    },

    left: {
      flex: 1,
    },

    title: {
      fontSize: 30,
      fontWeight: '500',
      color: COLORS.primary, // slate-900 look
      letterSpacing: 0.3,
    },

    right: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 10,

      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 5,
      elevation: 2,
    },

    badge: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FF3B30',
      borderWidth: 1,
      borderColor: '#fff',
    },
  });
