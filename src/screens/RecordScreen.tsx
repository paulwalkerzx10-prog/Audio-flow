import { useState, useEffect } from 'react';
import { Mic, X, MessageSquare, Bell } from 'lucide-react';
import { Waveform } from '../components/Waveform';
import { saveRecording } from '../lib/storage';
import { format } from 'date-fns';

interface RecordScreenProps {
  audioHook: any; 
  bluetoothHook: any;
  onSaveCompleted: () => void;
}

export function RecordScreen({ audioHook, bluetoothHook, onSaveCompleted }: RecordScreenProps) {
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
      const title = `Voice Note - ${format(new Date(), 'MMM dd')}`;
      const rec = {
        id: crypto.randomUUID(),
        title,
        date: Date.now(),
        durationMs: duration,
        blob,
        tags: [],
        isBookmarked: false
      };
      await saveRecording(rec);
      onSaveCompleted();
    }
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    const msPortion = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
    return `${m}:${s}.${msPortion}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="flex items-center justify-between p-4 pt-12 bg-transparent">
        <button className="p-2 text-gray-800">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div className="flex flex-col items-center">
            <h1 className="text-lg font-medium">New Recording</h1>
            {device && (
                <div className="flex items-center text-xs font-semibold text-blue-600 mt-1 space-x-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 7 10 10-5 5V2l5 5L7 17"/></svg>
                    <span>{batteryLevel !== null ? `${batteryLevel}%` : 'Connected'}</span>
                </div>
            )}
        </div>
        <button className="p-2 text-gray-600">
            <Bell size={20} />
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-2 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm text-center shadow-sm">
            {error}
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center -mt-10">
        <Waveform data={analyserData} isRecording={isRecording && !isPaused} />
        
        {isRecording && (
            <div className="text-3xl font-mono font-medium text-gray-800 mt-8 mb-4 tracking-tight">
              {formatDuration(duration)}
            </div>
        )}
      </div>

      <div className="flex flex-col items-center pb-8 px-8">
        <div className="flex items-center justify-center space-x-12 mb-10 w-full relative h-[120px]">
          {isRecording && (
              <button className="w-12 h-12 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-600 shadow-sm absolute left-6">
                <MessageSquare size={20} />
              </button>
          )}

          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
              <button 
                onClick={handleStartStop}
                className={`w-28 h-28 rounded-full flex items-center justify-center transition-all bg-white relative ${isRecording ? 'top-[-8px]' : ''}`}
                style={{
                  boxShadow: isRecording && !isPaused ? '0 0 0 8px rgba(37,99,235,0.1), 0 0 0 16px rgba(37,99,235,0.05)' : 'none'
                }}
              >
                  <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl">
                    <Mic size={36} className={`${isRecording && !isPaused ? 'animate-pulse' : ''}`} />
                  </div>
              </button>
              <span className="font-medium text-lg text-gray-800 mt-6 tracking-tight">
                  {isRecording ? (isPaused ? 'Paused' : 'Recording...') : 'Start Recording'}
              </span>
          </div>

          {isRecording && (
              <button 
                onClick={handleSave}
                className="w-12 h-12 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-600 shadow-sm absolute right-6"
              >
                <X size={20} />
              </button>
          )}
        </div>
      </div>
    </div>
  );
}
