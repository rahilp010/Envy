import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text } from 'react-native';

const formatINR = value =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(value);

const AnimatedCounter = ({
  value = 0,
  duration = 600,
  style,
  formatter = formatINR,
}) => {
  const animatedValue = useRef(new Animated.Value(value)).current;
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const listener = animatedValue.addListener(({ value }) => {
      setDisplayValue(value);
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();

    return () => animatedValue.removeListener(listener);
  }, [value]);

  return <Text style={style}>{formatter(displayValue)}</Text>;
};

export default AnimatedCounter;
