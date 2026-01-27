# 🧠 CNN 3D Visualizer

Một ứng dụng web tương tác mô phỏng hoạt động của mạng nơ-ron tích chập (Convolutional Neural Network - CNN) trong không gian 3D thời gian thực. Dự án được xây dựng nhằm mục đích giáo dục và nghiên cứu trực quan.

🔗 **Live Demo:** [Xem tại đây](https://<USERNAME>.github.io/<REPO_NAME>/) 
*(Thay thế link trên sau khi deploy thành công)*

![CNN Visualization Preview](https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main/skills/3d-web-experience/preview-placeholder.jpg)
*(Bạn có thể chụp màn hình ứng dụng sau khi chạy và thay link ảnh vào đây)*

## ✨ Tính năng chính

- **Real-time Tensor Engine:** Sử dụng TensorFlow.js (WebGPU/WebGL) để chạy suy luận AI ngay trên trình duyệt.
- **Interactive 3D Layering:** Hiển thị các lớp Feature Maps dưới dạng khối 3D xếp chồng (Hierarchical View).
- **Receptive Field Mapping:** Click vào bất kỳ neuron nào để xem vùng pixel ảnh hưởng ngược lại (Back-tracing).
- **GPU Accelerated:** Render hàng nghìn instance neuron mượt mà (60fps) với React Three Fiber và InstancedMesh.

## 🛠 Công nghệ sử dụng

- **Core:** [Next.js 14](https://nextjs.org/) (App Router, Static Export)
- **3D Engine:** [Three.js](https://threejs.org/) & [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- **AI Backend:** [TensorFlow.js](https://www.tensorflow.org/js)
- **Styling:** Tailwind CSS
- **Deployment:** GitHub Pages (Automated via GitHub Actions)

## 🚀 Hướng dẫn chạy cục bộ (Local Development)

1. Clone repository:
   ```bash
   git clone [https://github.com/](https://github.com/)<USERNAME>/<REPO_NAME>.git
   cd <REPO_NAME>
