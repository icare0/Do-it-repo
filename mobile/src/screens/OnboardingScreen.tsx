import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  useWindowDimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useOnboarding } from '../hooks/useOnboarding';
import { hapticsService } from '../services/hapticsService';

const SLIDES = [
  {
    id: '1',
    title: 'Organisez votre chaos',
    description: 'Transformez vos tâches quotidiennes en actions simples. Ne laissez plus rien vous échapper.',
    lottie: require('../../assets/animations/onboarding_1.json'),
    gradient: ['#3B82F6', '#8B5CF6'],
    icon: 'checkbox-outline',
  },
  {
    id: '2',
    title: 'Synchronisation Totale',
    description: 'Vos calendriers Google, Outlook et iCloud réunis au même endroit. Une seule vue pour toute votre vie.',
    lottie: require('../../assets/animations/onboarding_2.json'),
    gradient: ['#8B5CF6', '#EC4899'],
    icon: 'sync-outline',
  },
  {
    id: '3',
    title: 'Agissez localement',
    description: 'Recevez des rappels intelligents basés sur votre localisation. Faites les courses quand vous passez devant le magasin.',
    lottie: require('../../assets/animations/onboarding_3.json'),
    gradient: ['#10B981', '#3B82F6'],
    icon: 'location-outline',
  },
  {
    id: '4',
    title: 'Restez concentré',
    description: 'Mode Focus avec timer Pomodoro intégré. Accomplissez plus en moins de temps avec des sessions de travail optimisées.',
    lottie: require('../../assets/animations/onboarding_1.json'),
    gradient: ['#F59E0B', '#EF4444'],
    icon: 'timer-outline',
  },
];

export const OnboardingScreen = () => {
  const { width, height } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigation = useNavigation();
  const { completeOnboarding } = useOnboarding();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentIndex]);

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
      hapticsService.selection();
    }
  }).current;

  const handleNext = async () => {
    await hapticsService.medium();
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      await completeOnboarding();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as never }],
      });
    }
  };

  const handleSkip = async () => {
    await hapticsService.light();
    await completeOnboarding();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' as never }],
    });
  };

  const renderItem = ({ item, index }: any) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [50, 0, 50],
      extrapolate: 'clamp',
    });

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.slide, { width }]}>
        {/* Gradient Background */}
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          <View style={styles.gradientOverlay} />
        </LinearGradient>

        {/* Animation Container */}
        <Animated.View
          style={[
            styles.animationContainer,
            {
              height: height * 0.45,
              transform: [{ translateY }, { scale }],
              opacity,
            },
          ]}
        >
          <LottieView
            source={item.lottie}
            autoPlay
            loop
            style={styles.lottie}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Text Container */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              transform: [{ translateY }],
              opacity,
            },
          ]}
        >
          {/* Icon Badge */}
          <View style={styles.iconBadge}>
            <LinearGradient
              colors={item.gradient}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={item.icon} size={24} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </Animated.View>
      </View>
    );
  };

  const Paginator = () => {
    return (
      <View style={styles.paginatorContainer}>
        {SLIDES.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 32, 8],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });

          const dotColor = scrollX.interpolate({
            inputRange,
            outputRange: ['#A3A3A3', colors.light.primary, '#A3A3A3'],
            extrapolate: 'clamp',
          });

          return (
            <TouchableOpacity
              key={i.toString()}
              onPress={() => {
                hapticsService.selection();
                flatListRef.current?.scrollToIndex({ index: i });
              }}
            >
              <Animated.View
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor: dotColor,
                  },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const ProgressBar = () => {
    const progress = scrollX.interpolate({
      inputRange: [0, (SLIDES.length - 1) * width],
      outputRange: ['0%', '100%'],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progress,
              },
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Progress Bar */}
      <ProgressBar />

      {/* Skip Button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>Passer</Text>
        <Ionicons name="arrow-forward" size={16} color="#A3A3A3" />
      </TouchableOpacity>

      {/* Slides */}
      <View style={{ flex: 3 }}>
        <FlatList
          data={SLIDES}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={flatListRef}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Paginator />

        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={SLIDES[currentIndex].gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {currentIndex === SLIDES.length - 1 ? "C'est parti !" : 'Suivant'}
            </Text>
            <Ionicons
              name={currentIndex === SLIDES.length - 1 ? 'rocket-outline' : 'arrow-forward'}
              size={20}
              color="#fff"
              style={{ marginLeft: 8 }}
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* Step indicator */}
        <Text style={styles.stepIndicator}>
          {currentIndex + 1} / {SLIDES.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  progressBarContainer: {
    position: 'absolute',
    top: 50,
    left: 24,
    right: 24,
    zIndex: 100,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.light.primary,
    borderRadius: 2,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    opacity: 0.1,
  },
  gradientOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  animationContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: '85%',
    height: '85%',
  },
  textContainer: {
    paddingHorizontal: 32,
    alignItems: 'center',
    paddingBottom: 20,
  },
  iconBadge: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#171717',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: '#737373',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  footer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  paginatorContainer: {
    flexDirection: 'row',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  skipButton: {
    position: 'absolute',
    top: 70,
    right: 24,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
  },
  skipText: {
    color: '#737373',
    fontSize: 14,
    fontWeight: '600',
  },
  stepIndicator: {
    color: '#A3A3A3',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 12,
  },
});

export default OnboardingScreen;
