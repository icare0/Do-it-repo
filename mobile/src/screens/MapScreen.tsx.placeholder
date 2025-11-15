import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { getTheme } from '@/theme';

const MapScreen: React.FC = () => {
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Carte
      </Text>
      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
        La fonctionnalité de carte sera disponible prochainement.
      </Text>
      <Text style={[styles.info, { color: theme.colors.textTertiary }]}>
        Cette fonctionnalité nécessite react-native-maps qui sera ajouté dans une prochaine version.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  info: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default MapScreen;
