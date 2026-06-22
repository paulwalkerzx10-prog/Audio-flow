import { useState, useEffect } from 'react';
import { Search, Filter, Play, MoreVertical, Star, Plus, Grid, List, Music, Radio, Bookmark, Volume2, Calendar, Clock, Sparkles } from 'lucide-react';
import { getRecordings, saveRecording } from '../lib/storage';
import { Recording } from '../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface ListScreenProps {
  onSelect: (recording: Recording) => void;
  onRecordNew: () => void;
}

export function ListScreen({ onSelect, onRecordNew }: ListScreenProps) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGridView, setIsGridView] = useState(false);

  // Prepopulate standard mock recordings if empty so the user sees a premium, fully populated interactive view
  const seedMockRecordings = async () => {
    const rawRecs = await getRecordings();
    if (rawRecs.length === 0) {
      const mocks: Recording[] = [
        {
          id: 'mock-1',
          title: 'Vocal Masterclass 03',
          date: new Date('2026-06-20T10:34:00').getTime(),
          durationMs: 145000, 
          tags: ['Recordings'],
          isBookmarked: true,
          blob: new Blob()
        },
        {
          id: 'mock-2',
          title: 'Field Acoustics Demo',
          date: new Date('2026-06-19T14:15:00').getTime(),
          durationMs: 222000, 
          tags: ['Recordings'],
          isBookmarked: false,
          blob: new Blob()
        },
        {
          id: 'mock-3',
          title: 'Raw Acoustic Melody',
          date: new Date('2026-06-18T09:41:00').getTime(),
          durationMs: 87000, 
          tags: ['Favorites'],
          isBookmarked: true,
          blob: new Blob()
        },
        {
          id: 'mock-4',
          title: 'Ambient Vocal Synthesis',
          date: new Date('2026-06-17T11:20:00').getTime(),
          durationMs: 72800, 
          tags: ['Recordings'],
          isBookmarked: false,
          blob: new Blob()
        }
      ];

      for (const item of mocks) {
        await saveRecording(item);
      }
      const loaded = await getRecordings();
      setRecordings(loaded.sort((a, b) => b.date - a.date));
    } else {
      setRecordings(rawRecs.sort((a, b) => b.date - a.date));
    }
  };

  useEffect(() => {
    seedMockRecordings();
  }, []);

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleToggleFavorite = async (e: any, rec: Recording) => {
    e.stopPropagation();
    const updated = recordings.map(r => {
      if (r.id === rec.id) {
        return { ...r, isBookmarked: !r.isBookmarked };
      }
      return r;
    });
    setRecordings(updated);
    const targetFile = updated.find(x => x.id === rec.id);
    if (targetFile) {
      await saveRecording(targetFile);
    }
  };

  // Filter & Search Logic
  const filteredRecordings = recordings.filter(rec => {
    const matchesSearch = rec.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'All') return matchesSearch;
    if (filter === 'Favorites') return rec.isBookmarked && matchesSearch;
    return rec.tags?.includes(filter) && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden relative select-none">
      
      {/* Top Header */}
      <div className="px-6 pt-12 pb-4 flex items-center justify-between border-b border-white/20 bg-white/25 backdrop-blur-md">
        <div>
          <h1 className="text-base font-extrabold text-[#1E2229] tracking-tight flex items-center space-x-1.5 leading-none">
            <span>Library Clips</span>
            <Radio size={14} className="text-emerald-500 animate-pulse" />
          </h1>
          <p className="text-[10px] text-gray-500 font-semibold mt-1">Manage and edit your recorded tracks</p>
        </div>
        
        {/* Actions Row */}
        <div className="flex items-center space-x-2">
          <div className="relative flex items-center bg-white/70 rounded-full border border-white/60 p-1 shadow-sm">
            <Search size={14} className="text-gray-450 ml-2.5 absolute" />
            <input 
              type="text" 
              placeholder="Filter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent pl-7 pr-3 py-1 text-[10px] outline-none w-20 text-[#2A2E35] font-extrabold"
            />
          </div>
        </div>
      </div>

      {/* Categories Bar & Grid Switcher */}
      <div className="px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-1.5 bg-white/50 p-1 rounded-full border border-white/60 shadow-inner">
          {['All', 'Recordings', 'Favorites'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold transition-all cursor-pointer ${
                filter === tab 
                  ? 'bg-emerald-500 text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* View mode toggle switcher */}
        <div className="flex items-center space-x-1 bg-white/70 p-1 rounded-full border border-white/60 shadow-sm">
          <button 
            onClick={() => setIsGridView(false)}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${!isGridView ? 'bg-[#EEF9F1] text-emerald-500' : 'text-gray-450'}`}
          >
            <List size={12} />
          </button>
          <button 
            onClick={() => setIsGridView(true)}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${isGridView ? 'bg-[#EEF9F1] text-emerald-500' : 'text-gray-450'}`}
          >
            <Grid size={12} />
          </button>
        </div>
      </div>

      {/* Main recordings list with translucent cards */}
      <div className="flex-1 overflow-y-auto px-6 pb-28 pt-2 no-scrollbar">
        <AnimatePresence mode="popLayout">
          {filteredRecordings.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center text-gray-400"
            >
              <div className="w-16 h-16 rounded-full bg-white/40 border border-white/60 flex items-center justify-center shadow-sm mb-4">
                <Radio size={22} className="text-gray-400 animate-pulse" />
              </div>
              <p className="text-xs font-bold text-gray-700">No recordings match your filter</p>
              <p className="text-[10px] text-gray-440 mt-1">Initiate a voice tape from the home screen first.</p>
            </motion.div>
          ) : (
            <div className={`${isGridView ? 'grid grid-cols-2 gap-4' : 'space-y-4'}`}>
              {filteredRecordings.map((rec) => (
                <motion.div 
                  key={rec.id}
                  layoutId={`rec-${rec.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => onSelect(rec)}
                  className="bg-white/45 backdrop-blur-md p-4 rounded-3xl border border-white/60 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                    {/* Compact sleek Play bubble */}
                    <div className="bg-[#EEF9F1] w-10 h-10 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner shrink-0 mt-0.5">
                      <Play size={14} fill="currentColor" className="ml-0.5" />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-[#2A2E35] text-xs truncate leading-none">{rec.title}</h3>
                      <div className="flex items-center space-x-1.5 mt-1.5">
                        <Calendar size={10} className="text-gray-400" />
                        <span className="text-[9px] text-[#A3A099] font-bold">
                          {format(new Date(rec.date), 'MMM dd • h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right metrics row */}
                  <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-white/40">
                    <div className="flex items-center space-x-1">
                      <Clock size={10} className="text-gray-400" />
                      <span className="text-[9px] font-extrabold text-gray-600">
                        {formatDuration(rec.durationMs)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      {/* Golden Favorite star */}
                      <button 
                        onClick={(e) => handleToggleFavorite(e, rec)}
                        className="p-1 rounded-full hover:bg-amber-50/70 active:scale-90 transition shrink-0"
                      >
                        <Star 
                          size={15} 
                          className={`transition-colors duration-200 ${rec.isBookmarked ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} 
                        />
                      </button>

                      <span className="text-[10px] text-emerald-500 font-extrabold bg-[#EEF9F1] px-2 py-0.5 rounded-lg border border-[#D5EEDC]">
                        Open
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating glossy Add indicator */}
      <div className="absolute bottom-24 right-5 z-20">
        <button 
          onClick={onRecordNew}
          className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 active:scale-95 transition-all outline-none border border-white/35 cursor-pointer"
        >
          <Plus size={22} strokeWidth={2.8} />
        </button>
      </div>

    </div>
  );
}
