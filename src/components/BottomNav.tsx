import { Home, Mic, Download, Settings as SettingsIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
}

export function BottomNav({ currentTab, onChangeTab }: BottomNavProps) {
  const tabs = [
    { id: 'record', label: 'Home', icon: Home },
    { id: 'recordings', label: 'Library', icon: Mic },
    { id: 'export', label: 'Export', icon: Download },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="relative flex justify-around items-center h-20 bg-white/15 backdrop-blur-2xl border-t border-white/25 pb-4 px-2 shadow-[0_-8px_32px_rgba(0,0,0,0.02)] rounded-t-3xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`nav-tab-${tab.id}`}
            onClick={() => onChangeTab(tab.id)}
            className="relative flex flex-col items-center p-2 w-16 transition-all cursor-pointer focus:outline-none"
          >
            {isActive && (
              <motion.div
                layoutId="nav-glow"
                className="absolute -top-1 w-10 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full shadow-[0_2px_10px_2px_rgba(16,185,129,0.3)]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${
              isActive 
                ? "text-emerald-600 scale-110 drop-shadow-[0_2px_8px_rgba(16,185,129,0.25)]" 
                : "text-gray-400 hover:text-gray-600 scale-100"
            }`}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-bold tracking-tight transition-all duration-300 ${
              isActive ? "text-emerald-700 opacity-100" : "text-gray-400 opacity-80"
            }`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
