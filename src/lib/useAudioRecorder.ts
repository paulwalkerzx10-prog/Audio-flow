import { useState, useRef, useCallback, useEffect } from 'react';
import { DSPConfig, defaultDSPConfig } from '../types';

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('default');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [dspConfig, setDspConfig] = useState<DSPConfig>(defaultDSPConfig);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  
  // Real-time Waveform data callback
  const [analyserData, setAnalyserData] = useState<Uint8Array>(new Uint8Array(0));
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Only available initially if granted or prompt needed
    navigator.mediaDevices.enumerateDevices().then((devs) => {
      setDevices(devs.filter(d => d.kind === 'audioinput'));
    }).catch(console.warn);
  }, []);

  const initStream = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Audio recording is not supported in this browser environment. Please open the app in a new tab or use a secure origin (HTTPS).");
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: selectedDeviceId !== 'default' && selectedDeviceId !== 'simulated-bluetooth' ? { exact: selectedDeviceId } : undefined,
          echoCancellation: dspConfig.echoCancellation,
          noiseSuppression: dspConfig.noiseReduction,
          autoGainControl: dspConfig.autoGainControl,
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Update devices list after permission is granted
      const devs = await navigator.mediaDevices.enumerateDevices();
      const filtered = devs.filter(d => d.kind === 'audioinput');
      
      // Keep the simulated device if it is selected or already added
      setDevices((prev) => {
        const hasSimulated = prev.some(d => d.deviceId === 'simulated-bluetooth');
        if (hasSimulated) {
          const simDevice = prev.find(d => d.deviceId === 'simulated-bluetooth')!;
          return [...filtered, simDevice];
        }
        return filtered;
      });

      // Setup Web Audio API for further DSP & Analysis
      const ctx = new window.AudioContext();
      audioContextRef.current = ctx;
      
      const source = ctx.createMediaStreamSource(stream);
      let currentNode: AudioNode = source;

      if (dspConfig.voiceBoost) {
        // Boost midrange frequencies for vocal clarity
        const eqInfo = ctx.createBiquadFilter();
        eqInfo.type = 'peaking';
        eqInfo.frequency.value = 1500; // Human voice freq center approx
        eqInfo.gain.value = 5;         // Boost by 5dB
        eqInfo.Q.value = 1;
        currentNode.connect(eqInfo);
        currentNode = eqInfo;
      }

      if (dspConfig.compressor) {
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-24, ctx.currentTime);
        compressor.knee.setValueAtTime(30, ctx.currentTime);
        compressor.ratio.setValueAtTime(12, ctx.currentTime);
        compressor.attack.setValueAtTime(0.003, ctx.currentTime);
        compressor.release.setValueAtTime(0.25, ctx.currentTime);
        currentNode.connect(compressor);
        currentNode = compressor;
      }

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      currentNode.connect(analyser);
      analyserRef.current = analyser;

      // In order to record the processed audio, we would pipe it to a media stream destination
      // Using MediaRecorder on the original stream to keep it simple and high quality, but we'll use analyser for UI visualization.
      // Alternatively, we can record the Web Audio destination:
      const dest = ctx.createMediaStreamDestination();
      currentNode.connect(dest);

      return dest.stream; 

    } catch (err: any) {
      console.error("Microphone access denied or error", err);
      // Determine user-friendly message
      let msg = "Microphone access denied. Try opening in a new tab or granting permissions.";
      if (err.name === 'NotAllowedError') {
         msg = "Microphone permission denied. Please allow access or open in a new tab.";
      } else if (err.name === 'NotFoundError' || err.message?.includes('Requested device not found')) {
         msg = "No microphone found. Please connect a microphone and try again.";
      } else {
         msg = `Microphone access error: ${err.message || 'Unknown error'}. Try opening in a new tab.`;
      }
      throw new Error(msg);
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      const processedStream = await initStream();
      if (!processedStream) return;

      chunksRef.current = [];
      const options = { mimeType: 'audio/webm;codecs=opus' };
      const recorder = new MediaRecorder(processedStream, MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);

      // Start duration timer
      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        setDuration(Date.now() - startTime);
      }, 100);

      const updateWaveform = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteTimeDomainData(dataArray);
          setAnalyserData(dataArray);
        }
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();

    } catch (err: any) {
      setError(err.message || "Failed to start recording. Please check microphone permissions.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      const currentDuration = duration;
      const startTime = Date.now() - currentDuration;
      timerRef.current = window.setInterval(() => {
        setDuration(Date.now() - startTime);
      }, 100);

      const updateWaveform = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteTimeDomainData(dataArray);
          setAnalyserData(new Uint8Array(dataArray));
        }
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();
    }
  };

  const stopRecording = (): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) return resolve(new Blob());

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        chunksRef.current = [];
        resolve(blob);
      };

      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioContextRef.current?.close();
      
      streamRef.current = null;
      analyserRef.current = null;
      audioContextRef.current = null;
    });
  };

  // cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioContextRef.current?.close();
    };
  }, []);

  const addSimulatedDevice = (label: string) => {
    setDevices((prev) => {
      if (prev.some(d => d.deviceId === 'simulated-bluetooth')) return prev;
      const mockDev = {
        deviceId: 'simulated-bluetooth',
        groupId: 'simulated-group',
        kind: 'audioinput',
        label: label,
      } as MediaDeviceInfo;
      return [...prev, mockDev];
    });
    setSelectedDeviceId('simulated-bluetooth');
  };

  const removeSimulatedDevice = () => {
    setDevices((prev) => prev.filter(d => d.deviceId !== 'simulated-bluetooth'));
    setSelectedDeviceId('default');
  };

  return {
    isRecording,
    isPaused,
    duration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    analyserData,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    dspConfig,
    setDspConfig,
    error,
    setError,
    addSimulatedDevice,
    removeSimulatedDevice
  };
};
