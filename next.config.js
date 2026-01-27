/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Tắt SSR cho các component 3D nặng nếu cần, nhưng R3F xử lý khá tốt
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei']
};

module.exports = nextConfig;
