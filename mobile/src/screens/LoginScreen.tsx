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
      {/* Background mockup */}
      <View style={styles.backgroundMockup}>
        <LinearGradient
          colors={isDark ? ['#1a1a2e', '#16213e', '#0f3460'] : ['#E3F2FD', '#BBDEFB', '#90CAF9']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Mockup content - simulating the main app view */}
        <SafeAreaView style={styles.mockupContent}>
          <View style={styles.mockupHeader}>
            <Text style={[styles.mockupHeaderText, { color: isDark ? '#fff' : '#1a1a2e' }]}>
              Aujourd'hui
            </Text>
            <View style={styles.mockupHeaderIcons}>
              <Ionicons name="notifications-outline" size={24} color={isDark ? '#fff' : '#1a1a2e'} />
            </View>
          </View>

          <View style={styles.mockupTasks}>
            {[1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  styles.mockupTask,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.7)' },
                ]}
              >
                <View style={[styles.mockupCheckbox, { borderColor: isDark ? '#fff' : '#1a1a2e' }]} />
                <View style={styles.mockupTaskContent}>
                  <View
                    style={[
                      styles.mockupTaskTitle,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' },
                    ]}
                  />
                  <View
                    style={[
                      styles.mockupTaskSubtitle,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </SafeAreaView>
      </View>

      {/* Blur overlay */}
      <BlurView intensity={isDark ? 40 : 60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject}>
        <SafeAreaView style={styles.overlay}>
          <View style={styles.loginContainer}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={[styles.logo, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="checkmark-done" size={40} color="#fff" />
              </View>
              <Text style={[styles.title, { color: isDark ? '#fff' : '#1a1a2e' }]}>Bienvenue</Text>
              <Text style={[styles.subtitle, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }]}>
                Connectez-vous pour continuer
              </Text>
            </View>

            {/* Login options */}
            <View style={styles.loginOptions}>
              {/* Google Login */}
              <TouchableOpacity
                style={[styles.googleButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)' }]}
                onPress={handleGoogleLogin}
                disabled={loading}
              >
                <Ionicons name="logo-google" size={24} color={theme.colors.primary} />
                <Text style={[styles.googleButtonText, { color: isDark ? '#fff' : '#1a1a2e' }]}>
                  Continuer avec Google
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]} />
                <Text style={[styles.dividerText, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
                  ou
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]} />
              </View>

              {/* Email Login */}
              <TouchableOpacity
                style={[styles.emailButton, { borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }]}
                onPress={() => setShowEmailModal(true)}
                disabled={loading}
              >
                <Ionicons name="mail-outline" size={24} color={isDark ? '#fff' : '#1a1a2e'} />
                <Text style={[styles.emailButtonText, { color: isDark ? '#fff' : '#1a1a2e' }]}>
                  Se connecter avec Email
                </Text>
              </TouchableOpacity>

              {/* Register Link */}
              <View style={styles.registerContainer}>
                <Text style={[styles.registerText, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }]}>
                  Pas de compte ?{' '}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register' as never)}>
                  <Text style={[styles.registerLink, { color: theme.colors.primary }]}>
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
        <BlurView intensity={isDark ? 40 : 60} tint={isDark ? 'dark' : 'light'} style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <View style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a2e' : '#fff' }]}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#1a1a2e' }]}>
                  Connexion
                </Text>
                <TouchableOpacity onPress={() => setShowEmailModal(false)}>
                  <Ionicons name="close" size={28} color={isDark ? '#fff' : '#1a1a2e'} />
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
                  style={{ marginTop: 8 }}
                />
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
  backgroundMockup: {
    flex: 1,
  },
  mockupContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mockupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  mockupHeaderText: {
    fontSize: 28,
    fontWeight: '700',
  },
  mockupHeaderIcons: {
    flexDirection: 'row',
  },
  mockupTasks: {
    marginTop: 20,
  },
  mockupTask: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  mockupCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
  },
  mockupTaskContent: {
    flex: 1,
  },
  mockupTaskTitle: {
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
    width: '80%',
  },
  mockupTaskSubtitle: {
    height: 12,
    borderRadius: 4,
    width: '50%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loginContainer: {
    width: '100%',
    maxWidth: 400,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  loginOptions: {
    width: '100%',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalKeyboardView: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  modalForm: {
    gap: 16,
  },
});
