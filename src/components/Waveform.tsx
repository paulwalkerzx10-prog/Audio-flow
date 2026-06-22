import React, { useRef, useEffect } from 'react';

interface WaveformProps {
  data: Uint8Array;
  isRecording: boolean;
}

export function Waveform({ data, isRecording }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const draw = () => {
      // Fix for retina displays
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);
      
      const centerY = height / 2;
      
      // Draw baseline
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.strokeStyle = '#e2e8f0'; // slate-200
      ctx.lineWidth = 1;
      ctx.stroke();

      if (data.length > 0 && isRecording) {
        ctx.beginPath();
        const sliceWidth = width / data.length;
        let x = 0;

        for (let i = 0; i < data.length; i++) {
          const v = data[i] / 128.0;
          const y = v * centerY;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#2563eb'; // blue-600
        ctx.stroke();
        
        // Add a gentle fill underneath
        ctx.lineTo(x, centerY);
        ctx.lineTo(0, centerY);
        ctx.fillStyle = 'rgba(37, 99, 235, 0.1)';
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [data, isRecording]);

  return (
    <div className="w-full h-40">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
