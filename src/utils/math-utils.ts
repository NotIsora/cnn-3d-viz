import * as THREE from 'three';

// Hàm chuẩn hóa giá trị về [0, 1]
export const normalize = (val: number, min: number, max: number): number => {
  return Math.max(0, Math.min(1, (val - min) / (max - min)));
};

// Hàm tính màu sắc dựa trên giá trị activation
export const getActivationColor = (value: number): THREE.Color => {
  const color = new THREE.Color();
  // Nếu giá trị > 0 (Kích hoạt): Màu Vàng/Đỏ
  // Nếu giá trị <= 0 (Không kích hoạt): Màu Xanh tối
  if (value > 0) {
    const intensity = Math.min(value, 1);
    color.setHSL(0.1, 1.0, 0.5 * intensity); // Màu cam/vàng sáng
  } else {
    color.setHSL(0.6, 0.5, 0.1); // Màu xanh tối chìm xuống
  }
  return color;
};

// Hàm tính số cột/dòng tối ưu cho lưới vuông
export const getOptimalGridSize = (count: number): { cols: number, rows: number } => {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  return { cols, rows };
};
