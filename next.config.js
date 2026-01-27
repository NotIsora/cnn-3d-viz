/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Bắt buộc: Xuất ra HTML tĩnh
  basePath: '/cnn-3d-viz', // Quan trọng: Thay bằng tên repo của bạn (VD: /cnn-3d-viz)
  images: {
    unoptimized: true, // GitHub Pages không hỗ trợ Image Optimization
  },
  // Tắt strict mode để Three.js không bị render 2 lần (tăng fps dev)
  reactStrictMode: false, 
};

module.exports = nextConfig;
