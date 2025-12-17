import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useThemeStore } from '@/store/themeStore';
import { getTheme } from '@/theme';
import { authService } from '@/services/authService';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const isDark = colorScheme === 'dark';

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleEmailLogin() {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      await authService.loginWithEmail(email, password);
      setShowEmailModal(false);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Échec de la connexion');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setLoading(true);
      await authService.loginWithGoogle();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Échec de la connexion Google');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Background with abstract shapes */}
      <LinearGradient
        colors={isDark
          ? ['#0f172a', '#1e293b', '#334155']
          : ['#667eea', '#764ba2', '#f093fb']
        }
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Abstract geometric shapes */}
      <View style={styles.shapesContainer}>
        {/* Large circle */}
        <View
          style={[
            styles.circle,
            styles.circleLarge,
            { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.2)' }
          ]}
        />
        {/* Medium circle */}
        <View
          style={[
            styles.circle,
            styles.circleMedium,
            { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.15)' }
          ]}
        />
        {/* Small circle */}
        <View
          style={[
            styles.circle,
            styles.circleSmall,
            { backgroundColor: isDark ? 'rgba(236, 72, 153, 0.15)' : 'rgba(255, 255, 255, 0.25)' }
          ]}
        />
        {/* Squares */}
        <View
          style={[
            styles.square,
            styles.squareTop,
            { backgroundColor: isDark ? 'rgba(34, 211, 238, 0.1)' : 'rgba(255, 255, 255, 0.1)' }
          ]}
        />
        <View
          style={[
            styles.square,
            styles.squareBottom,
            { backgroundColor: isDark ? 'rgba(251, 146, 60, 0.1)' : 'rgba(255, 255, 255, 0.15)' }
          ]}
        />
      </View>

      {/* Blur overlay */}
      <BlurView intensity={isDark ? 50 : 70} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject}>
        <SafeAreaView style={styles.overlay}>
          <View style={styles.loginContainer}>
            {/* Logo and Title */}
            <View style={styles.logoContainer}>
              <View style={[styles.logo, {
                backgroundColor: '#fff',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 12,
              }]}>
                <Ionicons name="checkmark-done" size={44} color={theme.colors.primary} />
              </View>
              <Text style={[styles.title, { color: '#fff' }]}>Do'It</Text>
              <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.9)' }]}>
                Organisez votre vie simplement
              </Text>
            </View>

            {/* Login Card */}
            <View style={[styles.loginCard, {
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.95)',
            }]}>
              {/* Google Login */}
              <TouchableOpacity
                style={[styles.googleButton, {
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                }]}
                onPress={handleGoogleLogin}
                disabled={loading}
              >
                <Ionicons name="logo-google" size={24} color="#EA4335" />
                <Text style={[styles.googleButtonText, { color: '#1a1a2e' }]}>
                  Continuer avec Google
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]} />
                <Text style={[styles.dividerText, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }]}>
                  ou
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]} />
              </View>

              {/* Email Login */}
              <TouchableOpacity
                style={[styles.emailButton, {
                  backgroundColor: theme.colors.primary,
                }]}
                onPress={() => setShowEmailModal(true)}
                disabled={loading}
              >
                <Ionicons name="mail-outline" size={22} color="#fff" />
                <Text style={[styles.emailButtonText, { color: '#fff' }]}>
                  Se connecter avec Email
                </Text>
              </TouchableOpacity>

              {/* Register Link */}
              <View style={styles.registerContainer}>
                <Text style={[styles.registerText, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }]}>
                  Pas de compte ?{' '}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register' as never)}>
                  <Text style={[styles.registerLink, {
                    color: theme.colors.primary,
                    fontWeight: '700',
                  }]}>
                    Créer un compte
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </BlurView>

      {/* Email Login Modal */}
      <Modal
        visible={showEmailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEmailModal(false)}
      >
        <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <View style={[styles.modalContent, {
              backgroundColor: isDark ? '#1e293b' : '#fff',
            }]}>
              {/* Handle bar */}
              <View style={styles.modalHandleContainer}>
                <View style={[styles.modalHandle, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                }]} />
              </View>

              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#1a1a2e' }]}>
                  Connexion Email
                </Text>
                <TouchableOpacity
                  onPress={() => setShowEmailModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close-circle" size={32} color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} />
                </TouchableOpacity>
              </View>

              {/* Form */}
              <View style={styles.modalForm}>
                <Input
                  label="Email"
                  placeholder="votre@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={<Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} />}
                />

                <Input
                  label="Mot de passe"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} />}
                />

                <Button
                  title="Se connecter"
                  onPress={handleEmailLogin}
                  loading={loading}
                  fullWidth
                  style={{ marginTop: 16 }}
                />

                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
                    Mot de passe oublié ?
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shapesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
  },
  circleLarge: {
    width: 400,
    height: 400,
    top: -100,
    right: -100,
  },
  circleMedium: {
    width: 280,
    height: 280,
    bottom: -80,
    left: -60,
  },
  circleSmall: {
    width: 180,
    height: 180,
    top: height * 0.4,
    right: -40,
  },
  square: {
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
  },
  squareTop: {
    width: 120,
    height: 120,
    top: height * 0.15,
    left: 40,
  },
  squareBottom: {
    width: 90,
    height: 90,
    bottom: height * 0.25,
    right: 60,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loginContainer: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  loginCard: {
    width: '100%',
    padding: 28,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    fontWeight: '500',
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalKeyboardView: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHandleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  modalForm: {
    gap: 16,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 12,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
