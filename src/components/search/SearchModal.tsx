import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, X, Film, Play, Tv } from 'lucide-react';
import { Series, Season, Episode } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  seriesList: Series[];
  seasonsList: Season[];
  episodesList: Episode[];
  onSelectEpisode: (episode: Episode) => void;
  onSelectSeries?: (series: Series) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  seriesList,
  seasonsList,
  episodesList,
  onSelectEpisode,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredEpisodes = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase().trim();
    return episodesList.filter((ep) => {
      const matchTitle = ep.title.toLowerCase().includes(term);
      const matchDesc = ep.description.toLowerCase().includes(term);
      const matchNumber = `episode ${ep.episodeNumber}`.toLowerCase().includes(term) || `ep ${ep.episodeNumber}`.toLowerCase().includes(term);
      return matchTitle || matchDesc || matchNumber;
    });
  }, [searchTerm, episodesList]);

  const filteredSeries = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase().trim();
    return seriesList.filter((s) => s.title.toLowerCase().includes(term) || s.genre.toLowerCase().includes(term));
  }, [searchTerm, seriesList]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 px-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <SearchIcon className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search episodes, titles, numbers (e.g. Samosa, Ep 2, Homework)..."
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-semibold px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!searchTerm.trim() ? (
            <div className="text-center py-10 space-y-2">
              <Film className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">
                Explore the Bundbudh Aur Budbak universe
              </p>
              <p className="text-xs text-slate-400">
                Type an episode title, number, or keyword to start watching.
              </p>
            </div>
          ) : filteredEpisodes.length === 0 && filteredSeries.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No matching cartoon episodes found for "{searchTerm}".
            </div>
          ) : (
            <>
              {/* Episodes Results */}
              {filteredEpisodes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-blue-400" />
                    Matching Episodes ({filteredEpisodes.length})
                  </h4>
                  <div className="space-y-1.5">
                    {filteredEpisodes.map((ep) => (
                      <button
                        key={ep.id}
                        onClick={() => {
                          onSelectEpisode(ep);
                          onClose();
                        }}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-950/60 hover:bg-blue-600/15 border border-slate-800 hover:border-blue-500/50 transition-all flex items-center gap-3 group"
                      >
                        <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-800 shrink-0 relative">
                          <img
                            src={ep.thumbnailUrl}
                            alt={ep.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-4 h-4 text-white fill-white" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-amber-400 px-1.5 py-0.2 bg-amber-400/10 rounded">
                              EP {ep.episodeNumber}
                            </span>
                            <p className="text-xs font-bold text-slate-200 group-hover:text-blue-400 truncate">
                              {ep.title}
                            </p>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {ep.description}
                          </p>
                        </div>

                        <span className="text-[11px] font-mono text-slate-400 shrink-0">
                          {ep.duration}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Series Results */}
              {filteredSeries.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-amber-400" />
                    Series ({filteredSeries.length})
                  </h4>
                  <div className="space-y-1.5">
                    {filteredSeries.map((s) => (
                      <div
                        key={s.id}
                        className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center gap-3"
                      >
                        <img
                          src={s.posterUrl}
                          alt={s.title}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-200">{s.title}</p>
                          <p className="text-[11px] text-slate-400">{s.genre} • {s.releaseYear}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
