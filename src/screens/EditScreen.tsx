import { useRef, useState, useEffect } from 'react';
import { 
  Play, Pause, Volume2, Save, Trash2, Scissors, SplitSquareVertical, Mic, 
  Sparkles, Sliders, Check, HelpCircle, ArrowLeft, RotateCcw, RotateCw, 
  FileAudio, Share2, Star, Download, Music, Radio, FolderPlus, Compass, Eye, AlertCircle
} from 'lucide-react';
import { Recording } from '../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface EditScreenProps {
  recording: Recording;
  onBack: () => void;
  onDelete: (id: string) => void;
}

export function EditScreen({ recording, onBack, onDelete }: EditScreenProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0.42);
  const [currentTimeStr, setCurrentTimeStr] = useState('01:14.30');
  const [totalTimeStr, setTotalTimeStr] = useState('02:56.00');
  
  // Audio state parameters matching property reference panel
  const [toolSelected, setToolSelected] = useState('trim');
  const [volume, setVolume] = useState(90);
  const [isNormalized, setIsNormalized] = useState(true);
  
  // Equalizer presets & fader parameters
  const [eqPreset, setEqPreset] = useState('Voice Clarity');
  const [eqValues, setEqValues] = useState({
    '60Hz': 5,
    '150Hz': 9,
    '400Hz': 12,
    '1kHz': 6,
    '2.5kHz': 10,
    '12kHz': 7,
    '16kHz': 3,
  });

  // Export parameters
  const [exportFormat, setExportFormat] = useState('WAV');
  const [exportQuality, setExportQuality] = useState('High (Lossless)');
  const [exportSampleRate, setExportSampleRate] = useState('48 kHz');
  const [exportBitrate, setExportBitrate] = useState('320 kbps');

  // Other dynamic audio parameters
  const [otherEffects, setOtherEffects] = useState({
    noiseReduction: true,
    compressor: true,
    reverb: false,
    pitchShift: false,
    voiceEnhance: true,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto update correct time ranges if real blob is attached
  useEffect(() => {
    if (recording && recording.durationMs > 0) {
      const totalSec = Math.floor(recording.durationMs / 1000);
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
  }, [recording]);

  // Playback handlers
  const togglePlay = () => {
    if (audioRef.current && recording.blob && recording.blob.size > 0) {
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

  const handlePresetSelect = (preset: string) => {
    setEqPreset(preset);
    if (preset === 'Flat') {
      setEqValues({ '60Hz': 0, '150Hz': 0, '400Hz': 0, '1kHz': 0, '2.5kHz': 0, '12kHz': 0, '16kHz': 0 });
    } else if (preset === 'Voice Clarity') {
      setEqValues({ '60Hz': -3, '150Hz': 2, '400Hz': 8, '1kHz': 12, '2.5kHz': 9, '12kHz': 4, '16kHz': 1 });
    } else if (preset === 'Bass Boost') {
      setEqValues({ '60Hz': 12, '150Hz': 10, '400Hz': 5, '1kHz': 0, '2.5kHz': -2, '12kHz': -3, '16kHz': -4 });
    } else if (preset === 'Treble+') {
      setEqValues({ '60Hz': -5, '150Hz': -2, '400Hz': 1, '1kHz': 4, '2.5kHz': 8, '12kHz': 12, '16kHz': 10 });
    }
  };

  const handleExport = () => {
    if (!recording.blob || recording.blob.size === 0) {
      alert("No active audio signal found. Please record a voice note first.");
      return;
    }
    const url = URL.createObjectURL(recording.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.title || 'voice-note'}.${exportFormat.toLowerCase()}`;
    a.click();
  };

  const isPlaceholder = recording.id === 'placeholder';

  return (
    <div className="flex flex-col h-full bg-transparent overflow-y-auto no-scrollbar pb-28 select-none">
      
      {/* Dynamic Header */}
      <div className="px-6 pt-12 pb-5 flex items-center justify-between border-b border-white/20 bg-white/25 backdrop-blur-md">
        <div className="flex items-center space-x-3.5">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-white/70 hover:bg-white rounded-full border border-white/50 flex items-center justify-center text-[#2A2E35] shadow-sm hover:scale-105 active:scale-95 transition"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-base font-extrabold text-[#1E2229] flex items-center space-x-1.5 leading-none">
              <span>Studio Desk</span>
              <Sparkles size={14} className="text-emerald-500 animate-pulse" />
            </h1>
            <p className="text-[10px] text-gray-500 font-semibold mt-1">
              {isPlaceholder ? "No recording loaded" : `${recording.title}`}
            </p>
          </div>
        </div>

        {!isPlaceholder && (
          <button 
            id="delete-recording-btn"
            onClick={() => {
              onDelete(recording.id);
              onBack();
            }}
            className="w-10 h-10 bg-red-50/70 hover:bg-red-100/80 text-red-500 rounded-full border border-red-100 flex items-center justify-center hover:scale-105 active:scale-95 transition"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">

        {isPlaceholder ? (
          /* Stunning liquid-glass onboarding view when no recording has been selected */
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/40 backdrop-blur-xl border border-white/60 p-8 rounded-3xl text-center space-y-5 shadow-sm"
          >
            <div className="relative w-20 h-20 bg-gradient-to-tr from-emerald-100 to-teal-50/30 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center shadow-md">
                <Scissors size={28} className="text-emerald-500 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-[#1E2229]">Select a Voice Track to Edit</h3>
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
                  // Simply simulate an onboarding demo clip
                  recording.id = 'demo-track';
                  recording.title = 'Inspirational Podcast (Demo Workspace)';
                  recording.date = Date.now();
                  recording.durationMs = 176000;
                  setIsPlaying(false);
                }}
                className="py-3 bg-white/70 hover:bg-white text-emerald-600 border border-white/60 text-xs font-extrabold rounded-2xl shadow-sm transition active:scale-95 cursor-pointer"
              >
                Try Editor demo track
              </button>
            </div>
          </motion.div>
        ) : (
          /* Multi-grid high end audio workspace */
          <div className="space-y-6">

            {/* Interactive wave module */}
            <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/60 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-700 bg-[#EEF9F1] px-2.5 py-1 rounded-full border border-[#D5EEDC]">
                  Track Signal 1
                </span>
                <span className="text-[10px] font-bold text-gray-400 bg-white/60 px-2 py-0.5 rounded border border-[#EDECE9] uppercase">Mono</span>
              </div>

              {/* Neo Waveform track container */}
              <div className="relative w-full h-36 bg-[#FAF8F5]/80 rounded-2xl border border-white/60 overflow-hidden flex items-center justify-center px-4 my-1 shadow-inner">
                
                {/* Highlight selector trim block segment between 20% and 80% */}
                <div className="absolute top-0 bottom-0 left-[20%] right-[25%] bg-emerald-500/5 border-x border-emerald-500 flex justify-between items-center z-10">
                  <div className="w-3 h-3 bg-emerald-500 border-2 border-white rounded-full -ml-1.5 shadow-md animate-pulse"></div>
                  <div className="w-3 h-3 bg-emerald-500 border-2 border-white rounded-full -mr-1.5 shadow-md animate-pulse"></div>
                </div>

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
                <span className="text-emerald-600">Trim Select block</span>
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

                  <div className="p-2.5 bg-white/70 rounded-xl border border-white/60 text-[#1E2229]">
                    <span className="text-base font-bold font-mono tracking-tight">{currentTimeStr}</span>
                    <span className="text-xs text-gray-400 font-mono font-bold ml-1">/ {totalTimeStr}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => {
                      if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
                    }}
                    className="w-8 h-8 rounded-full bg-white/60 hover:bg-white/90 border border-white/60 flex items-center justify-center text-gray-500 cursor-pointer"
                  >
                    <RotateCcw size={13} />
                  </button>
                  <button 
                    onClick={() => {
                      if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 5);
                    }}
                    className="w-8 h-8 rounded-full bg-white/60 hover:bg-white/90 border border-white/60 flex items-center justify-center text-gray-500 cursor-pointer"
                  >
                    <RotateCw size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Parametric Equalizer Faders Rack */}
            <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/60 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-[#1E2229] uppercase tracking-wider">Voice Parametric EQ</h3>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Refine audio frequency spectrum nodes smoothly</p>
                </div>

                {/* Preset choices toolbar */}
                <div className="flex items-center space-x-1 bg-white/60 p-1 rounded-full border border-white/60 shadow-inner">
                  {['Flat', 'Voice Clarity', 'Bass Boost', 'Treble+'].map(prst => (
                    <button
                      key={prst}
                      onClick={() => handlePresetSelect(prst)}
                      className={`px-3 py-1 rounded-full text-[9px] font-extrabold transition-all cursor-pointer ${
                        eqPreset === prst 
                          ? 'bg-emerald-500 text-white shadow-sm' 
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {prst.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7 Band sliders faders container */}
              <div className="h-40 flex items-center justify-around bg-[#FAF8F5]/80 rounded-2xl border border-white/80 px-2 mt-2 shadow-inner relative overflow-hidden">
                {(Object.keys(eqValues) as Array<keyof typeof eqValues>).map((freq) => {
                  const dbVal = eqValues[freq];
                  return (
                    <div key={freq} className="flex flex-col items-center h-full justify-between py-2">
                      <span className="text-[8px] font-bold text-emerald-600 font-mono tracking-tighter">
                        {dbVal > 0 ? `+${dbVal}` : dbVal}dB
                      </span>

                      {/* Vert track slider */}
                      <div className="relative w-1 h-20 bg-gray-200 rounded-full flex justify-center">
                        <input 
                          type="range"
                          min="-12"
                          max="12"
                          value={dbVal}
                          onChange={(e) => {
                            setEqValues({ ...eqValues, [freq]: parseInt(e.target.value) });
                            setEqPreset('Custom');
                          }}
                          className="absolute h-full w-full opacity-0 cursor-ns-resize z-20 pointer-events-auto"
                          style={{ writingMode: 'bt-lr' } as any}
                        />
                        {/* Interactive dynamic slider handle bead */}
                        <div 
                          className="w-3.5 h-3.5 bg-white border border-emerald-500 rounded-full absolute shadow-sm z-10 transition-all duration-75"
                          style={{ bottom: `${((dbVal + 12) / 24) * 85}%` }}
                        />
                      </div>

                      <span className="text-[9px] font-mono font-bold text-gray-500">{freq}</span>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic effects checks */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {[
                  { key: 'noiseReduction', title: 'Smart Gate Filter', desc: 'Silence mic static hums' },
                  { key: 'compressor', title: 'Level Compression', desc: 'Graceful peak limiter' },
                  { key: 'reverb', title: 'Spatial Reverb', desc: 'Virtual room acoustic depth' },
                  { key: 'voiceEnhance', title: 'Vocal Presence', desc: 'Warm presence boost' },
                ].map(item => (
                  <div 
                    key={item.key}
                    className="bg-white/60 p-3 rounded-2xl border border-white/60 flex items-center justify-between"
                  >
                    <div>
                      <h5 className="text-[11px] font-bold text-[#2A2E35] leading-none">{item.title}</h5>
                      <p className="text-[9px] text-gray-400 mt-1 leading-none">{item.desc}</p>
                    </div>
                    <button 
                      onClick={() => setOtherEffects({ ...otherEffects, [item.key]: !otherEffects[item.key as keyof typeof otherEffects] })}
                      className="shrink-0 cursor-pointer"
                    >
                      <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${otherEffects[item.key as keyof typeof otherEffects] ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                        <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform ${otherEffects[item.key as keyof typeof otherEffects] ? 'transform translate-x-[14px]' : ''}`} />
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Properties and quick volume controllers */}
            <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/60 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-[#1E2229] uppercase tracking-wider">Sound Track Volume Gain</h3>
              
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                <span>Vocal Gain multiplier</span>
                <span className="font-bold text-emerald-600 font-mono">{(volume - 90) > 0 ? `+${(volume - 90) / 10}dB` : `${(volume - 90) / 10}dB`}</span>
              </div>
              <div className="flex items-center space-x-3.5">
                <span className="text-[10px] text-gray-400 font-bold">MIN</span>
                <input 
                  type="range" 
                  min="0" 
                  max="120" 
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  className="flex-1 accent-emerald-500 h-1 bg-gray-250 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-gray-400 font-bold">MAX</span>
              </div>
            </div>

            {/* Format selectors & Solid glowing export buttons */}
            <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/60 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-[#1E2229] uppercase tracking-wider">Format Export Settings</h3>
              
              <div className="grid grid-cols-3 gap-1 bg-white/60 p-1 rounded-xl border border-white/40">
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
                    className="bg-white/60 border border-white/60 rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#2A2E35] outline-none"
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
                    className="bg-white/60 border border-white/60 rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#2A2E35] outline-none"
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
                  <span>Download Transformed Clip</span>
                </button>

                <p className="text-[9px] text-center text-gray-400 font-bold">Estimated output size: <strong className="text-gray-600">{(recording.blob ? (recording.blob.size / (1024 * 1024)).toFixed(1) : 12.3)} MB</strong></p>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Hidden audio element for actual live playbacks of selected recordings */}
      {recording && recording.blob && recording.blob.size > 0 && (
        <audio 
          ref={audioRef} 
          src={URL.createObjectURL(recording.blob)} 
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />
      )}

    </div>
  );
}
