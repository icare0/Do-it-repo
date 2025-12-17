/**
 * Intent Classifier using TensorFlow.js
 * Classifies user intent from natural language input
 */

import * as tf from '@tensorflow/tfjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRAINING_DATA, INTENT_LABELS, CATEGORY_MAPPING } from './trainingData';
import { vocabularyBuilder } from './vocabularyBuilder';
import { IntentPrediction, TrainingExample } from './types';

const MODEL_STORAGE_KEY = '@ai_intent_model';
const MODEL_METADATA_KEY = '@ai_intent_metadata';

export class IntentClassifier {
  private model: tf.LayersModel | null = null;
  private vocabulary: Map<string, number> = new Map();
  private readonly vocabularySize = 500;
  private readonly intentLabels = INTENT_LABELS;
  private isInitialized = false;
  private isTraining = false;

  /**
   * Initialize the classifier
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🧠 Initializing Intent Classifier...');

    try {
      // Load vocabulary
      await this.loadVocabulary();

      // Try to load existing model
      const modelLoaded = await this.loadModel();

      if (!modelLoaded) {
        // Create and train new model
        console.log('📚 No existing model found. Training new model...');
        await this.trainNewModel();
      }

      this.isInitialized = true;
      console.log('✅ Intent Classifier initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Intent Classifier:', error);
      // Fallback: create basic model
      this.model = this.createModel();
      this.isInitialized = true;
    }
  }

  /**
   * Load vocabulary from storage or build new one
   */
  private async loadVocabulary(): Promise<void> {
    try {
      const storedVocab = await AsyncStorage.getItem('@ai_vocabulary');
      if (storedVocab) {
        const vocabData = JSON.parse(storedVocab);
        this.vocabulary = new Map(vocabData);
        console.log(`📚 Loaded vocabulary: ${this.vocabulary.size} words`);
      } else {
        // Build new vocabulary
        this.vocabulary = vocabularyBuilder.build();
        await AsyncStorage.setItem('@ai_vocabulary', JSON.stringify(Array.from(this.vocabulary.entries())));
      }
    } catch (error) {
      console.error('Error loading vocabulary:', error);
      this.vocabulary = vocabularyBuilder.build();
    }
  }

