import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

import { shadows, layout } from '@/theme';
import { hapticsService } from '@/services/hapticsService';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface AnimatedFABProps {
  onPress: () => void;
  gradientColors: string[];
  iconColor: string;
  pulse?: boolean; // Enable subtle pulse animation
}

export const AnimatedFAB: React.FC<AnimatedFABProps> = ({
  onPress,
  gradientColors,
  iconColor,
  pulse = false,
}) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  // Subtle pulse effect (optional)
  useEffect(() => {
    if (pulse) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 2000 }),
          withTiming(1, { duration: 2000 })
        ),
        -1, // infinite
        false
      );
    }
  }, [pulse]);

  const handlePressIn = () => {
    scale.value = withSpring(0.9, {
      damping: 15,
      stiffness: 300,
    });
    rotation.value = withTiming(-10, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 200,
    });
    rotation.value = withSpring(0, {
      damping: 12,
      stiffness: 200,
    });
  };

  const handlePress = () => {
    hapticsService.medium();
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * pulseScale.value },
    ],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <AnimatedTouchable
      style={[styles.fab, shadows.xl, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fabGradient}
      >
        <Animated.View style={iconAnimatedStyle}>
          <Ionicons name="add" size={28} color={iconColor} />
        </Animated.View>
      </LinearGradient>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  fab: {
    width: layout.fabSize,
    height: layout.fabSize,
    borderRadius: layout.fabSize / 2,
    overflow: 'hidden',
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
