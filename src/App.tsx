/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { Footer } from './components/layout/Footer';
import { HeroBanner } from './components/home/HeroBanner';
import { EpisodeCard } from './components/home/EpisodeCard';
import { SeasonCard } from './components/home/SeasonCard';
import { SeriesCard } from './components/home/SeriesCard';
import { VideoPlayer } from './components/player/VideoPlayer';
import { ReactionsBar } from './components/episodes/ReactionsBar';
import { CommentsSection } from './components/episodes/CommentsSection';
import { SearchModal } from './components/search/SearchModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LoginGateModal } from './components/auth/LoginGateModal';
import {
  subscribeAppSettings,
  subscribeSeries,
  subscribeSeasons,
  subscribeEpisodes,
  subscribeAllComments,
  subscribeUserWatchHistory,
  seedInitialDataIfEmpty,
  DEFAULT_SETTINGS,
} from './services/dataService';
import {
  Series,
  Season,
  Episode,
  Comment,
  AppSettings,
  WatchProgress,
} from './types';
import {
  Play,
  Tv,
  Layers,
  Film,
  Sparkles,
  Clock,
  Flame,
  CheckCircle2,
  LogIn,
  Sliders,
  X,
} from 'lucide-react';

function StreamingApp() {
  const { currentUser, loading, isGoogle, isGuest, isAdmin, signInWithGoogle, signInAsGuest, logout } = useAuth();

  // Firestore Live States
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [seasonsList, setSeasonsList] = useState<Season[]>([]);
  const [episodesList, setEpisodesList] = useState<Episode[]>([]);
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchProgress[]>([]);

  // Navigation & View States
  const [activeTab, setActiveTab] = useState<string>('home');
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  const [selectedSeasonFilter, setSelectedSeasonFilter] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  // Subscribe to AppSettings
  useEffect(() => {
    const unsub = subscribeAppSettings((data) => setSettings(data));
    return () => unsub();
  }, []);

  // Subscribe to Series
  useEffect(() => {
    const unsub = subscribeSeries((data) => {
      setSeriesList(data);
      if (data.length === 0) {
        // Automatically check if initial seed is needed
        seedInitialDataIfEmpty();
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to Seasons
  useEffect(() => {
    const unsub = subscribeSeasons((data) => setSeasonsList(data));
    return () => unsub();
  }, []);

  // Subscribe to Episodes
  useEffect(() => {
    const unsub = subscribeEpisodes((data) => {
      setEpisodesList(data);
    });
    return () => unsub();
  }, []);

  // Subscribe to All Comments
  useEffect(() => {
    const unsub = subscribeAllComments((data) => setCommentsList(data));
    return () => unsub();
  }, []);

  // Subscribe to User Watch History
  useEffect(() => {
    if (!currentUser) {
      setWatchHistory([]);
      return;
    }
    const unsub = subscribeUserWatchHistory(currentUser.uid, (data) => {
      setWatchHistory(data);
    });
    return () => unsub();
  }, [currentUser]);

  // Featured Episode & Series
  const featuredSeries = seriesList.find((s) => s.featured) || seriesList[0] || null;
  const featuredEpisode = episodesList[0] || null;

  // Continue Watching Episodes map
  const continueWatchingEpisodes = useMemo(() => {
    if (!watchHistory.length || !episodesList.length) return [];
    return watchHistory
      .map((hist) => {
        const ep = episodesList.find((e) => e.id === hist.episodeId);
        return ep ? { episode: ep, progress: hist } : null;
      })
      .filter((item): item is { episode: Episode; progress: WatchProgress } => !!item && item.progress.percentage < 95);
  }, [watchHistory, episodesList]);

  // Popular Episodes sorted by views
  const popularEpisodes = useMemo(() => {
    return [...episodesList].sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
  }, [episodesList]);

  // Filtered episodes for Seasons tab or Season filter
  const displayedEpisodes = useMemo(() => {
    if (!selectedSeasonFilter) return episodesList;
    return episodesList.filter((e) => e.seasonId === selectedSeasonFilter);
  }, [episodesList, selectedSeasonFilter]);

  // Handle Play Episode
  const handlePlayEpisode = (ep: Episode) => {
    setActiveEpisode(ep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Initial Loading Splash
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500/50 p-1 bg-slate-900 mb-4 animate-pulse">
          <img
            src={settings.logoUrl || '/src/assets/images/bandbudh_budbak_logo_1792155787010.jpg'}
            alt="Loading"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-full"
          />
        </div>
        <p className="text-sm font-bold text-white tracking-wide">BUNDBUDH AUR BUDBAK</p>
        <p className="text-xs text-slate-400 mt-1">Connecting to Apna School streaming servers...</p>
      </div>
    );
  }

  // GATE: Do not open site before login (Requires Google or Guest login)
  if (!currentUser) {
    return (
      <LoginGateModal
        settings={settings}
        onAdminUnlock={() => setIsAdminOpen(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        settings={settings}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'home') setActiveEpisode(null);
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        {/* ACTIVE EPISODE VIDEO PLAYER VIEW */}
        {activeEpisode ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <button
                onClick={() => setActiveEpisode(null)}
                className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
              >
                <X className="w-4 h-4" /> Close Player & Back to Catalog
              </button>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 font-bold text-xs rounded-full border border-amber-500/30">
                  Episode {activeEpisode.episodeNumber}
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  {activeEpisode.duration}
                </span>
              </div>
            </div>

            {/* Video Player */}
            <VideoPlayer
              episode={activeEpisode}
              allEpisodes={episodesList}
              onSelectEpisode={handlePlayEpisode}
              initialProgress={
                watchHistory.find((w) => w.episodeId === activeEpisode.id)?.progressSeconds || 0
              }
            />

            {/* Episode Meta & Info */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {activeEpisode.title}
                </h1>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{activeEpisode.viewsCount || 0} views</span>
                  <span>•</span>
                  <span>{activeEpisode.likesCount || 0} likes</span>
                </div>
              </div>
              <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                {activeEpisode.description}
              </p>
            </div>

            {/* Reactions Bar (Love, Funny, Amazing, Surprised, Like) */}
            <ReactionsBar episodeId={activeEpisode.id} />

            {/* Grid Layout: Comments on Left, Next Up on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
              <div className="lg:col-span-2">
                <CommentsSection episodeId={activeEpisode.id} />
              </div>

              {/* Up Next Episodes Sidebar */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Film className="w-4 h-4 text-blue-400" />
                  More Classroom Episodes
                </h3>
                <div className="space-y-2.5">
                  {episodesList
                    .filter((e) => e.id !== activeEpisode.id)
                    .slice(0, 6)
                    .map((ep) => (
                      <div
                        key={ep.id}
                        onClick={() => handlePlayEpisode(ep)}
                        className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-blue-500/40 cursor-pointer transition-all group"
                      >
                        <div className="w-20 h-14 rounded-lg overflow-hidden bg-slate-950 shrink-0 relative">
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
                          <span className="text-[10px] font-bold text-amber-400">
                            EP {ep.episodeNumber}
                          </span>
                          <p className="text-xs font-bold text-slate-200 group-hover:text-blue-400 truncate">
                            {ep.title}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {ep.duration}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* REGULAR TAB VIEWS */
          <>
            {/* TAB: HOME */}
            {activeTab === 'home' && (
              <div className="space-y-12">
                {/* Hero Banner */}
                <HeroBanner
                  settings={settings}
                  featuredSeries={featuredSeries}
                  featuredEpisode={featuredEpisode}
                  onPlayEpisode={handlePlayEpisode}
                  onExplore={() => {
                    const el = document.getElementById('all-episodes-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                />

                {/* CONTINUE WATCHING (Section 21) */}
                {continueWatchingEpisodes.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        Continue Watching
                      </h2>
                    </div>

                    <div className="flex items-center gap-4 overflow-x-auto pb-4 hide-scrollbar">
                      {continueWatchingEpisodes.map(({ episode, progress }) => (
                        <EpisodeCard
                          key={episode.id}
                          episode={episode}
                          progress={progress}
                          onPlay={handlePlayEpisode}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* POPULAR / LATEST EPISODES */}
                <section id="all-episodes-section" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                        <Flame className="w-5 h-5 text-amber-400" />
                        Latest Cartoon Episodes
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Brand new school pranks, funny comedy, and stories from Apna School.
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('episodes')}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                    >
                      View All ({episodesList.length})
                    </button>
                  </div>

                  {episodesList.length === 0 ? (
                    <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                      <Film className="w-12 h-12 text-slate-600 mx-auto" />
                      <h3 className="text-base font-bold text-white">No episodes in catalog yet</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        The administrator can add episodes or populate the official catalog from the Admin Dashboard.
                      </p>
                      {isAdmin && (
                        <button
                          onClick={() => setIsAdminOpen(true)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow inline-flex items-center gap-2"
                        >
                          <Sliders className="w-4 h-4" /> Open Admin Dashboard
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 overflow-x-auto pb-4 hide-scrollbar">
                      {episodesList.map((ep) => (
                        <EpisodeCard
                          key={ep.id}
                          episode={ep}
                          onPlay={handlePlayEpisode}
                        />
                      ))}
                    </div>
                  )}
                </section>

                {/* SEASONS BROWSER (Section 11) */}
                {seasonsList.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                        <Layers className="w-5 h-5 text-indigo-400" />
                        Explore Seasons
                      </h2>
                      <button
                        onClick={() => setActiveTab('seasons')}
                        className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                      >
                        All Seasons
                      </button>
                    </div>

                    <div className="flex items-center gap-4 overflow-x-auto pb-4 hide-scrollbar">
                      {seasonsList.map((season) => {
                        const count = episodesList.filter((e) => e.seasonId === season.id).length;
                        return (
                          <SeasonCard
                            key={season.id}
                            season={season}
                            episodeCount={count}
                            onSelect={(sn) => {
                              setSelectedSeasonFilter(sn.id);
                              setActiveTab('episodes');
                            }}
                          />
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* ALL SERIES SECTION (Section 10) */}
                {seriesList.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                        <Tv className="w-5 h-5 text-blue-400" />
                        All Cartoon Series
                      </h2>
                    </div>

                    <div className="flex items-center gap-4 overflow-x-auto pb-4 hide-scrollbar">
                      {seriesList.map((series) => {
                        const sCount = seasonsList.filter((sn) => sn.seriesId === series.id).length;
                        return (
                          <SeriesCard
                            key={series.id}
                            series={series}
                            seasonCount={sCount}
                            onSelect={() => setActiveTab('episodes')}
                          />
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* TAB: SERIES */}
            {activeTab === 'series' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-black text-white">Cartoon Series Catalog</h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Official animated series featuring Badrinath and Budhdeb.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {seriesList.map((series) => (
                    <SeriesCard
                      key={series.id}
                      series={series}
                      onSelect={() => setActiveTab('episodes')}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* TAB: SEASONS */}
            {activeTab === 'seasons' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-black text-white">Cartoon Seasons</h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Select a season to view all its episodes.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {seasonsList.map((season) => {
                    const epCount = episodesList.filter((e) => e.seasonId === season.id).length;
                    return (
                      <SeasonCard
                        key={season.id}
                        season={season}
                        episodeCount={epCount}
                        onSelect={(sn) => {
                          setSelectedSeasonFilter(sn.id);
                          setActiveTab('episodes');
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: EPISODES */}
            {activeTab === 'episodes' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <h1 className="text-2xl font-black text-white">All Episodes</h1>
                    <p className="text-xs text-slate-400 mt-1">
                      Showing {displayedEpisodes.length} cartoon episodes.
                    </p>
                  </div>

                  {/* Season Filter Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Filter Season:</span>
                    <select
                      value={selectedSeasonFilter || ''}
                      onChange={(e) => setSelectedSeasonFilter(e.target.value || null)}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">All Seasons</option>
                      {seasonsList.map((sn) => (
                        <option key={sn.id} value={sn.id}>
                          {sn.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {displayedEpisodes.map((ep) => (
                    <EpisodeCard
                      key={ep.id}
                      episode={ep}
                      onPlay={handlePlayEpisode}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* TAB: PROFILE (FOR MOBILE / USER PROFILE) */}
            {activeTab === 'profile' && (
              <div className="max-w-md mx-auto space-y-6 py-8">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-blue-600/20 text-blue-400 mx-auto flex items-center justify-center overflow-hidden border-2 border-blue-500/40">
                    {currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt="Profile" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <Tv className="w-10 h-10" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {currentUser?.displayName || (isGuest ? 'Guest Student' : 'Schoolmate Account')}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {currentUser?.email || (isGuest ? 'Anonymous guest session' : 'Sign in to sync watchlist')}
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-bold">
                      VERIFIED ADMINISTRATOR
                    </div>
                  )}

                  {!currentUser ? (
                    <div className="space-y-2 pt-2">
                      <button
                        onClick={signInWithGoogle}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2"
                      >
                        <LogIn className="w-4 h-4" /> Sign in with Google
                      </button>
                      <button
                        onClick={signInAsGuest}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs rounded-xl"
                      >
                        Continue as Guest
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-2">
                      {isGuest && (
                        <button
                          onClick={signInWithGoogle}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2"
                        >
                          <LogIn className="w-4 h-4" /> Link Google Account
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => setIsAdminOpen(true)}
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2"
                        >
                          <Sliders className="w-4 h-4" /> Open Admin Dashboard
                        </button>
                      )}
                      <button
                        onClick={logout}
                        className="w-full py-2 bg-slate-900 hover:bg-rose-500/10 text-rose-400 font-semibold text-xs rounded-xl"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <Footer settings={settings} />

      {/* Mobile-first Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={(t) => {
          setActiveTab(t);
          if (t !== 'home') setActiveEpisode(null);
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        seriesList={seriesList}
        seasonsList={seasonsList}
        episodesList={episodesList}
        onSelectEpisode={handlePlayEpisode}
      />

      {/* Admin Dashboard Fullscreen Overlay */}
      {isAdminOpen && (
        <AdminDashboard
          onClose={() => setIsAdminOpen(false)}
          settings={settings}
          seriesList={seriesList}
          seasonsList={seasonsList}
          episodesList={episodesList}
          commentsList={commentsList}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StreamingApp />
    </AuthProvider>
  );
}
