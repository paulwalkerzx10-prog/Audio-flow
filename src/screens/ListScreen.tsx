import { useState, useEffect } from 'react';
import { Search, Filter, Play, MoreVertical, Bookmark, Mic } from 'lucide-react';
import { getRecordings } from '../lib/storage';
import { Recording } from '../types';
import { format } from 'date-fns';

interface ListScreenProps {
  onSelect: (recording: Recording) => void;
  onRecordNew: () => void;
}

export function ListScreen({ onSelect, onRecordNew }: ListScreenProps) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    getRecordings().then((recs) => {
      setRecordings(recs.sort((a, b) => b.date - a.date));
    });
  }, []);

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const filters = ['All', 'Interviews', 'Meetings', 'Notes', 'Lectures'];

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="flex items-center justify-between p-4 pt-12 bg-white">
        <button className="p-2 text-gray-800">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <h1 className="text-lg font-medium">Recordings</h1>
        <div className="flex space-x-2">
            <button className="p-2 text-gray-600"><Search size={20}/></button>
            <button className="p-2 text-gray-600"><Filter size={20}/></button>
        </div>
      </div>

      <div className="flex overflow-x-auto px-4 py-3 bg-white border-b border-gray-100 no-scrollbar space-x-2">
          {filters.map(f => (
              <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                      filter === f 
                        ? 'bg-blue-600 text-white font-medium shadow-sm' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                  {f}
              </button>
          ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
          {recordings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <p>No recordings yet.</p>
              </div>
          ) : (
              <div className="space-y-3 pb-24">
                  {recordings.map((rec) => (
                      <div 
                          key={rec.id} 
                          className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center cursor-pointer hover:border-blue-200 transition-colors"
                          onClick={() => onSelect(rec)}
                      >
                          <div className="bg-blue-50 w-10 h-10 rounded-full flex items-center justify-center text-blue-600 mr-4 shrink-0">
                              <Play size={18} fill="currentColor" className="ml-0.5" />
                          </div>
                          <div className="flex-1 min-w-0 pr-2">
                              <h3 className="font-semibold text-gray-900 text-base truncate">{rec.title}</h3>
                              <p className="text-xs text-gray-500 font-medium tracking-tight">
                                  {format(rec.date, 'MMM dd, yyyy • hh:mm a')}
                              </p>
                          </div>
                          <div className="flex items-center space-x-3 shrink-0">
                              <span className="text-sm font-medium text-gray-600">
                                  {formatDuration(rec.durationMs)}
                              </span>
                              {rec.isBookmarked ? (
                                <Bookmark className="w-5 h-5 text-blue-500 fill-blue-500" />
                              ) : (
                                <MoreVertical className="w-5 h-5 text-gray-400" />
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>

      <div className="absolute bottom-6 right-6">
          <button 
              onClick={onRecordNew}
              className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition"
              style={{ filter: "drop-shadow(0 10px 15px rgba(37,99,235,0.4))" }}
          >
              <Mic size={24} />
          </button>
      </div>
    </div>
  );
}
