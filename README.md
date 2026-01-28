# 🧠 3D CNN Explainer

Một ứng dụng web tương tác cao cấp giúp **trực quan hóa hoạt động của Mạng Nơ-ron Tích chập (CNN)** trong không gian 3D. Dự án giúp người xem "nhìn thấu" những gì máy tính thực sự nhìn thấy khi nhận diện chữ số viết tay.

🔗 **Live Demo:** [Trải nghiệm ngay tại đây](https://NotIsora.github.io/cnn-3d-viz/)

![CNN Visualization Preview](./public/assets/preview.png)

## ✨ Tính năng nổi bật

### 1. 🖌️ Tương tác thời gian thực
-   **Vẽ số tự do**: Bạn vẽ số lên bảng, hệ thống nhận diện tức thì.
-   **Real-time Inference**: Mô hình AI chạy trực tiếp trên trình duyệt bằng **TensorFlow.js** (WebGPU/WebGL), không cần gửi ảnh về server.

### 2. 🧊 Trực quan hóa 3D (Fluid Visualization)
-   **True Feature Maps**: Thay vì các khối hộp trừu tượng, hệ thống hiển thị **hình ảnh thực tế (2D Texture)** mà mạng nơ-ron đang "học" tại mỗi lớp.
    -   *Layer 1 (Conv2D)*: Thấy rõ các đặc điểm cạnh, nét cong.
    -   *Layer 2 (MaxPooling)*: Thấy hình ảnh được cô đọng lại.
-   **Fluid Animations**: Các lớp nơ-ron biến đổi mượt mà (Interpolation) khi bạn vẽ nét mới.
-   **Interactive Inspection**: 
    -   **Click to Zoom**: Nhấp vào bất kỳ lớp nào để camera tự động zoom vào và tập trung vào lớp đó.
    -   **Detailed Explanations**: Một bảng thông tin chi tiết sẽ hiện ra, giải thích cơ chế hoạt động, công thức toán học đơn giản hóa, và ý nghĩa của lớp đó (ví dụ: "Thinking Layer", "Focus Training").
-   **Optimized Layout**: Sắp xếp dạng lưới 2 hàng giúp quan sát toàn bộ mạng lưới dễ dàng hơn.

### 3. 🧠 Mô hình AI Tối ưu
-   **Architecture**: Conv2D -> MaxPooling -> Conv2D -> Flatten -> Dropout -> Dense.
-   **Robustness**: Được huấn luyện với **Data Augmentation** (xoay, dịch chuyển) và **Regularization** (Dropout, L2) để nhận diện tốt chữ số viết tay méo mó hoặc không nằm giữa tâm.

## 🛠 Công nghệ cốt lõi

-   **Frontend**: [Next.js 14](https://nextjs.org/) (App Router, TypeScript)
-   **3D Graphics**: [Three.js](https://threejs.org/) & [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
    -   *Custom Shaders/Textures* cho hiệu năng cao.
-   **AI Core**: [TensorFlow.js](https://www.tensorflow.org/js)
-   **Styling**: Tailwind CSS & Lucide Icons

## 📂 Cấu trúc dự án

```bash
src/
├── app/                  # Next.js Pages
├── components/
│   ├── scene/            # 3D Components
│   │   ├── NetworkView.tsx   # Quản lý Scene 3D
│   │   └── LayerMesh.tsx     # Render Feature Maps (DataTexture)
│   └── ui/               # 2D Interface (Button, Drawing Canvas)
├── core/                 # AI & Logic
│   ├── CNNEngine.ts      # Quản lý model & training loop
│   └── MnistData.ts      # Xử lý dữ liệu MNIST
└── styles/               # Global CSS
```

## 🚀 Cài đặt & Chạy thử

1.  **Clone repo:**
    ```bash
    git clone https://github.com/NotIsora/cnn-3d-viz.git
    cd cnn-3d-viz
    ```

2.  **Cài đặt dependencies:**
    ```bash
    npm install
    # hoặc
    yarn install
    ```

3.  **Chạy server development:**
    ```bash
    npm run dev
    ```
    Truy cập `http://localhost:3000`.

## 🤝 Đóng góp

Dự án này là mã nguồn mở. Mọi đóng góp (Pull Request, Issue) đều được hoan nghênh!

---
*Developed with ❤️ using Next.js & TensorFlow.js*
