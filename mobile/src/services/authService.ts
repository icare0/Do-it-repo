import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { apiService } from './api';
import { useAuthStore } from '@/store/authStore';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

// Get Google Web Client ID from environment variables
const GOOGLE_WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId || '731566945558-7232om519vm0ivgvour2mh7b5n83ju39.apps.googleusercontent.com';

class AuthService {
  async initialize() {
    try {
      useAuthStore.getState().setLoading(true);

      // Configure Google Sign In
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
        forceCodeForRefreshToken: true,
      });

      console.log('🔧 Google Sign-In configured');

      // Check if user is already logged in
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      const userStr = await AsyncStorage.getItem(USER_KEY);

      if (token && refreshToken && userStr) {
        const user = JSON.parse(userStr);
        useAuthStore.getState().setUser(user);
        useAuthStore.getState().setTokens(token, refreshToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      return false;
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  }

  async loginWithEmail(email: string, password: string) {
    try {
      const response = await apiService.login(email, password);
      await this.saveAuthData(response.token, response.refreshToken, response.user);
      return response.user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async registerWithEmail(email: string, password: string, name: string) {
    try {
      const response = await apiService.register(email, password, name);
      await this.saveAuthData(response.token, response.refreshToken, response.user);
      return response.user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async loginWithGoogle() {
    try {
      console.log('🚀 Starting Google Sign-In...');

      // Configure Google Sign-In une seule fois
      GoogleSignin.configure({
        webClientId: '731566945558-7232om519vm0ivgvour2mh7b5n83ju39.apps.googleusercontent.com',
        offlineAccess: true,
        forceCodeForRefreshToken: true,
      });
      console.log('🔧 Google Sign-In configured');

      // Vérifie la disponibilité de Google Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('✅ Google Play Services available');

      // Sign out préalable si déjà connecté
      const alreadySignedIn = await GoogleSignin.isSignedIn();
      if (alreadySignedIn) {
        console.log('🔄 User already signed in, signing out...');
        await GoogleSignin.signOut();
      }

      // Lancement du login Google
      const userInfo = await GoogleSignin.signIn();
      console.log('👤 Google Sign-In successful:', userInfo.user.email);

      const { idToken } = userInfo;
      if (!idToken) throw new Error('❌ No ID token received from Google Sign-In');

      console.log('🔑 ID Token received, signing in with Firebase...');

      // Firebase credential
      const credential = auth.GoogleAuthProvider.credential(idToken);
      const firebaseUser = await auth().signInWithCredential(credential);
      console.log('✅ Firebase authentication successful:', firebaseUser.user.email);

      // Envoi à ton backend
      const response = await apiService.loginWithGoogle(idToken);
      console.log('✅ Backend authentication successful');

      // Sauvegarde des tokens et de l’utilisateur
      await this.saveAuthData(response.token, response.refreshToken, response.user);
      console.log('💾 Auth data saved in AsyncStorage');

      return response.user;
    } catch (error: any) {
      console.error('❌ Google Sign-In Error:', error);

      if (error.code) {
        switch (error.code) {
          case 'SIGN_IN_CANCELLED': throw new Error('Connexion annulée');
          case 'IN_PROGRESS': throw new Error('Connexion en cours...');
          case 'PLAY_SERVICES_NOT_AVAILABLE': throw new Error('Google Play Services non disponible');
          case 'SIGN_IN_REQUIRED': throw new Error('Veuillez vous connecter à nouveau');
          case 'DEVELOPER_ERROR':
          case '10': throw new Error('Configuration Google incorrecte. Contactez le développeur.');
          default: throw new Error(`Erreur Google Sign-In (${error.code}): ${error.message}`);
        }
      }

      // Gestion générique
      throw this.handleAuthError(error);
    }
  }


  async logout() {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      await this.clearAuthData();

      // Sign out from Google
      try {
        if (await GoogleSignin.isSignedIn()) {
          await GoogleSignin.signOut();
          console.log('🔄 Google Sign-Out successful');
        }
      } catch (error) {
        console.error('Google sign-out error:', error);
      }
    }
  }

  async refreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) throw new Error('No refresh token');

      // The API service interceptor handles this automatically
      return true;
    } catch (error) {
      await this.clearAuthData();
      return false;
    }
  }

  private async saveAuthData(token: string, refreshToken: string, user: any) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

    useAuthStore.getState().setUser(user);
    useAuthStore.getState().setTokens(token, refreshToken);
  }

  private async clearAuthData() {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
    useAuthStore.getState().logout();
  }

  private handleAuthError(error: any): Error {
    if (error.response) {
      return new Error(error.response.data.message || 'Authentication failed');
    }
    return new Error(error.message || 'An error occurred');
  }
}

export const authService = new AuthService();