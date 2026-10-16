import React, { useState } from 'react';
import {
  Search,
  ShieldAlert,
  User as UserIcon,
  LogIn,
  LogOut,
  Sliders,
  Tv,
  Film,
  KeyRound,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppSettings } from '../../types';

interface NavbarProps {
  settings: AppSettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenAdmin,
}) => {
  const { currentUser, isGoogle, isGuest, isAdmin, signInWithGoogle, signInAsGuest, logout, verifyOwnerPasscode } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [showOwnerUnlockModal, setShowOwnerUnlockModal] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string>('');

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyOwnerPasscode(passcodeInput)) {
      setShowOwnerUnlockModal(false);
      setPasscodeInput('');
      setPasscodeError('');
      onOpenAdmin();
    } else {
      setPasscodeError('Invalid administrator PIN.');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* LEFT: Official Logo + App Name */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-blue-500/60 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform bg-slate-900">
            <img
              src={settings.logoUrl}
              alt={settings.appName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="font-extrabold text-base sm:text-xl tracking-tight text-white flex items-center gap-1.5">
              BUNDBUDH <span className="text-blue-400">AUR</span> <span className="text-amber-400">BUDBAK</span>
            </span>
            <span className="hidden sm:block text-[10px] uppercase font-bold tracking-widest text-slate-400">
              Premium Cartoon OTT
            </span>
          </div>
        </div>

        {/* CENTER: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-full border border-slate-800">
          {[
            { id: 'home', label: 'Home' },
            { id: 'series', label: 'Series' },
            { id: 'seasons', label: 'Seasons' },
            { id: 'episodes', label: 'Episodes' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* RIGHT: Search + Admin Panel + Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all flex items-center gap-2 text-xs font-medium"
            title="Search cartoon episodes"
          >
            <Search className="w-4 h-4 text-blue-400" />
            <span className="hidden lg:inline text-slate-400">Search episodes...</span>
          </button>

          {/* ADMIN DASHBOARD ICON (Visible if Admin or for Owner) */}
          {isAdmin ? (
            <button
              onClick={onOpenAdmin}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 hover:border-amber-500 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/10 transition-all animate-pulse"
              title="Administrator Dashboard"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Admin Panel</span>
            </button>
          ) : (
            <button
              onClick={() => setShowOwnerUnlockModal(true)}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 transition-colors"
              title="Owner / Administrator Access"
            >
              <KeyRound className="w-4 h-4" />
            </button>
          )}

          {/* USER PROFILE DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center overflow-hidden border border-blue-500/30">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="Profile"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-4 h-4" />
                )}
              </div>
              <span className="hidden sm:block text-xs font-semibold text-slate-200 max-w-[100px] truncate">
                {currentUser?.displayName || (isGuest ? 'Guest' : 'Account')}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 space-y-2">
                <div className="border-b border-slate-800 pb-2">
                  <p className="text-xs font-bold text-white truncate">
                    {currentUser?.displayName || (isGuest ? 'Guest Schoolmate' : 'Not signed in')}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {currentUser?.email || (isGuest ? 'Anonymous Session' : 'Sign in to sync watchlist')}
                  </p>
                  {isAdmin && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold text-[10px] rounded border border-amber-500/40">
                      VERIFIED ADMINISTRATOR
                    </span>
                  )}
                </div>

                {!currentUser && (
                  <div className="space-y-1.5">
                    <button
                      onClick={async () => {
                        setShowProfileMenu(false);
                        await signInWithGoogle();
                      }}
                      className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-4 h-4" /> Sign in with Google
                    </button>
                    <button
                      onClick={async () => {
                        setShowProfileMenu(false);
                        await signInAsGuest();
                      }}
                      className="w-full px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-all"
                    >
                      Continue as Guest
                    </button>
                  </div>
                )}

                {currentUser && isGuest && (
                  <button
                    onClick={async () => {
                      setShowProfileMenu(false);
                      await signInWithGoogle();
                    }}
                    className="w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow"
                  >
                    <LogIn className="w-4 h-4" /> Link Google Account
                  </button>
                )}

                {isAdmin && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenAdmin();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-2 border border-amber-500/30"
                  >
                    <Sliders className="w-4 h-4 text-amber-400" />
                    Open Admin Dashboard
                  </button>
                )}

                {currentUser && (
                  <button
                    onClick={async () => {
                      setShowProfileMenu(false);
                      await logout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-500/10 text-rose-400 text-xs font-medium flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OWNER ADMIN UNLOCK MODAL */}
      {showOwnerUnlockModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Owner Administrator Portal</h4>
                <p className="text-[11px] text-slate-400">hdgaishs24@gmail.com</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Sign in with your authorized Google owner account or enter your administrator PIN.
            </p>

            <form onSubmit={handlePasscodeSubmit} className="space-y-3">
              <input
                type="password"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="Enter Admin PIN"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 font-mono text-center tracking-widest"
              />

              {passcodeError && (
                <p className="text-xs text-rose-400 font-medium">{passcodeError}</p>
              )}

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOwnerUnlockModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow"
                >
                  Unlock Admin
                </button>
              </div>
            </form>

            <div className="pt-2 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={async () => {
                  setShowOwnerUnlockModal(false);
                  await signInWithGoogle();
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign in with Owner Google Email
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
