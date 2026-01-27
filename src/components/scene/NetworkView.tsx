'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { LayerData } from '@/core/CNNEngine';
import { LayerMesh } from './LayerMesh';
import { Suspense } from 'react';

interface NetworkViewProps {
    layers: LayerData[];
}

export default function NetworkView({ layers }: NetworkViewProps) {
    // Define palette
    const PALETTE = ['#00a8ff', '#ff007f', '#00ff7f', '#ffaa00', '#aa00ff'];

    return (
        <div className="w-full h-full min-h-[600px] bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
            <Canvas camera={{ position: [10, 5, 10], fov: 50 }}>
                <color attach="background" args={['#0f172a']} />
                <Suspense fallback={null}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    
                    <group position={[-(layers.length * 3) / 2, 0, 0]}>
                        {layers.map((layer, index) => (
                            <LayerMesh 
                                key={layer.id} 
                                data={layer} 
                                position={[index * 8, 0, 0]} // Trải dài các layer theo trục X
                                colorBase={PALETTE[index % PALETTE.length]}
                            />
                        ))}
                    </group>

                    <ContactShadows opacity={0.5} scale={40} blur={2} far={10} resolution={256} color="#000000" />
                    <Environment preset="city" />
                </Suspense>
                <OrbitControls autoRotate autoRotateSpeed={0.5} />
            </Canvas>
        </div>
    );
}
