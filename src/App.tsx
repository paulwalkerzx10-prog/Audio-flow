import { useState, useEffect } from 'react';
import { RecordScreen } from './screens/RecordScreen';
import { ListScreen } from './screens/ListScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ExportScreen } from './screens/ExportScreen';
import { BottomNav } from './components/BottomNav';
import { useAudioRecorder } from './lib/useAudioRecorder';
import { Recording } from './types';
import { deleteRecording, getRecordings } from './lib/storage';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('record');
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [lastLoadedRecording, setLastLoadedRecording] = useState<Recording | null>(null);
  
  const audioHook = useAudioRecorder();

  const handleNavigate = (tab: string) => {
    setCurrentTab(tab);
  };

  const handleSelectRecording = (recording: Recording) => {
    setSelectedRecording(recording);
    setLastLoadedRecording(recording);
    setCurrentTab('export'); // Automatically switch to the export tab when a recording is tapped
  };

  const handleDeleteRecording = async (id: string) => {
    await deleteRecording(id);
    if (selectedRecording?.id === id) {
      setSelectedRecording(null);
    }
    if (lastLoadedRecording?.id === id) {
      setLastLoadedRecording(null);
    }
  };

  // Pre-load the latest recording to initialize the editor space elegantly if none is selected
  useEffect(() => {
    getRecordings().then((recs) => {
      if (recs && recs.length > 0) {
        // Sort by newest
        const sorted = [...recs].sort((a, b) => b.date - a.date);
        setLastLoadedRecording(sorted[0]);
      }
    }).catch(console.warn);
  }, [currentTab]);

  return (
    <div className="relative flex justify-center items-center h-screen w-full bg-[#FAF8F5] overflow-hidden">
      
      {/* Background Liquid Glass Ambient Glowing Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div 
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 40, 0],
            scale: [1, 1.1, 0.9, 1]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-gradient-to-tr from-emerald-200/40 via-teal-300/30 to-emerald-400/20 blur-3xl"
        />
        <motion.div 
          animate={{
            x: [0, -50, 30, 0],
            y: [0, 40, -30, 0],
            scale: [1, 0.95, 1.05, 1]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-1/4 -right-16 w-96 h-96 rounded-full bg-gradient-to-br from-cyan-200/40 via-teal-100/30 to-emerald-300/20 blur-3xl"
        />
        {/* Extra glowing orange orb representing high fidelity warm voice EQ frequency lights */}
        <motion.div 
          animate={{
            x: [0, 20, -30, 0],
            y: [0, 30, -10, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-amber-100/25 blur-3xl"
        />
      </div>

      {/* Screen Frame Container with Frosted Glass panel design styles */}
      <div className="w-full h-full max-w-md bg-white/30 tall:bg-white/20 backdrop-blur-3xl flex flex-col relative overflow-hidden shadow-[0_32px_96px_rgba(0,0,0,0.04)] border border-white/40 z-10 sm:h-[830px] sm:rounded-[2.8rem]">
        
        {/* Action views router */}
        <div className="flex-1 overflow-hidden relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full h-full"
            >
              {currentTab === 'record' && (
                <RecordScreen 
                  audioHook={audioHook} 
                  onSaveCompleted={() => handleNavigate('recordings')} 
                  onNavigateToTab={handleNavigate}
                />
              )}

              {currentTab === 'recordings' && (
                <ListScreen 
                  onSelect={handleSelectRecording} 
                  onRecordNew={() => handleNavigate('record')}
                />
              )}

              {currentTab === 'export' && (
                <ExportScreen 
                  recording={selectedRecording || lastLoadedRecording || {
                    id: 'placeholder',
                    title: 'No Recording Selected',
                    date: Date.now(),
                    durationMs: 0,
                    blob: new Blob(),
                    tags: ['Draft'],
                    isBookmarked: false
                  }} 
                  onBack={() => handleNavigate('recordings')} 
                  onDelete={handleDeleteRecording}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsScreen 
                  audioHook={audioHook} 
                  onBack={() => handleNavigate('record')} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Global Floating Glass bottom menu */}
        <div className="relative z-20 shrink-0">
          <BottomNav 
            currentTab={currentTab} 
            onChangeTab={handleNavigate} 
          />
        </div>

      </div>
    </div>
  );
}
