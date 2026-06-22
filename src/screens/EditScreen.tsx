import { useRef, useState } from 'react';
import { Play, Pause, Square, MoreHorizontal, Download, Share2, Trash2, Scissors, SplitSquareVertical, Merge, VolumeX, Bookmark, Folder } from 'lucide-react';
import { Recording } from '../types';
import { format } from 'date-fns';

interface EditScreenProps {
  recording: Recording;
  onBack: () => void;
  onDelete: (id: string) => void;
}

export function EditScreen({ recording, onBack, onDelete }: EditScreenProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime / audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-10">
      <div className="flex items-center justify-between p-4 pt-12 bg-white">
        <button onClick={onBack} className="p-2 text-gray-800">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h1 className="text-lg font-semibold truncate max-w-[200px]">{recording.title}</h1>
        <div className="flex items-center space-x-2">
          <Bookmark className={`w-5 h-5 ${recording.isBookmarked ? 'fill-blue-500 text-blue-500' : 'text-gray-500'}`} />
          <MoreHorizontal className="w-5 h-5 text-gray-500" />
        </div>
      </div>
      
      <div className="flex justify-center my-2">
        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 shadow-sm">
          WAV • 48 kHz • 1536 kbps
        </span>
      </div>

      <div className="flex-1 px-4 flex flex-col justify-center items-center">
        {/* Placeholder waveform for edit screen */}
        <div className="w-full h-40 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center relative overflow-hidden my-6">
            <div className="absolute top-0 bottom-0 left-0 bg-blue-50 opacity-50" style={{ width: `${progress * 100}%` }}></div>
            {/* Visual simulated waveform */}
            <div className="flex items-center justify-center space-x-1 h-3/4 opacity-30">
               {[...Array(40)].map((_, i) => (
                  <div key={i} className="w-1 bg-blue-600 rounded-full" style={{ height: `${Math.max(10, Math.random() * 100)}%` }}></div>
               ))}
            </div>
            
            <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-blue-600 shadow-sm" style={{ left: `${progress * 100}%` }}>
               <div className="w-3 h-3 bg-blue-600 rounded-full -ml-[5px] -mt-1 shadow-md"></div>
            </div>
        </div>

        <div className="flex justify-between w-full text-xs font-medium text-gray-500 mb-8">
            <span>{formatTime(audioRef.current?.currentTime ? audioRef.current.currentTime * 1000 : 0)}</span>
            <span>{formatTime(recording.durationMs)}</span>
        </div>

        <div className="grid grid-cols-5 gap-2 w-full mb-10 max-w-sm">
            <div className="flex flex-col items-center">
                <button className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 bg-white shadow-sm hover:bg-gray-50"><Scissors size={18}/></button>
                <span className="text-[10px] text-gray-500 mt-2">Trim</span>
            </div>
            <div className="flex flex-col items-center">
                <button className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 bg-white shadow-sm hover:bg-gray-50"><SplitSquareVertical size={18}/></button>
                <span className="text-[10px] text-gray-500 mt-2">Split</span>
            </div>
            <div className="flex flex-col items-center">
                <button className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 bg-white shadow-sm hover:bg-gray-50"><Merge size={18}/></button>
                <span className="text-[10px] text-gray-500 mt-2">Merge</span>
            </div>
            <div className="flex flex-col items-center">
                <button className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 bg-white shadow-sm hover:bg-gray-50"><VolumeX size={18}/></button>
                <span className="text-[10px] text-gray-500 mt-2">Silence</span>
            </div>
            <div className="flex flex-col items-center">
                <button className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 bg-white shadow-sm hover:bg-gray-50"><MoreHorizontal size={18}/></button>
                <span className="text-[10px] text-gray-500 mt-2">More</span>
            </div>
        </div>

        <div className="flex items-center justify-between w-full max-w-xs mb-8">
            <button className="text-gray-400 font-medium text-sm">1.0x</button>
            <button className="text-gray-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg></button>
            
            <button 
                onClick={togglePlay}
                className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
                style={{ filter: "drop-shadow(0 10px 15px rgba(37,99,235,0.3))" }}
            >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>
            
            <button className="text-gray-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M12 7v5l-4 2"/></svg></button>
            <button className="text-gray-400"><Bookmark size={20}/></button>
        </div>

      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 flex justify-around">
        <button className="flex flex-col items-center text-gray-500 hover:text-gray-700">
            <Share2 size={20} className="mb-1"/>
            <span className="text-[10px]">Share</span>
        </button>
        <button 
            className="flex flex-col items-center text-gray-500 hover:text-gray-700"
            onClick={() => {
                const url = URL.createObjectURL(recording.blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${recording.title}.webm`;
                a.click();
            }}
        >
            <Download size={20} className="mb-1"/>
            <span className="text-[10px]">Export</span>
        </button>
        <button className="flex flex-col items-center text-gray-500 hover:text-gray-700">
            <Folder size={20} className="mb-1"/>
            <span className="text-[10px]">Move</span>
        </button>
        <button 
            onClick={() => {
                onDelete(recording.id);
                onBack();
            }}
            className="flex flex-col items-center text-red-500 hover:text-red-700"
        >
            <Trash2 size={20} className="mb-1"/>
            <span className="text-[10px]">Delete</span>
        </button>
      </div>

      {/* Hidden audio element for actual playback */}
      <audio 
        ref={audioRef} 
        src={URL.createObjectURL(recording.blob)} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
    </div>
  );
}
