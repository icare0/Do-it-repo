import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useThemeStore } from '@/store/themeStore';
import { getTheme } from '@/theme';
import { authService } from '@/services/authService';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      await authService.loginWithEmail(email, password);
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={[styles.logo, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="checkmark-done" size={48} color="#fff" />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Do'It
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Gérez votre vie en toute simplicité
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
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
              onPress={handleLogin}
              loading={loading}
              fullWidth
              style={{ marginTop: 8 }}
            />

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
                Mot de passe oublié ?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>
              ou
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          </View>

          {/* Social Login */}
          <View style={styles.socialContainer}>
{/* TEMPORAIREMENT DÉSACTIVÉ - On configure ça après
<Button
  title="Continuer avec Google"
  onPress={handleGoogleLogin}
  variant="outline"
  fullWidth
  icon={<Ionicons name="logo-google" size={20} color={theme.colors.primary} />}
/>
*/}
<Button
  title="🧪 TEST API"
  onPress={async () => {
    try {
      console.log('Test: http://192.168.1.59:3000/api/health');
      const response = await fetch('http://192.168.1.59:3000/api/health');
      const data = await response.json();
      Alert.alert('✅ Succès!', JSON.stringify(data, null, 2));
    } catch (error: any) {
      Alert.alert('❌ Erreur', error.message);
    }
  }}
  variant="outline"
  fullWidth
  style={{ marginTop: 16 }}
/>
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={[styles.registerText, { color: theme.colors.textSecondary }]}>
              Pas encore de compte ?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register' as never)}>
              <Text style={[styles.registerLink, { color: theme.colors.primary }]}>
                Créer un compte
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 24,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 12,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
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
  socialContainer: {
    marginBottom: 24,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
