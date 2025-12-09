import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useThemeStore } from '@/store/themeStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { getTheme } from '@/theme';
import { authService } from '@/services/authService';
import { hapticsService } from '@/services/hapticsService';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
  illustration: 'tasks' | 'calendar' | 'stats' | 'welcome' | 'auth';
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: "Bienvenue dans Do'It",
    description: 'Ta nouvelle app de productivité pour accomplir plus, simplement.',
    icon: 'rocket',
    gradient: ['#667eea', '#764ba2'],
    illustration: 'welcome',
  },
  {
    id: 2,
    title: 'Organise tes tâches',
    description: 'Crée, planifie et complète tes tâches facilement. Tout est sous contrôle.',
    icon: 'checkmark-circle',
    gradient: ['#f093fb', '#f5576c'],
    illustration: 'tasks',
  },
  {
    id: 3,
    title: 'Calendrier intelligent',
    description: 'Synchronise tous tes événements. Vois tout en un seul endroit.',
    icon: 'calendar',
    gradient: ['#4facfe', '#00f2fe'],
    illustration: 'calendar',
  },
  {
    id: 4,
    title: 'Progresse et gagne !',
    description: 'Gagne des points, monte de niveau et garde ta série ! Reste motivé.',
    icon: 'trophy',
    gradient: ['#fa709a', '#fee140'],
    illustration: 'stats',
  },
  {
    id: 5,
    title: 'Prêt à commencer ?',
    description: 'Connecte-toi avec Google et commence ton voyage vers la productivité.',
    icon: 'sparkles',
    gradient: ['#FF6B35', '#F7931E'],
    illustration: 'auth',
  },
];

