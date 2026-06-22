import { Bluetooth, Info, Mic, Loader2 } from 'lucide-react';
import { DSPConfig } from '../types';

interface SettingsScreenProps {
  audioHook: any;
  bluetoothHook: any;
  onBack: () => void;
}

export function SettingsScreen({ audioHook, bluetoothHook, onBack }: SettingsScreenProps) {
  const { 
    devices, 
    selectedDeviceId, 
    setSelectedDeviceId, 
    dspConfig, 
    setDspConfig, 
    addSimulatedDevice, 
    removeSimulatedDevice 
  } = audioHook;
  const { device, batteryLevel, isConnecting, error, connect, connectSimulated, disconnect, isSimulated } = bluetoothHook;

  const toggleDSP = (key: keyof DSPConfig) => {
    setDspConfig({ ...dspConfig, [key]: !dspConfig[key] });
  };

  const handleConnectSimulated = () => {
    connectSimulated();
    addSimulatedDevice('AirPods Pro Mic (Simulated)');
  };

  const handleDisconnect = () => {
    disconnect();
    removeSimulatedDevice();
  };



  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="flex items-center p-4 pt-12 bg-slate-50">
        <button onClick={onBack} className="p-2 text-gray-800">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h1 className="text-lg font-medium mx-auto -ml-3">Bluetooth & DSP</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-10">
          {/* Bluetooth Header section */}
          <div className="flex flex-col items-center justify-center py-6">
              <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center relative shadow-sm text-blue-600">
                  <div className="absolute inset-0 bg-blue-100 rounded-full scale-125 opacity-30"></div>
                  <div className="absolute inset-0 bg-blue-50 rounded-full scale-150 opacity-20"></div>
                  {isConnecting ? <Loader2 size={48} className="animate-spin" /> : <Bluetooth size={48} className="text-shadow-sm" />}
              </div>
              <p className="mt-8 text-gray-500 font-medium text-sm">
                  {device ? 'Connected to' : 'No Bluetooth Device'}
              </p>
              <h2 className="text-2xl font-semibold text-gray-900 mt-1">
                  {device ? device.name || 'Unknown Device' : 'Standby'}
              </h2>
              
              {device && (
                  <div className="flex items-center space-x-2 mt-3 bg-blue-50 px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-blue-700 text-sm font-semibold tracking-tight">
                          {batteryLevel !== null ? `${batteryLevel}% Battery` : 'Connected (No Battery Info)'}
                      </span>
                  </div>
              )}
          </div>

          <div className="px-6 mt-4 space-y-6">
              {error && (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs space-y-2 mb-2">
                    <p className="font-semibold">{error}</p>
                    <p className="opacity-90">Chrome/Firefox block direct Bluetooth inside embedded frames. Click the button below to simulate connection and see it in action!</p>
                </div>
              )}

              {/* Bluetooth Controls */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                  {device ? (
                      <div className="p-4 flex items-center justify-between bg-blue-50/20">
                          <div className="flex items-center">
                              <Bluetooth className="text-blue-600 w-5 h-5 mr-3 animate-pulse" />
                              <span className="font-semibold text-blue-900">{device.name || 'Bluetooth Device'}</span>
                              {isSimulated && <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">SIMULATED</span>}
                          </div>
                           <button 
                            onClick={handleDisconnect}
                            className="text-sm text-red-500 font-semibold px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
                          >
                              Disconnect
                          </button>
                      </div>
                  ) : (
                      <div className="p-4 space-y-3">
                          <button 
                              onClick={connect}
                              disabled={isConnecting}
                              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                          >
                              <Bluetooth size={18} />
                              <span>{isConnecting ? 'Connecting...' : 'Connect Bluetooth Earbud'}</span>
                          </button>
                          
                          <button 
                              onClick={handleConnectSimulated}
                              disabled={isConnecting}
                              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer text-sm"
                          >
                              <span>Demo: Simulate Earbud Connection</span>
                          </button>
                          
                          <p className="text-[11px] text-gray-500 text-center px-2 leading-relaxed">
                              Tip: If the browser frame blocks hardware permission requests, the <strong className="text-slate-700">Simulate</strong> button lets you preview full functionality.
                          </p>
                      </div>
                  )}
              </div>

              {/* Input Device Selection */}
              <div>
                  <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Input Device</h3>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      {devices.length === 0 && (
                          <div className="p-4 text-sm text-gray-500">Enable microphone permissions to see devices.</div>
                      )}
                      {devices.map((dev: any, idx: number) => (
                          <div 
                              key={dev.deviceId} 
                              onClick={() => setSelectedDeviceId(dev.deviceId)}
                              className={`flex items-center justify-between p-4 cursor-pointer ${idx !== devices.length - 1 ? 'border-b border-gray-50' : ''} ${selectedDeviceId === dev.deviceId ? 'bg-blue-50/50' : ''}`}
                          >
                              <div className="flex items-center">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${selectedDeviceId === dev.deviceId ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                      <Mic size={18} />
                                  </div>
                                  <span className={`font-medium ${selectedDeviceId === dev.deviceId ? 'text-blue-900' : 'text-gray-700'}`}>
                                      {dev.label || `Microphone ${idx + 1}`}
                                  </span>
                              </div>
                              {selectedDeviceId === dev.deviceId && (
                                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>

              <div>
                  <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Real-time DSP Features</h3>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                      
                      <div className="flex items-center justify-between p-4">
                          <div>
                              <p className="font-semibold text-gray-800">Noise Reduction</p>
                              <p className="text-xs text-gray-500 mt-0.5">Hardware-level wind/noise filtering</p>
                          </div>
                          <button onClick={() => toggleDSP('noiseReduction')} className={`w-12 h-6 rounded-full transition-colors relative ${dspConfig.noiseReduction ? 'bg-blue-600' : 'bg-gray-200'}`}>
                              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${dspConfig.noiseReduction ? 'left-6.5' : 'left-0.5'}`}></div>
                          </button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4">
                          <div>
                              <p className="font-semibold text-gray-800">Echo Cancellation</p>
                              <p className="text-xs text-gray-500 mt-0.5">Prevent audio feedback loops</p>
                          </div>
                          <button onClick={() => toggleDSP('echoCancellation')} className={`w-12 h-6 rounded-full transition-colors relative ${dspConfig.echoCancellation ? 'bg-blue-600' : 'bg-gray-200'}`}>
                              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${dspConfig.echoCancellation ? 'left-6.5' : 'left-0.5'}`}></div>
                          </button>
                      </div>

                      <div className="flex items-center justify-between p-4">
                          <div>
                              <p className="font-semibold text-gray-800">Automatic Gain Control</p>
                              <p className="text-xs text-gray-500 mt-0.5">Normalize input volume gracefully</p>
                          </div>
                          <button onClick={() => toggleDSP('autoGainControl')} className={`w-12 h-6 rounded-full transition-colors relative ${dspConfig.autoGainControl ? 'bg-blue-600' : 'bg-gray-200'}`}>
                              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${dspConfig.autoGainControl ? 'left-6.5' : 'left-0.5'}`}></div>
                          </button>
                      </div>

                      <div className="flex items-center justify-between p-4">
                          <div>
                              <p className="font-semibold text-gray-800">Active Voice Boost</p>
                              <p className="text-xs text-gray-500 mt-0.5">Boost 1.5kHz EQ frequencies by 5dB</p>
                          </div>
                          <button onClick={() => toggleDSP('voiceBoost')} className={`w-12 h-6 rounded-full transition-colors relative ${dspConfig.voiceBoost ? 'bg-blue-600' : 'bg-gray-200'}`}>
                              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${dspConfig.voiceBoost ? 'left-6.5' : 'left-0.5'}`}></div>
                          </button>
                      </div>

                      <div className="flex items-center justify-between p-4">
                          <div>
                              <p className="font-semibold text-gray-800">Dynamics Compressor</p>
                              <p className="text-xs text-gray-500 mt-0.5">Limit peaks and raise quiet sounds</p>
                          </div>
                          <button onClick={() => toggleDSP('compressor')} className={`w-12 h-6 rounded-full transition-colors relative ${dspConfig.compressor ? 'bg-blue-600' : 'bg-gray-200'}`}>
                              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${dspConfig.compressor ? 'left-6.5' : 'left-0.5'}`}></div>
                          </button>
                      </div>

                  </div>
              </div>
              
              <div className="pb-8">
                <button className="w-full py-4 bg-white border border-blue-600 text-blue-600 font-semibold rounded-2xl shadow-sm relative overflow-hidden active:scale-[0.98] transition-transform">
                    Check System Permissions
                </button>
              </div>
          </div>
      </div>
    </div>
  );
}
