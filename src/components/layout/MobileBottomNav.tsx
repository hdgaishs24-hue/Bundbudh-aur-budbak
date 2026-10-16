import React from 'react';
import { Home, Tv, Search, User, Sliders } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenAdmin: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenAdmin,
}) => {
  const { isAdmin, currentUser } = useAuth();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070b14]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 flex items-center justify-around">
      <button
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center gap-1 p-1.5 transition-colors ${
          activeTab === 'home' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px]">Home</span>
      </button>

      <button
        onClick={() => setActiveTab('series')}
        className={`flex flex-col items-center gap-1 p-1.5 transition-colors ${
          activeTab === 'series' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Tv className="w-5 h-5" />
        <span className="text-[10px]">Series</span>
      </button>

      <button
        onClick={onOpenSearch}
        className="flex flex-col items-center gap-1 p-1.5 text-slate-400 hover:text-slate-200"
      >
        <Search className="w-5 h-5" />
        <span className="text-[10px]">Search</span>
      </button>

      {isAdmin && (
        <button
          onClick={onOpenAdmin}
          className="flex flex-col items-center gap-1 p-1.5 text-amber-400 hover:text-amber-300"
        >
          <Sliders className="w-5 h-5" />
          <span className="text-[10px] font-bold">Admin</span>
        </button>
      )}

      <button
        onClick={() => setActiveTab('profile')}
        className={`flex flex-col items-center gap-1 p-1.5 transition-colors ${
          activeTab === 'profile' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <User className="w-5 h-5" />
        <span className="text-[10px]">{currentUser ? 'Profile' : 'Sign In'}</span>
      </button>
    </div>
  );
};
