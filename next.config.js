/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Tắt SSR cho các component 3D nặng nếu cần, nhưng R3F xử lý khá tốt
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  output: 'export', // Bắt buộc cho GitHub Pages (Static Site Generation)
  basePath: '/cnn-3d-viz', // Tên repository của bạn
  images: {
    unoptimized: true, // Không dùng Image Optimization của Next.js (yêu cầu server)
  },
};

module.exports = nextConfig;
