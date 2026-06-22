import { useState, useEffect } from 'react';
import { Mic, X, MessageSquare, Bell, Settings, Circle, Check, AlertCircle, Share2, Save, Trash2, Edit, Headphones } from 'lucide-react';
import { Waveform } from '../components/Waveform';
import { saveRecording } from '../lib/storage';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface RecordScreenProps {
  audioHook: any; 
  bluetoothHook: any;
  onSaveCompleted: () => void;
  onNavigateToTab: (tab: string) => void;
}

export function RecordScreen({ audioHook, bluetoothHook, onSaveCompleted, onNavigateToTab }: RecordScreenProps) {
  const {
    isRecording,
    isPaused,
    duration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    analyserData,
    error
  } = audioHook;
  
  const { device, batteryLevel } = bluetoothHook;
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  const handleStartStop = async () => {
    if (isRecording) {
      if (isPaused) {
        resumeRecording();
      } else {
        pauseRecording();
      }
    } else {
      await startRecording();
    }
  };

  const handleSave = async () => {
    const blob = await stopRecording();
    if (blob.size > 0 && duration > 0) {
      const title = `Vocala Note - ${format(new Date(), 'MMM dd, hh:mm a')}`;
      const rec = {
        id: crypto.randomUUID(),
        title,
        date: Date.now(),
        durationMs: duration,
        blob,
        tags: ['Recordings'],
        isBookmarked: false
      };
      await saveRecording(rec);
      setShowSavedFeedback(true);
      setTimeout(() => {
        setShowSavedFeedback(false);
        onSaveCompleted();
      }, 1200);
    }
  };

  const formatDurationHM = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative select-none overflow-hidden pb-28">
      
      {/* Decorative top translucent header panel */}
      <div className="px-6 pt-12 pb-5 flex items-center justify-between border-b border-white/20 bg-white/25 backdrop-blur-md">
        
        {/* Connection status pill */}
        <div 
          onClick={() => onNavigateToTab('settings')}
          className="flex items-center space-x-3 bg-white/70 hover:bg-white p-2 pr-4 rounded-full border border-white/50 shadow-sm cursor-pointer transition active:scale-95"
        >
          <div className="bg-[#EAF3EB] w-9 h-9 rounded-full flex items-center justify-center text-emerald-500 shadow-inner">
            <Headphones size={18} className={device ? "animate-bounce" : ""} />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-bold text-[#2A2E35] leading-none shrink-0">{device ? device.name : 'Device Standby'}</h4>
            <div className="flex items-center space-x-1 mt-1">
              <span className={`text-[9px] font-extrabold tracking-wide uppercase ${device ? 'text-emerald-500' : 'text-gray-400'}`}>
                {device ? 'Linked' : 'Receiver Off'}
              </span>
              <span className="text-[9px] text-[#A3A099]">• {device && batteryLevel !== null ? `${batteryLevel}%` : 'Phone Mic'}</span>
            </div>
          </div>
        </div>

        {/* Navigation settings fob */}
        <button 
          onClick={() => onNavigateToTab('settings')}
          className="w-10 h-10 bg-white/70 hover:bg-white rounded-full border border-white/50 flex items-center justify-center text-[#2A2E35] shadow-sm hover:scale-105 active:scale-95 transition"
        >
          <Settings size={18} />
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3.5 bg-red-50/80 border border-red-100 rounded-2xl flex items-start space-x-2 text-red-700 text-xs shadow-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Pop-up feedback when saved successfully */}
      <AnimatePresence>
        {showSavedFeedback && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-28 left-6 right-6 z-50 bg-[#EEF9F1]/95 text-[#1F542A] border border-[#D5EEDC] px-4 py-3 rounded-2xl shadow-lg flex items-center space-x-2.5 backdrop-blur-md"
          >
            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-extrabold shadow-sm">
              <Check size={11} strokeWidth={3.5} />
            </div>
            <span className="text-xs font-extrabold tracking-tight">Audio saved successfully to Recordings Library!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Centered recording portal widget */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        
        <div className="relative flex items-center justify-center w-72 h-72">
          
          {/* Pulsating glowing rings when active */}
          <AnimatePresence>
            {isRecording && !isPaused && (
              <motion.div 
                initial={{ transform: 'scale(1)', opacity: 0.3 }}
                animate={{ transform: 'scale(1.23)', opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                className="absolute inset-4 rounded-full bg-emerald-400/20 z-0 pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Frosted beveled outer ring */}
          <div className="absolute inset-0 rounded-full bg-white/35 backdrop-blur-lg border border-white/80 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.06)] flex items-center justify-center z-10">
            
            {/* Emerald/grey dynamic track orbit */}
            <div className={`absolute inset-8 rounded-full border-4 ${isRecording && !isPaused ? 'border-emerald-500' : 'border-gray-200'} transition-all duration-300 flex items-center justify-center bg-white/90 shadow-inner z-20`}>
              
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center space-x-1.5 mb-1.5 bg-[#EEF9F1] px-3 py-0.5 rounded-full border border-[#D5EEDC]">
                  <Circle className={`w-2.5 h-2.5 fill-emerald-500 text-emerald-500 ${isRecording && !isPaused ? 'animate-pulse' : ''}`} />
                  <span className="text-[9px] font-extrabold text-[#1F542A] tracking-wider uppercase">Live</span>
                </div>

                <div className="text-4xl font-extrabold tracking-tight text-[#1E2229] font-mono leading-none my-1">
                  {formatDurationHM(duration)}
                </div>

                <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wide mt-2">
                  {isRecording ? (isPaused ? 'Recording paused' : 'Voice Link Active') : 'Tap mic to initiate'}
                </p>
              </div>

            </div>
          </div>

          {/* Left: Pause Controller */}
          <button 
            onClick={isRecording ? handleStartStop : undefined}
            disabled={!isRecording}
            className={`absolute left-[-20px] w-12 h-12 rounded-full border border-white flex items-center justify-center shadow-md transition duration-300 z-30 ${isRecording ? 'opacity-100 bg-white cursor-pointer hover:scale-105 active:scale-95 text-[#2A2E35]' : 'opacity-30 bg-[#FAF8F5] text-gray-300 pointer-events-none'}`}
          >
            {isPaused ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            )}
          </button>

          {/* Right: Master recording handler trigger button */}
          <button 
            id="mic-record-btn"
            onClick={isRecording ? handleSave : handleStartStop}
            className={`absolute right-[-20px] w-12 h-12 rounded-full border-2 border-white flex items-center justify-center shadow-lg transition duration-300 z-30 cursor-pointer ${isRecording ? 'bg-[#EF4444] text-white hover:bg-red-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'} hover:scale-105 active:scale-95`}
          >
            {isRecording ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
            ) : (
              <Mic size={20} className="animate-pulse" />
            )}
          </button>

        </div>

        {/* Real-time Detailed Waveform Container */}
        <div className="w-full my-6 bg-white/30 backdrop-blur-md rounded-2xl p-4 border border-white/40 shadow-sm relative overflow-hidden">
          <Waveform data={analyserData} isRecording={isRecording && !isPaused} />
        </div>

        {/* Signal parameters details capsule panel */}
        <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/60 shadow-sm w-full grid grid-cols-3 gap-3 text-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Interface link</span>
            <span className="text-xs font-extrabold text-[#2A2E35] mt-1 block truncate">48 kHz • 24bit</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Compression</span>
            <span className="text-xs font-extrabold text-[#2A2E35] mt-1 block">Opus codec</span>
          </div>

          <div className="flex flex-col justify-center px-1">
            <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider text-left mb-1">Sensitivity status</span>
            <div className="flex items-center space-x-1.5">
              <div className="flex-1 h-2 bg-gray-250 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 h-full transition-all duration-100 animate-pulse" style={{ width: isRecording && !isPaused ? '70%' : '10%' }}></div>
              </div>
              <span className="text-[8px] font-bold text-emerald-600 shrink-0 uppercase tracking-tighter">HD audio</span>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Action options strip */}
      <div className="px-6 pt-2.5 grid grid-cols-4 gap-3.5 relative z-10 shrink-0">
        
        <button 
          onClick={() => onNavigateToTab('recordings')} 
          className="flex flex-col items-center justify-center p-3 bg-white/70 hover:bg-white border border-white/60 rounded-2xl shadow-sm text-gray-700 hover:text-emerald-600 transition hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Edit size={18} className="mb-1" />
          <span className="text-[10px] font-extrabold tracking-tight">Studio List</span>
        </button>

        <button 
          onClick={isRecording ? handleSave : undefined}
          disabled={!isRecording}
          className="flex flex-col items-center justify-center p-3 bg-white/70 border border-white/60 rounded-2xl shadow-sm text-gray-700 hover:text-emerald-600 transition hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-45 disabled:pointer-events-none"
        >
          <Save size={18} className="mb-1" />
          <span className="text-[10px] font-extrabold tracking-tight">Save</span>
        </button>

        <button 
          onClick={() => {
            stopRecording();
          }}
          disabled={!isRecording}
          className="flex flex-col items-center justify-center p-3 bg-red-50/50 hover:bg-red-50 border border-red-100 rounded-2xl shadow-sm text-red-500 transition hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-45 disabled:pointer-events-none col-span-2"
        >
          <Trash2 size={18} className="mb-1 text-red-400" />
          <span className="text-[10px] font-extrabold tracking-tight">Discard Buffer</span>
        </button>
      </div>

    </div>
  );
}
