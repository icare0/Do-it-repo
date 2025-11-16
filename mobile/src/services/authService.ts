import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';
import { useAuthStore } from '@/store/authStore';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

class AuthService {
  async initialize() {
    try {
      // Configure Google Sign In
      GoogleSignin.configure({
        webClientId: '1:731566945558:web:5b800388f785d4a972cc37',
      });

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
      console.error('Auth initialization error:', error);
      return false;
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
      // Check if device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Get user info
      const { idToken } = await GoogleSignin.signIn();

      if (!idToken) throw new Error('No ID token received');

      // Send to backend
      const response = await apiService.loginWithGoogle(idToken);
      await this.saveAuthData(response.token, response.refreshToken, response.user);
      return response.user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async loginWithApple() {
    try {
      // Apple Sign In logic will be implemented
      // This requires iOS-specific configuration
      throw new Error('Apple Sign In not yet implemented');
    } catch (error) {
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
      if (await GoogleSignin.isSignedIn()) {
        await GoogleSignin.signOut();
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
