import { create } from 'zustand';

import { LayerData } from '@/core/CNNEngine';

export interface HoverInfo {
  layerIndex: number;
  voxelIndex: number;
  x: number;
  y: number;
  z: number;
  value: number;
}

interface CNNState {
  // Data
  layers: LayerData[];
  isComputing: boolean;
  error: string | null;
  hoveredInfo: HoverInfo | null;

  prediction: number | null;

  // Actions
  setPrediction: (pred: number | null) => void;
  setLayers: (layers: LayerData[]) => void;
  setComputing: (isComputing: boolean) => void;
  setError: (error: string | null) => void;
  setHoveredInfo: (info: HoverInfo | null) => void;
  reset: () => void;
}

export const useCNNStore = create<CNNState>((set) => ({
  layers: [],
  prediction: null,
  isComputing: false,
  error: null,
  hoveredInfo: null,

  setPrediction: (prediction) => set({ prediction }),
  setLayers: (layers) => set({ layers, error: null }),
  setComputing: (isComputing) => set({ isComputing }),
  setError: (error) => set({ error, isComputing: false }),
  setHoveredInfo: (hoveredInfo) => set({ hoveredInfo }),
  reset: () => set({ layers: [], error: null, hoveredInfo: null, prediction: null }),
}));
