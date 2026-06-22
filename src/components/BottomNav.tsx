import { Home, Mic, Folder, Settings as SettingsIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface BottomNavProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
}

export function BottomNav({ currentTab, onChangeTab }: BottomNavProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'record', label: 'Recordings', icon: Mic },
    { id: 'files', label: 'Files', icon: Folder },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex justify-around items-center h-20 bg-white border-t border-gray-100 pb-4 px-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={clsx(
              "flex flex-col items-center p-2 w-16 transition-colors",
              isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Icon size={24} className="mb-1" strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
