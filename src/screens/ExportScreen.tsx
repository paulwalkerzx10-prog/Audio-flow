import { useRef, useState, useEffect } from 'react';
import { 
  Play, Pause, Trash2,
  Sparkles, ArrowLeft, RotateCcw, RotateCw, 
  Download, AlertCircle
} from 'lucide-react';
import { Recording } from '../types';
import { motion } from 'motion/react';

interface ExportScreenProps {
  recording: Recording;
  onBack: () => void;
  onDelete: (id: string) => void;
}

export function ExportScreen({ recording, onBack, onDelete }: ExportScreenProps) {
  const [activeTrack, setActiveTrack] = useState<Recording>(recording);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0.42);
  const [currentTimeStr, setCurrentTimeStr] = useState('01:14.30');
  const [totalTimeStr, setTotalTimeStr] = useState('02:56.00');
  
  const [errorMsg, setErrorMsg] = useState('');

  // Export parameters
  const [exportFormat, setExportFormat] = useState('WAV');
  const [exportQuality, setExportQuality] = useState('High (Lossless)');
  const [exportSampleRate, setExportSampleRate] = useState('48 kHz');
  const [exportBitrate, setExportBitrate] = useState('320 kbps');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [blobUrl, setBlobUrl] = useState<string>('');

  // Sync activeTrack state with incoming prop
  useEffect(() => {
    setActiveTrack(recording);
  }, [recording]);

  // Create or update object URL for active player cleanly
  useEffect(() => {
    let url = '';
    if (activeTrack && activeTrack.blob && activeTrack.blob.size > 0) {
      try {
        url = URL.createObjectURL(activeTrack.blob);
        setBlobUrl(url);
      } catch (e) {
        console.warn("URL.createObjectURL is blocked or failed in this sandbox environment:", e);
        setBlobUrl('');
      }
      return () => {
        if (url) {
          try {
            URL.revokeObjectURL(url);
          } catch (e) {}
        }
      };
    } else {
      setBlobUrl('');
    }
  }, [activeTrack]);

  // Auto update correct time ranges if real blob or demo is attached
  useEffect(() => {
    if (activeTrack && activeTrack.durationMs > 0) {
      const totalSec = Math.floor(activeTrack.durationMs / 1000);
      const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
      const s = (totalSec % 60).toString().padStart(2, '0');
      setTotalTimeStr(`${m}:${s}.00`);
      setCurrentTimeStr('00:00.00');
      setProgress(0);
    } else {
      setTotalTimeStr('02:56.00');
      setCurrentTimeStr('01:14.30');
      setProgress(0.42);
    }
    setIsPlaying(false);
  }, [activeTrack]);

  // Simulate playback for demo track when blobUrl is empty
  useEffect(() => {
    if (isPlaying && !blobUrl && activeTrack && activeTrack.durationMs > 0) {
      const startMs = progress * activeTrack.durationMs;
      const startTime = Date.now() - startMs;
      const interval = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= activeTrack.durationMs) {
          setIsPlaying(false);
          setProgress(0);
          setCurrentTimeStr('00:00.00');
          window.clearInterval(interval);
        } else {
          const currentProgress = elapsed / activeTrack.durationMs;
          setProgress(currentProgress);
          
          const totalSeconds = Math.floor(elapsed / 1000);
          const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
          const s = (totalSeconds % 60).toString().padStart(2, '0');
          const msPart = Math.floor((elapsed % 1000) / 10).toString().padStart(2, '0');
          setCurrentTimeStr(`${m}:${s}.${msPart}`);
        }
      }, 50);
      return () => window.clearInterval(interval);
    }
  }, [isPlaying, blobUrl, activeTrack]);

  // Playback handlers
  const togglePlay = () => {
    if (audioRef.current && blobUrl) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => {
          console.warn("Direct blob playback error inside nested iframe, running demo play state", e);
        });
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      const p = audioRef.current.currentTime / audioRef.current.duration;
      setProgress(p);
      
      const curMs = Math.floor(audioRef.current.currentTime * 1000);
      const totalSeconds = Math.floor(curMs / 1000);
      const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
      const s = (totalSeconds % 60).toString().padStart(2, '0');
      const msPart = Math.floor((curMs % 1000) / 10).toString().padStart(2, '0');
      setCurrentTimeStr(`${m}:${s}.${msPart}`);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const handleExport = () => {
    if (!activeTrack?.blob || activeTrack.blob.size === 0) {
      setErrorMsg("No active audio signal found. Please record a voice note first.");
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }
    if (!blobUrl) return;
    try {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${activeTrack?.title || 'voice-note'}.${exportFormat.toLowerCase()}`;
      a.click();
    } catch (e: any) {
      console.warn("Failed to trigger automatic download inside sandboxed iframe:", e);
      setErrorMsg("Download blocked by browser iframe constraints. Try opening the app in a new tab.");
      setTimeout(() => setErrorMsg(''), 5000);
    }
  };

  const isPlaceholder = !activeTrack || activeTrack.id === 'placeholder';

  return (
    <div className="flex flex-col h-full bg-transparent overflow-y-auto no-scrollbar pb-28 select-none">
      
      {/* Dynamic Header */}
      <div className="px-6 pt-12 pb-5 flex items-center justify-between border-b border-white/10 bg-white/15 backdrop-blur-xl">
        <div className="flex items-center space-x-3.5">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-white/30 hover:bg-white/50 rounded-full border border-white/30 flex items-center justify-center text-[#2A2E35] shadow-sm hover:scale-105 active:scale-95 transition"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-base font-extrabold text-[#1E2229] flex items-center space-x-1.5 leading-none">
              <span>Studio Desk</span>
              <Sparkles size={14} className="text-emerald-500 animate-pulse" />
            </h1>
            <p className="text-[10px] text-gray-500 font-semibold mt-1">
              {isPlaceholder ? "No recording loaded" : `${activeTrack.title}`}
            </p>
          </div>
        </div>

        {!isPlaceholder && activeTrack && (
          <button 
            id="delete-recording-btn"
            onClick={() => {
              if (activeTrack) {
                onDelete(activeTrack.id);
                onBack();
              }
            }}
            className="w-10 h-10 bg-red-50/70 hover:bg-red-100/80 text-red-500 rounded-full border border-red-100 flex items-center justify-center hover:scale-105 active:scale-95 transition"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">

        {errorMsg && (
          <div className="p-3.5 bg-red-55/90 border border-red-200 text-red-800 rounded-2xl flex items-start space-x-2 text-xs shadow-md backdrop-blur-md">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {isPlaceholder ? (
          /* Stunning liquid-glass onboarding view when no recording has been selected */
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/15 backdrop-blur-2xl border border-white/30 p-8 rounded-3xl text-center space-y-5 shadow-sm"
          >
            <div className="relative w-20 h-20 bg-gradient-to-tr from-emerald-100 to-teal-50/30 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center shadow-md">
                <Download size={28} className="text-emerald-500 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-[#1E2229]">Select a Voice Track to Export</h3>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed max-w-xs mx-auto">
                No raw recording is active. Navigate to Library to tap an existing voice, or open the Home portal to record a new voiceover instantly.
              </p>
            </div>

            <div className="pt-2 flex flex-col space-y-2.5">
              <button 
                onClick={onBack}
                className="py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-extrabold rounded-2xl shadow-md hover:scale-[1.02] active:scale-95 transition cursor-pointer"
              >
                Go to Library
              </button>
              
              {/* Fallback load demo state so they can interact with the EQ dials right away */}
              <button 
                onClick={() => {
                  // Simply simulate an onboarding demo clip loaded in active state
                  setActiveTrack({
                    id: 'demo-track',
                    title: 'Inspirational Podcast (Demo Workspace)',
                    date: Date.now(),
                    durationMs: 176000,
                    blob: new Blob(),
                    tags: ['Draft'],
                    isBookmarked: false
                  });
                  setIsPlaying(false);
                }}
                className="py-3 bg-white/30 hover:bg-white/50 text-emerald-600 border border-white/30 text-xs font-extrabold rounded-2xl shadow-sm transition active:scale-95 cursor-pointer"
              >
                Try Demo track
              </button>
            </div>
          </motion.div>
        ) : (
          /* Multi-grid high end audio workspace */
          <div className="space-y-6">

            {/* Interactive wave module */}
            <div className="bg-white/15 backdrop-blur-2xl rounded-3xl p-5 border border-white/25 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-700 bg-[#EEF9F1] px-2.5 py-1 rounded-full border border-[#D5EEDC]">
                  Track Signal 1
                </span>
                <span className="text-[10px] font-bold text-gray-400 bg-white/30 px-2 py-0.5 rounded border border-[#EDECE9]/30 uppercase">Mono</span>
              </div>

              {/* Neo Waveform track container */}
              <div className="relative w-full h-36 bg-white/5 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden flex items-center justify-center px-4 my-1 shadow-inner">
                
                {/* Simulated high-fidelity level bars */}
                <div className="flex items-center justify-between w-full h-20 opacity-70">
                  {[...Array(40)].map((_, i) => {
                    const h = Math.abs(Math.sin(i * 0.4) * 55) + Math.cos(i * 0.15) * 20 + 20;
                    return (
                      <div 
                        key={i} 
                        className={`w-1 rounded-full transition-all duration-300 ${i > 7 && i < 31 ? 'bg-emerald-500' : 'bg-gray-300'}`} 
                        style={{ height: `${h}%` }}
                      ></div>
                    );
                  })}
                </div>

                {/* Progress playhead */}
                <div className="absolute top-0 bottom-0 w-[1.5px] bg-red-400 z-20" style={{ left: `${progress * 100}%` }}>
                  <div className="w-2.5 h-2.5 bg-red-400 rounded-full -ml-[4.5px] shadow-sm"></div>
                </div>
              </div>

              {/* Timelines statistics */}
              <div className="flex justify-between text-[10px] text-gray-400 font-mono leading-none font-semibold">
                <span>00:00.00</span>
                <span className="text-emerald-600">Track Progress</span>
                <span>{totalTimeStr}</span>
              </div>

              {/* Core Media playback and dynamic control buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-[#EDECE9]/40">
                <div className="flex items-center space-x-3.5">
                  <button 
                    id="audio-play-pause-btn"
                    onClick={togglePlay}
                    className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-full flex items-center justify-center text-white shadow-md transition transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                  </button>

                  <div className="p-2.5 bg-white/30 backdrop-blur-md rounded-xl border border-white/30 text-[#1E2229]">
                    <span className="text-base font-bold font-mono tracking-tight">{currentTimeStr}</span>
                    <span className="text-xs text-gray-400 font-mono font-bold ml-1">/ {totalTimeStr}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => {
                      try {
                        if (audioRef.current) {
                          audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
                        }
                      } catch (e) {
                        console.warn("Could not seek backwards:", e);
                      }
                    }}
                    className="w-8 h-8 rounded-full bg-white/30 hover:bg-white/60 border border-white/30 flex items-center justify-center text-gray-500 cursor-pointer"
                  >
                    <RotateCcw size={13} />
                  </button>
                  <button 
                    onClick={() => {
                      try {
                        if (audioRef.current) {
                          audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 5);
                        }
                      } catch (e) {
                        console.warn("Could not seek forwards:", e);
                      }
                    }}
                    className="w-8 h-8 rounded-full bg-white/30 hover:bg-white/60 border border-white/30 flex items-center justify-center text-gray-500 cursor-pointer"
                  >
                    <RotateCw size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Format selectors & Solid glowing export buttons */}
            <div className="bg-white/15 backdrop-blur-2xl rounded-3xl p-5 border border-white/25 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-[#1E2229] uppercase tracking-wider">Format Export Settings</h3>
              
              <div className="grid grid-cols-3 gap-1 bg-white/20 p-1 rounded-xl border border-white/20 backdrop-blur-md">
                {['WAV', 'M4A', 'MP3'].map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      exportFormat === fmt 
                        ? 'bg-emerald-500 text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
                  <span>Quality Profile</span>
                  <select 
                    value={exportQuality}
                    onChange={(e) => setExportQuality(e.target.value)}
                    className="bg-white/30 backdrop-blur-md border border-white/30 rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#2A2E35] outline-none animate-none"
                  >
                    <option>High (Lossless)</option>
                    <option>Standard (Dynamic)</option>
                    <option>Compact (Compressed)</option>
                  </select>
                </div>

                <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
                  <span>Sample Rate</span>
                  <select 
                    value={exportSampleRate}
                    onChange={(e) => setExportSampleRate(e.target.value)}
                    className="bg-white/30 backdrop-blur-md border border-white/30 rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#2A2E35] outline-none animate-none"
                  >
                    <option>48 kHz</option>
                    <option>44.1 kHz</option>
                    <option>32 kHz</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EDECE9]/40 space-y-2.5">
                <button 
                  onClick={handleExport}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border border-white/40 text-white text-xs font-extrabold rounded-2xl flex items-center justify-center space-x-2 shadow-lg cursor-pointer transform active:scale-95 transition"
                >
                  <Download size={15} strokeWidth={2.5} />
                  <span>Download Clip</span>
                </button>

                <p className="text-[9px] text-center text-gray-400 font-bold">Estimated output size: <strong className="text-gray-600">{(activeTrack?.blob ? (activeTrack.blob.size / (1024 * 1024)).toFixed(1) : 12.3)} MB</strong></p>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Hidden audio element for actual live playbacks of selected recordings */}
      <audio 
        ref={audioRef} 
        src={blobUrl || undefined} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={(e) => {
          console.warn("Audio element error caught and suppressed:", e);
        }}
      />

    </div>
  );
}
