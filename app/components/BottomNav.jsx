import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const BottomNav = ({ navigation, active }) => {
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
            color={active === 'home' ? '#000' : '#fff'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={
            active === 'product' ||
            active === 'client' ||
            active === 'purchase' ||
            active === 'sales' ||
            active === 'bank' ||
            active === 'analytics'
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
                : 'cash-outline'
            }
            size={22}
            color={
              active === 'product' ||
              active === 'client' ||
              active === 'purchase' ||
              active === 'sales' ||
              active === 'bank' ||
              active === 'analytics'
                ? '#000'
                : '#fff'
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default BottomNav;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  nav: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderRadius: 40,
    padding: 6,
  },

  item: {
    padding: 14,
  },

  active: {
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 30,
  },
});
