import React from 'react';
import { Season } from '../../types';
import { Layers } from 'lucide-react';

interface SeasonCardProps {
  season: Season;
  episodeCount?: number;
  isSelected?: boolean;
  onSelect: (season: Season) => void;
}

export const SeasonCard: React.FC<SeasonCardProps> = ({
  season,
  episodeCount = 0,
  isSelected = false,
  onSelect,
}) => {
  return (
    <div
      onClick={() => onSelect(season)}
      className={`group flex-shrink-0 w-52 sm:w-60 cursor-pointer rounded-2xl overflow-hidden border p-3 transition-all duration-300 hover:-translate-y-1 ${
        isSelected
          ? 'bg-blue-600/15 border-blue-500 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500'
          : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 mb-3">
        <img
          src={season.bannerUrl || season.posterUrl || '/src/assets/images/bandbudh_budbak_logo_1792155787010.jpg'}
          alt={season.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-amber-400">
          SEASON {season.seasonNumber}
        </div>
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
          {season.title}
        </h4>
        <p className="text-xs text-slate-400 line-clamp-1">
          {season.description}
        </p>
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span className="flex items-center gap-1 text-blue-400">
            <Layers className="w-3 h-3" /> {episodeCount} Episodes
          </span>
          <span>{season.releaseDate}</span>
        </div>
      </div>
    </div>
  );
};
