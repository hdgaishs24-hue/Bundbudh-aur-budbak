import React from 'react';
import { Play, Info, Sparkles, Tv, CheckCircle2 } from 'lucide-react';
import { Series, Season, Episode, AppSettings } from '../../types';

interface HeroBannerProps {
  settings: AppSettings;
  featuredSeries?: Series | null;
  featuredEpisode?: Episode | null;
  onPlayEpisode: (episode: Episode) => void;
  onExplore: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  settings,
  featuredSeries,
  featuredEpisode,
  onPlayEpisode,
  onExplore,
}) => {
  const bannerImage = settings.heroBannerUrl || featuredSeries?.bannerUrl || '/src/assets/images/bandbudh_hero_banner_1792155804824.jpg';
  const title = featuredSeries?.title || 'Bandbudh Aur Budbak 2.0';
  const description =
    featuredSeries?.description ||
    'Join Badrinath and Budhdeb in their hilarious classroom adventures, clever pranks, and non-stop comedy at Apna School!';

  return (
    <div className="relative w-full h-[420px] sm:h-[500px] lg:h-[560px] rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80 mb-8 sm:mb-12">
      {/* Background Hero Image */}
      <img
        src={bannerImage}
        alt={title}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover object-center"
      />

      {/* Cinematic Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#070b14]/90 via-[#070b14]/40 to-transparent" />

      {/* Hero Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 lg:p-12 max-w-3xl space-y-4">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-[11px] rounded-full uppercase tracking-wider shadow-lg shadow-blue-500/30 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Featured Cartoon Original
          </span>
          {featuredSeries?.genre && (
            <span className="px-3 py-1 bg-slate-900/80 backdrop-blur text-slate-300 font-semibold text-[11px] rounded-full border border-slate-700">
              {featuredSeries.genre}
            </span>
          )}
          {featuredSeries?.releaseYear && (
            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 font-bold text-[11px] rounded-full border border-amber-500/30">
              {featuredSeries.releaseYear}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-md">
          {title}
        </h1>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 max-w-2xl leading-relaxed drop-shadow">
          {description}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {featuredEpisode && (
            <button
              onClick={() => onPlayEpisode(featuredEpisode)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-blue-600/30 transition-all active:scale-95 flex items-center gap-2.5"
            >
              <Play className="w-4 h-4 fill-white" />
              Watch Now • Ep {featuredEpisode.episodeNumber}
            </button>
          )}

          <button
            onClick={onExplore}
            className="px-5 py-3 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-sm rounded-xl border border-slate-700 backdrop-blur transition-all flex items-center gap-2"
          >
            <Info className="w-4 h-4 text-blue-400" />
            Explore Episodes & Seasons
          </button>
        </div>
      </div>
    </div>
  );
};
