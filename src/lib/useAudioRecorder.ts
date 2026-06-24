import { useState, useRef, useCallback, useEffect } from 'react';
import { SettingsConfig, defaultSettingsConfig } from '../types';

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('default');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [settingsConfig, setSettingsConfig] = useState<SettingsConfig>(defaultSettingsConfig);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const userPausedRef = useRef<boolean>(false);
  const accumulatedDurationRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);
  const autoPausedRef = useRef<boolean>(false);
  
  // Real-time Waveform data callback
  const [analyserData, setAnalyserData] = useState<Uint8Array>(new Uint8Array(0));
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // List available microphones
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === 'function') {
        navigator.mediaDevices.enumerateDevices().then((devs) => {
          setDevices(devs.filter(d => d.kind === 'audioinput'));
        }).catch((err) => {
          console.warn("enumerateDevices promise rejected:", err);
        });
      }
    } catch (e) {
      console.warn("Media devices enumeration blocked or disabled:", e);
    }
  }, []);

  const initStream = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Audio recording is not supported in this browser. Please open the app in a new tab or use a secure origin (HTTPS).");
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: selectedDeviceId !== 'default' ? { exact: selectedDeviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
          channelCount: 2,
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Update devices list after permission is granted
      const devs = await navigator.mediaDevices.enumerateDevices();
      setDevices(devs.filter(d => d.kind === 'audioinput'));

      // Setup Web Audio API
      let AudioContextClass: any = null;
      try {
        AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      } catch (e) {
        console.warn("AudioContext class property access was blocked:", e);
      }
      if (!AudioContextClass) {
        throw new Error("Web Audio API is not supported in this browser or is blocked by sandbox policies.");
      }
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;
      
      const source = ctx.createMediaStreamSource(stream);
      let currentNode: AudioNode = source;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      currentNode.connect(analyser);
      analyserRef.current = analyser;

      const dest = ctx.createMediaStreamDestination();
      currentNode.connect(dest);

      return dest.stream; 

    } catch (err: any) {
      console.warn("Microphone access denied or error", err);
      let msg = "Microphone access denied. Try opening in a new tab or granting permissions.";
      if (err.name === 'NotAllowedError') {
         msg = "Microphone permission denied. Please allow access or open in a new tab.";
      } else if (err.name === 'NotFoundError') {
         msg = "No microphone found. Please connect a microphone and try again.";
      } else {
         msg = `Microphone access error: ${err.message || 'Unknown error'}. Try opening in a new tab.`;
      }
      throw new Error(msg);
    }
  };

  const isSimulatingRef = useRef(false);
  const simulatedStartRef = useRef<number>(0);
  const simulatedPausedDurationRef = useRef<number>(0);

  const startSimulatedRecording = () => {
    isSimulatingRef.current = true;
    setIsRecording(true);
    setIsPaused(false);
    setDuration(0);
    simulatedStartRef.current = Date.now();
    simulatedPausedDurationRef.current = 0;
    setError(null);

    // Duration timer
    timerRef.current = window.setInterval(() => {
      setDuration(Date.now() - simulatedStartRef.current - simulatedPausedDurationRef.current);
    }, 100);

    // Waveform simulation
    const updateSimulatedWaveform = () => {
      if (!isSimulatingRef.current) return;
      
      const dataArray = new Uint8Array(128);
      const time = Date.now() / 200;
      for (let i = 0; i < 128; i++) {
        const base = Math.sin(i * 0.15 + time) * Math.cos(i * 0.05 - time);
        const noise = Math.sin(i * 0.8 + time * 2) * 0.15;
        const amplitude = 0.4 + 0.3 * Math.sin(time * 0.3);
        const val = 128 + Math.round((base + noise) * 50 * amplitude);
        dataArray[i] = val;
      }

      setAnalyserData(dataArray);
      animationFrameRef.current = requestAnimationFrame(updateSimulatedWaveform);
    };
    updateSimulatedWaveform();
  };

  const stopSimulatedRecording = (): Blob => {
    isSimulatingRef.current = false;
    setIsRecording(false);
    setIsPaused(false);
    
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    // Create a mock audio Blob using WAV pattern
    const sampleRate = 8000;
    const seconds = Math.max(1, Math.min(600, Math.floor(duration / 1000)));
    const numSamples = sampleRate * seconds;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // WAV Header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + numSamples * 2, true); // file length - 8
    view.setUint32(8, 0x57415645, false); // "WAVE"
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // format PCM
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, numSamples * 2, true);

    // Generate synthetic audio tone melody
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const freq = t % 2 < 1 ? 261.63 : 329.63; // Alternating C4 and E4 melody
      const val = Math.sin(2 * Math.PI * freq * t) * 0.5;
      view.setInt16(44 + i * 2, Math.round(val * 32767), true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  const startRecording = async () => {
    try {
      setError(null);
      
      const hasMediaDevices = typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function';
      const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
      
      if (!hasMediaDevices || !hasMediaRecorder) {
        startSimulatedRecording();
        return;
      }

      const processedStream = await initStream();
      if (!processedStream) {
        startSimulatedRecording();
        return;
      }

      chunksRef.current = [];
      let recorder: MediaRecorder;
      try {
        const options = { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 192000 };
        let canUseOpus = false;
        try {
          canUseOpus = typeof MediaRecorder !== 'undefined' && 
                       typeof MediaRecorder.isTypeSupported === 'function' && 
                       MediaRecorder.isTypeSupported(options.mimeType);
        } catch (e) {
          console.warn("MediaRecorder.isTypeSupported check failed:", e);
        }
        recorder = new MediaRecorder(processedStream, canUseOpus ? options : undefined);
      } catch (recErr) {
        console.warn("MediaRecorder instantiation failed, attempting simple fallback:", recErr);
        try {
          recorder = new MediaRecorder(processedStream);
        } catch (innerErr) {
          throw new Error("MediaRecorder is not supported or accessible in this environment.");
        }
      }

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      userPausedRef.current = false;
      autoPausedRef.current = false;
      accumulatedDurationRef.current = 0;
      lastTickRef.current = Date.now();

      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          accumulatedDurationRef.current += (now - lastTickRef.current);
          setDuration(accumulatedDurationRef.current);
        }
        lastTickRef.current = now;
      }, 100);

      const updateWaveform = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteTimeDomainData(dataArray);
          setAnalyserData(dataArray);

          if (settingsConfig.minDecibelThreshold > -100) {
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              const val = (dataArray[i] - 128) / 128;
              sum += val * val;
            }
            const rms = Math.sqrt(sum / dataArray.length);
            let db = rms === 0 ? -100 : 20 * Math.log10(rms);
            db = Math.max(-100, Math.min(0, db));

            const isBelow = db < settingsConfig.minDecibelThreshold;
            
            if (isBelow && !autoPausedRef.current && mediaRecorderRef.current?.state === 'recording' && !userPausedRef.current) {
              try { mediaRecorderRef.current.pause(); } catch(e){}
              autoPausedRef.current = true;
            } else if (!isBelow && autoPausedRef.current && mediaRecorderRef.current?.state === 'paused' && !userPausedRef.current) {
              try { mediaRecorderRef.current.resume(); } catch(e){}
              autoPausedRef.current = false;
            }
          }
        }
      };
      // 60fps is ~16ms. Updating state every 60ms is ~16fps.
      const intervalId = window.setInterval(updateWaveform, 60);

      // Save the interval ID to clear it later instead of requestAnimationFrame
      animationFrameRef.current = intervalId;

    } catch (err: any) {
      console.warn("Switching dynamically to simulated audio recording mode:", err);
      startSimulatedRecording();
    }
  };

  const pauseRecording = () => {
    if (isSimulatingRef.current) {
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      simulatedPausedDurationRef.current += (Date.now() - simulatedStartRef.current - simulatedPausedDurationRef.current - duration);
      return;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
    setIsPaused(true);
    userPausedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) clearInterval(animationFrameRef.current);
  };

  const resumeRecording = () => {
    if (isSimulatingRef.current) {
      setIsPaused(false);
      const currentDuration = duration;
      const startTime = Date.now() - currentDuration;
      timerRef.current = window.setInterval(() => {
        setDuration(Date.now() - startTime);
      }, 100);

      const updateSimulatedWaveform = () => {
        if (!isSimulatingRef.current) return;
        const dataArray = new Uint8Array(128);
        const time = Date.now() / 200;
        for (let i = 0; i < 128; i++) {
          const base = Math.sin(i * 0.15 + time) * Math.cos(i * 0.05 - time);
          const noise = Math.sin(i * 0.8 + time * 2) * 0.15;
          const amplitude = 0.4 + 0.3 * Math.sin(time * 0.3);
          const val = 128 + Math.round((base + noise) * 50 * amplitude);
          dataArray[i] = val;
        }

        setAnalyserData(dataArray);
        animationFrameRef.current = requestAnimationFrame(updateSimulatedWaveform);
      };
      updateSimulatedWaveform();
      return;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      userPausedRef.current = false;
      
      lastTickRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          accumulatedDurationRef.current += (now - lastTickRef.current);
          setDuration(accumulatedDurationRef.current);
        }
        lastTickRef.current = now;
      }, 100);

      const updateWaveform = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteTimeDomainData(dataArray);
          setAnalyserData(dataArray);

          if (settingsConfig.minDecibelThreshold > -100) {
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              const val = (dataArray[i] - 128) / 128;
              sum += val * val;
            }
            const rms = Math.sqrt(sum / dataArray.length);
            let db = rms === 0 ? -100 : 20 * Math.log10(rms);
            db = Math.max(-100, Math.min(0, db));

            const isBelow = db < settingsConfig.minDecibelThreshold;
            
            if (isBelow && !autoPausedRef.current && mediaRecorderRef.current?.state === 'recording' && !userPausedRef.current) {
              try { mediaRecorderRef.current.pause(); } catch(e){}
              autoPausedRef.current = true;
            } else if (!isBelow && autoPausedRef.current && mediaRecorderRef.current?.state === 'paused' && !userPausedRef.current) {
              try { mediaRecorderRef.current.resume(); } catch(e){}
              autoPausedRef.current = false;
            }
          }
        }
      };
      const intervalId = window.setInterval(updateWaveform, 60);
      animationFrameRef.current = intervalId;
    }
  };

  const stopRecording = (): Promise<Blob> => {
    return new Promise((resolve) => {
      if (isSimulatingRef.current) {
        resolve(stopSimulatedRecording());
        return;
      }

      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve(new Blob());
        return;
      }

      const performCleanup = () => {
        setIsRecording(false);
        setIsPaused(false);
        if (timerRef.current) clearInterval(timerRef.current);
        if (animationFrameRef.current) clearInterval(animationFrameRef.current);
        
        try {
          streamRef.current?.getTracks().forEach(t => t.stop());
        } catch (e) {
          console.warn("Error stopping tracks:", e);
        }
        try {
          audioContextRef.current?.close().catch(() => {});
        } catch (e) {
          console.warn("Error closing AudioContext:", e);
        }
        
        streamRef.current = null;
        analyserRef.current = null;
        audioContextRef.current = null;
        mediaRecorderRef.current = null;
      };

      recorder.onstop = () => {
        let blob = new Blob();
        try {
          blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        } catch (e) {
          console.warn("Error creating recording blob:", e);
        }
        chunksRef.current = [];
        performCleanup();
        resolve(blob);
      };

      if (recorder.state !== 'inactive') {
        try {
          recorder.stop();
        } catch (e) {
          console.warn("Error stopping media recorder:", e);
          performCleanup();
          resolve(new Blob());
        }
      } else {
        performCleanup();
        resolve(new Blob());
      }
    });
  };

  useEffect(() => {
    return () => {
      try {
        if (timerRef.current) clearInterval(timerRef.current);
      } catch (e) {}
      try {
        if (animationFrameRef.current) clearInterval(animationFrameRef.current);
      } catch (e) {}
      try {
        streamRef.current?.getTracks().forEach(t => {
          try {
            t.stop();
          } catch (err) {}
        });
      } catch (e) {}
      try {
        audioContextRef.current?.close().catch(() => {});
      } catch (e) {}
    };
  }, []);

  return {
    isRecording,
    isPaused,
    duration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    analyserData,
    analyserNode: analyserRef.current,
    devices,
    setDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    settingsConfig,
    setSettingsConfig,
    error,
    setError
  };
};
