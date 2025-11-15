import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';
import { useAuthStore } from '@/store/authStore';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

class AuthService {
  async initialize() {
    try {
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
      // TODO: Implement Google Sign-In when ready
      // For now, return a mock error
      throw new Error('Google Sign-In not yet configured. Please use email/password login.');
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async logout() {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
      useAuthStore.getState().logout();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const response = await apiService.refreshToken(refreshToken);
      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      useAuthStore.getState().setTokens(response.token, refreshToken);
      return response.token;
    } catch (error) {
      // If refresh fails, logout user
      await this.logout();
      throw error;
    }
  }

  async resetPassword(email: string) {
    try {
      await apiService.resetPassword(email);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async updateProfile(updates: { name?: string; email?: string }) {
    try {
      const response = await apiService.updateProfile(updates);
      const userStr = await AsyncStorage.getItem(USER_KEY);
      if (userStr) {
        const user = JSON.parse(userStr);
        const updatedUser = { ...user, ...response.user };
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        useAuthStore.getState().setUser(updatedUser);
      }
      return response.user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async deleteAccount() {
    try {
      await apiService.deleteAccount();
      await this.logout();
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  private async saveAuthData(token: string, refreshToken: string, user: any) {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      [REFRESH_TOKEN_KEY, refreshToken],
      [USER_KEY, JSON.stringify(user)],
    ]);

    useAuthStore.getState().setUser(user);
    useAuthStore.getState().setTokens(token, refreshToken);
  }

  private handleAuthError(error: any): Error {
    if (error?.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    if (error?.message) {
      return new Error(error.message);
    }
    return new Error('Une erreur est survenue lors de l\'authentification');
  }
}

export const authService = new AuthService();
