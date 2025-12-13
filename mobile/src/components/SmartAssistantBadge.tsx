/**
 * Badge pour afficher le nombre de suggestions/recommandations non vues
 * À utiliser dans TodayScreen ou en en-tête
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSmartAssistant } from '../hooks/useSmartAssistant';

interface Props {
  variant?: 'compact' | 'full';
  onPress?: () => void;
}

export const SmartAssistantBadge: React.FC<Props> = ({
  variant = 'full',
  onPress,
}) => {
  const navigation = useNavigation();
  const { unviewedCount, isAnalyzing } = useSmartAssistant({
    autoAnalyze: false, // Pas d'analyse auto dans le badge
  });

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // @ts-ignore
      navigation.navigate('SmartAssistant');
    }
  };

  if (unviewedCount === 0 && !isAnalyzing) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <TouchableOpacity style={styles.compactContainer} onPress={handlePress}>
        <View style={styles.compactBadge}>
          <Text style={styles.compactBadgeText}>{unviewedCount}</Text>
        </View>
        <Text style={styles.compactIcon}>💡</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.content}>
        <Text style={styles.icon}>🤖</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {isAnalyzing
              ? 'Analyse en cours...'
              : `${unviewedCount} suggestion${unviewedCount > 1 ? 's' : ''}`}
          </Text>
          <Text style={styles.subtitle}>
            {isAnalyzing
              ? 'Optimisation du planning'
              : 'Appuyez pour voir'}
          </Text>
        </View>
        {unviewedCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unviewedCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  compactIcon: {
    fontSize: 16,
    marginLeft: 4,
  },
  compactBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginRight: 6,
  },
  compactBadgeText: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: '700',
  },
});
