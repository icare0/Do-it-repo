import AsyncStorage from '@react-native-async-storage/async-storage';

const HAPTICS_ENABLED_KEY = 'haptics_enabled';

// Dynamic import to handle missing native module
let Haptics: typeof import('expo-haptics') | null = null;

async function loadHaptics() {
  try {
    Haptics = await import('expo-haptics');
  } catch (error) {
    console.warn('expo-haptics not available (requires dev build)');
    Haptics = null;
  }
}

// Initialize haptics on module load
loadHaptics();

class HapticsService {
  private enabled: boolean = true;

  async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(HAPTICS_ENABLED_KEY);
      this.enabled = stored !== 'false';
    } catch (error) {
      console.error('Error loading haptics settings:', error);
    }
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.enabled = enabled;
    await AsyncStorage.setItem(HAPTICS_ENABLED_KEY, enabled.toString());
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  isAvailable(): boolean {
    return Haptics !== null;
  }

  // Light feedback - for subtle interactions like hover
  async light(): Promise<void> {
    if (!this.enabled || !Haptics) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Silently fail if haptics unavailable
    }
  }

  // Medium feedback - for standard button presses
  async medium(): Promise<void> {
    if (!this.enabled || !Haptics) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Silently fail
    }
  }

  // Heavy feedback - for significant actions like delete
  async heavy(): Promise<void> {
    if (!this.enabled || !Haptics) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      // Silently fail
    }
  }

  // Success feedback - task completion, achievements
  async success(): Promise<void> {
    if (!this.enabled || !Haptics) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Silently fail
    }
  }

  // Warning feedback - important alerts
  async warning(): Promise<void> {
    if (!this.enabled || !Haptics) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      // Silently fail
    }
  }

  // Error feedback - validation errors, failed actions
  async error(): Promise<void> {
    if (!this.enabled || !Haptics) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      // Silently fail
    }
  }

  // Selection feedback - scrolling through pickers, toggles
  async selection(): Promise<void> {
    if (!this.enabled || !Haptics) return;
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      // Silently fail
    }
  }

  // Custom patterns for special interactions
  async taskComplete(): Promise<void> {
    if (!this.enabled || !Haptics) return;
    try {
      // Double tap pattern for task completion
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await new Promise(resolve => setTimeout(resolve, 100));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Silently fail
    }
  }

  async swipeAction(): Promise<void> {
    if (!this.enabled || !Haptics) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Silently fail
    }
  }

  async buttonPress(): Promise<void> {
    if (!this.enabled || !Haptics) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Silently fail
    }
  }

  async tabSwitch(): Promise<void> {
    if (!this.enabled || !Haptics) return;
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      // Silently fail
    }
  }
}

export const hapticsService = new HapticsService();
