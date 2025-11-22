import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useThemeStore } from '@/store/themeStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getTheme } from '@/theme';
import { hapticsService } from '@/services/hapticsService';
import { notificationService } from '@/services/notificationService';

type FocusPhase = 'idle' | 'focus' | 'break' | 'completed';

const AMBIENT_SOUNDS = {
  none: null,
  rain: 'https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3',
  cafe: 'https://assets.mixkit.co/active_storage/sfx/1/1-preview.mp3',
  forest: 'https://assets.mixkit.co/active_storage/sfx/528/528-preview.mp3',
  waves: 'https://assets.mixkit.co/active_storage/sfx/529/529-preview.mp3',
};

// Dynamic imports for native modules
let keepAwakeModule: any = null;
let audioModule: any = null;

async function loadNativeModules() {
  // Load expo-keep-awake
  try {
    const ka = await import('expo-keep-awake');
    if (ka.activateKeepAwakeAsync) {
      keepAwakeModule = ka;
    }
  } catch {
    // Silently fail
  }

  // Load expo-av with native module check
  try {
    const av = await import('expo-av');
    if (av.Audio && typeof av.Audio.setAudioModeAsync === 'function') {
      await av.Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      audioModule = av;
    }
  } catch {
    // Silently fail - native module not available
  }
}

loadNativeModules();