export default function OnboardingScreen() {
  const { colorScheme } = useThemeStore();
  const { completeOnboarding } = useOnboardingStore();
  const theme = getTheme(colorScheme);

  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentIndex(index);
  };

  const handleNext = async () => {
    await hapticsService.light();
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: width * (currentIndex + 1),
        animated: true,
      });
    }
  };

  const handleSkip = async () => {
    await hapticsService.light();
    scrollViewRef.current?.scrollTo({
      x: width * (slides.length - 1),
      animated: true,
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await hapticsService.medium();
      await authService.loginWithGoogle();
      // Mark onboarding as completed after successful sign-in
      await completeOnboarding();
    } catch (error) {
      console.error('Google Sign-In error:', error);
      await hapticsService.error();
    } finally {
      setIsLoading(false);
    }
  };

  const renderIllustration = (type: OnboardingSlide['illustration'], gradient: string[]) => {
    switch (type) {
      case 'welcome':
        return (
          <View style={styles.illustrationContainer}>
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.illustrationCircle}
            >
              <Ionicons name="rocket" size={120} color="#FFF" />
            </LinearGradient>
            <View style={[styles.floatingIcon, { top: 40, right: 40 }]}>
              <Ionicons name="sparkles" size={32} color={gradient[0]} />
            </View>
            <View style={[styles.floatingIcon, { bottom: 60, left: 30 }]}>
              <Ionicons name="star" size={28} color={gradient[1]} />
            </View>
          </View>
        );

      case 'tasks':
        return (
          <View style={styles.illustrationContainer}>
            <View style={styles.tasksList}>
              {[1, 2, 3].map((i) => (
                <LinearGradient
                  key={i}
                  colors={[`${gradient[0]}20`, `${gradient[1]}20`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.taskItem, { marginTop: i * 16 }]}
                >
                  <View style={[styles.checkbox, { backgroundColor: gradient[0] }]}>
                    <Ionicons name="checkmark" size={20} color="#FFF" />
                  </View>
                  <View style={styles.taskTextPlaceholder} />
                </LinearGradient>
              ))}
            </View>
            <View style={[styles.floatingIcon, { top: 20, right: 20 }]}>
              <Ionicons name="add-circle" size={48} color={gradient[1]} />
            </View>
          </View>
        );

      case 'calendar':
        return (
          <View style={styles.illustrationContainer}>
            <LinearGradient
              colors={[`${gradient[0]}30`, `${gradient[1]}30`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.calendarBox}
            >
              <View style={styles.calendarHeader}>
                <Ionicons name="chevron-back" size={24} color={gradient[0]} />
                <Text style={[styles.calendarMonth, { color: gradient[0] }]}>Décembre</Text>
                <Ionicons name="chevron-forward" size={24} color={gradient[0]} />
              </View>
              <View style={styles.calendarGrid}>
                {[...Array(21)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.calendarDay,
                      i === 8 && {
                        backgroundColor: gradient[0],
                      },
                    ]}
                  >
                    {i === 8 && <View style={styles.calendarDot} />}
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>
        );

      case 'stats':
        return (
          <View style={styles.illustrationContainer}>
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statsCard}
            >
              <Ionicons name="flame" size={60} color="#FFF" />
              <Text style={styles.statsValue}>7</Text>
              <Text style={styles.statsLabel}>jours de série</Text>
            </LinearGradient>
            <View style={styles.miniStatsRow}>
              <View style={[styles.miniStat, { backgroundColor: `${gradient[0]}30` }]}>
                <Ionicons name="trophy" size={32} color={gradient[0]} />
                <Text style={[styles.miniStatValue, { color: gradient[0] }]}>12</Text>
              </View>
              <View style={[styles.miniStat, { backgroundColor: `${gradient[1]}30` }]}>
                <Ionicons name="star" size={32} color={gradient[1]} />
                <Text style={[styles.miniStatValue, { color: gradient[1] }]}>340</Text>
              </View>
            </View>
          </View>
        );

      case 'auth':
        return (
          <View style={styles.illustrationContainer}>
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.authCircle}
            >
              <Ionicons name="checkmark-circle" size={100} color="#FFF" />
            </LinearGradient>
            <View style={[styles.floatingIcon, { top: 60, left: 40 }]}>
              <Ionicons name="flash" size={40} color={gradient[0]} />
            </View>
            <View style={[styles.floatingIcon, { bottom: 80, right: 40 }]}>
              <Ionicons name="heart" size={36} color={gradient[1]} />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Skip Button */}
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>Passer</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            {renderIllustration(slide.illustration, slide.gradient)}

            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: theme.colors.text }]}>{slide.title}</Text>
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                {slide.description}
              </Text>
            </View>

            {/* Auth Button for last slide */}
            {slide.id === slides.length && (
              <View style={styles.authContainer}>
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={slide.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.googleButtonGradient}
                  >
                    <Ionicons
                      name={isLoading ? 'hourglass' : 'logo-google'}
                      size={24}
                      color="#FFF"
                    />
                    <Text style={styles.googleButtonText}>
                      {isLoading ? 'Connexion...' : 'Continuer avec Google'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentIndex ? theme.colors.primary : theme.colors.border,
                  width: index === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Next Button */}
        {currentIndex < slides.length - 1 && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <LinearGradient
              colors={slides[currentIndex].gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>Suivant</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}
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
  slide: {
    width,
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 120,
  },
  illustrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  illustrationCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  floatingIcon: {
    position: 'absolute',
  },
  tasksList: {
    width: '100%',
    paddingHorizontal: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTextPlaceholder: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 6,
  },
  calendarBox: {
    width: '90%',
    padding: 20,
    borderRadius: 24,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  calendarDay: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  statsCard: {
    width: 200,
    height: 200,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  statsValue: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFF',
    marginTop: 8,
  },
  statsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    opacity: 0.9,
  },
  miniStatsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  miniStat: {
    width: 90,
    height: 90,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  authCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  textContainer: {
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 16,
  },
  authContainer: {
    marginTop: 20,
  },
  googleButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  googleButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 12,
  },
  googleButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
});
