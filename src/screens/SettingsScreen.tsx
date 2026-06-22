import { useState } from 'react';
import { Bluetooth, Search, Plus, Check, Volume2, ArrowLeft, Headphones, Loader2, Sparkles, Sliders, ToggleLeft, ToggleRight, Radio, RefreshCw } from 'lucide-react';
import { DSPConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsScreenProps {
  audioHook: any;
  bluetoothHook: any;
  onBack: () => void;
}

export function SettingsScreen({ audioHook, bluetoothHook, onBack }: SettingsScreenProps) {
  const { 
    dspConfig, 
    setDspConfig, 
  } = audioHook;
  
  const { device, batteryLevel, isConnecting, error, connect, disconnect } = bluetoothHook;
  const [isScanning, setIsScanning] = useState(false);

  const toggleDSP = (key: keyof DSPConfig) => {
    setDspConfig({ ...dspConfig, [key]: !dspConfig[key] });
  };

  const handleStartScan = async () => {
    setIsScanning(true);
    try {
      await connect();
    } catch (e) {
      console.warn("Bluetooth device request cancelled, closed, or disbarred", e);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-y-auto no-scrollbar pb-28 select-none">
      
      {/* Header section with liquid background */}
      <div className="px-6 pt-12 pb-5 flex items-center justify-between border-b border-white/20 bg-white/20 backdrop-blur-md">
        <button 
          onClick={onBack}
          className="w-10 h-10 bg-white/60 hover:bg-white/80 rounded-full border border-white/40 flex items-center justify-center text-[#2A2E35] shadow-sm hover:scale-105 active:scale-95 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="text-base font-extrabold text-[#1E2229] tracking-tight">Audio & Link Hardware</span>
        <div className="w-10 h-10 bg-white/20 rounded-full border border-white/10 flex items-center justify-center text-[#2A2E35]">
          <Bluetooth size={16} className={`${device ? 'text-emerald-500 animate-pulse' : 'text-gray-400'}`} />
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        
        {/* Real Bluetooth Connection Capsule / Radar Section */}
        <div className="bg-white/50 backdrop-blur-xl p-5 rounded-3xl border border-white/60 shadow-[0_12px_40px_rgba(0,0,0,0.03)] space-y-5 relative overflow-hidden">
          
          {/* Animated decorative waves in back */}
          <div className="absolute inset-0 pointer-events-none opacity-15 overflow-hidden">
            <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-emerald-500 rounded-full w-48 h-48 transition-transform duration-1000 ${isScanning || isConnecting ? 'scale-125 animate-ping' : 'scale-75'}`} />
            <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-emerald-400 rounded-full w-72 h-72 transition-transform duration-1000 ${isScanning || isConnecting ? 'scale-150 animate-ping delay-200' : 'scale-50'}`} />
          </div>

          <div className="flex flex-col items-center text-center pt-2 relative z-10">
            {/* Visual Glass Radar Disk with pulsating indicator */}
            <div className="w-24 h-24 bg-gradient-to-tr from-white/90 to-white/40 rounded-full border border-white/80 shadow-md flex items-center justify-center relative mb-4">
              <div className="absolute inset-1.5 bg-[#E8F8EE] rounded-full flex items-center justify-center">
                {isConnecting || isScanning ? (
                  <Loader2 size={32} className="text-emerald-500 animate-spin" />
                ) : (
                  <Headphones size={32} className={device ? "text-emerald-500 animate-bounce" : "text-gray-400"} />
                )}
              </div>
              
              {device && (
                <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm animate-pulse" />
              )}
            </div>

            <h3 className="text-sm font-extrabold text-[#1E2229]">
              {device ? "Pair Connected Successfully" : "Pair Wireless Audio device"}
            </h3>
            <p className="text-[10px] text-gray-500 font-semibold max-w-xs mt-1 leading-relaxed">
              Connect external low latency audio receivers, headphones, or recording interfaces directly.
            </p>
          </div>

          {/* Connected Device Card */}
          <AnimatePresence mode="wait">
            {device ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-emerald-50/70 border border-[#D5EEDC] p-4 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-[#EEF9F1] w-10 h-10 rounded-xl flex items-center justify-center text-[#10B981] shadow-inner shrink-0">
                    <Bluetooth size={18} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1F542A] text-xs truncate max-w-[150px]">{device.name || "Default Sound Receiver"}</h4>
                    <span className="text-[9px] bg-emerald-100 text-[#1F542A] px-1.5 py-0.5 rounded-md font-extrabold tracking-wide uppercase mt-0.5 inline-block">Active • AAC</span>
                  </div>
                </div>

                <button 
                  onClick={disconnect}
                  className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 text-[10px] font-extrabold rounded-xl shadow-sm cursor-pointer transition active:scale-95"
                >
                  Unpair link
                </button>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pt-1.5"
              >
                <button 
                  onClick={handleStartScan}
                  disabled={isConnecting || isScanning}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border border-white/40 text-white text-xs font-bold rounded-2xl flex items-center justify-center space-x-2 shadow-lg hover:shadow-cyan-500/10 transition transform active:scale-95 cursor-pointer leading-none"
                >
                  {isScanning ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Requesting Device Box...</span>
                    </>
                  ) : (
                    <>
                      <Bluetooth size={16} />
                      <span>Start Web Bluetooth Search</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Web Bluetooth Sandbox warning constraints */}
          {error && (
            <div className="px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-800 rounded-xl text-[10px] leading-relaxed font-semibold">
              <span className="block text-[11px] font-extrabold text-amber-900 mb-0.5">Sandbox restriction Info</span>
              <span>Web Bluetooth requires top-level document permissions. For hardware integration, click settings and choose <strong className="text-amber-900 font-bold">Open in New Tab</strong> to experience uncontained Bluetooth.</span>
            </div>
          )}

        </div>

        {/* Real-time DSP & Equalization Parameters */}
        <div className="bg-white/50 backdrop-blur-xl p-5 rounded-3xl border border-white/60 shadow-[0_12px_40px_rgba(0,0,0,0.03)] space-y-4">
          <div>
            <h4 className="text-xs font-extrabold text-[#1E2229] uppercase tracking-wider">Active Voice DSP Knobs</h4>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Processed directly in real-time inside the Web Audio pipeline.</p>
          </div>

          <div className="space-y-1 divide-y divide-white/20">
            
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-xs font-bold text-[#2A2E35]">Wind & Noise Suppression</p>
                <p className="text-[9px] text-gray-400">Attenuate static mic baseline noise</p>
              </div>
              <button 
                onClick={() => toggleDSP('noiseReduction')}
                className="cursor-pointer transition transform active:scale-[0.9] hover:scale-105"
              >
                {dspConfig.noiseReduction ? (
                  <ToggleRight size={44} className="text-emerald-500 drop-shadow-[0_2px_6px_rgba(16,185,129,0.2)]" />
                ) : (
                  <ToggleLeft size={44} className="text-gray-300" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-xs font-bold text-[#2A2E35]">Echo Feedback Cancellation</p>
                <p className="text-[9px] text-gray-400">Prevent audio howling feedback loops</p>
              </div>
              <button 
                onClick={() => toggleDSP('echoCancellation')}
                className="cursor-pointer transition transform active:scale-[0.9] hover:scale-105"
              >
                {dspConfig.echoCancellation ? (
                  <ToggleRight size={44} className="text-emerald-500 drop-shadow-[0_2px_6px_rgba(16,185,129,0.2)]" />
                ) : (
                  <ToggleLeft size={44} className="text-gray-300" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-xs font-bold text-[#2A2E35]">Automatic AGC gain limiters</p>
                <p className="text-[9px] text-gray-400">Regularize speaker distance fluctuations</p>
              </div>
              <button 
                onClick={() => toggleDSP('autoGainControl')}
                className="cursor-pointer transition transform active:scale-[0.9] hover:scale-105"
              >
                {dspConfig.autoGainControl ? (
                  <ToggleRight size={44} className="text-emerald-500 drop-shadow-[0_2px_6px_rgba(16,185,129,0.2)]" />
                ) : (
                  <ToggleLeft size={44} className="text-gray-300" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-xs font-bold text-[#2A2E35]">Mid-Band Vocal Enhancer</p>
                <p className="text-[9px] text-gray-400">Boost vocal clarity center by +5dB (1.5kHz)</p>
              </div>
              <button 
                onClick={() => toggleDSP('voiceBoost')}
                className="cursor-pointer transition transform active:scale-[0.9] hover:scale-105"
              >
                {dspConfig.voiceBoost ? (
                  <ToggleRight size={44} className="text-emerald-500 drop-shadow-[0_2px_6px_rgba(16,185,129,0.2)]" />
                ) : (
                  <ToggleLeft size={44} className="text-gray-300" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-xs font-bold text-[#2A2E35]">Smooth Dynamics Compressor</p>
                <p className="text-[9px] text-gray-400">Prevent crest clipping while raising quiet valleys</p>
              </div>
              <button 
                onClick={() => toggleDSP('compressor')}
                className="cursor-pointer transition transform active:scale-[0.9] hover:scale-105"
              >
                {dspConfig.compressor ? (
                  <ToggleRight size={44} className="text-emerald-500 drop-shadow-[0_2px_6px_rgba(16,185,129,0.2)]" />
                ) : (
                  <ToggleLeft size={44} className="text-gray-300" />
                )}
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Persistent Audio Route State footer banner */}
      <div className="absolute bottom-20 left-0 right-0 px-6 py-4 bg-white/40 backdrop-blur-xl border-t border-white/20 flex items-center justify-between shadow-soft">
        <div className="flex items-center space-x-2">
          <Volume2 className="text-emerald-500 w-4 h-4 animate-bounce" />
          <span className="text-[10px] font-bold text-[#2A2E35] uppercase tracking-wide">Audio Pipeline status</span>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-[#D5EEDC]">
          Route: {device ? device.name : 'Internal Microphone'}
        </span>
      </div>

    </div>
  );
}
