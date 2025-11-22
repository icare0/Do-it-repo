import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Card } from '@/components/ui/Card';
import { useThemeStore } from '@/store/themeStore';
import { useNotificationStore, NotificationSettings } from '@/store/notificationStore';
import { getTheme } from '@/theme';
import { hapticsService } from '@/services/hapticsService';
import { notificationService } from '@/services/notificationService';

const REMINDER_OPTIONS = [
  { label: '5 minutes', value: 5 },
  { label: '10 minutes', value: 10 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 heure', value: 60 },
  { label: '2 heures', value: 120 },
];

const RADIUS_OPTIONS = [
  { label: '50 mètres', value: 50 },
  { label: '100 mètres', value: 100 },
  { label: '200 mètres', value: 200 },
  { label: '500 mètres', value: 500 },
  { label: '1 kilomètre', value: 1000 },
];

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const { settings, updateSettings } = useNotificationStore();
  const [showTimePicker, setShowTimePicker] = useState<'briefing' | 'quietStart' | 'quietEnd' | null>(null);

  const handleToggle = async (key: keyof NotificationSettings, value: boolean) => {
    await hapticsService.selection();
    updateSettings({ [key]: value });

    // Request permissions if enabling notifications
    if (key === 'enabled' && value) {
      const granted = await notificationService.requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permission requise',
          'Veuillez activer les notifications dans les paramètres de votre appareil.',
          [{ text: 'OK' }]
        );
        updateSettings({ enabled: false });
      }
    }
  };

  const handleTimeChange = (type: 'briefing' | 'quietStart' | 'quietEnd', date?: Date) => {
    if (date) {
      const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

      switch (type) {
        case 'briefing':
          updateSettings({ dailyBriefingTime: timeStr });
          break;
        case 'quietStart':
          updateSettings({ quietHoursStart: timeStr });
          break;
        case 'quietEnd':
          updateSettings({ quietHoursEnd: timeStr });
          break;
      }
    }
    setShowTimePicker(null);
  };

  const parseTime = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const showOptionsPicker = (
    title: string,
    options: { label: string; value: number }[],
    currentValue: number,
    onSelect: (value: number) => void
  ) => {
    Alert.alert(
      title,
      '',
      [
        ...options.map((option) => ({
          text: option.label + (option.value === currentValue ? ' ✓' : ''),
          onPress: () => {
            hapticsService.selection();
            onSelect(option.value);
          },
        })),
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const SettingRow = ({
    icon,
    label,
    description,
    value,
    onValueChange,
  }: {
    icon: string;
    label: string;
    description?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.settingRow}>
      <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.primary}15` }]}>
        <Ionicons name={icon as any} size={20} color={theme.colors.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{label}</Text>
        {description && (
          <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );

  const OptionRow = ({
    icon,
    label,
    value,
    onPress,
  }: {
    icon: string;
    label: string;
    value: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.secondary}15` }]}>
        <Ionicons name={icon as any} size={20} color={theme.colors.secondary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{label}</Text>
      </View>
      <View style={styles.optionValue}>
        <Text style={[styles.optionValueText, { color: theme.colors.textSecondary }]}>{value}</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Paramètres notifications
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* General */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Général</Text>
          <Card>
            <SettingRow
              icon="notifications-outline"
              label="Notifications"
              description="Activer toutes les notifications"
              value={settings.enabled}
              onValueChange={(v) => handleToggle('enabled', v)}
            />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <SettingRow
              icon="volume-high-outline"
              label="Son"
              value={settings.sound}
              onValueChange={(v) => handleToggle('sound', v)}
            />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <SettingRow
              icon="phone-portrait-outline"
              label="Vibration"
              value={settings.vibration}
              onValueChange={(v) => handleToggle('vibration', v)}
            />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <SettingRow
              icon="ellipse-outline"
              label="Badge"
              description="Afficher le nombre de notifications"
              value={settings.badge}
              onValueChange={(v) => handleToggle('badge', v)}
            />
          </Card>
        </View>

        {/* Types de notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Types de notifications</Text>
          <Card>
            <SettingRow
              icon="alarm-outline"
              label="Rappels de tâches"
              description="Rappels avant les tâches programmées"
              value={settings.taskReminders}
              onValueChange={(v) => handleToggle('taskReminders', v)}
            />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <SettingRow
              icon="location-outline"
              label="Rappels de proximité"
              description="Notifications basées sur la localisation"
              value={settings.locationReminders}
              onValueChange={(v) => handleToggle('locationReminders', v)}
            />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <SettingRow
              icon="sunny-outline"
              label="Briefing matinal"
              description="Résumé quotidien de vos tâches"
              value={settings.dailyBriefing}
              onValueChange={(v) => handleToggle('dailyBriefing', v)}
            />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <SettingRow
              icon="trophy-outline"
              label="Accomplissements"
              description="Badges et récompenses"
              value={settings.achievements}
              onValueChange={(v) => handleToggle('achievements', v)}
            />
          </Card>
        </View>

        {/* Horaires */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Horaires</Text>
          <Card>
            <OptionRow
              icon="time-outline"
              label="Heure du briefing"
              value={settings.dailyBriefingTime}
              onPress={() => setShowTimePicker('briefing')}
            />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <OptionRow
              icon="timer-outline"
              label="Rappel avant tâche"
              value={REMINDER_OPTIONS.find((o) => o.value === settings.reminderMinutes)?.label || '15 minutes'}
              onPress={() =>
                showOptionsPicker(
                  'Rappel avant tâche',
                  REMINDER_OPTIONS,
                  settings.reminderMinutes,
                  (v) => updateSettings({ reminderMinutes: v })
                )
              }
            />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <OptionRow
              icon="navigate-outline"
              label="Rayon de proximité"
              value={RADIUS_OPTIONS.find((o) => o.value === settings.locationRadius)?.label || '100 mètres'}
              onPress={() =>
                showOptionsPicker(
                  'Rayon de proximité',
                  RADIUS_OPTIONS,
                  settings.locationRadius,
                  (v) => updateSettings({ locationRadius: v })
                )
              }
            />
          </Card>
        </View>

        {/* Mode silencieux */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Mode silencieux</Text>
          <Card>
            <SettingRow
              icon="moon-outline"
              label="Heures silencieuses"
              description="Pas de notifications pendant ces heures"
              value={settings.quietHoursEnabled}
              onValueChange={(v) => handleToggle('quietHoursEnabled', v)}
            />
            {settings.quietHoursEnabled && (
              <>
                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                <OptionRow
                  icon="arrow-forward-outline"
                  label="Début"
                  value={settings.quietHoursStart}
                  onPress={() => setShowTimePicker('quietStart')}
                />
                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                <OptionRow
                  icon="arrow-back-outline"
                  label="Fin"
                  value={settings.quietHoursEnd}
                  onPress={() => setShowTimePicker('quietEnd')}
                />
              </>
            )}
          </Card>
        </View>

        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: `${theme.colors.info}10`, borderColor: `${theme.colors.info}30` }]}>
          <Ionicons name="information-circle" size={20} color={theme.colors.info} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Les paramètres de notification s'appliquent à toutes les notifications de l'app.
            Vous pouvez aussi gérer les notifications dans les paramètres système.
          </Text>
        </View>
      </ScrollView>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={parseTime(
            showTimePicker === 'briefing'
              ? settings.dailyBriefingTime
              : showTimePicker === 'quietStart'
              ? settings.quietHoursStart
              : settings.quietHoursEnd
          )}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={(_, date) => handleTimeChange(showTimePicker, date)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  optionValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  optionValueText: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginLeft: 48,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
