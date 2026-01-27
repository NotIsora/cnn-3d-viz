// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Import file CSS ở bước dưới

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CNN 3D Visualizer",
  description: "Interactive 3D Visualization of Convolutional Neural Networks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
