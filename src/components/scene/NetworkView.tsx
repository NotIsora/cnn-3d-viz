'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Text } from '@react-three/drei';
import { Suspense, useEffect, useState } from 'react';
import LayerMesh from './LayerMesh';
import { CNNEngine, LayerData } from '@/core/CNNEngine';

export default function NetworkView() {
  const [layers, setLayers] = useState<LayerData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadAI = async () => {
      const engine = CNNEngine.getInstance();
      await engine.init();
      const structure = await engine.loadModel();
      setLayers(structure);
      setIsLoaded(true);
    };
    loadAI();
  }, []);

  return (
    <div className="h-full w-full relative bg-neutral-950">
      <Canvas
        camera={{ position: [30, 20, 50], fov: 45 }}
        dpr={[1, 2]} // Tối ưu màn hình Retina
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#050505']} />
        
        {/* Ánh sáng */}
        <ambientLight intensity={1.5} />
        <pointLight position={[50, 50, 50]} intensity={1000} />
        <pointLight position={[-20, -10, 0]} intensity={500} color="blue" />

        <Suspense fallback={null}>
          <group position={[-5, 0, -30]}>
            {/* Hiển thị chữ Loading nếu chưa tải xong */}
            {!isLoaded && (
              <Text position={[0, 5, 0]} fontSize={2} color="white">
                Initializing AI Core...
              </Text>
            )}

            {/* Render Layers */}
            {layers.map((layer) => {
              // Tính số lượng neuron: width * height * channels
              const totalNeurons = layer.shape.reduce((a, b) => a * b, 1);
              
              // Chọn màu theo loại layer
              const layerColor = layer.type.includes('Conv') ? '#4f46e5' // Xanh tím
                : layer.type.includes('Pool') ? '#ec4899' // Hồng
                : '#eab308'; // Vàng

              return (
                <LayerMesh
                  key={layer.id}
                  position={[0, 0, layer.depth]}
                  count={Math.min(totalNeurons, 2000)} // Giới hạn max 2000 để ko lag
                  color={layerColor}
                  layerName={layer.name}
                />
              );
            })}

            {/* Trục nối giữa các layer */}
            {isLoaded && (
              <mesh position={[0, 0, 40]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 100]} />
                <meshBasicMaterial color="#333" transparent opacity={0.5} />
              </mesh>
            )}
          </group>
        </Suspense>

        <Grid infiniteGrid sectionColor="#444" cellColor="#222" fadeDistance={100} />
        <OrbitControls makeDefault />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 text-white pointer-events-none">
        <h1 className="text-2xl font-bold bg-black/50 px-3 py-1 rounded">
          CNN 3D Visualizer
        </h1>
        <p className="text-xs text-gray-400 px-3">
          {isLoaded ? "● System Ready" : "○ Loading Tensor Engine..."}
        </p>
      </div>
    </div>
  );
}
