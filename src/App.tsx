import { useState, useEffect } from 'react';
import { RecordScreen } from './screens/RecordScreen';
import { ListScreen } from './screens/ListScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { EditScreen } from './screens/EditScreen';
import { BottomNav } from './components/BottomNav';
import { useAudioRecorder } from './lib/useAudioRecorder';
import { useBluetooth } from './lib/useBluetooth';
import { Recording } from './types';
import { deleteRecording } from './lib/storage';

export default function App() {
  const [currentTab, setCurrentTab] = useState('record');
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  
  const audioHook = useAudioRecorder();
  const bluetoothHook = useBluetooth();

  const handleNavigate = (tab: string) => {
    setCurrentTab(tab);
    setSelectedRecording(null);
  };


  const handleSelectRecording = (recording: Recording) => {
    setSelectedRecording(recording);
  };

  const handleDeleteRecording = async (id: string) => {
    await deleteRecording(id);
    setSelectedRecording(null);
  };

  return (
    <div className="flex justify-center items-center h-screen w-full font-sans overflow-hidden">
      {/* Mobile constraint container simulating device frame */}
      <div className="w-full h-full max-w-md bg-white flex flex-col relative overflow-hidden shadow-2xl sm:h-[850px] sm:rounded-[3rem] sm:border-8 sm:border-slate-800">
        
        {/* Dynamic Island / Status bar placeholder for realism on desktop */}
        <div className="hidden sm:flex absolute top-0 w-full h-8 bg-transparent z-50 justify-center">
            <div className="w-32 h-6 bg-slate-800 rounded-b-3xl"></div>
        </div>

        <div className="flex-1 overflow-hidden relative z-10">
          {selectedRecording ? (
            <EditScreen 
              recording={selectedRecording} 
              onBack={() => setSelectedRecording(null)} 
              onDelete={handleDeleteRecording}
            />
          ) : (
            <>
              {currentTab === 'record' && (
                <RecordScreen 
                    audioHook={audioHook} 
                    bluetoothHook={bluetoothHook}
                    onSaveCompleted={() => handleNavigate('recordings')} 
                />
              )}
              {currentTab === 'recordings' && (
                <ListScreen 
                    onSelect={handleSelectRecording} 
                    onRecordNew={() => handleNavigate('record')}
                />
              )}
              {currentTab === 'settings' && (
                <SettingsScreen 
                    audioHook={audioHook} 
                    bluetoothHook={bluetoothHook}
                    onBack={() => handleNavigate('record')} 
                />
              )}
              {currentTab === 'files' && (
                <div className="flex flex-col items-center justify-center h-full bg-slate-50 text-gray-400 p-8 text-center">
                   <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                   </div>
                   <h2 className="text-xl font-medium text-gray-800 mb-2">Folder Management</h2>
                   <p className="text-sm">Create nested folders to organize your recordings. (Coming soon)</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Navigation */}
        {!selectedRecording && (
          <div className="relative z-20">
             <BottomNav 
               currentTab={currentTab === 'recordings' ? 'record' : currentTab} 
               onChangeTab={handleNavigate} 
             />
          </div>
        )}

      </div>
    </div>
  );
}
