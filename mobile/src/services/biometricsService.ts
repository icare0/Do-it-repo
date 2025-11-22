import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRICS_ENABLED_KEY = 'biometrics_enabled';
const APP_LOCKED_KEY = 'app_locked';

export interface BiometricCapabilities {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  biometricType: 'faceid' | 'touchid' | 'fingerprint' | 'none';
}

class BiometricsService {
  private enabled: boolean = false;
  private appLocked: boolean = false;

  async initialize(): Promise<void> {
    try {
      const [enabledStored, lockedStored] = await Promise.all([
        AsyncStorage.getItem(BIOMETRICS_ENABLED_KEY),
        AsyncStorage.getItem(APP_LOCKED_KEY),
      ]);

      this.enabled = enabledStored === 'true';
      this.appLocked = lockedStored === 'true';
    } catch (error) {
      console.error('Error loading biometrics settings:', error);
    }
  }

  async getCapabilities(): Promise<BiometricCapabilities> {
    try {
      const [hasHardware, isEnrolled, supportedTypes] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
      ]);

      let biometricType: BiometricCapabilities['biometricType'] = 'none';

      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'faceid';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = 'touchid';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricType = 'fingerprint';
      }

      return {
        hasHardware,
        isEnrolled,
        supportedTypes,
        biometricType,
      };
    } catch (error) {
      console.error('Error getting biometric capabilities:', error);
      return {
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
        biometricType: 'none',
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    const capabilities = await this.getCapabilities();
    return capabilities.hasHardware && capabilities.isEnrolled;
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.enabled = enabled;
    await AsyncStorage.setItem(BIOMETRICS_ENABLED_KEY, enabled.toString());
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async setAppLocked(locked: boolean): Promise<void> {
    this.appLocked = locked;
    await AsyncStorage.setItem(APP_LOCKED_KEY, locked.toString());
  }

  isAppLocked(): boolean {
    return this.appLocked && this.enabled;
  }

  async authenticate(options?: {
    promptMessage?: string;
    cancelLabel?: string;
    fallbackLabel?: string;
    disableDeviceFallback?: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        return { success: false, error: 'Biométrie non disponible' };
      }

      const capabilities = await this.getCapabilities();
      const biometricName = capabilities.biometricType === 'faceid' ? 'Face ID' :
                           capabilities.biometricType === 'touchid' ? 'Touch ID' : 'Empreinte digitale';

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: options?.promptMessage || `Déverrouiller avec ${biometricName}`,
        cancelLabel: options?.cancelLabel || 'Annuler',
        fallbackLabel: options?.fallbackLabel || 'Utiliser le code',
        disableDeviceFallback: options?.disableDeviceFallback ?? false,
      });

      if (result.success) {
        return { success: true };
      }

      let errorMessage = 'Authentification échouée';
      if (result.error === 'user_cancel') {
        errorMessage = 'Authentification annulée';
      } else if (result.error === 'user_fallback') {
        errorMessage = 'Code de secours demandé';
      } else if (result.error === 'lockout') {
        errorMessage = 'Trop de tentatives, réessayez plus tard';
      }

      return { success: false, error: errorMessage };
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return { success: false, error: 'Erreur d\'authentification' };
    }
  }

  async unlockApp(): Promise<boolean> {
    if (!this.enabled || !this.appLocked) {
      return true;
    }

    const result = await this.authenticate({
      promptMessage: 'Déverrouillez Do\'It',
    });

    return result.success;
  }

  getBiometricIcon(type: BiometricCapabilities['biometricType']): string {
    switch (type) {
      case 'faceid':
        return 'scan-outline';
      case 'touchid':
      case 'fingerprint':
        return 'finger-print-outline';
      default:
        return 'lock-closed-outline';
    }
  }

  getBiometricName(type: BiometricCapabilities['biometricType']): string {
    switch (type) {
      case 'faceid':
        return 'Face ID';
      case 'touchid':
        return 'Touch ID';
      case 'fingerprint':
        return 'Empreinte digitale';
      default:
        return 'Biométrie';
    }
  }
}

export const biometricsService = new BiometricsService();
