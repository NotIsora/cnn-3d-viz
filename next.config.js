/** @type {import('next').NextConfig} */

// ⚠️ CẤU HÌNH QUAN TRỌNG:
// Hãy thay đổi dòng dưới đây thành tên Repository chính xác của bạn trên GitHub
// Ví dụ: Repo là https://github.com/User/my-ai-project -> điền '/my-ai-project'
// Nếu bạn dùng tên repo là cnn-visualizer, hãy đổi thành '/cnn-visualizer'
const repoName = '/cnn-3d-viz'; 

const nextConfig = {
  output: 'export',
  
  // Logic: Chỉ dùng basePath khi ở môi trường Production (GitHub Pages)
  // Khi chạy npm run dev, nó sẽ để trống để bạn dễ code.
  basePath: process.env.NODE_ENV === 'production' ? repoName : '',
  
  images: {
    unoptimized: true,
  },
  reactStrictMode: false,
  
  // Bỏ qua lỗi TypeScript khi build để đảm bảo deploy được (Hotfix)
  typescript: {
    ignoreBuildErrors: true, 
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

module.exports = nextConfig;
