'use client';

import React, { useRef, useEffect, useState } from 'react';

interface DrawingCanvasProps {
    onDraw: (imageData: number[][]) => void;
    width?: number;
    height?: number;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onDraw, width = 280, height = 280 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Fill black background
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, [width, height]);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(x, y);
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const { x, y } = getCoordinates(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            extractImage();
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);
        // Send empty grid
        extractImage();
    };

    const extractImage = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // 1. Get raw image data
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // 2. Find bounding box
        let minX = width, minY = height, maxX = 0, maxY = 0;
        let found = false;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const alpha = data[(y * width + x) * 4 + 3];
                // Check if pixel is drawn (white). In our case we draw white on black.
                // The drawing is white (255,255,255) on black (0,0,0).
                // We check Red channel or Alpha if applicable. 
                // Since we fillRect black, alpha is 255 everywhere, so check RGB.
                const r = data[(y * width + x) * 4];
                if (r > 20) { // Threshold
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                    found = true;
                }
            }
        }

        if (!found) {
            // Return empty 28x28
            const empty = Array(28).fill(0).map(() => Array(28).fill(0));
            onDraw(empty);
            return;
        }

        // 3. Crop and Scale into 20x20 box (standard MNIST is 20x20 in 28x28)
        const bboxWidth = maxX - minX + 1;
        const bboxHeight = maxY - minY + 1;
        const scalingFactor = 20 / Math.max(bboxWidth, bboxHeight);

        const newWidth = Math.round(bboxWidth * scalingFactor);
        const newHeight = Math.round(bboxHeight * scalingFactor);

        // Create temp canvas for scaling
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = 28;
        scaledCanvas.height = 28;
        const scaledCtx = scaledCanvas.getContext('2d');
        if (!scaledCtx) return;

        // Fill black
        scaledCtx.fillStyle = 'black';
        scaledCtx.fillRect(0, 0, 28, 28);

        // Center calculation
        // Center of Mass or Geometric Center? MNIST uses Center of Mass, 
        // but Geometric Center (bbox center) is 95% effective and simpler/faster for UI.
        // We put the scaled image in the center of 28x28.
        const startX = 4 + (20 - newWidth) / 2; // 4 padding + centering
        const startY = 4 + (20 - newHeight) / 2;

        // Draw cropped image onto scale canvas
        scaledCtx.drawImage(
            canvas,
            minX, minY, bboxWidth, bboxHeight,
            startX, startY, newWidth, newHeight
        );

        // 4. Extract final 28x28 data
        const finalData = scaledCtx.getImageData(0, 0, 28, 28).data;
        const inputMatrix: number[][] = [];

        for (let y = 0; y < 28; y++) {
            const row: number[] = [];
            for (let x = 0; x < 28; x++) {
                const index = (y * 28 + x) * 4;
                const val = finalData[index] / 255;
                row.push(val);
            }
            inputMatrix.push(row);
        }

        // Draw to debug canvas
        const debugCanvas = document.getElementById('debug-canvas') as HTMLCanvasElement;
        if (debugCanvas) {
            const debugCtx = debugCanvas.getContext('2d');
            if (debugCtx) {
                debugCtx.fillStyle = 'black';
                debugCtx.fillRect(0, 0, 28, 28);
                // We need to construct ImageData from inputMatrix to visualize it correcty
                // Or just use the tempCtx if it has the final state.
                // But wait, the previous logic (scaledCtx) has the final image.
                // Let's refactor slightly to just draw `scaledCtx` or `inputMatrix`.

                // visualizing inputMatrix
                const id = debugCtx.createImageData(28, 28);
                for (let i = 0; i < inputMatrix.length; i++) {
                    for (let j = 0; j < inputMatrix[i].length; j++) {
                        const val = inputMatrix[i][j] * 255;
                        const idx = (i * 28 + j) * 4;
                        id.data[idx] = val;   // R
                        id.data[idx + 1] = val; // G
                        id.data[idx + 2] = val; // B
                        id.data[idx + 3] = 255; // A
                    }
                }
                debugCtx.putImageData(id, 0, 0);
            }
        }

        onDraw(inputMatrix);
    };

    return (
        <div className="flex flex-col gap-2">
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="cursor-crosshair border-2 border-slate-600 rounded-lg touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
            <div className="flex gap-2">
                <button
                    onClick={clearCanvas}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors"
                >
                    Clear
                </button>
            </div>
            {/* Debug View: Show what the model sees */}
            <div className="mt-2 text-xs text-slate-500">
                <p>Model Input (28x28):</p>
                <canvas
                    id="debug-canvas"
                    width={28}
                    height={28}
                    className="border border-slate-700 bg-black mt-1 w-28 h-28 image-pixelated"
                />
            </div>
        </div>
    );
};
