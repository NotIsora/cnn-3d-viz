import * as tf from '@tensorflow/tfjs';

export interface LayerData {
  id: string;
  type: string;
  name: string;
  shape: number[];
  depth: number;
}

export class CNNEngine {
  private static instance: CNNEngine;
  private model: tf.LayersModel | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): CNNEngine {
    if (!CNNEngine.instance) {
      CNNEngine.instance = new CNNEngine();
    }
    return CNNEngine.instance;
  }

  async init() {
    if (this.isInitialized) return;
    await tf.ready();
    console.log(`🧠 Backend: ${tf.getBackend()}`);
    this.isInitialized = true;
  }

  async loadModel() {
    // Tạo một model giả lập đơn giản để demo (chạy cực nhanh)
    this.model = tf.sequential({
      layers: [
        tf.layers.conv2d({ inputShape: [28, 28, 1], filters: 16, kernelSize: 3, activation: 'relu', name: 'Conv2D_1' }),
        tf.layers.maxPooling2d({ poolSize: 2, name: 'MaxPool_1' }),
        tf.layers.conv2d({ filters: 32, kernelSize: 3, activation: 'relu', name: 'Conv2D_2' }),
        tf.layers.flatten({ name: 'Flatten' }),
        tf.layers.dense({ units: 10, activation: 'softmax', name: 'Output_Dense' })
      ]
    });
    
    // Giả lập biên dịch để model sẵn sàng
    this.model.compile({ optimizer: 'sgd', loss: 'categoricalCrossentropy' });
    
    return this.extractStructure();
  }

  extractStructure(): LayerData[] {
    if (!this.model) return [];
    let zOffset = 0;
    return this.model.layers.map((layer, idx) => {
      zOffset += 15; // Khoảng cách giữa các lớp
      const shape = layer.outputShape as number[];
      return {
        id: `layer_${idx}`,
        type: layer.getClassName(),
        name: layer.name,
        shape: shape.map(s => s || 1), // Xử lý null dimension
        depth: zOffset
      };
    });
  }
}
