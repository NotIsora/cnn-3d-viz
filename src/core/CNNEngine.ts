import * as tf from '@tensorflow/tfjs';

export interface LayerData {
  id: string;
  name: string;
  shape: number[];
  activations: Float32Array; // Dữ liệu đã được flatten để render
}

export class CNNEngine {
  private model: tf.Sequential | null = null;
  private debugModel: tf.LayersModel | null = null;

  constructor() {
    this.initModel();
  }

  private initModel() {
    // Xây dựng model CNN đơn giản cho MNIST (Input 28x28)
    this.model = tf.sequential();
    
    // Layer 1: Conv2D
    this.model.add(tf.layers.conv2d({
      inputShape: [28, 28, 1],
      kernelSize: 3,
      filters: 8,
      activation: 'relu',
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
      name: 'conv2d_2'
    }));

    // Layer 4: Flatten
    this.model.add(tf.layers.flatten({ name: 'flatten' }));

    // Layer 5: Dense
    this.model.add(tf.layers.dense({ 
      units: 10, 
      activation: 'softmax',
      name: 'output' 
    }));

    // Tạo auxiliary model để lấy output của từng layer
    // Defensive coding: Kiểm tra inputs/outputs tồn tại
    if (this.model.inputs && this.model.layers) {
        const layers = this.model.layers;
        const symbolicOutputs = layers.map(l => l.output) as tf.SymbolicTensor[];
        this.debugModel = tf.model({ 
            inputs: this.model.inputs, 
            outputs: symbolicOutputs 
        });
    }
  }

  /**
   * Dự đoán và trả về activations của TOÀN BỘ các lớp
   * @param inputData Mảng 2D 28x28 pixel (giá trị 0-1)
   */
  async predict(inputData: number[][]): Promise<LayerData[]> {
    if (!this.debugModel) throw new Error("Model not initialized");

    return tf.tidy(() => {
        // 1. Chuyển đổi input thành Tensor [1, 28, 28, 1]
        const inputTensor = tf.tensor4d(inputData.flat(), [1, 28, 28, 1]);

        // 2. Chạy inference
        // tf.model.predict trả về Tensor hoặc Tensor[]
        const outputs = this.debugModel!.predict(inputTensor);
        const outputArray = Array.isArray(outputs) ? outputs : [outputs];

        // 3. Map kết quả sang cấu trúc dữ liệu cho visualization
        const results: LayerData[] = outputArray.map((tensor, index) => {
            const layer = this.model!.layers[index];
            const data = tensor.dataSync() as Float32Array; // Sync download vì data nhỏ
            return {
                id: `layer_${index}`,
                name: layer.name,
                shape: tensor.shape.slice(1), // Bỏ batch dimension [1, h, w, d] -> [h, w, d]
                activations: data
            };
        });

        return results;
    }); // tf.tidy tự động dọn dẹp tensor trung gian để tránh memory leak
  }
}
