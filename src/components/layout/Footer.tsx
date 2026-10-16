import React from 'react';
import { AppSettings } from '../../types';
import { ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  settings: AppSettings;
}

export const Footer: React.FC<FooterProps> = ({ settings }) => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 mt-16 pb-20 md:pb-8 pt-10 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src={settings.logoUrl}
              alt={settings.appName}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full border border-blue-500/40 object-cover"
            />
            <div>
              <span className="font-extrabold text-lg text-white">
                {settings.appName}
              </span>
              <p className="text-xs text-slate-400 max-w-sm">
                {settings.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400">
            <span>Powered by Firebase Enterprise</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> Hardened Firestore ABAC Security
            </span>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} {settings.appName}. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for cartoon fans worldwide
          </p>
        </div>
      </div>
    </footer>
  );
};
