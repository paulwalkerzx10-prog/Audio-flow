import React from 'react';
import { ArrowLeft, Sliders, Bluetooth, Activity } from 'lucide-react';
import { SettingsConfig } from '../types';

interface SettingsScreenProps {
  audioHook: any;
  onBack: () => void;
}

export function SettingsScreen({ audioHook, onBack }: SettingsScreenProps) {
  const { 
    settingsConfig, 
    setSettingsConfig,
    devices,
    selectedDeviceId,
    setSelectedDeviceId
  } = audioHook;

  const toggleBluetooth = () => {
    if (setSettingsConfig) {
      setSettingsConfig((prev: SettingsConfig) => ({
        ...prev,
        bluetoothEarbuds: !prev.bluetoothEarbuds
      }));
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (setSettingsConfig) {
      setSettingsConfig((prev: SettingsConfig) => ({
        ...prev,
        minDecibelThreshold: val
      }));
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-y-auto no-scrollbar pb-28 select-none">
      
      {/* Header section */}
      <div className="px-6 pt-12 pb-5 flex items-center justify-between border-b border-white/20 bg-white/20 backdrop-blur-md">
        <button 
          onClick={onBack}
          className="w-10 h-10 bg-white/60 hover:bg-white/80 rounded-full border border-white/40 flex items-center justify-center text-[#2A2E35] shadow-sm hover:scale-105 active:scale-95 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="text-base font-extrabold text-[#1E2229] tracking-tight">Settings</span>
        <div className="w-10 h-10 bg-white/20 rounded-full border border-white/10 flex items-center justify-center text-[#2A2E35]">
          <Sliders size={16} className="text-emerald-500" />
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        
        {/* Input Device Selection */}
        <div className="bg-white/50 backdrop-blur-xl p-5 rounded-3xl border border-white/60 shadow-[0_12px_40px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 shadow-inner">
              <Bluetooth size={18} />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-extrabold text-[#1E2229] uppercase tracking-wider">Audio Input Device</h4>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Select a headset or microphone</p>
            </div>
            <button 
              onClick={async () => {
                try {
                  const nav = navigator as any;
                  if (nav.bluetooth) {
                    await nav.bluetooth.requestDevice({ acceptAllDevices: true });
                    // Refresh devices list after pairing
                    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                      const devs = await navigator.mediaDevices.enumerateDevices();
                      const audioInputDevices = devs.filter(d => d.kind === 'audioinput');
                      if (audioHook && audioHook.setDevices) {
                        audioHook.setDevices(audioInputDevices);
                      }
                    }
                  } else {
                    alert("Bluetooth pairing is not supported in this browser.");
                  }
                } catch (e) {
                  console.warn("Bluetooth pairing canceled or failed:", e);
                }
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95 flex items-center space-x-1 cursor-pointer"
            >
              <Bluetooth size={12} />
              <span>Pair Device</span>
            </button>
          </div>

          <div className="pt-1">
            <div className="bg-white/30 backdrop-blur-md p-3.5 rounded-2xl border border-white/40">
              <select 
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId?.(e.target.value)}
                className="w-full bg-white/50 border border-white/40 rounded-xl px-3 py-2.5 text-xs font-bold text-[#2A2E35] outline-none"
              >
                <option value="default">Default System Microphone</option>
                {devices?.map((dev: MediaDeviceInfo) => (
                  <option key={dev.deviceId} value={dev.deviceId}>
                    {dev.label || `Device (${dev.deviceId.slice(0, 5)}...)`}
                  </option>
                ))}
              </select>
              <p className="text-[9px] text-gray-400 mt-2 ml-1">
                Ensure your Bluetooth earbuds are paired to your device before selecting them.
              </p>
            </div>
          </div>
        </div>

        {/* Minimum Decibel Slider */}
        <div className="bg-white/50 backdrop-blur-xl p-5 rounded-3xl border border-white/60 shadow-[0_12px_40px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 shadow-inner">
              <Activity size={18} />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-[#1E2229] uppercase tracking-wider">Recording Threshold</h4>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Adjust minimum decibel level</p>
            </div>
          </div>

          <div className="bg-white/30 backdrop-blur-md p-5 rounded-2xl border border-white/40 space-y-4">
            <div className="flex justify-between items-center text-xs font-bold text-[#2A2E35]">
              <span>Min Decibels</span>
              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-extrabold">
                {settingsConfig.minDecibelThreshold} dB
              </span>
            </div>
            <input 
              type="range" 
              min="-100" 
              max="0" 
              value={settingsConfig.minDecibelThreshold} 
              onChange={handleSliderChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-medium">
              <span>-100 dB (Sensitive)</span>
              <span>0 dB (Loud only)</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
