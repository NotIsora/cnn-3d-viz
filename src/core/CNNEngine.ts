import * as tf from '@tensorflow/tfjs';
import { LayerData } from '@/store/useCNNStore';

export class CNNEngine {
  /**
   * Chạy Inference an toàn với memory cleanup
   */
  static async runInference(inputData: number[][]): Promise<LayerData[]> {
    // 1. Validate Input
    if (!inputData || inputData.length === 0) {
      throw new Error("Input data is empty or invalid.");
    }

    // 2. Wrap trong tf.tidy để tự động dọn dẹp Tensor, tránh memory leak
    return tf.tidy(() => {
      try {
        const results: LayerData[] = [];
        
        // --- Input Layer ---
        // Chuyển mảng 2D thành Tensor [1, H, W, 1]
        let currentTensor = tf.tensor2d(inputData).expandDims(0).expandDims(-1) as tf.Tensor4D;
        
        results.push({
          name: 'Input Layer',
          shape: currentTensor.shape,
          data: currentTensor.dataSync() as Float32Array
        });

        // --- Conv2D Layer 1 ---
        // Giả lập kernel detect edge (Sobel-like)
        const kernel1 = tf.tensor4d([
          [1, 0, -1], [2, 0, -2], [1, 0, -1]
        ], [3, 3, 1, 1]); 
        
        currentTensor = tf.conv2d(currentTensor, kernel1, 1, 'same');
        currentTensor = tf.relu(currentTensor); // Activation
        
        results.push({
          name: 'Conv2D + ReLU',
          shape: currentTensor.shape,
          data: currentTensor.dataSync() as Float32Array
        });

        // --- Max Pooling Layer ---
        currentTensor = tf.maxPool(currentTensor, [2, 2], [2, 2], 'same');
        
        results.push({
          name: 'Max Pooling 2x2',
          shape: currentTensor.shape,
          data: currentTensor.dataSync() as Float32Array
        });

        return results;

      } catch (err) {
        console.error("TF.js Inference Error:", err);
        throw err; // Ném lỗi ra để UI catch
      }
    });
  }
}
