import dynamic from 'next/dynamic';

// Import Dynamic để tắt Server-Side Rendering cho 3D Canvas
const NetworkView = dynamic(() => import('@/components/scene/NetworkView'), {
  ssr: false,
  loading: () => <div className="flex h-screen items-center justify-center bg-black text-white">Loading AI Engine...</div>
});

export default function Home() {
  return (
    <main className="h-screen w-full bg-black">
      <NetworkView />
    </main>
  );
}
