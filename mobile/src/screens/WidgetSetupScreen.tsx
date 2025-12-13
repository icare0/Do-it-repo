/**
 * Widget Setup Screen
 * Shows available widgets and instructions for adding them
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { getTheme } from '@/theme';

interface WidgetInfo {
  id: string;
  name: string;
  description: string;
  sizes: string[];
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const WIDGETS: WidgetInfo[] = [
  {
    id: 'today',
    name: "Tâches du Jour",
    description: "Affiche vos tâches d'aujourd'hui avec progression",
    sizes: ['Petit', 'Moyen', 'Grand'],
    icon: 'calendar',
    color: '#3B82F6',
  },
  {
    id: 'next-task',
    name: 'Prochaine Tâche',
    description: 'Affiche votre tâche la plus urgente',
    sizes: ['Petit'],
    icon: 'alarm',
    color: '#EF4444',
  },
  {
    id: 'stats',
    name: 'Statistiques',
    description: 'Affiche vos statistiques de productivité',
    sizes: ['Moyen'],
    icon: 'stats-chart',
    color: '#9C27B0',
  },
  {
    id: 'suggestions',
    name: 'Assistant Intelligent',
    description: "Affiche les suggestions d'optimisation",
    sizes: ['Moyen'],
    icon: 'bulb',
    color: '#6366F1',
  },
];

const WidgetSetupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);
  const isDark = colorScheme === 'dark';

  const getInstructions = (): string[] => {
    if (Platform.OS === 'ios') {
      return [
        "Appuyez longuement sur l'écran d'accueil",
        'Touchez le bouton + en haut à gauche',
        'Recherchez "Do-It"',
        'Sélectionnez le widget souhaité',
        'Choisissez la taille et touchez "Ajouter"',
        'Positionnez le widget où vous le souhaitez',
      ];
    } else {
      return [
        "Appuyez longuement sur l'écran d'accueil",
        'Touchez "Widgets"',
        'Recherchez "Do-It" dans la liste',
        'Appuyez longuement sur le widget souhaité',
        "Faites-le glisser vers l'emplacement désiré",
        'Relâchez pour placer le widget',
      ];
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Widgets
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Introduction */}
        <View style={[styles.introCard, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
          <View style={[styles.introIcon, { backgroundColor: theme.colors.primary + '15' }]}>
            <Ionicons name="apps" size={32} color={theme.colors.primary} />
          </View>
          <Text style={[styles.introTitle, { color: theme.colors.text }]}>
            Ajoutez des widgets à votre écran d'accueil
          </Text>
          <Text style={[styles.introDescription, { color: theme.colors.textSecondary }]}>
            Gardez un œil sur vos tâches et statistiques directement depuis votre écran d'accueil
          </Text>
        </View>

        {/* Available Widgets */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Widgets Disponibles
          </Text>

          {WIDGETS.map((widget) => (
            <View
              key={widget.id}
              style={[
                styles.widgetCard,
                {
                  backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                  borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                },
              ]}
            >
              <View style={[styles.widgetIcon, { backgroundColor: widget.color + '15' }]}>
                <Ionicons name={widget.icon} size={28} color={widget.color} />
              </View>
              <View style={styles.widgetInfo}>
                <Text style={[styles.widgetName, { color: theme.colors.text }]}>
                  {widget.name}
                </Text>
                <Text style={[styles.widgetDescription, { color: theme.colors.textSecondary }]}>
                  {widget.description}
                </Text>
                <View style={styles.sizeBadges}>
                  {widget.sizes.map((size) => (
                    <View
                      key={size}
                      style={[
                        styles.sizeBadge,
                        { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
                      ]}
                    >
                      <Text style={[styles.sizeBadgeText, { color: theme.colors.textSecondary }]}>
                        {size}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Comment ajouter un widget
          </Text>

          <View
            style={[
              styles.instructionsCard,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
              },
            ]}
          >
            {getInstructions().map((instruction, index) => (
              <View key={index} style={styles.instructionRow}>
                <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={[styles.instructionText, { color: theme.colors.text }]}>
                  {instruction}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Astuces
          </Text>

          <View
            style={[
              styles.tipCard,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
                borderColor: theme.colors.primary + '30',
              },
            ]}
          >
            <Ionicons name="bulb" size={20} color={theme.colors.primary} />
            <Text style={[styles.tipText, { color: theme.colors.text }]}>
              Les widgets se mettent à jour automatiquement toutes les 15-30 minutes
            </Text>
          </View>

          <View
            style={[
              styles.tipCard,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
                borderColor: theme.colors.primary + '30',
              },
            ]}
          >
            <Ionicons name="hand-left" size={20} color={theme.colors.primary} />
            <Text style={[styles.tipText, { color: theme.colors.text }]}>
              Touchez un widget pour ouvrir l'app directement à la section correspondante
            </Text>
          </View>

          <View
            style={[
              styles.tipCard,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
                borderColor: theme.colors.primary + '30',
              },
            ]}
          >
            <Ionicons name="resize" size={20} color={theme.colors.primary} />
            <Text style={[styles.tipText, { color: theme.colors.text }]}>
              {Platform.OS === 'ios'
                ? 'Appuyez longuement sur un widget pour modifier sa taille'
                : 'Certains widgets peuvent être redimensionnés après placement'}
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  introCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  introDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  widgetCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  widgetIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  widgetInfo: {
    flex: 1,
  },
  widgetName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  widgetDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  sizeBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  sizeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sizeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  instructionsCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 28,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
});

export default WidgetSetupScreen;
