import React from 'react';
import { Play, Eye, ThumbsUp, Clock } from 'lucide-react';
import { Episode, WatchProgress } from '../../types';

interface EpisodeCardProps {
  episode: Episode;
  progress?: WatchProgress;
  onPlay: (episode: Episode) => void;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({
  episode,
  progress,
  onPlay,
}) => {
  return (
    <div
      onClick={() => onPlay(episode)}
      className="group flex-shrink-0 w-64 sm:w-72 cursor-pointer bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
        <img
          src={episode.thumbnailUrl || episode.bannerUrl || '/src/assets/images/bandbudh_hero_banner_1792155804824.jpg'}
          alt={episode.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 fill-white ml-0.5" />
          </div>
        </div>

        {/* Episode Number Badge */}
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur border border-white/10 text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
          EP {episode.episodeNumber}
        </div>

        {/* Duration Badge */}
        {episode.duration && (
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur text-[10px] font-mono text-slate-300 flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-400" />
            {episode.duration}
          </div>
        )}

        {/* Continue Watching Progress Bar */}
        {progress && progress.percentage > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-r-full"
              style={{ width: `${Math.min(100, progress.percentage)}%` }}
            />
          </div>
        )}
      </div>

      {/* Content Meta */}
      <div className="p-3.5 space-y-1.5">
        <h4 className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">
          {episode.title}
        </h4>
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {episode.description}
        </p>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-blue-400" /> {episode.viewsCount ?? 0} views
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3 text-amber-400" /> {episode.likesCount ?? 0} likes
          </span>
        </div>
      </div>
    </div>
  );
};
