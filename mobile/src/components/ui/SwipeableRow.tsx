import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '@/store/themeStore';
import { getTheme } from '@/theme';
import { hapticsService } from '@/services/hapticsService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TRIGGER_THRESHOLD = SCREEN_WIDTH * 0.3; // 30% to trigger

interface SwipeAction {
  icon: string;
  color: string;
  gradient: readonly [string, string];
  onPress: () => void;
  label?: string;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  disabled?: boolean;
  style?: any;
}

export function SwipeableRow({
  children,
  leftAction,
  rightAction,
  disabled = false,
  style,
}: SwipeableRowProps) {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const translateX = useRef(new Animated.Value(0)).current;
  const actionIconScale = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (disabled) return false;
        // Only allow horizontal swipes
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderGrant: () => {
        // Prepare for interaction
      },
      onPanResponderMove: (_, gestureState) => {
        let newValue = gestureState.dx;

        // Prevent swipe if action doesn't exist
        if (!leftAction && newValue > 0) newValue = 0;
        if (!rightAction && newValue < 0) newValue = 0;

        translateX.setValue(newValue);

        // Animate icon scale based on pull distance
        const progress = Math.min(Math.abs(newValue) / (TRIGGER_THRESHOLD * 0.8), 1.3);
        actionIconScale.setValue(progress);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx } = gestureState;

        if (leftAction && dx > TRIGGER_THRESHOLD) {
          // Trigger Left Action
          hapticsService.success();

          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            leftAction.onPress();
            // Reset after delay
            setTimeout(() => {
              translateX.setValue(0);
              actionIconScale.setValue(0);
            }, 300);
          });
        }
        else if (rightAction && dx < -TRIGGER_THRESHOLD) {
          // Trigger Right Action
          hapticsService.warning();

          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            rightAction.onPress();
            // Reset after delay
            setTimeout(() => {
              translateX.setValue(0);
              actionIconScale.setValue(0);
            }, 300);
          });
        }
        else {
          // Snap back if incorrect threshold
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Interpolate opacity for the background layers
  const leftOpacity = translateX.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const rightOpacity = translateX.interpolate({
    inputRange: [-50, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, style]}>
      {/* Background Layer */}
      <View style={styles.backgroundContainer}>
        {/* Left Action Background (Positive) */}
        <Animated.View style={[
          styles.actionBackground,
          styles.leftBackground,
          { opacity: leftOpacity }
        ]}>
          {leftAction && (
            <LinearGradient
              colors={[...leftAction.gradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <Animated.View style={[styles.iconContainer, { transform: [{ scale: actionIconScale }] }]}>
                <Ionicons name={leftAction.icon as any} size={32} color={leftAction.color} />
              </Animated.View>
            </LinearGradient>
          )}
        </Animated.View>

        {/* Right Action Background (Negative) */}
        <Animated.View style={[
          styles.actionBackground,
          styles.rightBackground,
          { opacity: rightOpacity }
        ]}>
          {rightAction && (
            <LinearGradient
              colors={[...rightAction.gradient]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 0 }}
              style={styles.gradient}
            >
              <Animated.View style={[styles.iconContainer, { transform: [{ scale: actionIconScale }] }]}>
                <Ionicons name={rightAction.icon as any} size={32} color={rightAction.color} />
              </Animated.View>
            </LinearGradient>
          )}
        </Animated.View>
      </View>

      {/* Content */}
      <Animated.View
        style={[styles.content, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100%',
    justifyContent: 'center',
  },
  leftBackground: {
    left: 0,
    alignItems: 'flex-start',
  },
  rightBackground: {
    right: 0,
    alignItems: 'flex-end',
  },
  gradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    backgroundColor: 'transparent',
  },
});
