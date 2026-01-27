import { create } from 'zustand';

export interface LayerData {
  name: string;
  // Shape: [Batch, Height, Width, Channels]
  shape: [number, number, number, number];
  data: Float32Array;
}

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

  // Actions
  setLayers: (layers: LayerData[]) => void;
  setComputing: (isComputing: boolean) => void;
  setError: (error: string | null) => void;
  setHoveredInfo: (info: HoverInfo | null) => void;
  reset: () => void;
}

export const useCNNStore = create<CNNState>((set) => ({
  layers: [],
  isComputing: false,
  error: null,
  hoveredInfo: null,

  setLayers: (layers) => set({ layers, error: null }),
  setComputing: (isComputing) => set({ isComputing }),
  setError: (error) => set({ error, isComputing: false }),
  setHoveredInfo: (hoveredInfo) => set({ hoveredInfo }),
  reset: () => set({ layers: [], error: null, hoveredInfo: null }),
}));
