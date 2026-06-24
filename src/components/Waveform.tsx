import React, { useRef, useEffect } from 'react';

interface WaveformProps {
  analyserNode: AnalyserNode | null;
  fallbackData: Uint8Array; // Used for the simulated mode
  isRecording: boolean;
}

export function Waveform({ analyserNode, fallbackData, isRecording }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fallbackDataRef = useRef<Uint8Array>(fallbackData);
  const isRecordingRef = useRef<boolean>(isRecording);

  useEffect(() => {
    fallbackDataRef.current = fallbackData;
    isRecordingRef.current = isRecording;
  }, [fallbackData, isRecording]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;
    
    // We'll use frequency data or time domain data depending on the visualizer style
    // A mirrored time-domain or frequency bar visualizer looks great.
    // For a voice recording app, smoothed time-domain bars or frequency bars are best.
    const dataArray = analyserNode ? new Uint8Array(analyserNode.frequencyBinCount) : null;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const newWidth = Math.floor(rect.width) || 300;
      const newHeight = Math.floor(rect.height) || 160;
      
      const dpr = window.devicePixelRatio || 1;
      const targetWidth = Math.floor(newWidth * dpr);
      const targetHeight = Math.floor(newHeight * dpr);
      
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.scale(dpr, dpr);
      }
      width = newWidth;
      height = newHeight;
    };

    resizeCanvas();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        window.requestAnimationFrame(resizeCanvas);
      });
      resizeObserver.observe(container);
    } else {
      window.addEventListener('resize', resizeCanvas);
    }

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      
      ctx.clearRect(0, 0, width, height);
      
      const centerY = height / 2;
      
      // Draw baseline
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.strokeStyle = '#e2e8f0'; // slate-200
      ctx.lineWidth = 2;
      ctx.stroke();

      const currentlyRecording = isRecordingRef.current;

      if (currentlyRecording) {
        let currentData: Uint8Array;
        
        if (analyserNode && dataArray) {
          // Use Web Audio API directly!
          analyserNode.getByteTimeDomainData(dataArray);
          currentData = dataArray;
        } else {
          // Fallback for simulated recording
          currentData = fallbackDataRef.current;
        }

        if (currentData && currentData.length > 0) {
          const barWidth = 4;
          const gap = 3;
          const totalBarWidth = barWidth + gap;
          const numBars = Math.floor(width / totalBarWidth);
          
          // Downsample the data to the number of bars
          const rawStep = currentData.length / numBars;
          const step = Math.max(1, Math.floor(rawStep));
          
          for (let i = 0; i < numBars; i++) {
            let sum = 0;
            let count = 0;
            const startIdx = Math.floor(i * rawStep);
            const endIdx = Math.floor((i + 1) * rawStep);
            const actualEnd = Math.max(startIdx + 1, endIdx); // Ensure at least 1 item is read
            
            for (let j = startIdx; j < actualEnd; j++) {
              if (j < currentData.length) {
                // value is between 0 and 255. 128 is silence.
                sum += Math.abs(currentData[j] - 128);
                count++;
              }
            }
            const avg = count > 0 ? sum / count : 0;
            
            // Normalize and scale height
            const val = avg / 128.0; 
            // Enhance the visual slightly so small noises show up
            const barHeight = Math.max(2, val * height * 0.8);
            
            const x = i * totalBarWidth + (width - numBars * totalBarWidth) / 2;
            
            // Draw mirrored rounded bar
            ctx.fillStyle = '#10B981'; // emerald-500
            
            // Top half
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(x, centerY - barHeight / 2, barWidth, barHeight / 2, [4, 4, 0, 0]);
            } else {
              ctx.rect(x, centerY - barHeight / 2, barWidth, barHeight / 2);
            }
            ctx.fill();
            
            // Bottom half (slightly lighter/transparent)
            ctx.fillStyle = 'rgba(16, 185, 129, 0.5)';
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(x, centerY, barWidth, barHeight / 2, [0, 0, 4, 4]);
            } else {
              ctx.rect(x, centerY, barWidth, barHeight / 2);
            }
            ctx.fill();
          }
        }
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', resizeCanvas);
      }
    };
  }, [analyserNode]); // Re-bind if analyserNode changes

  return (
    <div ref={containerRef} className="w-full h-40">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
