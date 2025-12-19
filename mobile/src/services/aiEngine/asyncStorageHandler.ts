/**
 * Custom IOHandler for TensorFlow.js to save/load models in AsyncStorage
 * Allows persistent model storage in React Native
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from '@tensorflow/tfjs';
import { Buffer } from 'buffer';

const MODEL_WEIGHTS_KEY = '@ai_model_weights';
const MODEL_TOPOLOGY_KEY = '@ai_model_topology';

export class AsyncStorageHandler implements io.IOHandler {
  constructor(private modelName: string) {}

  async save(modelArtifacts: io.ModelArtifacts): Promise<io.SaveResult> {
    try {
      // Save model topology (architecture)
      const topology = {
        modelTopology: modelArtifacts.modelTopology,
        weightsManifest: modelArtifacts.weightsManifest,
        format: modelArtifacts.format,
        generatedBy: modelArtifacts.generatedBy,
        convertedBy: modelArtifacts.convertedBy,
      };

      await AsyncStorage.setItem(
        `${MODEL_TOPOLOGY_KEY}_${this.modelName}`,
        JSON.stringify(topology)
      );

      // Save weights (convert ArrayBuffer to base64 using Buffer polyfill)
      if (modelArtifacts.weightData) {
        const weightData = modelArtifacts.weightData;
        const base64Weights = Buffer.from(weightData).toString('base64');

        await AsyncStorage.setItem(
          `${MODEL_WEIGHTS_KEY}_${this.modelName}`,
          base64Weights
        );
      }

      console.log(`✅ Model "${this.modelName}" saved successfully`);

      return {
        modelArtifactsInfo: {
          dateSaved: new Date(),
          modelTopologyType: 'JSON',
          weightDataBytes: modelArtifacts.weightData?.byteLength,
        },
      };
    } catch (error) {
      console.error('Error saving model:', error);
      throw error;
    }
  }

  async load(): Promise<io.ModelArtifacts> {
    try {
      // Load topology
      const topologyStr = await AsyncStorage.getItem(
        `${MODEL_TOPOLOGY_KEY}_${this.modelName}`
      );

      if (!topologyStr) {
        throw new Error(`Model "${this.modelName}" not found in storage`);
      }

      const topology = JSON.parse(topologyStr);

      // Load weights
      const base64Weights = await AsyncStorage.getItem(
        `${MODEL_WEIGHTS_KEY}_${this.modelName}`
      );

      if (!base64Weights) {
        throw new Error(`Model weights for "${this.modelName}" not found`);
      }

      const weightData = Buffer.from(base64Weights, 'base64').buffer;

      console.log(`✅ Model "${this.modelName}" loaded successfully`);

      return {
        modelTopology: topology.modelTopology,
        weightsManifest: topology.weightsManifest,
        format: topology.format,
        generatedBy: topology.generatedBy,
        convertedBy: topology.convertedBy,
        weightData,
      };
    } catch (error) {
      console.error('Error loading model:', error);
      throw error;
    }
  }
}

/**
 * Create an IOHandler for AsyncStorage
 */
export function asyncStorageIO(modelName: string): io.IOHandler {
  return new AsyncStorageHandler(modelName);
}
