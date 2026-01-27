'use client';

import { useEffect } from 'react';
import { NetworkView } from '@/components/scene/NetworkView';
import { useCNNStore } from '@/store/useCNNStore';
import { CNNEngine } from '@/core/CNNEngine';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { setLayers, setComputing, isComputing, hoveredInfo } = useCNNStore();

  useEffect(() => {
    const initModel = async () => {
      setComputing(true);
      try {
        // Tạo ảnh random 14x14 cho demo
        const dummyInput = Array.from({ length: 14 }, () => 
          Array.from({ length: 14 }, () => Math.random())
        );
        
        const layers = await CNNEngine.runInference(dummyInput);
        setLayers(layers);
      } catch (e) {
        console.error("Init failed", e);
      } finally {
        setComputing(false);
      }
    };

    initModel();
  }, [setLayers, setComputing]);

  return (
    <main className="w-screen h-screen flex flex-col">
      {/* 3D Viewport */}
      <div className="flex-1 relative">
        <NetworkView />
        
        {/* Loading Overlay */}
        {isComputing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="text-white flex flex-col items-center gap-2">
              <Loader2 className="animate-spin w-8 h-8 text-emerald-400" />
              <p>Calculating Tensors...</p>
            </div>
          </div>
        )}

        {/* Info Panel (Tooltip) */}
        {hoveredInfo && (
          <div className="absolute bottom-4 left-4 bg-slate-900/90 p-4 rounded-lg border border-slate-700 text-white w-64 backdrop-blur">
            <h3 className="font-bold text-emerald-400 mb-2">Voxel Info</h3>
            <div className="text-sm space-y-1 text-slate-300">
              <p>Layer: {hoveredInfo.layerIndex}</p>
              <p>Index: {hoveredInfo.voxelIndex}</p>
              <p>Activation: <span className="font-mono text-white">{hoveredInfo.value.toFixed(4)}</span></p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
