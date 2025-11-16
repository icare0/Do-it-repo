import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeStore } from '@/store/themeStore';
import { getTheme } from '@/theme';

const { width, height } = Dimensions.get('window');
const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'sparkles',
    title: 'Bienvenue sur Do\'It',
    description: 'Une nouvelle façon intelligente de gérer vos tâches avec un design épuré et intuitif',
    primaryColor: '#3B82F6',
    secondaryColor: '#60A5FA',
  },
  {
    id: '2',
    icon: 'location',
    title: 'Géolocalisation intelligente',
    description: 'Vos tâches s\'organisent automatiquement selon votre position et vous guide vers vos destinations',
    primaryColor: '#8B5CF6',
    secondaryColor: '#A78BFA',
  },
  {
    id: '3',
    icon: 'bulb',
    title: 'Apprentissage contextuel',
    description: 'L\'app apprend de vos habitudes et enrichit automatiquement vos tâches pour vous faire gagner du temps',
    primaryColor: '#10B981',
    secondaryColor: '#34D399',
  },
  {
    id: '4',
    icon: 'sync',
    title: 'Synchronisation automatique',
    description: 'Toutes vos données sont synchronisées en temps réel sur tous vos appareils',
    primaryColor: '#F59E0B',
    secondaryColor: '#FBBF24',
  },
  {
    id: '5',
    icon: 'checkmark-circle',
    title: 'Prêt à commencer',
    description: 'Créez votre première tâche et découvrez une productivité sans effort',
    primaryColor: '#EF4444',
    secondaryColor: '#F87171',
  },
];

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const currentSlide = slides[currentIndex];
  const isLastSlide = currentIndex === slides.length - 1;

  async function handleComplete() {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      onComplete();
    } catch (error) {
      console.error('Error saving onboarding state:', error);
      onComplete();
    }
  }

  function handleNext() {
    if (isLastSlide) {
      handleComplete();
    } else {
      // Animate transition
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex(currentIndex + 1);

        // Animate in
        Animated.parallel([
          Animated.spring(fadeAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }

  function handleSkip() {
    handleComplete();
  }

  function handleBack() {
    if (currentIndex > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex(currentIndex - 1);

        Animated.parallel([
          Animated.spring(fadeAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      {/* Skip button */}
      {!isLastSlide && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>
            Passer
          </Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.slideContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: `${currentSlide.primaryColor}15`,
              },
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: currentSlide.primaryColor,
                },
              ]}
            >
              <Ionicons name={currentSlide.icon} size={64} color="#fff" />
            </View>

            {/* Decorative circles */}
            <View
              style={[
                styles.decorativeCircle,
                styles.decorativeCircle1,
                { backgroundColor: `${currentSlide.secondaryColor}20` },
              ]}
            />
            <View
              style={[
                styles.decorativeCircle,
                styles.decorativeCircle2,
                { backgroundColor: `${currentSlide.primaryColor}10` },
              ]}
            />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {currentSlide.title}
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {currentSlide.description}
          </Text>
        </Animated.View>

        {/* Pagination dots */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentIndex
                      ? currentSlide.primaryColor
                      : theme.colors.border,
                  width: index === currentIndex ? 32 : 8,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        {currentIndex > 0 && (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.backButton,
              { borderColor: theme.colors.border },
            ]}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            {
              backgroundColor: currentSlide.primaryColor,
              marginLeft: currentIndex > 0 ? 12 : 0,
              flex: 1,
            },
          ]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {isLastSlide ? 'Commencer' : 'Suivant'}
          </Text>
          {!isLastSlide && (
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  slideContent: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    position: 'relative',
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  decorativeCircle1: {
    width: 100,
    height: 100,
    top: 20,
    right: 10,
  },
  decorativeCircle2: {
    width: 80,
    height: 80,
    bottom: 30,
    left: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 340,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 64,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s',
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    paddingBottom: 32,
    alignItems: 'center',
  },
  navButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  backButton: {
    width: 56,
    borderWidth: 2,
  },
  nextButton: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 32,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});

// Export helper function to check if onboarding is completed
export async function isOnboardingCompleted(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking onboarding state:', error);
    return false;
  }
}

// Export helper function to reset onboarding (for testing)
export async function resetOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
  } catch (error) {
    console.error('Error resetting onboarding:', error);
  }
}
