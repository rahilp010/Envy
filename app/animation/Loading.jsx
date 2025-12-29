import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const Dot = ({ delay }) => {
  const scale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(scale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          transform: [{ scale }],
        },
      ]}
    />
  );
};

const Loading = () => {
  return (
    <View style={styles.container}>
      <Dot delay={0} />
      <Dot delay={150} />
      <Dot delay={300} />
    </View>
  );
};

export default Loading;

const styles = StyleSheet.create({
  container: {
    zIndex: 50,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ff0000ff', // black
    marginHorizontal: 4,
  },
});
