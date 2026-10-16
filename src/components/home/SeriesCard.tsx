import React from 'react';
import { Series } from '../../types';
import { Tv, Sparkles } from 'lucide-react';

interface SeriesCardProps {
  series: Series;
  seasonCount?: number;
  onSelect: (series: Series) => void;
}

export const SeriesCard: React.FC<SeriesCardProps> = ({
  series,
  seasonCount = 0,
  onSelect,
}) => {
  return (
    <div
      onClick={() => onSelect(series)}
      className="group flex-shrink-0 w-48 sm:w-56 cursor-pointer rounded-2xl overflow-hidden border border-slate-800 hover:border-blue-500/50 bg-slate-900/60 hover:bg-slate-900 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 p-2.5"
    >
      <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-950 mb-2.5">
        <img
          src={series.posterUrl || '/src/assets/images/bandbudh_budbak_logo_1792155787010.jpg'}
          alt={series.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {series.featured && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-blue-600 text-[10px] font-bold text-white flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Featured
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
          {series.title}
        </h4>
        <p className="text-xs text-slate-400 line-clamp-1">{series.genre}</p>
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
          <span>{series.releaseYear}</span>
          <span className="text-amber-400 font-medium">{series.status}</span>
        </div>
      </div>
    </div>
  );
};
