'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LayerData } from '@/core/CNNEngine';
import { Html } from '@react-three/drei';

interface LayerMeshProps {
  data: LayerData;
  position: [number, number, number];
  colorBase: string;
}

const FeaturePlane = ({
  data,
  filterIndex,
  position,
  colorBase,
  width,
  height,
  depth
}: {
  data: Float32Array,
  filterIndex: number,
  position: [number, number, number],
  colorBase: string,
  width: number,
  height: number,
  depth: number
}) => {
  const textureRef = useRef<THREE.DataTexture>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  // Buffers for interpolation
  // Texture is RGBA (4 bytes per pixel)
  const size = width * height;
  const currentPixels = useRef<Float32Array | null>(null);
  const targetPixels = useRef<Float32Array | null>(null);
  const dataTextureColorBuffer = useRef<Uint8Array | null>(null);

  // Initialize buffers
  useMemo(() => {
    currentPixels.current = new Float32Array(size).fill(0);
    targetPixels.current = new Float32Array(size).fill(0);
    dataTextureColorBuffer.current = new Uint8Array(size * 4); // RGBA
  }, [size]);

  // Update targets when data changes
  useEffect(() => {
    if (!targetPixels.current) return;

    // Extract slice for this filter (Channels Last: H-W-D)
    // index = h * (W*D) + w * D + d
    // But data is flattened H*W*D

    // Wait, let's verify strides.
    // data is from tensor.dataSync(). 
    // TFJS default is NHWC. 
    // So strides are: 
    // y (row) = W * D
    // x (col) = D
    // d (depth) = 1

    // wait, usually tf.tensor3d(..., [h, w, d])
    // So index(h,w,d) = h * (W*D) + w * D + d

    for (let h = 0; h < height; h++) {
      for (let w = 0; w < width; w++) {
        const dataIdx = h * (width * depth) + w * depth + filterIndex;
        const val = data[dataIdx] || 0;
        // Target Intensity
        // Flip Y axis for correct orientation (Canvas 0,0 is Top-Left, Texture 0,0 is Bottom-Left potentially)
        targetPixels.current![(height - 1 - h) * width + w] = Math.max(0, val);
      }
    }
  }, [data, filterIndex, width, height, depth]);

  // Animation Loop
  useFrame((state, delta) => {
    if (!currentPixels.current || !targetPixels.current || !dataTextureColorBuffer.current || !textureRef.current) return;

    const lerpFactor = Math.min(1, delta * 8);
    let needsUpdate = false;

    const baseColor = new THREE.Color(colorBase);
    const pixelData = currentPixels.current;
    const targetData = targetPixels.current;
    const texData = dataTextureColorBuffer.current;

    for (let i = 0; i < size; i++) {
      const current = pixelData[i];
      const target = targetData[i];

      if (Math.abs(current - target) > 0.001) {
        pixelData[i] = THREE.MathUtils.lerp(current, target, lerpFactor);
        needsUpdate = true;
      }

      // Map to RGBA
      // Intensity map: 
      // 0 -> Black/Transparent
      // >0 -> Base Color * Intensity
      // High intensity -> White

      const val = pixelData[i];
      const intensity = Math.min(1.5, val); // Cap at 1.5 for brightness

      // R, G, B
      // Simple visualization: Color * val
      // Make it "hot": if val > 1, go towards white?

      // Let's keep it simple: BaseColor scaled by intensity.
      // Alpha is 255.

      const displayVal = Math.min(255, Math.floor(intensity * 255));
      texData[i * 4] = displayVal;
      texData[i * 4 + 1] = displayVal;
      texData[i * 4 + 2] = displayVal;
      texData[i * 4 + 3] = 255; // Opaque Black Background
    }

    if (needsUpdate) {
      textureRef.current.needsUpdate = true;
      // Scale pop effect? Maybe just scale the whole plane slightly?
      // Let's keep plane stable for "image" feel.
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[width * 0.1, height * 0.1]} />
      <meshBasicMaterial transparent side={THREE.DoubleSide}>
        <dataTexture
          attach="map"
          ref={textureRef}
          args={[dataTextureColorBuffer.current as any, width, height, THREE.RGBAFormat]}
          magFilter={THREE.NearestFilter}
          minFilter={THREE.NearestFilter}
        />
      </meshBasicMaterial>
    </mesh>
  );
};

interface LayerMeshProps {
  data: LayerData;
  position: [number, number, number];
  colorBase: string;
  onClick: () => void;
  isActive: boolean;
}

export const LayerMesh: React.FC<LayerMeshProps> = ({ data, position, colorBase, onClick, isActive }) => {
  // Determine layout
  const is3D = data.shape.length === 3;
  const height = is3D ? data.shape[0] : 1;
  const width = is3D ? data.shape[1] : Math.sqrt(data.shape[0]);
  const depth = is3D ? data.shape[2] : 1;

  // Create a plane for each filter
  // Spacing
  const FILTER_SPACING = 1.0;
  // We want to center the stack

  const getLayerDescription = (name: string) => {
    if (name.includes('conv')) return 'Feature Extraction';
    if (name.includes('pool')) return 'Downsampling';
    if (name.includes('flatten')) return 'Vectorization';
    if (name.includes('dense')) return 'Thinking Layer';
    if (name.includes('dropout')) return 'Focus Training';
    if (name.includes('output')) return 'Prediction';
    return 'Layer';
  };

  const description = getLayerDescription(data.name);

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <Html
        position={[0, (height * 0.1) / 2 + 1.5, 0]}
        center
        distanceFactor={10}
        zIndexRange={[100, 0]}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className={`
            group pointer-events-auto select-none flex flex-col items-center 
            backdrop-blur-md rounded-lg p-3 border shadow-xl min-w-[120px] transition-all duration-300
            ${isActive
              ? 'bg-cyan-900/80 border-cyan-400 scale-110 ring-2 ring-cyan-500/50'
              : 'bg-black/60 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-500 hover:scale-105'
            }
          `}
        >
          <h3 className={`font-bold text-sm tracking-wider uppercase mb-1 ${isActive ? 'text-cyan-200' : 'text-white'}`}>
            {data.name.split('_')[0]}
          </h3>
          <p className="text-xs text-cyan-400 font-medium mb-1">
            {description}
          </p>
          <p className="text-[10px] text-slate-400 font-mono bg-black/40 px-2 py-0.5 rounded">
            {data.shape.join(' × ')}
          </p>

          <div className={`mt-2 text-[10px] uppercase tracking-widest text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'hidden' : ''}`}>
            Click to Inspect
          </div>
        </button>
      </Html>

      {Array.from({ length: depth }).map((_, i) => (
        <FeaturePlane
          key={i}
          data={data.activations}
          filterIndex={i}
          position={[0, 0, (i - (depth - 1) / 2) * FILTER_SPACING]}
          colorBase={colorBase}
          width={width}
          height={height}
          depth={depth}
        />
      ))}
    </group>
  );
};
