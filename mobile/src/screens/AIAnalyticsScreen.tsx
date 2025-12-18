/**
 * AI Analytics Dashboard
 * Shows AI performance metrics and learned patterns
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

import { useThemeStore } from '@/store/themeStore';
import { getTheme } from '@/theme';
import { aiEngine, AccuracyMetrics, LearnedPattern } from '@/services/aiEngine';
import { unifiedLearningService } from '@/services/unifiedLearningService';
import { smartTaskService } from '@/services/smartTaskService';

const screenWidth = Dimensions.get('window').width;

export default function AIAnalyticsScreen() {
  const navigation = useNavigation();
  const { colorScheme } = useThemeStore();
  const theme = getTheme(colorScheme);

  const [metrics, setMetrics] = useState<AccuracyMetrics | null>(null);
  const [learnedPatterns, setLearnedPatterns] = useState<LearnedPattern[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [unifiedAnalytics, setUnifiedAnalytics] = useState<any>(null);
  const [smartEnrichments, setSmartEnrichments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'enrichments'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      await aiEngine.initialize();
      await smartTaskService.initialize();

      const metricsData = aiEngine.getMetrics();
      const patterns = aiEngine.getLearnedPatterns();
      const analytics = aiEngine.getAnalytics();
      const unified = unifiedLearningService.getUnifiedAnalytics();
      const enrichments = smartTaskService.getLearnedContexts();

      setMetrics(metricsData);
      setLearnedPatterns(patterns);
      setAnalyticsData(analytics);
      setUnifiedAnalytics(unified);
      setSmartEnrichments(enrichments);
    } catch (error) {
      console.error('Error loading AI analytics:', error);
      Alert.alert('Erreur', "Impossible de charger les analytics de l'IA");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePattern(key: string) {
    Alert.alert(
      'Supprimer le pattern',
      'Êtes-vous sûr de vouloir supprimer ce pattern appris ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await aiEngine.deleteLearnedPattern(key);
            await loadData();
          }
        }
      ]
    );
  }

  async function handleDeleteEnrichment(keyword: string) {
    Alert.alert(
      'Supprimer l\'enrichissement',
      `Voulez-vous que l'IA oublie "${keyword}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await smartTaskService.deleteEnrichment(keyword);
            await loadData();
          }
        }
      ]
    );
  }

  async function handleRetrain() {
    Alert.alert(
      'Réentraîner l\'IA',
      'L\'IA va être réentraînée avec vos corrections. Cela peut prendre quelques minutes.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Commencer',
          onPress: async () => {
            try {
              setLoading(true);
              await aiEngine.retrain();
              Alert.alert('Succès', 'L\'IA a été réentraînée avec succès !');
              await loadData();
            } catch (error) {
              Alert.alert('Erreur', 'Échec du réentraînement');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  }

  const MetricCard = ({ title, value, subtitle, icon, color }: any) => (
    <View style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.metricHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={[styles.metricTitle, { color: theme.colors.textSecondary }]}>
          {title}
        </Text>
      </View>
      <Text style={[styles.metricValue, { color: theme.colors.text }]}>
        {value}
      </Text>
      {subtitle && (
        <Text style={[styles.metricSubtitle, { color: theme.colors.textTertiary }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  const PatternItem = ({ pattern }: { pattern: LearnedPattern }) => (
    <View style={[styles.patternItem, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.patternContent}>
        <View style={styles.patternHeader}>
          <Text style={[styles.patternKey, { color: theme.colors.text }]}>
            {pattern.key}
          </Text>
          <View style={[styles.patternTypeBadge, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={[styles.patternType, { color: theme.colors.primary }]}>
              {pattern.type}
            </Text>
          </View>
        </View>

        {pattern.replacement && (
          <Text style={[styles.patternReplacement, { color: theme.colors.textSecondary }]}>
            → {typeof pattern.replacement === 'string' ? pattern.replacement : JSON.stringify(pattern.replacement)}
          </Text>
        )}

        <View style={styles.patternStats}>
          <Text style={[styles.patternStat, { color: theme.colors.textTertiary }]}>
            Utilisé {pattern.usageCount}x
          </Text>
          <Text style={[styles.patternStat, { color: theme.colors.textTertiary }]}>
            Confiance: {(pattern.confidence * 100).toFixed(0)}%
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => handleDeletePattern(pattern.key)}
        style={styles.deleteButton}
      >
        <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.loadingContainer}>
            <Text style={{ color: theme.colors.text }}>Chargement...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Analytics IA
          </Text>
          <TouchableOpacity onPress={handleRetrain} style={styles.retrainButton}>
            <Ionicons name="refresh" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Overall Metrics */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Performance Globale
            </Text>

            <View style={styles.metricsGrid}>
              <MetricCard
                title="Précision"
                value={metrics ? `${(metrics.overallAccuracy * 100).toFixed(1)}%` : '0%'}
                subtitle={`${metrics?.totalPredictions || 0} prédictions`}
                icon="checkmark-circle"
                color={theme.colors.success}
              />

              <MetricCard
                title="Taux d'apprentissage"
                value={metrics ? `${(metrics.learningRate * 100).toFixed(1)}%` : '0%'}
                subtitle="Amélioration"
                icon="trending-up"
                color={theme.colors.primary}
              />

              <MetricCard
                title="Corrections"
                value={metrics?.totalCorrections || 0}
                subtitle="Apprentissages"
                icon="school"
                color={theme.colors.accent}
              />

              <MetricCard
                title="Patterns appris"
                value={learnedPatterns.length}
                subtitle="Automatisés"
                icon="bulb"
                color={theme.colors.warning}
              />
            </View>
          </View>

          {/* Detailed Metrics */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Précision par Type
            </Text>

            <View style={styles.detailedMetrics}>
              <DetailedMetric
                label="Intention"
                value={metrics?.intentAccuracy || 0}
                theme={theme}
              />
              <DetailedMetric
                label="Temporel"
                value={metrics?.temporalAccuracy || 0}
                theme={theme}
              />
              <DetailedMetric
                label="Localisation"
                value={metrics?.locationAccuracy || 0}
                theme={theme}
              />
              <DetailedMetric
                label="Catégorie"
                value={metrics?.categoryAccuracy || 0}
                theme={theme}
              />
              <DetailedMetric
                label="Priorité"
                value={metrics?.priorityAccuracy || 0}
                theme={theme}
              />
            </View>
          </View>

          {/* Improvement Chart */}
          {analyticsData?.improvementOverTime && analyticsData.improvementOverTime.length > 1 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Amélioration dans le temps
              </Text>

              <LineChart
                data={{
                  labels: analyticsData.improvementOverTime.slice(-7).map((_: any, i: number) => `J${i + 1}`),
                  datasets: [{
                    data: analyticsData.improvementOverTime.slice(-7).map((d: any) => d.accuracy * 100)
                  }]
                }}
                width={screenWidth - 48}
                height={220}
                chartConfig={{
                  backgroundColor: theme.colors.surface,
                  backgroundGradientFrom: theme.colors.surface,
                  backgroundGradientTo: theme.colors.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(${colorScheme === 'dark' ? '100, 120, 255' : '50, 80, 200'}, ${opacity})`,
                  labelColor: (opacity = 1) => theme.colors.textSecondary,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: theme.colors.primary
                  }
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16
                }}
              />
            </View>
          )}

          {/* Unified Stats */}
          {unifiedAnalytics && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Apprentissage Unifié
              </Text>

              <View style={[styles.unifiedCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.unifiedRow}>
                  <Ionicons name="bulb" size={20} color={theme.colors.primary} />
                  <Text style={[styles.unifiedLabel, { color: theme.colors.textSecondary }]}>
                    Connaissances totales
                  </Text>
                  <Text style={[styles.unifiedValue, { color: theme.colors.text }]}>
                    {unifiedAnalytics.combined.totalLearnings}
                  </Text>
                </View>
                <View style={styles.unifiedRow}>
                  <Ionicons name="layers" size={20} color={theme.colors.success} />
                  <Text style={[styles.unifiedLabel, { color: theme.colors.textSecondary }]}>
                    Patterns IA
                  </Text>
                  <Text style={[styles.unifiedValue, { color: theme.colors.text }]}>
                    {unifiedAnalytics.ai.learnedPatterns}
                  </Text>
                </View>
                <View style={styles.unifiedRow}>
                  <Ionicons name="location" size={20} color={theme.colors.warning} />
                  <Text style={[styles.unifiedLabel, { color: theme.colors.textSecondary }]}>
                    Enrichissements
                  </Text>
                  <Text style={[styles.unifiedValue, { color: theme.colors.text }]}>
                    {unifiedAnalytics.smart.enrichments}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Smart Enrichments */}
          {smartEnrichments.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Enrichissements Contextuels ({smartEnrichments.length})
              </Text>

              <View style={styles.patternsList}>
                {smartEnrichments.map((enrichment, index) => (
                  <View key={index} style={[styles.patternItem, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.patternContent}>
                      <View style={styles.patternHeader}>
                        <Text style={[styles.patternKey, { color: theme.colors.text }]}>
                          {enrichment.keyword}
                        </Text>
                        <View style={[styles.patternTypeBadge, { backgroundColor: theme.colors.warning + '20' }]}>
                          <Text style={[styles.patternType, { color: theme.colors.warning }]}>
                            enrichment
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.patternReplacement, { color: theme.colors.textSecondary }]}>
                        → {enrichment.specificValue}
                      </Text>

                      <View style={styles.patternStats}>
                        <Text style={[styles.patternStat, { color: theme.colors.textTertiary }]}>
                          Utilisé {enrichment.usageCount}x
                        </Text>
                        {enrichment.location && (
                          <Text style={[styles.patternStat, { color: theme.colors.textTertiary }]}>
                            📍 {enrichment.location.name}
                          </Text>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDeleteEnrichment(enrichment.keyword)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Learned Patterns */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Patterns IA ({learnedPatterns.length})
            </Text>

            {learnedPatterns.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
                <Ionicons name="school-outline" size={48} color={theme.colors.textTertiary} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  L'IA n'a encore rien appris
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.colors.textTertiary }]}>
                  Créez des tâches et corrigez les erreurs pour que l'IA apprenne
                </Text>
              </View>
            ) : (
              <View style={styles.patternsList}>
                {learnedPatterns.map((pattern, index) => (
                  <PatternItem key={pattern.key} pattern={pattern} />
                ))}
              </View>
            )}
          </View>

          {/* Recent Predictions */}
          {analyticsData?.recentPredictions && analyticsData.recentPredictions.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Prédictions Récentes
              </Text>

              {analyticsData.recentPredictions.slice(0, 10).map((pred: any, index: number) => (
                <View key={index} style={[styles.predictionItem, { backgroundColor: theme.colors.surface }]}>
                  <View style={styles.predictionHeader}>
                    <Text style={[styles.predictionInput, { color: theme.colors.text }]}>
                      {pred.input}
                    </Text>
                    <Ionicons
                      name={pred.wasCorrect ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={pred.wasCorrect ? theme.colors.success : theme.colors.error}
                    />
                  </View>
                  <Text style={[styles.predictionTitle, { color: theme.colors.textSecondary }]}>
                    → {pred.prediction.title}
                  </Text>
                  <Text style={[styles.predictionConfidence, { color: theme.colors.textTertiary }]}>
                    Confiance: {(pred.prediction.confidence * 100).toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const DetailedMetric = ({ label, value, theme }: any) => (
  <View style={styles.detailedMetricRow}>
    <Text style={[styles.detailedMetricLabel, { color: theme.colors.textSecondary }]}>
      {label}
    </Text>
    <View style={styles.detailedMetricBar}>
      <View
        style={[
          styles.detailedMetricFill,
          {
            width: `${value * 100}%`,
            backgroundColor: theme.colors.primary
          }
        ]}
      />
    </View>
    <Text style={[styles.detailedMetricValue, { color: theme.colors.text }]}>
      {(value * 100).toFixed(0)}%
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  retrainButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
  },
  detailedMetrics: {
    gap: 16,
  },
  detailedMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailedMetricLabel: {
    width: 100,
    fontSize: 14,
  },
  detailedMetricBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  detailedMetricFill: {
    height: '100%',
    borderRadius: 4,
  },
  detailedMetricValue: {
    width: 50,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
  },
  patternsList: {
    gap: 12,
  },
  patternItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  patternContent: {
    flex: 1,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  patternKey: {
    fontSize: 16,
    fontWeight: '600',
  },
  patternTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  patternType: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  patternReplacement: {
    fontSize: 14,
    marginBottom: 8,
  },
  patternStats: {
    flexDirection: 'row',
    gap: 16,
  },
  patternStat: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  predictionItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionInput: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  predictionTitle: {
    fontSize: 13,
    marginBottom: 4,
  },
  predictionConfidence: {
    fontSize: 12,
  },
  unifiedCard: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  unifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unifiedLabel: {
    flex: 1,
    fontSize: 14,
  },
  unifiedValue: {
    fontSize: 16,
    fontWeight: '700',
  },
});
