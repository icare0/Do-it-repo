import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { getTheme } from '@/theme';
import { voiceService, VoiceTranscription } from '@/services/voiceService';
import { hapticsService } from '@/services/hapticsService';

interface VoiceButtonProps {
  onTranscription: (result: VoiceTranscription) => void;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export function VoiceButton({ onTranscription, size = 'medium', style }: VoiceButtonProps) {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Check if voice service is available
  useEffect(() => {
    const checkAvailability = async () => {
      await voiceService.initialize();
      // Small delay to allow dynamic imports to complete
      setTimeout(() => {
        setIsAvailable(voiceService.isAvailable());
      }, 500);
    };
    checkAvailability();
  }, []);

  const sizeStyles = {
    small: { button: 40, icon: 20 },
    medium: { button: 56, icon: 24 },
    large: { button: 72, icon: 32 },
  };

  useEffect(() => {
    if (isRecording) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Wave animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      waveAnim.setValue(0);
    }
  }, [isRecording, pulseAnim, waveAnim]);

  const handlePressIn = async () => {
    await hapticsService.medium();
    setShowModal(true);
    setTranscribedText('');
    setIsRecording(true);
    await voiceService.startRecording();
  };

  const handlePressOut = async () => {
    if (!isRecording) return;

    setIsRecording(false);
    setIsProcessing(true);
    await hapticsService.light();

    const audioUri = await voiceService.stopRecording();
    if (audioUri) {
      const result = await voiceService.transcribeAudio(audioUri);
      if (result) {
        setTranscribedText(result.text);
        await hapticsService.success();

        // Auto-close after showing result
        setTimeout(() => {
          setShowModal(false);
          setIsProcessing(false);
          onTranscription(result);
        }, 1500);
      } else {
        await hapticsService.error();
        setTranscribedText('Impossible de transcrire...');
        setTimeout(() => {
          setShowModal(false);
          setIsProcessing(false);
        }, 1500);
      }
    } else {
      setShowModal(false);
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (isRecording) {
      await voiceService.cancelRecording();
      setIsRecording(false);
    }
    setShowModal(false);
    setIsProcessing(false);
  };

  const waveOpacity = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  const waveScale = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
  });

  // Don't render if voice service is not available
  if (!isAvailable) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        style={[
          styles.button,
          {
            width: sizeStyles[size].button,
            height: sizeStyles[size].button,
            borderRadius: sizeStyles[size].button / 2,
            backgroundColor: theme.colors.primary,
          },
          style,
        ]}
      >
        <Ionicons name="mic" size={sizeStyles[size].icon} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
              <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.recordingContainer}>
              {isRecording && (
                <>
                  <Animated.View
                    style={[
                      styles.wave,
                      {
                        opacity: waveOpacity,
                        transform: [{ scale: waveScale }],
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.wave,
                      {
                        opacity: waveOpacity,
                        transform: [{ scale: Animated.add(waveScale, 0.3) }],
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  />
                </>
              )}

              <Animated.View
                style={[
                  styles.micCircle,
                  {
                    backgroundColor: isRecording ? theme.colors.error : theme.colors.primary,
                    transform: [{ scale: isRecording ? pulseAnim : 1 }],
                  },
                ]}
              >
                {isProcessing ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : (
                  <Ionicons
                    name={isRecording ? 'mic' : 'checkmark'}
                    size={48}
                    color="#fff"
                  />
                )}
              </Animated.View>
            </View>

            <Text style={[styles.statusText, { color: theme.colors.text }]}>
              {isRecording
                ? 'Parlez maintenant...'
                : isProcessing
                ? 'Transcription en cours...'
                : 'Terminé !'}
            </Text>

            {transcribedText ? (
              <View style={[styles.transcriptionBox, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <Text style={[styles.transcriptionText, { color: theme.colors.text }]}>
                  "{transcribedText}"
                </Text>
              </View>
            ) : null}

            <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
              {isRecording
                ? 'Relâchez pour arrêter'
                : 'Maintenez le bouton micro pour parler'}
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  recordingContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  wave: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  micCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  transcriptionBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  transcriptionText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  hintText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
