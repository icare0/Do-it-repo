import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  useWindowDimensions,
  TouchableOpacity,
  StatusBar
} from 'react-native';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useOnboarding } from '../hooks/useOnboarding';

// Les données de tes slides
const SLIDES = [
  {
    id: '1',
    title: 'Organisez votre chaos',
    description: 'Transformez vos tâches quotidiennes en actions simples. Ne laissez plus rien vous échapper.',
    lottie: require('../../assets/animations/onboarding_1.json'), // Assure-toi d'avoir le fichier
  },
  {
    id: '2',
    title: 'Synchronisation Totale',
    description: 'Vos calendriers Google, Outlook et iCloud réunis au même endroit. Une seule vue pour toute votre vie.',
    lottie: require('../../assets/animations/onboarding_2.json'),
  },
  {
    id: '3',
    title: 'Agissez localement',
    description: 'Recevez des rappels intelligents basés sur votre localisation. Faites les courses quand vous passez devant le magasin.',
    lottie: require('../../assets/animations/onboarding_3.json'),
  },
];

export const OnboardingScreen = () => {
  const { width, height } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigation = useNavigation();
  const { completeOnboarding } = useOnboarding();

  // Gérer le scroll pour les points de pagination
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      // Fin de l'onboarding
      await completeOnboarding();
      // On reset la navigation vers le Login ou Home
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as never }], // ou 'Register'
      });
    }
  };

  const handleSkip = async () => {
      await completeOnboarding();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as never }],
      });
  };

  // Rendu d'un slide
  const renderItem = ({ item }: any) => {
    return (
      <View style={[styles.slide, { width }]}>
        <View style={[styles.animationContainer, { height: height * 0.5 }]}>
          <LottieView
            source={item.lottie}
            autoPlay
            loop
            style={styles.lottie}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  // Rendu des points (Pagination)
  const Paginator = () => {
    return (
      <View style={styles.paginatorContainer}>
        {SLIDES.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 25, 10], // Le point actif s'élargit
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={i.toString()}
              style={[styles.dot, { width: dotWidth, opacity }]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Bouton Skip discret en haut à droite */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Passer</Text>
      </TouchableOpacity>

      <View style={{ flex: 3 }}>
        <FlatList
          data={SLIDES}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
          })}
          scrollEventThrottle={32}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={flatListRef}
        />
      </View>

      <View style={styles.footer}>
        <Paginator />

        <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? "C'est parti !" : "Suivant"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animationContainer: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
  },
  lottie: {
    width: '80%',
    height: '80%',
  },
  textContainer: {
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 50,
    width: '100%',
    alignItems: 'center',
  },
  paginatorContainer: {
    flexDirection: 'row',
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginHorizontal: 5,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32, // Plus large
    borderRadius: 30, // Bien rond
    width: '80%',
    alignItems: 'center',
    elevation: 5, // Ombre Android
    shadowColor: colors.primary, // Ombre iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  skipButton: {
      position: 'absolute',
      top: 60,
      right: 30,
      zIndex: 100
  },
  skipText: {
      color: '#bdc3c7',
      fontSize: 16,
      fontWeight: '500'
  }
});

export default OnboardingScreen;