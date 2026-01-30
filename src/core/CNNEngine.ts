import * as tf from '@tensorflow/tfjs';
import { MnistData } from './MnistData';

export interface LayerData {
  id: string;
  name: string;
  shape: number[];
  activations: Float32Array; // Flattened data for rendering
}

export class CNNEngine {
  private model: tf.Sequential | null = null;
  private debugModel: tf.LayersModel | null = null;

  constructor() {
    // defer initialization to allow async load
  }

  async initialize() {
    try {
      await this.loadModel();
      console.log("Model loaded from storage");
    } catch (e) {
      console.log("No saved model found, constructing new one");
      this.buildModel();
    }
  }

  private buildModel() {
    // Build a simple CNN model for MNIST (Input 28x28)
    this.model = tf.sequential();

    // Layer 1: Conv2D
    this.model.add(tf.layers.conv2d({
      inputShape: [28, 28, 1],
      kernelSize: 3,
      filters: 8,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }), // L2 Regularization
      name: 'conv2d_1'
    }));

    // Layer 2: MaxPooling
    this.model.add(tf.layers.maxPooling2d({
      poolSize: [2, 2],
      strides: [2, 2],
      name: 'maxpool_1'
    }));

    // Layer 3: Conv2D
    this.model.add(tf.layers.conv2d({
      kernelSize: 3,
      filters: 16,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }), // L2 Regularization
      name: 'conv2d_2'
    }));

    // Layer 4: Flatten
    this.model.add(tf.layers.flatten({ name: 'flatten' }));

    // Dropout
    this.model.add(tf.layers.dropout({ rate: 0.25 }));

    // Layer 5: Dense
    this.model.add(tf.layers.dense({
      units: 10,
      activation: 'softmax',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }), // L2 Regularization
      name: 'output'
    }));

    this.compileModel();
    this.updateDebugModel();
  }

  private compileModel() {
    this.model?.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });
  }

  private updateDebugModel() {
    if (this.model && this.model.inputs && this.model.layers) {
      const layers = this.model.layers;
      const symbolicOutputs = layers.map(l => l.output) as tf.SymbolicTensor[];
      this.debugModel = tf.model({
        inputs: this.model.inputs,
        outputs: symbolicOutputs
      });
    }
  }

  async train(onEpochEnd?: (epoch: number, logs: tf.Logs) => void) {
    if (!this.model) this.buildModel();

    const data = new MnistData();
    await data.load();

    const BATCH_SIZE = 64;
    const TRAIN_DATA_SIZE = 20000; // Increased dataset size
    const TEST_DATA_SIZE = 1000;

    const [trainXs, trainYs] = tf.tidy(() => {
      const d = data.nextTrainBatch(TRAIN_DATA_SIZE);
      const xReshaped = d.xs.reshape([TRAIN_DATA_SIZE, 28, 28, 1]);

      // Log training data sum to debug "loss=0"
      if (this.model) {
        console.log("DEBUG: Training Batch Sum:", d.xs.sum().dataSync()[0]);
      }

      return [
        xReshaped,
        d.ys
      ];
    });

    const [testXs, testYs] = tf.tidy(() => {
      const d = data.nextTestBatch(TEST_DATA_SIZE);
      return [
        d.xs.reshape([TEST_DATA_SIZE, 28, 28, 1]),
        d.ys
      ];
    });

    return this.model!.fit(trainXs, trainYs, {
      batchSize: BATCH_SIZE,
      validationData: [testXs, testYs],
      validationSplit: 0.1,
      epochs: 12,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (onEpochEnd && logs) onEpochEnd(epoch, logs);
        }
      }
    });
  }

  async saveModel() {
    if (!this.model) return;
    await this.model.save('downloads://model');
  }

  async loadModel() {
    // Try loading from public folder
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      // Ensure we don't have double slashes if basePath is empty or ends with /
      const modelPath = `${basePath}/model/model.json`;
      console.log(`Attempting to load model from: ${modelPath}`);
      this.model = await tf.loadLayersModel(modelPath) as tf.Sequential;
      this.compileModel();
      this.updateDebugModel();
    } catch (e) {
      throw new Error("Could not load model");
    }
  }

  /**
   * Predict and return activations of ALL layers
   * @param inputData 2D array 28x28 pixels (values 0-1)
   */
  async runInference(inputData: number[][]): Promise<{ layers: LayerData[], prediction: number }> {
    await tf.ready();
    if (!this.debugModel) this.updateDebugModel();

    // Verify Input
    const flatInput = inputData.flat();
    const inputSum = flatInput.reduce((a, b) => a + b, 0);
    console.log(`DEBUG: Inference Input Sum: ${inputSum} (Should be > 10 for a visible digit)`);
    if (inputSum < 1) console.warn("WARNING: Input image appears empty!");

    const intermediateResults = tf.tidy(() => {
      // 1. Convert input to Tensor [1, 28, 28, 1]
      const inputTensor = tf.tensor4d(flatInput, [1, 28, 28, 1]);

      // 2. Run inference
      // tf.model.predict returns Tensor or Tensor[]
      const outputs = this.debugModel!.predict(inputTensor);
      const outputArray = Array.isArray(outputs) ? outputs : [outputs];

      // 3. Extract data to escape local scope
      return outputArray.map(tensor => ({
        shape: tensor.shape.slice(1), // Remove batch dimension
        data: tensor.dataSync() as Float32Array
      }));
    });

    // 4. Map results to visualization data structure
    let prediction = -1;
    const layers = intermediateResults.map((item, index) => {
      const layer = this.model!.layers[index];

      // Check if this is the output layer (softmax)
      if (layer.name === 'output' || index === this.model!.layers.length - 1) {
        // Find max index
        let maxVal = -1;
        let maxIdx = -1;
        // Log raw probabilities
        console.log("Prediction Probabilities:", item.data);

        for (let i = 0; i < item.data.length; i++) {
          if (item.data[i] > maxVal) {
            maxVal = item.data[i];
            maxIdx = i;
          }
        }
        prediction = maxIdx;
      }

      return {
        id: `layer_${index}_${layer.name}`,
        name: layer.name,
        shape: item.shape,
        activations: item.data
      };
    });

    return { layers, prediction };
  }
}
