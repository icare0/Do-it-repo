import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { getTheme } from '@/theme';
import { hapticsService } from '@/services/hapticsService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 80;

interface SwipeAction {
  icon: string;
  color: string;
  backgroundColor: string;
  onPress: () => void;
  label?: string;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  disabled?: boolean;
}

export function SwipeableRow({
  children,
  leftAction,
  rightAction,
  onSwipeLeft,
  onSwipeRight,
  disabled = false,
}: SwipeableRowProps) {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const translateX = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (disabled) return false;
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderGrant: () => {
        translateX.setOffset(lastOffset.current);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        let newValue = gestureState.dx;

        // Limit swipe distance
        if (!leftAction && newValue > 0) newValue = 0;
        if (!rightAction && newValue < 0) newValue = 0;

        // Add resistance at edges
        if (newValue > ACTION_WIDTH) {
          newValue = ACTION_WIDTH + (newValue - ACTION_WIDTH) * 0.3;
        }
        if (newValue < -ACTION_WIDTH) {
          newValue = -ACTION_WIDTH + (newValue + ACTION_WIDTH) * 0.3;
        }

        translateX.setValue(newValue);

        // Haptic feedback at threshold
        if (Math.abs(newValue) > SWIPE_THRESHOLD && Math.abs(lastOffset.current) < SWIPE_THRESHOLD) {
          hapticsService.light();
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateX.flattenOffset();

        const currentValue = gestureState.dx + lastOffset.current;

        if (currentValue > SWIPE_THRESHOLD && leftAction) {
          // Swipe right - show left action
          Animated.spring(translateX, {
            toValue: ACTION_WIDTH,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
          lastOffset.current = ACTION_WIDTH;
          hapticsService.medium();
          if (onSwipeRight) onSwipeRight();
        } else if (currentValue < -SWIPE_THRESHOLD && rightAction) {
          // Swipe left - show right action
          Animated.spring(translateX, {
            toValue: -ACTION_WIDTH,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
          lastOffset.current = -ACTION_WIDTH;
          hapticsService.medium();
          if (onSwipeLeft) onSwipeLeft();
        } else {
          // Reset position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
          lastOffset.current = 0;
        }
      },
    })
  ).current;

  const closeRow = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
    lastOffset.current = 0;
  };

  const handleActionPress = (action: SwipeAction) => {
    hapticsService.medium();
    action.onPress();
    closeRow();
  };

  const leftActionOpacity = translateX.interpolate({
    inputRange: [0, ACTION_WIDTH / 2, ACTION_WIDTH],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  const rightActionOpacity = translateX.interpolate({
    inputRange: [-ACTION_WIDTH, -ACTION_WIDTH / 2, 0],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Left Action (shown on swipe right) */}
      {leftAction && (
        <Animated.View
          style={[
            styles.actionContainer,
            styles.leftAction,
            { backgroundColor: leftAction.backgroundColor, opacity: leftActionOpacity },
          ]}
        >
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleActionPress(leftAction)}
          >
            <Ionicons name={leftAction.icon as any} size={24} color={leftAction.color} />
            {leftAction.label && (
              <Text style={[styles.actionLabel, { color: leftAction.color }]}>
                {leftAction.label}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Right Action (shown on swipe left) */}
      {rightAction && (
        <Animated.View
          style={[
            styles.actionContainer,
            styles.rightAction,
            { backgroundColor: rightAction.backgroundColor, opacity: rightActionOpacity },
          ]}
        >
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleActionPress(rightAction)}
          >
            <Ionicons name={rightAction.icon as any} size={24} color={rightAction.color} />
            {rightAction.label && (
              <Text style={[styles.actionLabel, { color: rightAction.color }]}>
                {rightAction.label}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Main Content */}
      <Animated.View
        style={[
          styles.content,
          { transform: [{ translateX }] },
        ]}
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
  content: {
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  actionContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftAction: {
    left: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  rightAction: {
    right: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
