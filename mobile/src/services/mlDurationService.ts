/**
 * Service de Machine Learning avec TensorFlow Lite
 * 100% GRATUIT - Prédiction de durée de tâches
 *
 * Note: TensorFlow.js est gratuit et open source (Apache 2.0)
 * Pas de coûts d'API, tout fonctionne localement
 */

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { Task } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MODEL_CACHE_KEY = 'ml_duration_model';
const TRAINING_DATA_KEY = 'ml_training_data';
const MIN_TRAINING_SAMPLES = 20;

interface TrainingData {
  inputs: number[][]; // Features: [category_id, priority_id, hour, day_of_week, has_location]
  outputs: number[]; // Duration in minutes
}

interface PredictionFeatures {
  category: string;
  priority: 'low' | 'medium' | 'high';
  scheduledHour: number;
  dayOfWeek: number;
  hasLocation: boolean;
}

class MLDurationService {
  private model: tf.LayersModel | null = null;
  private isInitialized = false;
  private categoryMap: Map<string, number> = new Map();
  private priorityMap: Map<string, number> = new Map([
    ['low', 0],
    ['medium', 1],
    ['high', 2],
  ]);

  /**
   * Initialise TensorFlow et charge/crée le modèle
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      console.log('[MLDurationService] Initializing TensorFlow...');

      // Initialiser TensorFlow.js pour React Native
      await tf.ready();
      console.log('[MLDurationService] TensorFlow ready');

      // Essayer de charger un modèle existant
      const loaded = await this.loadModel();

      if (!loaded) {
        console.log('[MLDurationService] No existing model, creating new one');
        this.model = this.createModel();
      }

      this.isInitialized = true;
      console.log('[MLDurationService] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[MLDurationService] Initialization error:', error);
      return false;
    }
  }

  /**
   * Crée un modèle de réseau de neurones simple
   * Architecture: 5 inputs → 16 neurons → 8 neurons → 1 output
   */
  private createModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        // Input layer + première couche cachée
        tf.layers.dense({
          inputShape: [5], // 5 features
          units: 16,
          activation: 'relu',
          kernelInitializer: 'heNormal',
        }),

        // Dropout pour éviter l'overfitting
        tf.layers.dropout({ rate: 0.2 }),

        // Deuxième couche cachée
        tf.layers.dense({
          units: 8,
          activation: 'relu',
          kernelInitializer: 'heNormal',
        }),

