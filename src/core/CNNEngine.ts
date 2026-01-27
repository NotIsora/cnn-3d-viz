// src/core/CNNEngine.ts
import * as tf from '@tensorflow/tfjs';
// Nếu muốn dùng WebGPU (nhanh hơn nhưng kén trình duyệt), uncomment dòng dưới:
// import '@tensorflow/tfjs-backend-webgpu'; 

export interface LayerData {
  id: string;
  type: string;
  name: string;
  shape: number[]; // [batch, height, width, channels]
  weights?: Float32Array; // Trọng số (nếu cần visualize filter)
  output?: Float32Array;  // Giá trị activation sau khi chạy qua ảnh input
  depth: number;          // Độ sâu hiển thị trên trục Z
}

export class CNNEngine {
  private static instance: CNNEngine;
  private model: tf.LayersModel | null = null;
  private isInitialized = false;

  private constructor() {}

  // Singleton Pattern: Đảm bảo chỉ có 1 engine chạy
  static getInstance(): CNNEngine {
    if (!CNNEngine.instance) {
      CNNEngine.instance = new CNNEngine();
    }
    return CNNEngine.instance;
  }

  // Khởi tạo backend (WebGPU hoặc WebGL)
  async init() {
    if (this.isInitialized) return;
    
    try {
      // Ưu tiên WebGPU -> WebGL -> CPU
      await tf.setBackend('webgl'); 
      await tf.ready();
      console.log(`🧠 TF Backend: ${tf.getBackend()}`);
      this.isInitialized = true;
    } catch (e) {
      console.error("TF Init Error:", e);
    }
  }

  // Load mô hình mẫu (MobileNet hoặc mô hình custom của bạn)
  async loadModel(url?: string) {
    try {
      if (url) {
        this.model = await tf.loadLayersModel(url);
      } else {
        // Mặc định load một model nhỏ để demo nếu không có URL
        // Ở đây Dev-Mode giả lập tạo một model đơn giản
        this.model = tf.sequential({
          layers: [
            tf.layers.conv2d({
              inputShape: [28, 28, 1],
              filters: 32,
              kernelSize: 3,
              activation: 'relu',
              name: 'conv2d_1'
            }),
            tf.layers.maxPooling2d({ poolSize: 2, name: 'maxpool_1' }),
            tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: 'relu', name: 'conv2d_2' }),
            tf.layers.flatten({ name: 'flatten' }),
            tf.layers.dense({ units: 10, activation: 'softmax', name: 'output' })
          ]
        });
      }
      console.log("✅ Model Loaded:", this.model.summary());
      return this.extractStructure();
    } catch (e) {
      console.error("Load Model Error:", e);
      return [];
    }
  }

  // Trích xuất cấu trúc layer để vẽ khung 3D (Static Analysis)
  extractStructure(): LayerData[] {
    if (!this.model) return [];

    let zOffset = 0;
    const spacing = 15; // Khoảng cách giữa các layer

    return this.model.layers.map((layer, index) => {
      zOffset += spacing;
      
      // Lấy output shape (bỏ qua batch size null ở đầu)
      // Ví dụ: [null, 26, 26, 32] -> shape hiển thị là [26, 26, 32]
      const outputShape = layer.outputShape as number[];
      const cleanShape = outputShape.map(s => s || 1);

      return {
        id: layer.name || `layer_${index}`,
        type: layer.getClassName(), // Conv2D, MaxPooling2D...
        name: layer.name,
        shape: cleanShape,
        depth: zOffset
      };
    });
  }

  // Chạy suy luận (Inference) và lấy giá trị Activation của từng layer
  async runInference(imageElement: HTMLImageElement | HTMLCanvasElement): Promise<Record<string, Float32Array>> {
    if (!this.model) throw new Error("Model not loaded");

    // 1. Preprocess ảnh đầu vào
    return tf.tidy(() => { // tf.tidy tự động dọn dẹp tensor trung gian
      const tensor = tf.browser.fromPixels(imageElement, 1) // 1 channel (grayscale)
        .resizeNearestNeighbor([28, 28]) // Resize về đúng input model
        .toFloat()
        .div(255.0) // Normalize 0-1
        .expandDims(); // Thêm batch dimension -> [1, 28, 28, 1]

      // 2. Tạo Functional Model để lấy output của TẤT CẢ các layer trung gian
      // Input: Model Input
      // Output: List các output của từng layer
      const allLayerOutputs = this.model!.layers.map(l => l.output as tf.SymbolicTensor);
      const multiOutputModel = tf.model({ inputs: this.model!.inputs, outputs: allLayerOutputs });

      // 3. Dự đoán
      const outputs = multiOutputModel.predict(tensor) as tf.Tensor[];

      // 4. Trả về dữ liệu dạng object { layerName: TypedArray }
      // Lưu ý: dataSync() là synchronous, có thể gây lag nhẹ UI. 
      // Tốt hơn nên dùng data() async nhưng cần xử lý await bên ngoài.
      const activations: Record<string, Float32Array> = {};
      
      outputs.forEach((t, i) => {
        const layerName = this.model!.layers[i].name;
        activations[layerName] = t.dataSync() as Float32Array; 
      });

      return activations;
    });
  }
}
