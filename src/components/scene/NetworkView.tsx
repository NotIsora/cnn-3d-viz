import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { LayerData } from '@/core/CNNEngine';
import { LayerMesh } from './LayerMesh';
import { Suspense } from 'react';
import * as THREE from 'three';

interface NetworkViewProps {
    layers: LayerData[];
}

const LAYER_SPACING = 8;
const INITIAL_CAMERA_POS = new THREE.Vector3(0, 0, 32);

// Camera Controller Component
const CameraRig = ({ activeLayerIndex }: { activeLayerIndex: number | null }) => {
    const { camera, controls } = useThree();
    // Use a Ref to store target position to avoid re-calculating every frame unnecessarily
    const targetPos = useRef(new THREE.Vector3());
    const targetLookAt = useRef(new THREE.Vector3());

    useFrame((state, delta) => {
        if (activeLayerIndex !== null) {
            // Focus on specific layer
            // Re-calculate position based on new layout (3 Top, 3 Bottom)
            const row = activeLayerIndex < 3 ? 0 : 1;
            const col = activeLayerIndex % 3;
            const layerX = (col - 1) * 10;
            const layerY = row === 0 ? 5 : -5;

            // Move camera to front-right-up
            targetPos.current.set(layerX + 5, layerY + 4, 12);
            targetLookAt.current.set(layerX, layerY, 0);
        } else {
            // Default View - Overview
            // Center roughly around middle layers
            targetPos.current.copy(INITIAL_CAMERA_POS);
            targetLookAt.current.set(0, 0, 0); // Center at origin
        }

        // Smooth Lerp
        const damp = 4 * delta;
        camera.position.lerp(targetPos.current, damp);

        // Update OrbitControls target
        const orbit = state.controls as any; // Type assertion for OrbitControls
        if (orbit) {
            orbit.target.lerp(targetLookAt.current, damp);
            orbit.update();
        }
    });

    return null;
};

// Math Details Component (Overlay)
const LayerDetailsSidePanel = ({ layer, onClose }: { layer: LayerData | null, onClose: () => void }) => {
    if (!layer) return null;

    const getLayerDetails = (name: string, shape: number[]) => {
        if (name.includes('conv')) {
            return {
                title: "Convolutional Layer (Feature Extraction)",
                math: "Input Volume × Learnable Filters → Feature Maps",
                description: "This is the core building block of a CNN. It works by sliding small 3x3 filters (kernels) across the input image. Each filter is trained to detect specific visual features—starting with simple edges and lines, and eventually learning complex shapes. As the image passes through this layer, it is transformed into a stack of 'feature maps', where each map highlights the presence of a specific feature at different locations.",
                params: `${shape[2]} Filters of size 3x3`
            };
        }
        if (name.includes('pool')) {
            return {
                title: "Max Pooling Layer (Downsampling)",
                math: "Select Max Value in 2x2 Region",
                description: "This layer reduces the spatial size of the representation. It looks at small 2x2 windows of the feature maps and keeps only the highest value (the strongest feature activation). This effectively reduces the amount of data by 75% while retaining the most important information. It also makes the network more robust to small shifts or distortions in the input image.",
                params: "2x2 Region, Stride 2"
            };
        }
        if (name.includes('flatten')) {
            return {
                title: "Flatten Layer (Vectorization)",
                math: "3D Volume → 1D Vector",
                description: "This layer bridges the gap between the convolutional base and the classifier head. It takes the 3D cube of feature maps (Height × Width × Depth) and unrolls them into a single long list of numbers (a 1D vector). This prepares the spatial data for the fully connected layers that will make the final decision.",
                params: `Output Vector Size: ${shape[0]}`
            };
        }
        if (name.includes('dense') && !name.includes('output')) {
            return {
                title: "Dense Layer (Reasoning)",
                math: "Weighted Sum + Non-linearity (ReLU)",
                description: "A fully connected layer where every neuron is connected to every input from the previous layer. This layer acts as the 'brain' of the network, interpreting the high-level features extracted by the convolutional layers. It learns non-linear combinations of these features to understand what digit is likely present.",
                params: `${shape[0]} Neurons`
            };
        }
        if (name.includes('output')) {
            return {
                title: "Output Layer (Prediction)",
                math: "Softmax Probability",
                description: "The final layer of the network. It has 10 neurons, one for each possible digit (0-9). The 'Softmax' function converts the raw output scores into probabilities that sum to 100%. The neuron with the highest value represents the network's most confident guess for the input digit.",
                params: "10 Class Probabilities"
            };
        }
        if (name.includes('dropout')) {
            return {
                title: "Dropout Layer (Regularization)",
                math: "Randomly Disable Neurons",
                description: "This layer is active only during training. It randomly turns off a percentage of neurons in each step. This forces the network to learn multiple independent representations of the same data, preventing it from relying too heavily on any single feature. This helps the AI generalize better to new, unseen images.",
                params: "Drop Rate: 0.25 (25%)"
            };
        }
        return {
            title: "Neural Layer",
            math: "y = f(Wx + b)",
            description: "A standardized layer in the neural network pipeline.",
            params: `Shape: ${shape.join('x')}`
        };
    };

    const info = getLayerDetails(layer.name, layer.shape);

    return (
        <div className="absolute top-4 right-4 w-80 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl p-6 text-white transition-all transform animate-in slide-in-from-right duration-300">
            <button
                onClick={onClose}
                className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
                ✕
            </button>
            <div className="mb-4">
                <span className="text-xs font-mono text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded border border-cyan-800">
                    {layer.name}
                </span>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                {info.title}
            </h2>
            <div className="bg-black/40 p-4 rounded-lg my-4 border-l-2 border-cyan-500 font-mono text-sm text-cyan-100 overflow-x-auto">
                {info.math}
            </div>
            <p className="text-slate-200 text-lg leading-relaxed mb-4 border-l-2 border-cyan-500 pl-3 font-medium">
                {info.description}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-700/50 pt-3">
                <span className="uppercase tracking-wider font-semibold">Params:</span>
                <span className="text-slate-300">{info.params}</span>
            </div>
        </div>
    );
};


