# 🧠 CNN 3D Visualizer

Một ứng dụng web tương tác mô phỏng hoạt động của mạng nơ-ron tích chập (Convolutional Neural Network - CNN) trong không gian 3D thời gian thực. Dự án được xây dựng nhằm mục đích giáo dục và nghiên cứu trực quan về AI.

🔗 **Live Demo:** [Trải nghiệm ngay tại đây](https://NotIsora.github.io/cnn-3d-viz/)
*(Lưu ý: Demo chạy tốt nhất trên Chrome/Edge desktop để hỗ trợ WebGPU)*

![CNN Visualization Preview](https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main/skills/3d-web-experience/preview-placeholder.jpg)
*(Ảnh minh họa: Hệ thống mô phỏng Layer 3D)*

## ✨ Tính năng chính

- **🚀 Real-time Tensor Engine:** Tích hợp **TensorFlow.js** (backend WebGPU/WebGL) để chạy suy luận mô hình AI trực tiếp trên trình duyệt client-side, không cần server GPU.
- **🧊 Interactive 3D Layering:** Hiển thị các Feature Maps (bản đồ đặc trưng) dưới dạng các lớp 3D xếp chồng theo chiều sâu (Hierarchical View).
- **mag_right: Receptive Field Mapping:** Tính năng tương tác: Click vào một neuron bất kỳ để truy vết ngược (Back-tracing) vùng pixel ảnh hưởng tại các layer trước đó.
- **⚡ GPU Accelerated:** Sử dụng kỹ thuật **Instanced Mesh** của Three.js để render hàng chục nghìn neuron cùng lúc vẫn đảm bảo 60fps.

## 🛠 Công nghệ sử dụng

- **Core Framework:** [Next.js 14](https://nextjs.org/) (App Router, TypeScript)
- **3D Engine:** [Three.js](https://threejs.org/) & [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- **AI/ML Logic:** [TensorFlow.js](https://www.tensorflow.org/js)
- **Styling:** Tailwind CSS
- **Deployment:** GitHub Pages (Automated via GitHub Actions)

## 📂 Cấu trúc dự án

```bash
src/
├── app/                  # Next.js App Router
│   ├── page.tsx          # Entry point
│   └── layout.tsx        # Root layout & Metadata
├── components/
│   └── scene/            # Các thành phần 3D (Logic hiển thị)
│       ├── NetworkView.tsx   # Canvas chính
│       ├── LayerMesh.tsx     # Render lớp nơ-ron (InstancedMesh)
│       └── ...
├── core/                 # Logic xử lý toán học & AI
│   ├── cnn-engine.ts     # TensorFlow model wrapper
│   └── math-utils.ts     # Tính toán tọa độ 3D
└── types/                # TypeScript definitions
