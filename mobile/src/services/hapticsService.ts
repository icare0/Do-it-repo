import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HAPTICS_ENABLED_KEY = 'haptics_enabled';

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

  // Light feedback - for subtle interactions like hover
  async light(): Promise<void> {
    if (!this.enabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  // Medium feedback - for standard button presses
  async medium(): Promise<void> {
    if (!this.enabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  // Heavy feedback - for significant actions like delete
  async heavy(): Promise<void> {
    if (!this.enabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  // Success feedback - task completion, achievements
  async success(): Promise<void> {
    if (!this.enabled) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  // Warning feedback - important alerts
  async warning(): Promise<void> {
    if (!this.enabled) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  // Error feedback - validation errors, failed actions
  async error(): Promise<void> {
    if (!this.enabled) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  // Selection feedback - scrolling through pickers, toggles
  async selection(): Promise<void> {
    if (!this.enabled) return;
    await Haptics.selectionAsync();
  }

  // Custom patterns for special interactions
  async taskComplete(): Promise<void> {
    if (!this.enabled) return;
    // Double tap pattern for task completion
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise(resolve => setTimeout(resolve, 100));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async swipeAction(): Promise<void> {
    if (!this.enabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async buttonPress(): Promise<void> {
    if (!this.enabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  async tabSwitch(): Promise<void> {
    if (!this.enabled) return;
    await Haptics.selectionAsync();
  }
}

export const hapticsService = new HapticsService();
