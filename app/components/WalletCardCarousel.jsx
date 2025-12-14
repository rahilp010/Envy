import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const CARD_WIDTH = width - 40;
const SPACING = 16;
const SNAP_INTERVAL = CARD_WIDTH + SPACING;

const cards = [
  {
    id: '1',
    balance: '₹8,630.25',
    name: 'Rahil Patel',
    number: '•••• 5312',
    type: 'VISA',
  },
  // {
  //   id: '1',
  //   balance: '$8,630.25',
  //   name: 'Joy Laroy',
  //   number: '•••• 5312',
  //   type: 'VISA',
  // },
];

export default function WalletCardCarousel() {
  return (
    <FlatList
      data={cards}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={SNAP_INTERVAL}
      decelerationRate="fast"
      // contentContainerStyle={{
      //   paddingHorizontal: (width - CARD_WIDTH) / 2,
      // }}
      renderItem={({ item, index }) => (
        <View
          style={{
            marginRight: index === cards.length - 1 ? 0 : SPACING,
          }}
        >
          <Card item={item} />
        </View>
      )}
      keyExtractor={item => item.id}
    />
  );
}

/* SINGLE CARD */
const Card = ({ item }) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const blobAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Card scale animation
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Blob floating animation (loop)
    Animated.loop(
      Animated.sequence([
        Animated.timing(blobAnim, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(blobAnim, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const blobLeftTranslate = blobAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  const blobRightTranslate = blobAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 25],
  });

  return (
    <Animated.View
      style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}
    >
      {/* Animated blobs */}
      <Animated.View
        style={[
          styles.blobLeft,
          { transform: [{ translateX: blobLeftTranslate }] },
        ]}
      />
      <Animated.View
        style={[
          styles.blobRight,
          { transform: [{ translateY: blobRightTranslate }] },
        ]}
      />

      {/* Glass Blur */}
      <View style={styles.blurLayer} />

      {/* Card content */}
      <View style={styles.cardContent}>
        {/* Top row */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={styles.balance}>{item.balance}</Text>
          </View>

          {/* Contactless icon */}
          <Ionicons
            name="wifi-outline"
            size={30}
            color="#E5E7EB"
            style={{
              transform: [{ rotate: '90deg' }],
              paddingVertical: 27,
              marginTop: -10,
            }}
          />
        </View>

        {/* Bottom row */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.cardDots}>{item.number}</Text>
            <Text style={styles.cardName}>{item.name}</Text>
          </View>

          <Text style={styles.cardBrand}>{item.type}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    width: CARD_WIDTH,
    height: 210,
    borderRadius: 28,
    backgroundColor: '#0B1118',
    overflow: 'hidden',
  },

  blurLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  balanceLabel: {
    color: '#9CA3AF',
    fontSize: 13,
  },

  balance: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
    marginTop: 36,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  cardDots: {
    color: '#E5E7EB',
    letterSpacing: 2,
    fontSize: 14,
  },

  cardName: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },

  cardBrand: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },

  /* BLOBS */
  blobLeft: {
    position: 'absolute',
    width: 220,
    height: 220,
    backgroundColor: '#04ff5cff',
    opacity: 0.35,
    borderRadius: 110,
    top: -100,
    left: -120,
  },

  blobRight: {
    position: 'absolute',
    width: 260,
    height: 260,
    backgroundColor: '#60A5FA',
    opacity: 0.55,
    borderRadius: 130,
    bottom: -140,
    right: -120,
  },
});