  /**
   * Create the neural network model
   */
  private createModel(): tf.LayersModel {
    const model = tf.sequential();

    // Input layer: Bag of words (500 features)
    model.add(tf.layers.dense({
      inputShape: [this.vocabularySize],
      units: 128,
      activation: 'relu',
      kernelInitializer: 'heNormal'
    }));

    // Dropout for regularization
    model.add(tf.layers.dropout({ rate: 0.3 }));

    // Hidden layer
    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      kernelInitializer: 'heNormal'
    }));

    model.add(tf.layers.dropout({ rate: 0.2 }));

    // Output layer: Intent probabilities
    model.add(tf.layers.dense({
      units: this.intentLabels.length,
      activation: 'softmax'
    }));

    // Compile model
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    console.log('🏗️ Model created:');
    model.summary();

    return model;
  }

  /**
   * Train a new model with the training dataset
   */
  private async trainNewModel(): Promise<void> {
    if (this.isTraining) {
      console.log('⏳ Training already in progress...');
      return;
    }

    this.isTraining = true;

    try {
      // Create model
      this.model = this.createModel();

      // Prepare training data
      const { inputs, labels } = this.prepareTrainingData(TRAINING_DATA);

      console.log('🏋️ Training model...');
      console.log(`Training samples: ${TRAINING_DATA.length}`);

      // Train model
      const history = await this.model.fit(inputs, labels, {
        epochs: 50,
        batchSize: 16,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(`Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}, accuracy = ${logs?.acc.toFixed(4)}`);
            }
          }
        }
      });

      // Cleanup tensors
      inputs.dispose();
      labels.dispose();

      const finalAccuracy = history.history.acc[history.history.acc.length - 1];
      console.log(`✅ Training complete! Final accuracy: ${(finalAccuracy * 100).toFixed(2)}%`);

      // Save model
      await this.saveModel();

    } catch (error) {
      console.error('❌ Error training model:', error);
      throw error;
    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Prepare training data as tensors
   */
  private prepareTrainingData(examples: TrainingExample[]): {
    inputs: tf.Tensor2D;
    labels: tf.Tensor2D;
  } {
    const inputVectors: number[][] = [];
    const labelVectors: number[][] = [];

    for (const example of examples) {
      // Convert text to vector
      const vector = this.textToVector(example.text);
      inputVectors.push(vector);

      // Create one-hot label
      const intentIndex = this.intentLabels.indexOf(example.intent);
      if (intentIndex === -1) {
        console.warn(`Unknown intent: ${example.intent}`);
        continue;
      }

      const oneHot = new Array(this.intentLabels.length).fill(0);
      oneHot[intentIndex] = 1;
      labelVectors.push(oneHot);
    }

    const inputs = tf.tensor2d(inputVectors);
    const labels = tf.tensor2d(labelVectors);

    return { inputs, labels };
  }

  /**
   * Convert text to bag-of-words vector
   */
  private textToVector(text: string): number[] {
    const vector = new Array(this.vocabularySize).fill(0);
    const words = this.tokenize(text);

    for (const word of words) {
      const index = this.vocabulary.get(word);
      if (index !== undefined && index < this.vocabularySize) {
        vector[index] = 1; // Binary bag of words
      }
    }

    return vector;
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  /**
   * Predict intent from text
   */
  async predict(text: string): Promise<IntentPrediction> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.model) {
      throw new Error('Model not initialized');
    }

    // Convert text to vector
    const vector = this.textToVector(text);
    const input = tf.tensor2d([vector]);

    // Make prediction
    const prediction = this.model.predict(input) as tf.Tensor;
    const probabilities = await prediction.data();

    // Cleanup tensors
    input.dispose();
    prediction.dispose();

    // Find top predictions
    const results: Array<{ intent: string; confidence: number }> = [];
    const probMap: { [intent: string]: number } = {};

    for (let i = 0; i < this.intentLabels.length; i++) {
      const intent = this.intentLabels[i];
      const confidence = probabilities[i];
      probMap[intent] = confidence;
      results.push({ intent, confidence });
    }

    // Sort by confidence
    results.sort((a, b) => b.confidence - a.confidence);

    const topIntent = results[0];

    return {
      intent: topIntent.intent,
      confidence: topIntent.confidence,
      probabilities: probMap,
      alternatives: results.slice(1, 4) // Top 3 alternatives
    };
  }

  /**
   * Get category from intent
   */
  getCategory(intent: string): string {
    return CATEGORY_MAPPING[intent] || 'personnel';
  }

  /**
   * Learn from user feedback
   */
  async learnFromFeedback(text: string, correctIntent: string): Promise<void> {
    if (!this.isInitialized || !this.model) {
      await this.initialize();
    }

    console.log(`📖 Learning from feedback: "${text}" → ${correctIntent}`);

    // Create training example
    const vector = this.textToVector(text);
    const input = tf.tensor2d([vector]);

    const intentIndex = this.intentLabels.indexOf(correctIntent);
    if (intentIndex === -1) {
      console.warn(`Unknown intent for learning: ${correctIntent}`);
      return;
    }

    const oneHot = new Array(this.intentLabels.length).fill(0);
    oneHot[intentIndex] = 1;
    const label = tf.tensor2d([oneHot]);

    // Fine-tune model with this example
    await this.model!.fit(input, label, {
      epochs: 5,
      verbose: 0
    });

    // Cleanup tensors
    input.dispose();
    label.dispose();

    // Save updated model
    await this.saveModel();

    console.log('✅ Learning complete, model updated');
  }

  /**
   * Save model to storage
   */
  private async saveModel(): Promise<void> {
    if (!this.model) return;

    try {
      // TensorFlow.js doesn't support AsyncStorage directly on React Native
      // We'll need to use a custom handler or IndexedDB wrapper
      // For now, we'll save metadata only
      const metadata = {
        savedAt: new Date().toISOString(),
        intentLabels: this.intentLabels,
        vocabularySize: this.vocabularySize
      };

      await AsyncStorage.setItem(MODEL_METADATA_KEY, JSON.stringify(metadata));
      console.log('💾 Model metadata saved');

      // TODO: Implement model weights saving for React Native
      // This would require a custom storage handler
    } catch (error) {
      console.error('Error saving model:', error);
    }
  }

  /**
   * Load model from storage
   */
  private async loadModel(): Promise<boolean> {
    try {
      const metadata = await AsyncStorage.getItem(MODEL_METADATA_KEY);
      if (!metadata) {
        return false;
      }

      // TODO: Load model weights from storage
      // For now, return false to trigger training
      return false;
    } catch (error) {
      console.error('Error loading model:', error);
      return false;
    }
  }

  /**
   * Retrain model with additional examples
   */
  async retrain(additionalExamples: TrainingExample[]): Promise<void> {
    const allExamples = [...TRAINING_DATA, ...additionalExamples];
    const { inputs, labels } = this.prepareTrainingData(allExamples);

    console.log(`🔄 Retraining with ${allExamples.length} examples...`);

    await this.model!.fit(inputs, labels, {
      epochs: 30,
      batchSize: 16,
      validationSplit: 0.2,
      shuffle: true
    });

    inputs.dispose();
    labels.dispose();

    await this.saveModel();
    console.log('✅ Retraining complete');
  }

  /**
   * Get model accuracy on test data
   */
  async evaluateAccuracy(testExamples: TrainingExample[]): Promise<number> {
    if (!this.model) return 0;

    const { inputs, labels } = this.prepareTrainingData(testExamples);

    const result = await this.model.evaluate(inputs, labels) as tf.Scalar[];
    const accuracy = await result[1].data();

    inputs.dispose();
    labels.dispose();
    result.forEach(r => r.dispose());

    return accuracy[0];
  }

  /**
   * Reset model (for testing or debugging)
   */
  async reset(): Promise<void> {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }

    await AsyncStorage.removeItem(MODEL_METADATA_KEY);
    await AsyncStorage.removeItem(MODEL_STORAGE_KEY);
    this.isInitialized = false;

    console.log('🔄 Model reset');
  }
}

// Singleton instance
export const intentClassifier = new IntentClassifier();
