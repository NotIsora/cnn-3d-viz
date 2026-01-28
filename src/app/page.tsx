'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useCNNStore } from '@/store/useCNNStore';
import { CNNEngine } from '@/core/CNNEngine';
import { Loader2, Download, Play, RefreshCw, PenTool } from 'lucide-react';
import { DrawingCanvas } from '@/components/DrawingCanvas';

const NetworkView = dynamic(() => import('@/components/scene/NetworkView'), {
  ssr: false,
  loading: () => <div className="text-white">Loading 3D Engine...</div>
});

export default function Home() {
  const {
    layers,
    prediction,
    setLayers,
    setPrediction,
    setComputing,
    isComputing,
    hoveredInfo
  } = useCNNStore();

  const engineRef = useRef<CNNEngine | null>(null);
  const [trainingStatus, setTrainingStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'draw' | 'train'>('draw');

  useEffect(() => {
    const init = async () => {
      engineRef.current = new CNNEngine();
      await engineRef.current.initialize();
    };
    init();
  }, []);

  const handleDraw = async (imageData: number[][]) => {
    if (!engineRef.current) return;
    setComputing(true);
    try {
      const result = await engineRef.current.runInference(imageData);
      setLayers(result.layers);
      setPrediction(result.prediction);
    } catch (e) {
      console.error(e);
    } finally {
      setComputing(false);
    }
  };

  const trainModel = async () => {
    if (!engineRef.current) return;
    setTrainingStatus('Loading data...');
    setComputing(true);

    await engineRef.current.train((epoch, logs) => {
      setTrainingStatus(`Epoch ${epoch + 1}: Acc ${logs?.acc.toFixed(2)} | Loss ${logs?.loss.toFixed(4)}`);
    });

    setTrainingStatus('Training Complete!');
    setComputing(false);
  };

  const saveModel = async () => {
    if (!engineRef.current) return;
    await engineRef.current.saveModel();
  };

  return (
    <main className="w-screen h-screen flex bg-slate-950 text-slate-200">

      {/* Sidebar Control Panel */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col z-10 shadow-2xl backdrop-blur-md">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            CNN 3D Visualizer
          </h1>
          <p className="text-xs text-slate-500 mt-1">Interactive WebGPU Engine</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">

          {/* Mode Switcher */}
          <div className="flex p-1 bg-slate-800 rounded-lg">
            <button
              onClick={() => setActiveTab('draw')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-md transition-all ${activeTab === 'draw' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
            >
              <PenTool size={16} /> Draw
            </button>
            <button
              onClick={() => setActiveTab('train')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-md transition-all ${activeTab === 'train' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
            >
              <RefreshCw size={16} /> Train
            </button>
          </div>

          {/* DRAW MODE */}
          {activeTab === 'draw' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wider">
                  Input Canvas
                </label>
                <DrawingCanvas onDraw={handleDraw} width={240} height={240} />
              </div>

              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Prediction
                </div>
                <div className="flex items-center justify-center h-24">
                  {prediction !== null ? (
                    <span className="text-6xl font-bold text-emerald-400 drop-shadow-lg">
                      {prediction}
                    </span>
                  ) : (
                    <span className="text-slate-600 italic text-sm">Draw a digit...</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TRAIN MODE */}
          {activeTab === 'train' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
                <p className="text-sm text-slate-300">
                  Train the model directly in your browser using the MNIST dataset.
                </p>

                <div className="h-20 flex items-center justify-center bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-emerald-400 font-mono text-xs">
                    {trainingStatus || 'Ready to train'}
                  </span>
                </div>

                <button
                  onClick={trainModel}
                  disabled={isComputing}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isComputing ? <Loader2 className="animate-spin" /> : <Play size={16} />}
                  Start Training
                </button>
              </div>

              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
                <p className="text-sm text-slate-300">
                  Save weights to use optimally later.
                </p>
                <button
                  onClick={saveModel}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
                >
                  <Download size={16} /> Save Model
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3D Viewport */}
      <div className="flex-1 relative bg-slate-950">
        <NetworkView layers={layers} />

        {/* Computing Overlay */}
        {isComputing && activeTab === 'draw' && (
          <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur px-4 py-2 rounded-full border border-slate-700 flex items-center gap-2 z-50">
            <Loader2 className="animate-spin w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-300">Processing...</span>
          </div>
        )}

        {/* Info Panel */}
        {hoveredInfo && (
          <div className="absolute bottom-6 right-6 bg-slate-900/90 p-4 rounded-xl border border-slate-700 text-white w-64 backdrop-blur shadow-2xl">
            <h3 className="font-bold text-emerald-400 mb-2 border-b border-slate-800 pb-1">Voxel Info</h3>
            <div className="text-sm space-y-1 text-slate-300 font-mono">
              <div className="flex justify-between">
                <span>Layer:</span>
                <span className="text-white">{hoveredInfo.layerIndex}</span>
              </div>
              <div className="flex justify-between">
                <span>Index:</span>
                <span className="text-white">{hoveredInfo.voxelIndex}</span>
              </div>
              <div className="flex justify-between">
                <span>Activation:</span>
                <span className="text-emerald-400">{hoveredInfo.value.toFixed(4)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
