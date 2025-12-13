/**
 * Composant pour afficher une suggestion d'optimisation
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { OptimizationSuggestion } from '../types/optimization';

interface Props {
  suggestion: OptimizationSuggestion;
  onAccept: () => void;
  onReject: () => void;
}

export const OptimizationSuggestionCard: React.FC<Props> = ({
  suggestion,
  onAccept,
  onReject,
}) => {
  const getPriorityColor = () => {
    switch (suggestion.priority) {
      case 'critical':
        return '#EF4444';
      case 'high':
        return '#F59E0B';
      case 'medium':
        return '#3B82F6';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getTypeIcon = () => {
    switch (suggestion.type) {
      case 'reschedule':
        return '📅';
      case 'reorder':
        return '🔄';
      case 'group':
        return '📦';
      case 'split':
        return '✂️';
      case 'combine':
        return '🔗';
      case 'skip':
        return '⏭️';
      default:
        return '💡';
    }
  };

  const formatImpact = () => {
    const parts: string[] = [];

    if (suggestion.impact.timeSaved) {
      parts.push(`⏱️ ${suggestion.impact.timeSaved} min`);
    }

    if (suggestion.impact.distanceSaved) {
      const km = (suggestion.impact.distanceSaved / 1000).toFixed(1);
      parts.push(`🚗 ${km} km`);
    }

    if (suggestion.impact.energySaved) {
      parts.push(`⚡ ${suggestion.impact.energySaved}% énergie`);
    }

    if (suggestion.impact.stressReduced) {
      parts.push(`😌 ${suggestion.impact.stressReduced}% stress`);
    }

    return parts.join('  •  ');
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[styles.container, { borderLeftColor: getPriorityColor() }]}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.icon}>{getTypeIcon()}</Text>
        <View style={styles.headerText}>
          <Text style={styles.title}>{suggestion.title}</Text>
          <Text style={styles.confidence}>
            Confiance: {suggestion.confidence}%
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.reason}>{suggestion.reason}</Text>

      {/* Changements proposés */}
      {suggestion.proposedChanges.newStartTime && (
        <View style={styles.change}>
          <Text style={styles.changeLabel}>🕐 Nouveau horaire:</Text>
          <Text style={styles.changeValue}>
            {formatTime(suggestion.proposedChanges.newStartTime)}
          </Text>
        </View>
      )}

      {suggestion.proposedChanges.newLocation && (
        <View style={styles.change}>
          <Text style={styles.changeLabel}>📍 Nouveau lieu:</Text>
          <Text style={styles.changeValue}>
            {suggestion.proposedChanges.newLocation.name}
          </Text>
        </View>
      )}

      {/* Impact */}
      {formatImpact() && (
        <View style={styles.impact}>
          <Text style={styles.impactText}>{formatImpact()}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={onReject}
        >
          <Text style={styles.rejectButtonText}>❌ Non</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={onAccept}
        >
          <Text style={styles.acceptButtonText}>✅ Appliquer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  confidence: {
    fontSize: 12,
    color: '#6B7280',
  },
  reason: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  change: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
  },
  changeLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 8,
  },
  changeValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  impact: {
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
  },
  impactText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  rejectButton: {
    backgroundColor: '#F3F4F6',
  },
  rejectButtonText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 14,
  },
});