        // Output layer
        tf.layers.dense({
          units: 1,
          activation: 'linear', // Régression (prédiction de nombre)
        }),
      ],
    });

    // Compiler le modèle
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae'], // Mean Absolute Error
    });

    console.log('[MLDurationService] Model created');
    model.summary();

    return model;
  }

  /**
   * Entraîne le modèle avec l'historique des tâches
   */
  async trainWithHistory(completedTasks: Task[]): Promise<{
    success: boolean;
    samplesUsed: number;
    loss?: number;
    mae?: number;
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.model) {
      return { success: false, samplesUsed: 0 };
    }

    try {
      // Filtrer les tâches avec durée
      const validTasks = completedTasks.filter(
        (t) => t.completed && t.duration && t.duration > 0 && t.updatedAt
      );

      if (validTasks.length < MIN_TRAINING_SAMPLES) {
        console.log(
          `[MLDurationService] Not enough samples (${validTasks.length}/${MIN_TRAINING_SAMPLES})`
        );
        return { success: false, samplesUsed: validTasks.length };
      }

      // Construire la map des catégories
      this.buildCategoryMap(validTasks);

      // Préparer les données d'entraînement
      const trainingData = this.prepareTrainingData(validTasks);

      // Créer les tensors
      const xs = tf.tensor2d(trainingData.inputs);
      const ys = tf.tensor1d(trainingData.outputs);

      console.log(
        `[MLDurationService] Training with ${trainingData.inputs.length} samples...`
      );

      // Entraîner le modèle
      const history = await this.model.fit(xs, ys, {
        epochs: 50,
        batchSize: 8,
        validationSplit: 0.2,
        shuffle: true,
        verbose: 0, // Pas de logs détaillés
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(
                `[MLDurationService] Epoch ${epoch}: loss=${logs?.loss.toFixed(4)}, mae=${logs?.mae.toFixed(2)} min`
              );
            }
          },
        },
      });

      // Nettoyer les tensors
      xs.dispose();
      ys.dispose();

      const finalLoss = history.history.loss[history.history.loss.length - 1] as number;
      const finalMae = history.history.mae[history.history.mae.length - 1] as number;

      console.log(
        `[MLDurationService] Training complete: MAE=${finalMae.toFixed(2)} minutes`
      );

      // Sauvegarder le modèle
      await this.saveModel();

      return {
        success: true,
        samplesUsed: trainingData.inputs.length,
        loss: finalLoss,
        mae: finalMae,
      };
    } catch (error) {
      console.error('[MLDurationService] Training error:', error);
      return { success: false, samplesUsed: 0 };
    }
  }

  /**
   * Prédit la durée d'une tâche
   */
  async predictDuration(features: PredictionFeatures): Promise<number | null> {
    if (!this.isInitialized || !this.model) {
      console.warn('[MLDurationService] Model not initialized');
      return null;
    }

    try {
      // Convertir les features en format numérique
      const categoryId = this.categoryMap.get(features.category) ?? 0;
      const priorityId = this.priorityMap.get(features.priority) ?? 1;

      const input = tf.tensor2d([
        [
          categoryId,
          priorityId,
          features.scheduledHour,
          features.dayOfWeek,
          features.hasLocation ? 1 : 0,
        ],
      ]);

      // Prédiction
      const prediction = this.model.predict(input) as tf.Tensor;
      const duration = (await prediction.data())[0];

      // Nettoyer
      input.dispose();
      prediction.dispose();

      // Arrondir et limiter entre 5 et 480 minutes
      const finalDuration = Math.max(5, Math.min(480, Math.round(duration)));

      console.log(
        `[MLDurationService] Predicted duration: ${finalDuration} min for category "${features.category}"`
      );

      return finalDuration;
    } catch (error) {
      console.error('[MLDurationService] Prediction error:', error);
      return null;
    }
  }

  /**
   * Obtient une suggestion de durée (ML ou fallback statistique)
   */
  async suggestDuration(
    task: {
      category?: string;
      priority: 'low' | 'medium' | 'high';
      startDate?: Date;
      location?: any;
    },
    historicalTasks: Task[]
  ): Promise<{
    duration: number;
    confidence: 'high' | 'medium' | 'low';
    method: 'ml' | 'statistics' | 'default';
  }> {
    const scheduledHour = task.startDate ? task.startDate.getHours() : 12;
    const dayOfWeek = task.startDate ? task.startDate.getDay() : new Date().getDay();

    // Essayer ML
    if (this.model && task.category) {
      const mlPrediction = await this.predictDuration({
        category: task.category,
        priority: task.priority,
        scheduledHour,
        dayOfWeek,
        hasLocation: !!task.location,
      });

      if (mlPrediction) {
        return {
          duration: mlPrediction,
          confidence: 'high',
          method: 'ml',
        };
      }
    }

    // Fallback: Statistiques simples
    if (task.category) {
      const similarTasks = historicalTasks.filter(
        (t) => t.category === task.category && t.completed && t.duration
      );

      if (similarTasks.length >= 3) {
        const avgDuration =
          similarTasks.reduce((sum, t) => sum + (t.duration || 0), 0) /
          similarTasks.length;

        return {
          duration: Math.round(avgDuration),
          confidence: 'medium',
          method: 'statistics',
        };
      }
    }

    // Default basé sur priorité
    const defaultDurations = {
      high: 60,
      medium: 30,
      low: 15,
    };

    return {
      duration: defaultDurations[task.priority],
      confidence: 'low',
      method: 'default',
    };
  }

  // ===== HELPERS =====

  /**
   * Construit la map des catégories
   */
  private buildCategoryMap(tasks: Task[]): void {
    const categories = new Set(
      tasks.map((t) => t.category).filter((c): c is string => !!c)
    );

    this.categoryMap.clear();
    Array.from(categories).forEach((category, index) => {
      this.categoryMap.set(category, index);
    });
  }

  /**
   * Prépare les données d'entraînement
   */
  private prepareTrainingData(tasks: Task[]): TrainingData {
    const inputs: number[][] = [];
    const outputs: number[] = [];

    for (const task of tasks) {
      if (!task.category || !task.duration || !task.updatedAt) continue;

      const categoryId = this.categoryMap.get(task.category) ?? 0;
      const priorityId = this.priorityMap.get(task.priority) ?? 1;
      const completedDate = new Date(task.updatedAt);
      const hour = completedDate.getHours();
      const dayOfWeek = completedDate.getDay();
      const hasLocation = !!task.location;

      inputs.push([categoryId, priorityId, hour, dayOfWeek, hasLocation ? 1 : 0]);
      outputs.push(task.duration);
    }

    return { inputs, outputs };
  }

  /**
   * Sauvegarde le modèle
   */
  private async saveModel(): Promise<void> {
    try {
      if (!this.model) return;

      // TensorFlow.js permet de sauvegarder dans IndexedDB/AsyncStorage
      // Pour React Native, on utilise une approche simplifiée
      const modelJSON = await this.model.toJSON();
      await AsyncStorage.setItem(MODEL_CACHE_KEY, JSON.stringify(modelJSON));

      console.log('[MLDurationService] Model saved');
    } catch (error) {
      console.error('[MLDurationService] Save error:', error);
    }
  }

  /**
   * Charge le modèle
   */
  private async loadModel(): Promise<boolean> {
    try {
      const modelJSON = await AsyncStorage.getItem(MODEL_CACHE_KEY);
      if (!modelJSON) return false;

      // Note: Le chargement complet du modèle depuis JSON nécessite plus de travail
      // Pour une vraie production, utiliser tf.loadLayersModel avec un handler custom
      // Pour l'instant, on crée un nouveau modèle à chaque fois

      return false; // Simplified: toujours créer un nouveau modèle
    } catch (error) {
      console.error('[MLDurationService] Load error:', error);
      return false;
    }
  }

  /**
   * Obtient les stats du modèle
   */
  getModelInfo(): {
    isInitialized: boolean;
    hasModel: boolean;
    categoriesCount: number;
  } {
    return {
      isInitialized: this.isInitialized,
      hasModel: !!this.model,
      categoriesCount: this.categoryMap.size,
    };
  }

  /**
   * Nettoie les ressources
   */
  async dispose(): Promise<void> {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.isInitialized = false;
    console.log('[MLDurationService] Disposed');
  }
}

export default new MLDurationService();
