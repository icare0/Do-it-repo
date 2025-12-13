/**
 * Écran Smart Assistant - Affiche les suggestions d'optimisation et recommandations
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useOptimizationStore } from '../store/optimizationStore';
import { useTaskStore } from '../store/taskStore';
import { OptimizationSuggestionCard } from '../components/OptimizationSuggestionCard';
import { ProactiveRecommendationCard } from '../components/ProactiveRecommendationCard';
import taskOptimizationService from '../services/taskOptimizationService';
import proactiveRecommendationService from '../services/proactiveRecommendationService';
import habitLearningService from '../services/habitLearningService';
import { RecommendationAction } from '../types/optimization';

export const SmartAssistantScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    suggestions,
    recommendations,
    stats,
    optimizationEnabled,
    setSuggestions,
    setRecommendations,
    acceptSuggestion,
    rejectSuggestion,
    removeSuggestion,
    removeRecommendation,
    markRecommendationAsViewed,
  } = useOptimizationStore();

  const { tasks } = useTaskStore();

  // Charger les suggestions et recommandations au montage
  useEffect(() => {
    loadSuggestionsAndRecommendations();
  }, []);

  // Marquer les recommandations comme vues
  useEffect(() => {
    recommendations
      .filter((r) => !r.viewedAt)
      .forEach((r) => markRecommendationAsViewed(r.id));
  }, [recommendations]);

  const loadSuggestionsAndRecommendations = async () => {
    if (!optimizationEnabled) return;

    setIsLoading(true);

    try {
      // 1. Analyser les habitudes utilisateur
      const completedTasks = tasks.filter((t) => t.completed);
      await habitLearningService.analyzeUserPatterns(completedTasks);

      // 2. Générer les recommandations proactives
      const newRecommendations = await proactiveRecommendationService.analyzeAndRecommend(
        tasks
      );
      setRecommendations(newRecommendations);

      // 3. Générer les suggestions d'optimisation
      // (pour l'instant, on va simplifier sans contexte complet)
      // Dans une vraie implémentation, on récupèrerait la localisation, météo, etc.

    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSuggestionsAndRecommendations();
    setIsRefreshing(false);
  };

  const handleAcceptSuggestion = async (suggestionId: string) => {
    acceptSuggestion(suggestionId);

    // TODO: Appliquer les changements proposés aux tâches
    // Pour l'instant, on supprime juste la suggestion après un délai
    setTimeout(() => {
      removeSuggestion(suggestionId);
    }, 2000);
  };

  const handleRejectSuggestion = (suggestionId: string) => {
    rejectSuggestion(suggestionId);

    // Supprimer la suggestion après un délai
    setTimeout(() => {
      removeSuggestion(suggestionId);
    }, 1000);
  };

  const handleRecommendationAction = async (
    recommendationId: string,
    action: RecommendationAction
  ) => {
    // TODO: Implémenter les actions spécifiques
    // Pour l'instant, on supprime juste la recommandation

    switch (action.type) {
      case 'use_template':
        console.log('Apply template:', action.templateId);
        break;
      case 'add_location':
        console.log('Add location:', action.data);
        break;
      case 'set_reminder':
        console.log('Set reminder:', action.data);
        break;
      case 'group_tasks':
        console.log('Group tasks:', action.data);
        break;
      case 'auto_reschedule':
        console.log('Auto reschedule');
        break;
    }

    // Marquer comme actionnée et supprimer
    await proactiveRecommendationService.markAsActed(recommendationId);
    removeRecommendation(recommendationId);
  };

  const handleDismissRecommendation = async (recommendationId: string) => {
    await proactiveRecommendationService.dismissRecommendation(recommendationId);
    removeRecommendation(recommendationId);
  };

  // Filtrer les suggestions/recommandations actives
  const activeSuggestions = suggestions.filter(
    (s) => !s.acceptedAt && !s.rejectedAt
  );
  const activeRecommendations = recommendations.filter(
    (r) => !r.actedAt && (!r.expiresAt || r.expiresAt > new Date())
  );

  const totalActive = activeSuggestions.length + activeRecommendations.length;

  if (isLoading && totalActive === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Analyse en cours...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🤖 Assistant Intelligent</Text>
        <Text style={styles.headerSubtitle}>
          {totalActive > 0
            ? `${totalActive} suggestion${totalActive > 1 ? 's' : ''} disponible${totalActive > 1 ? 's' : ''}`
            : 'Aucune suggestion pour le moment'}
        </Text>
      </View>

      {/* Statistiques */}
      {stats.totalSuggestions > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.acceptedSuggestions}</Text>
            <Text style={styles.statLabel}>Acceptées</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.round(stats.totalTimeSaved)} min
            </Text>
            <Text style={styles.statLabel}>Gagnés</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {(stats.totalDistanceSaved / 1000).toFixed(1)} km
            </Text>
            <Text style={styles.statLabel}>Économisés</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.round(stats.acceptanceRate * 100)}%
            </Text>
            <Text style={styles.statLabel}>Taux</Text>
          </View>
        </View>
      )}

      {/* Liste des suggestions et recommandations */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#3B82F6']}
          />
        }
      >
        {totalActive === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>✨</Text>
            <Text style={styles.emptyStateTitle}>
              Tout est optimisé !
            </Text>
            <Text style={styles.emptyStateText}>
              Votre planning est bien organisé. L'assistant vous alertera s'il détecte des améliorations possibles.
            </Text>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
            >
              <Text style={styles.refreshButtonText}>🔄 Actualiser</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Suggestions d'optimisation */}
            {activeSuggestions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  💡 Suggestions d'optimisation
                </Text>
                {activeSuggestions.map((suggestion) => (
                  <OptimizationSuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onAccept={() => handleAcceptSuggestion(suggestion.id)}
                    onReject={() => handleRejectSuggestion(suggestion.id)}
                  />
                ))}
              </View>
            )}

            {/* Recommandations proactives */}
            {activeRecommendations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  📋 Recommandations
                </Text>
                {activeRecommendations.map((recommendation) => (
                  <ProactiveRecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    onAction={(action) =>
                      handleRecommendationAction(recommendation.id, action)
                    }
                    onDismiss={() =>
                      handleDismissRecommendation(recommendation.id)
                    }
                  />
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    height: 40,
  },
});
