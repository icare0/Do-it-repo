import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { getTheme } from '@/theme';
import { Button } from './ui/Button';

interface SmartPromptModalProps {
  visible: boolean;
  question: string;
  placeholder: string;
  icon?: keyof typeof Ionicons.glyphMap;
  suggestions?: string[];
  onSubmit: (answer: string) => void;
  onDismiss: () => void;
}

export function SmartPromptModal({
  visible,
  question,
  placeholder,
  icon = 'bulb',
  suggestions = [],
  onSubmit,
  onDismiss,
}: SmartPromptModalProps) {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const [answer, setAnswer] = useState('');
  const [scaleAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const handleSubmit = () => {
    if (answer.trim()) {
      onSubmit(answer.trim());
      setAnswer('');
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setAnswer(suggestion);
  };

  const handleSkip = () => {
    setAnswer('');
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity
          style={[styles.backdrop, { backgroundColor: colorScheme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)' }]}
          activeOpacity={1}
          onPress={onDismiss}
        />

        <Animated.View
          style={[
            styles.modal,
            {
              backgroundColor: theme.colors.surface,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
            <Ionicons name={icon} size={32} color={theme.colors.primary} />
          </View>

          {/* Question */}
          <Text style={[styles.question, { color: theme.colors.text }]}>
            {question}
          </Text>

          {/* Input */}
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textTertiary}
            value={answer}
            onChangeText={setAnswer}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <View style={styles.suggestions}>
              <Text style={[styles.suggestionsLabel, { color: theme.colors.textSecondary }]}>
                Suggestions :
              </Text>
              <View style={styles.suggestionsList}>
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.suggestionChip,
                      {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    onPress={() => handleSuggestionPress(suggestion)}
                  >
                    <Text style={[styles.suggestionText, { color: theme.colors.text }]}>
                      {suggestion}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={[styles.skipButtonText, { color: theme.colors.textSecondary }]}>
                Passer
              </Text>
            </TouchableOpacity>

            <Button
              title="Enregistrer"
              onPress={handleSubmit}
              disabled={!answer.trim()}
              size="small"
              style={styles.submitButton}
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modal: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  input: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  suggestions: {
    marginBottom: 20,
  },
  suggestionsLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
  },
});