export default function NetworkView({ layers }: NetworkViewProps) {
    // Define palette
    const PALETTE = ['#00a8ff', '#ff007f', '#00ff7f', '#ffaa00', '#aa00ff'];

    // State
    const [activeLayerIndex, setActiveLayerIndex] = useState<number | null>(null);

    // Initial load: maybe focus on input or nothing?
    // Let's start with nothing (overview)

    return (
        <div className="relative w-full h-full min-h-[600px] bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700 group">
            <Canvas camera={{ position: [10, 5, 20], fov: 50 }}>
                <color attach="background" args={['#0f172a']} />
                <Suspense fallback={null}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />

                    {/* Camera Controller */}
                    <CameraRig activeLayerIndex={activeLayerIndex} />

                    <group position={[0, 0, 0]}>
                        {layers.map((layer, index) => {
                            // Layout Logic: 3 Top, 3 Bottom
                            // Row 0: indices 0, 1, 2 -> Y = 5
                            // Row 1: indices 3, 4, 5 -> Y = -5
                            // X centering: -10, 0, 10

                            const row = index < 3 ? 0 : 1;
                            const col = index % 3;

                            const x = (col - 1) * 10; // Spacing 10. x = -10, 0, 10
                            const y = row === 0 ? 5 : -5;
                            const z = 0;

                            return (
                                <LayerMesh
                                    key={layer.id}
                                    data={layer}
                                    position={[x, y, z]}
                                    colorBase={PALETTE[index % PALETTE.length]}
                                    onClick={() => setActiveLayerIndex(index)}
                                    isActive={activeLayerIndex === index}
                                />
                            );
                        })}
                    </group>

                    <ContactShadows opacity={0.5} scale={40} blur={2} far={10} resolution={256} color="#000000" />
                    <Environment preset="city" />
                </Suspense>
                {/* Manual Controls enabled, but autoRotate disabled */}
                <OrbitControls makeDefault />
            </Canvas>

            {/* UI Overlay */}
            {activeLayerIndex !== null && (
                <LayerDetailsSidePanel
                    layer={layers[activeLayerIndex]}
                    onClose={() => setActiveLayerIndex(null)}
                />
            )}

            {/* Hint */}
            {activeLayerIndex === null && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur text-white/70 text-xs px-3 py-1 rounded-full pointer-events-none fade-in">
                    Click on a layer to inspect
                </div>
            )}
        </div>
    );
}
