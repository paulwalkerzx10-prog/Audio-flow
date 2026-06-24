import { useState, useEffect } from 'react';
import { Mic, X, MessageSquare, Bell, Settings, Circle, Check, AlertCircle, Share2, Save, Trash2, Edit, Headphones } from 'lucide-react';
import { Waveform } from '../components/Waveform';
import { saveRecording } from '../lib/storage';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface RecordScreenProps {
  audioHook: any; 
  onSaveCompleted: () => void;
  onNavigateToTab: (tab: string) => void;
}

export function RecordScreen({ audioHook, onSaveCompleted, onNavigateToTab }: RecordScreenProps) {
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
  
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  const handleStartStop = async () => {
    try {
      if (isRecording) {
        if (isPaused) {
          resumeRecording();
        } else {
          pauseRecording();
        }
      } else {
        await startRecording();
      }
    } catch (e: any) {
      console.warn("handleStartStop failed gracefully:", e);
    }
  };

  const handleSave = async () => {
    try {
      const blob = await stopRecording();
      if (blob && blob.size > 0 && duration > 0) {
        const title = `Vocala Note - ${format(new Date(), 'MMM dd, hh:mm a')}`;
        const rec = {
          id: (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') 
            ? crypto.randomUUID() 
            : 'rec_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36),
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
    } catch (e: any) {
      console.warn("handleSave failed gracefully:", e);
    }
  };

  const formatDurationHM = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const getAudioAmplitude = () => {
    if (!isRecording || isPaused || !analyserData || analyserData.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < analyserData.length; i++) {
      const val = Math.abs(analyserData[i] - 128);
      sum += val;
    }
    const avg = sum / analyserData.length;
    return Math.min(avg / 48, 1);
  };

  const getDecibels = () => {
    if (!isRecording || isPaused || !analyserData || analyserData.length === 0) return -60;
    let sum = 0;
    for (let i = 0; i < analyserData.length; i++) {
      const val = (analyserData[i] - 128) / 128;
      sum += val * val;
    }
    const rms = Math.sqrt(sum / analyserData.length);
    if (rms === 0) return -60;
    let db = 20 * Math.log10(rms);
    return Math.max(-60, Math.min(0, db));
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative select-none overflow-hidden pb-28">
      
      {/* Decorative top translucent header panel */}
      <div className="px-6 pt-12 pb-5 flex items-center justify-between border-b border-white/10 bg-white/15 backdrop-blur-xl">
        
        {/* Brand Identity Title */}
        <div className="flex items-center space-x-2.5">
          <div className="bg-[#EAF3EB] w-9 h-9 rounded-full flex items-center justify-center text-emerald-500 shadow-inner">
            <Mic size={18} />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-[#1E2229] leading-none">Vocala Studio</h1>
            <p className="text-[10px] text-gray-400 font-bold mt-1">High-Fidelity Audio capture</p>
          </div>
        </div>

        {/* Navigation settings fob */}
        <button 
          onClick={() => onNavigateToTab('settings')}
          className="w-10 h-10 bg-white/40 hover:bg-white/60 rounded-full border border-white/30 flex items-center justify-center text-[#2A2E35] shadow-sm hover:scale-105 active:scale-95 transition"
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
          
          {/* Circular wave beat animation reacting on recording (slow and smooth) */}
          <div className="absolute inset-[-40px] z-0 pointer-events-none flex items-center justify-center">
            {isRecording && !isPaused ? (
              Array.from({ length: 4 }).map((_, i) => {
                const amp = getAudioAmplitude();
                return (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1 + i * 0.18, 1.25 + i * 0.22 + amp * 0.45, 1 + i * 0.18],
                      rotate: [i * 30, i * 30 + 180, i * 30 + 360],
                      opacity: [0.12, 0.45 + amp * 0.25, 0.12],
                    }}
                    transition={{
                      duration: 4.5 + i * 1.5, // Slow, smooth, and hypnotic
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute inset-4 rounded-full border border-emerald-400/30 shadow-[0_0_32px_rgba(16,185,129,0.06)]"
                    style={{
                      borderStyle: i % 2 === 0 ? 'solid' : 'dashed',
                      borderWidth: `${1 + i * 0.5}px`,
                    }}
                  />
                );
              })
            ) : (
              // Ambient breathing rings when inactive/paused
              <motion.div
                animate={{
                  scale: [0.96, 1.04, 0.96],
                  opacity: [0.08, 0.14, 0.08],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-8 rounded-full border border-emerald-500/10"
              />
            )}
          </div>

          {/* Frosted beveled outer ring */}
          <div className="absolute inset-0 rounded-full bg-white/20 backdrop-blur-2xl border border-white/40 shadow-[0_24px_64px_rgba(0,0,0,0.04)] flex items-center justify-center z-10">
            
            {/* Emerald/grey dynamic track orbit */}
            <div className={`absolute inset-8 rounded-full border-4 ${isRecording && !isPaused ? 'border-emerald-500' : 'border-gray-200'} transition-all duration-300 flex items-center justify-center bg-white/60 backdrop-blur-md border border-white/35 shadow-inner z-20`}>
              
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

        {/* Real-time Detailed Waveform & DB Meter Container */}
        <div className="w-full my-6 flex space-x-3">
          <div className="flex-1 bg-white/15 backdrop-blur-xl rounded-2xl p-4 border border-white/25 shadow-sm relative overflow-hidden">
            <Waveform 
              analyserNode={audioHook.analyserNode || null} 
              fallbackData={analyserData} 
              isRecording={isRecording && !isPaused} 
            />
          </div>
          
          <div className="w-14 shrink-0 bg-white/15 backdrop-blur-xl rounded-2xl p-2 border border-white/25 shadow-sm flex flex-col items-center justify-between relative">
            <div className="text-[10px] font-extrabold text-[#2A2E35] font-mono mb-2">
              {Math.round(getDecibels())}
              <span className="text-[8px] text-gray-500 block -mt-1 text-center">dB</span>
            </div>
            <div className="w-4 flex-1 bg-gray-200/50 rounded-full overflow-hidden flex items-end justify-center pb-1">
               <motion.div 
                 className="w-full rounded-full"
                 animate={{ 
                   height: `${Math.max(4, Math.min(100, ((getDecibels() + 60) / 60) * 100))}%`, 
                   backgroundColor: `hsl(${120 * (1 - Math.max(0, Math.min(1, (getDecibels() + 60) / 60)))}, 80%, 50%)` 
                 }}
                 transition={{ type: "tween", duration: 0.1 }}
               />
            </div>
          </div>
        </div>

        {/* Signal parameters details capsule panel */}
        <div className="bg-white/15 backdrop-blur-2xl rounded-2xl p-4 border border-white/30 shadow-sm w-full grid grid-cols-3 gap-3 text-center">
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
          className="flex flex-col items-center justify-center p-3 bg-white/35 hover:bg-white/50 border border-white/30 backdrop-blur-lg rounded-2xl shadow-sm text-gray-700 hover:text-emerald-600 transition hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Edit size={18} className="mb-1" />
          <span className="text-[10px] font-extrabold tracking-tight">Studio List</span>
        </button>

        <button 
          onClick={isRecording ? handleSave : undefined}
          disabled={!isRecording}
          className="flex flex-col items-center justify-center p-3 bg-white/35 hover:bg-white/50 border border-white/30 backdrop-blur-lg rounded-2xl shadow-sm text-gray-700 hover:text-emerald-600 transition hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-45 disabled:pointer-events-none"
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
