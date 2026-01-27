import * as THREE from 'three';

/**
 * Chuẩn hóa giá trị về khoảng [0, 1]
 * @param val Giá trị đầu vào
 * @param min Giá trị nhỏ nhất (sàn)
 * @param max Giá trị lớn nhất (trần)
 */
export const normalize = (val: number, min: number, max: number): number => {
  return Math.max(0, Math.min 1, (val - min) / (max - min));
};

/**
 * Tính toán màu sắc dựa trên giá trị kích hoạt (Activation Value)
 * Giá trị âm -> Màu xanh (Ức chế)
 * Giá trị dương -> Màu đỏ/vàng (Kích hoạt)
 * @param value Giá trị từ tensor (-1 đến 1 hoặc 0 đến 1)
 */
export const getActivationColor = (value: number): THREE.Color => {
  const color = new THREE.Color();

  if (value > 0) {
    // Kích hoạt mạnh: Đen -> Đỏ -> Vàng
    // Dùng HSL để chuyển màu mượt hơn
    const intensity = Math.min(value, 1); 
    color.setHSL(0.0 + (intensity * 0.1), 1.0, intensity * 0.5); 
  } else {
    // Ức chế (Negative): Đen -> Xanh dương
    const intensity = Math.min(Math.abs(value), 1);
    color.setHSL(0.6, 1.0, intensity * 0.5);
  }

  return color;
};

/**
 * Tính toán vị trí X, Y trong lưới 2D từ index phẳng
 * Dùng để sắp xếp neuron thành hình vuông/chữ nhật
 */
export const getGridPosition = (
  index: number, 
  cols: number, 
  spacing: number
): { x: number, y: number } => {
  const x = (index % cols) * spacing;
  const y = Math.floor(index / cols) * spacing;
  
  // Trả về tọa độ chưa căn giữa (offset sẽ được xử lý ở component cha)
  return { x, y };
};

/**
 * Tính toán kích thước lưới tối ưu (số cột) dựa trên tổng số phần tử
 * Để tạo ra hình vuông hoặc chữ nhật gần vuông nhất
 */
export const getOptimalGridSize = (count: number): { cols: number, rows: number } => {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  return { cols, rows };
};
