import * as tf from '@tensorflow/tfjs';

// Define explicit types instead of 'any'
export interface LayerData {
  name: string;
  type: string;
  shape: number[];
  weights?: Float32Array; // Flattened weights
  activation?: string;
}

export class CNNEngine {
  private model: tf.LayersModel | null = null;

  /**
   * Loads a model safely with error handling.
   * @param modelUrl URL to the model.json
   */
  async loadModel(modelUrl: string): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(modelUrl);
      console.log(`[CNNEngine] Model loaded: ${this.model.name}`);
    } catch (error) {
      console.error(`[CNNEngine] Failed to load model:`, error);
      throw new Error(`Could not load model from ${modelUrl}`);
    }
  }

  /**
   * Extracts layer structure efficiently using tf.tidy to prevent leaks.
   */
  getLayerArchitecture(): LayerData[] {
    if (!this.model) {
      console.warn('[CNNEngine] Model not loaded yet.');
      return [];
    }

    // tf.tidy executes the function and then cleans up all intermediate tensors
    return tf.tidy(() => {
      return this.model!.layers.map(layer => {
        let weightsData: Float32Array | undefined;
        
        // Defensive check for weights
        const weights = layer.getWeights();
        if (weights && weights.length > 0) {
            // We usually want the kernel, usually the first weight tensor
            // synchonous dataSync() is okay for small visualization data, 
            // but prefer data() (async) for large models in production.
            weightsData = weights[0].dataSync() as Float32Array; 
        }

        return {
          name: layer.name,
          type: layer.getClassName(),
          shape: layer.outputShape as number[],
          weights: weightsData,
          activation: (layer as any).activation?.constructor?.name // Safer access
        };
      });
    });
  }

  /**
   * Manual cleanup method to be called when component unmounts
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      console.log('[CNNEngine] Model disposed.');
    }
  }
}