export default function FocusModeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { settings } = useSettingsStore();

  const taskTitle = (route.params as any)?.taskTitle || 'Session Focus';

  const [phase, setPhase] = useState<FocusPhase>('idle');
  const [timeLeft, setTimeLeft] = useState(settings.defaultPomodoroDuration * 60);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [sound, setSound] = useState<any>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const focusDuration = settings.defaultPomodoroDuration * 60;
  const breakDuration = settings.defaultBreakDuration * 60;

  // Keep screen awake during focus
  useEffect(() => {
    if (phase === 'focus' && !isPaused && keepAwakeModule) {
      keepAwakeModule.activateKeepAwakeAsync?.();
    } else if (keepAwakeModule) {
      keepAwakeModule.deactivateKeepAwake?.();
    }
    return () => {
      if (keepAwakeModule) {
        keepAwakeModule.deactivateKeepAwake?.();
      }
    };
  }, [phase, isPaused]);

  // Handle app state changes (pause when backgrounded)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState !== 'active' && phase === 'focus' && !isPaused) {
        setIsPaused(true);
      }
    });
    return () => subscription.remove();
  }, [phase, isPaused]);

  // Timer logic
  useEffect(() => {
    if ((phase === 'focus' || phase === 'break') && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });

        if (phase === 'focus') {
          setTotalFocusTime((prev) => prev + 1);
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [phase, isPaused]);

  // Progress animation
  useEffect(() => {
    const duration = phase === 'focus' ? focusDuration : breakDuration;
    const progress = timeLeft / duration;

    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [timeLeft, phase, focusDuration, breakDuration, progressAnim]);

  // Pulse animation when running
  useEffect(() => {
    if (phase === 'focus' && !isPaused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [phase, isPaused, pulseAnim]);

  const handlePhaseComplete = async () => {
    await hapticsService.success();

    if (phase === 'focus') {
      setSessionsCompleted((prev) => prev + 1);
      await notificationService.scheduleLocalNotification({
        title: 'Pause méritée !',
        body: 'Bien joué ! Prends une pause de quelques minutes.',
      });

      if (settings.autoStartBreaks) {
        setPhase('break');
        setTimeLeft(breakDuration);
      } else {
        setPhase('completed');
      }
    } else if (phase === 'break') {
      await notificationService.scheduleLocalNotification({
        title: 'Pause terminée',
        body: 'Prêt pour une nouvelle session focus ?',
      });
      setPhase('idle');
      setTimeLeft(focusDuration);
    }
  };

  const startFocus = async () => {
    await hapticsService.medium();
    setPhase('focus');
    setTimeLeft(focusDuration);
    setIsPaused(false);

    // Start ambient sound if enabled
    if (settings.focusModeSound !== 'none') {
      await playAmbientSound(settings.focusModeSound);
    }
  };

  const startBreak = async () => {
    await hapticsService.light();
    setPhase('break');
    setTimeLeft(breakDuration);
    setIsPaused(false);
  };

  const togglePause = async () => {
    await hapticsService.light();
    setIsPaused(!isPaused);
  };

  const stopSession = async () => {
    await hapticsService.medium();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    await stopAmbientSound();
    setPhase('idle');
    setTimeLeft(focusDuration);
    setIsPaused(false);
  };

  const playAmbientSound = async (soundType: keyof typeof AMBIENT_SOUNDS) => {
    if (!audioModule) return;

    try {
      const soundUrl = AMBIENT_SOUNDS[soundType];
      if (!soundUrl) return;

      const { sound: newSound } = await audioModule.Audio.Sound.createAsync(
        { uri: soundUrl },
        { isLooping: true, volume: 0.5 }
      );
      setSound(newSound);
      await newSound.playAsync();
    } catch (error) {
      console.error('Error playing ambient sound:', error);
    }
  };

  const stopAmbientSound = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (error) {
        console.error('Error stopping sound:', error);
      }
      setSound(null);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'focus':
        return theme.colors.primary;
      case 'break':
        return theme.colors.success;
      case 'completed':
        return theme.colors.warning;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getPhaseGradient = (): [string, string] => {
    switch (phase) {
      case 'focus':
        return ['#3B82F6', '#8B5CF6'];
      case 'break':
        return ['#10B981', '#34D399'];
      case 'completed':
        return ['#F59E0B', '#FBBF24'];
      default:
        return [theme.colors.backgroundSecondary, theme.colors.backgroundTertiary];
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.taskTitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {taskTitle}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main Timer */}
      <View style={styles.timerContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <LinearGradient
            colors={getPhaseGradient()}
            style={styles.timerCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.timerInner, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.phaseLabel, { color: getPhaseColor() }]}>
                {phase === 'focus'
                  ? 'FOCUS'
                  : phase === 'break'
                  ? 'PAUSE'
                  : phase === 'completed'
                  ? 'TERMINÉ'
                  : 'PRÊT'}
              </Text>
              <Text style={[styles.timerText, { color: theme.colors.text }]}>
                {formatTime(timeLeft)}
              </Text>
              {phase !== 'idle' && (
                <Text style={[styles.sessionCount, { color: theme.colors.textSecondary }]}>
                  Session {sessionsCompleted + (phase === 'focus' ? 1 : 0)}
                </Text>
              )}
            </View>
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {formatTotalTime(totalFocusTime)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Temps total
          </Text>
        </Card>
        <Card style={styles.statCard}>
          <Ionicons name="flame-outline" size={24} color={theme.colors.error} />
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {sessionsCompleted}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Sessions
          </Text>
        </Card>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {phase === 'idle' && (
          <Button
            title="Démarrer le Focus"
            onPress={startFocus}
            size="large"
            style={styles.mainButton}
          />
        )}

        {phase === 'completed' && (
          <View style={styles.completedButtons}>
            <Button
              title="Nouvelle session"
              onPress={startFocus}
              size="large"
              style={styles.mainButton}
            />
            <Button
              title="Prendre une pause"
              onPress={startBreak}
              variant="outline"
              size="large"
              style={styles.secondaryButton}
            />
          </View>
        )}

        {(phase === 'focus' || phase === 'break') && (
          <View style={styles.activeControls}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: theme.colors.backgroundTertiary }]}
              onPress={stopSession}
            >
              <Ionicons name="stop" size={28} color={theme.colors.error} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pauseButton, { backgroundColor: getPhaseColor() }]}
              onPress={togglePause}
            >
              <Ionicons
                name={isPaused ? 'play' : 'pause'}
                size={40}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: theme.colors.backgroundTertiary }]}
              onPress={handlePhaseComplete}
            >
              <Ionicons name="play-skip-forward" size={28} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Status message */}
      {isPaused && (
        <Text style={[styles.pausedText, { color: theme.colors.warning }]}>
          En pause
        </Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    padding: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  timerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  timerInner: {
    width: '100%',
    height: '100%',
    borderRadius: 136,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  timerText: {
    fontSize: 64,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  sessionCount: {
    fontSize: 14,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  controlsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  mainButton: {
    width: '100%',
  },
  completedButtons: {
    gap: 12,
  },
  secondaryButton: {
    width: '100%',
  },
  activeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pausedText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
});
