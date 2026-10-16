import React, { useState } from 'react';
import { LogIn, UserCheck, Sparkles, Shield, KeyRound, Loader2, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppSettings } from '../../types';

interface LoginGateModalProps {
  settings: AppSettings;
  onAdminUnlock: () => void;
}

export const LoginGateModal: React.FC<LoginGateModalProps> = ({ settings, onAdminUnlock }) => {
  const { signInWithGoogle, signInAsGuest, verifyOwnerPasscode, ownerEmail } = useAuth();
  const [loadingType, setLoadingType] = useState<'google' | 'guest' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showAdminPinInput, setShowAdminPinInput] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setLoadingType('google');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Login error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign in popup was closed. Please try again or continue as Guest.');
      } else if (err?.code === 'auth/popup-blocked') {
        setErrorMessage('Pop-up was blocked by your browser. Please allow popups or use Guest login.');
      } else {
        setErrorMessage(err?.message || 'Failed to sign in with Google. Please retry.');
      }
    } finally {
      setLoadingType(null);
    }
  };

  const handleGuestLogin = async () => {
    setErrorMessage('');
    setLoadingType('guest');
    try {
      await signInAsGuest();
    } catch (err: any) {
      console.error('Guest login error:', err);
      setErrorMessage(err?.message || 'Failed to start guest session. Please retry.');
    } finally {
      setLoadingType(null);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyOwnerPasscode(adminPin)) {
      setPinError('');
      onAdminUnlock();
    } else {
      setPinError('Incorrect administrator PIN.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070b14]/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      {/* Background cinematic aura */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 my-auto">
        {/* Official Application Logo */}
        <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-amber-400 shadow-xl shadow-blue-500/20 group">
          <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 border-2 border-slate-950">
            <img
              src={settings.logoUrl || '/src/assets/images/bandbudh_budbak_logo_1792155787010.jpg'}
              alt={settings.appName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 text-white rounded-full shadow-lg">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Title and Welcome */}
        <div className="space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400 px-3 py-1 bg-amber-400/10 rounded-full border border-amber-400/20">
            Welcome to Apna School
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            BUNDBUDH <span className="text-blue-400">AUR</span> <span className="text-amber-400">BUDBAK</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Please choose a login method to enter the streaming platform and watch your favorite episodes.
          </p>
        </div>

        {/* Error message if any */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* METHOD 1: SIGN IN WITH GOOGLE */}
          <button
            onClick={handleGoogleLogin}
            disabled={loadingType !== null}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm rounded-xl shadow-lg shadow-white/10 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
          >
            {loadingType === 'google' ? (
              <Loader2 className="w-5 h-5 text-slate-900 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Sign in with Google</span>
          </button>

          {/* METHOD 2: CONTINUE AS GUEST */}
          <button
            onClick={handleGuestLogin}
            disabled={loadingType !== null}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 disabled:opacity-60 cursor-pointer"
          >
            {loadingType === 'guest' ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <UserCheck className="w-5 h-5 text-blue-200" />
            )}
            <span>Continue as Guest (Instant Entry)</span>
          </button>
        </div>

        {/* Feature comparison pills */}
        <div className="pt-2 border-t border-slate-900 grid grid-cols-2 gap-2 text-[11px] text-slate-400 text-left">
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
            <span className="font-bold text-slate-200 block mb-1">Google Sign-In</span>
            <ul className="space-y-0.5 text-[10px]">
              <li>✓ Watch all episodes</li>
              <li>✓ Post comments & replies</li>
              <li>✓ Save watch progress</li>
              <li>✓ Likes & reactions</li>
            </ul>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
            <span className="font-bold text-slate-200 block mb-1">Guest Mode</span>
            <ul className="space-y-0.5 text-[10px]">
              <li>✓ Watch all episodes</li>
              <li>✓ Read comments</li>
              <li>✓ Likes & reactions</li>
              <li>✗ Cannot write comments</li>
            </ul>
          </div>
        </div>

        {/* Owner / Administrator PIN Unlock */}
        <div className="pt-2">
          {!showAdminPinInput ? (
            <button
              onClick={() => setShowAdminPinInput(true)}
              className="text-xs text-slate-400 hover:text-amber-400 font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" /> Owner / Admin Portal Access
            </button>
          ) : (
            <form onSubmit={handlePinSubmit} className="space-y-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
                <span>Owner PIN Unlock</span>
                <button
                  type="button"
                  onClick={() => setShowAdminPinInput(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="Enter PIN"
                  className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white text-center font-mono tracking-widest focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg"
                >
                  Enter
                </button>
              </div>
              {pinError && <p className="text-[11px] text-rose-400">{pinError}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
