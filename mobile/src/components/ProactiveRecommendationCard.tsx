/**
 * Composant pour afficher une recommandation proactive
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ProactiveRecommendation, RecommendationAction } from '../types/optimization';

interface Props {
  recommendation: ProactiveRecommendation;
  onAction: (action: RecommendationAction) => void;
  onDismiss: () => void;
}

export const ProactiveRecommendationCard: React.FC<Props> = ({
  recommendation,
  onAction,
  onDismiss,
}) => {
  const getPriorityColor = () => {
    switch (recommendation.priority) {
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
    switch (recommendation.type) {
      case 'create_list':
        return '📝';
      case 'add_location':
        return '📍';
      case 'set_reminder':
        return '⏰';
      case 'group_tasks':
        return '📦';
      case 'reschedule':
        return '📅';
      case 'add_details':
        return '✏️';
      case 'use_template':
        return '📋';
      default:
        return '💡';
    }
  };

  return (
    <View style={[styles.container, { borderLeftColor: getPriorityColor() }]}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.icon}>{getTypeIcon()}</Text>
        <Text style={styles.title}>{recommendation.title}</Text>
        {recommendation.dismissable && (
          <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Message */}
      <Text style={styles.message}>{recommendation.message}</Text>

      {/* Actions */}
      {recommendation.actions.length > 0 && (
        <View style={styles.actions}>
          {recommendation.actions.map((action, index) => {
            const isDismiss = action.type === 'dismiss';

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.actionButton,
                  isDismiss ? styles.dismissButton : styles.primaryButton,
                ]}
                onPress={() => (isDismiss ? onDismiss() : onAction(action))}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    isDismiss
                      ? styles.dismissButtonText
                      : styles.primaryButtonText,
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    fontSize: 24,
    marginRight: 10,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  message: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  dismissButton: {
    backgroundColor: '#F3F4F6',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  dismissButtonText: {
    color: '#6B7280',
  },
});
