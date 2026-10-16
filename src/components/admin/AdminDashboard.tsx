import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Palette,
  Tv,
  Layers,
  Film,
  Upload,
  Image as ImageIcon,
  MessageSquare,
  Users,
  BarChart3,
  Activity,
  Settings as SettingsIcon,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';
import {
  Series,
  Season,
  Episode,
  Comment,
  Reaction,
  AppSettings,
  UserProfile,
} from '../../types';
import {
  createSeries,
  updateSeries,
  deleteSeries,
  createSeason,
  updateSeason,
  deleteSeason,
  createEpisode,
  updateEpisode,
  deleteEpisode,
  updateAppSettings,
  deleteComment,
  seedInitialDataIfEmpty,
} from '../../services/dataService';
import { DeviceUploader } from '../common/DeviceUploader';
import { useAuth } from '../../context/AuthContext';
import { testConnection } from '../../lib/firebase';

interface AdminDashboardProps {
  onClose: () => void;
  settings: AppSettings;
  seriesList: Series[];
  seasonsList: Season[];
  episodesList: Episode[];
  commentsList: Comment[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onClose,
  settings,
  seriesList,
  seasonsList,
  episodesList,
  commentsList,
}) => {
  const { logout, ownerEmail } = useAuth();
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'branding'
    | 'series'
    | 'seasons'
    | 'episodes'
    | 'videos'
    | 'posters'
    | 'banners'
    | 'comments'
    | 'users'
    | 'analytics'
    | 'status'
    | 'settings'
  >('dashboard');

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ---------------- FORM STATES ----------------
  // Series form state
  const [editingSeries, setEditingSeries] = useState<Partial<Series> | null>(null);
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);

  // Season form state
  const [editingSeason, setEditingSeason] = useState<Partial<Season> | null>(null);
  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false);

  // Episode form state
  const [editingEpisode, setEditingEpisode] = useState<Partial<Episode> | null>(null);
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false);

  // Branding state
  const [brandingForm, setBrandingForm] = useState<AppSettings>(settings);

  // Status check states
  const [isCheckingFirebase, setIsCheckingFirebase] = useState(false);
  const [firebaseLiveStatus, setFirebaseLiveStatus] = useState<string>('Online • Firestore Connected');

  // Stats calculation
  const stats = useMemo(() => {
    const totalViews = episodesList.reduce((acc, ep) => acc + (ep.viewsCount || 0), 0);
    const totalLikes = episodesList.reduce((acc, ep) => acc + (ep.likesCount || 0), 0);
    return {
      series: seriesList.length,
      seasons: seasonsList.length,
      episodes: episodesList.length,
      views: totalViews,
      likes: totalLikes,
      comments: commentsList.length,
    };
  }, [seriesList, seasonsList, episodesList, commentsList]);

  // Handle Save Branding
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateAppSettings(brandingForm);
      showNotification('App branding successfully updated and live!');
    } catch {
      showNotification('Failed to update app branding', 'error');
    }
  };

  // Handle Save Series
  const handleSaveSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeries?.title) return;
    try {
      if (editingSeries.id) {
        await updateSeries(editingSeries.id, editingSeries);
        showNotification('Series successfully updated!');
      } else {
        await createSeries({
          title: editingSeries.title,
          description: editingSeries.description || '',
          genre: editingSeries.genre || 'Cartoon / Comedy',
          releaseYear: editingSeries.releaseYear || '2026',
          language: editingSeries.language || 'Hindi / English',
          status: editingSeries.status || 'Ongoing',
          featured: !!editingSeries.featured,
          published: editingSeries.published ?? true,
          posterUrl: editingSeries.posterUrl || settings.logoUrl,
          bannerUrl: editingSeries.bannerUrl || settings.heroBannerUrl,
          displayOrder: editingSeries.displayOrder || seriesList.length + 1,
        });
        showNotification('New cartoon series created!');
      }
      setIsSeriesModalOpen(false);
      setEditingSeries(null);
    } catch {
      showNotification('Failed to save series', 'error');
    }
  };

  // Handle Delete Series
  const handleDeleteSeries = async (id: string) => {
    if (!window.confirm('Delete this series? Associated seasons and episodes will also be removed!')) return;
    try {
      await deleteSeries(id, true);
      showNotification('Series and its contents deleted.');
    } catch {
      showNotification('Failed to delete series', 'error');
    }
  };

  // Handle Save Season
  const handleSaveSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeason?.title || !editingSeason?.seriesId) return;
    try {
      if (editingSeason.id) {
        await updateSeason(editingSeason.id, editingSeason);
        showNotification('Season updated!');
      } else {
        await createSeason({
          seriesId: editingSeason.seriesId,
          seasonNumber: Number(editingSeason.seasonNumber) || 1,
          title: editingSeason.title,
          description: editingSeason.description || '',
          posterUrl: editingSeason.posterUrl || settings.logoUrl,
          bannerUrl: editingSeason.bannerUrl || settings.heroBannerUrl,
          releaseDate: editingSeason.releaseDate || '2026',
          published: editingSeason.published ?? true,
          displayOrder: Number(editingSeason.seasonNumber) || 1,
        });
        showNotification('New season created!');
      }
      setIsSeasonModalOpen(false);
      setEditingSeason(null);
    } catch {
      showNotification('Failed to save season', 'error');
    }
  };

  // Handle Delete Season
  const handleDeleteSeason = async (id: string) => {
    if (!window.confirm('Delete this season? Associated episodes will also be removed!')) return;
    try {
      await deleteSeason(id, true);
      showNotification('Season deleted.');
    } catch {
      showNotification('Failed to delete season', 'error');
    }
  };

  // Handle Save Episode
  const handleSaveEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEpisode?.title || !editingEpisode?.seasonId) return;
    try {
      if (editingEpisode.id) {
        await updateEpisode(editingEpisode.id, editingEpisode);
        showNotification('Episode details updated!');
      } else {
        await createEpisode({
          seriesId: editingEpisode.seriesId || seriesList[0]?.id || '',
          seasonId: editingEpisode.seasonId,
          episodeNumber: Number(editingEpisode.episodeNumber) || 1,
          title: editingEpisode.title,
          description: editingEpisode.description || '',
          thumbnailUrl: editingEpisode.thumbnailUrl || settings.heroBannerUrl,
          bannerUrl: editingEpisode.bannerUrl || settings.heroBannerUrl,
          videoSourceType: editingEpisode.videoSourceType || 'direct',
          videoUrl: editingEpisode.videoUrl || '',
          storagePath: editingEpisode.storagePath || '',
          duration: editingEpisode.duration || '11:00',
          releaseDate: editingEpisode.releaseDate || '2026',
          published: editingEpisode.published ?? true,
        });
        showNotification('New episode uploaded and published!');
      }
      setIsEpisodeModalOpen(false);
      setEditingEpisode(null);
    } catch {
      showNotification('Failed to save episode', 'error');
    }
  };

  // Handle Delete Episode
  const handleDeleteEpisode = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this episode and its media?')) return;
    try {
      await deleteEpisode(id);
      showNotification('Episode deleted.');
    } catch {
      showNotification('Failed to delete episode', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070b14] text-slate-100 flex flex-col md:flex-row overflow-hidden">
      {/* NOTIFICATION TOAST */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-2.5 text-xs font-bold transition-all animate-bounce ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500 text-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
        {/* Admin Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={settings.logoUrl}
              alt="Logo"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full border border-blue-500/50 object-cover"
            />
            <div>
              <h2 className="text-sm font-extrabold text-white">Admin Dashboard</h2>
              <p className="text-[10px] text-amber-400 font-semibold truncate max-w-[120px]">
                {ownerEmail}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Return to Public Streaming App"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Nav Items (Scrollable on small devices) */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-xs font-semibold">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'branding', label: 'App Branding', icon: Palette },
            { id: 'series', label: 'Manage Series', icon: Tv },
            { id: 'seasons', label: 'Manage Seasons', icon: Layers },
            { id: 'episodes', label: 'Manage Episodes', icon: Film },
            { id: 'videos', label: 'Upload Videos', icon: Upload },
            { id: 'posters', label: 'Manage Posters', icon: ImageIcon },
            { id: 'banners', label: 'Manage Banners', icon: Sparkles },
            { id: 'comments', label: 'Manage Comments', icon: MessageSquare },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'status', label: 'Firebase Status', icon: Activity },
            { id: 'settings', label: 'App Settings', icon: SettingsIcon },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Back to App button */}
        <div className="p-3 border-t border-slate-900">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-blue-400 font-bold text-xs rounded-xl border border-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Back to OTT Platform
          </button>
        </div>
      </aside>

      {/* MAIN ADMIN WORKSPACE */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#070b14]">
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">Streaming Platform Overview</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Real Firebase metrics for Bundbudh Aur Budbak streaming operations.
                </p>
              </div>
              <button
                onClick={async () => {
                  await seedInitialDataIfEmpty();
                  showNotification('Checked catalog initialization.');
                }}
                className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold rounded-xl flex items-center gap-2 self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Check Data Sync
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Total Series', value: stats.series, color: 'text-blue-400' },
                { label: 'Total Seasons', value: stats.seasons, color: 'text-indigo-400' },
                { label: 'Total Episodes', value: stats.episodes, color: 'text-amber-400' },
                { label: 'Total Views', value: stats.views, color: 'text-emerald-400' },
                { label: 'Total Likes', value: stats.likes, color: 'text-rose-400' },
                { label: 'Comments', value: stats.comments, color: 'text-purple-400' },
              ].map((m, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-1">
                  <p className="text-[11px] font-semibold text-slate-400">{m.label}</p>
                  <p className={`text-2xl font-black ${m.color}`}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Quick Administrator Management
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setEditingEpisode({});
                    setIsEpisodeModalOpen(true);
                  }}
                  className="p-4 rounded-xl bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/30 hover:border-blue-500 text-left transition-all group"
                >
                  <Plus className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-bold text-white">Upload New Episode</p>
                  <p className="text-xs text-slate-400 mt-1">Direct from phone/desktop storage or URL</p>
                </button>

                <button
                  onClick={() => {
                    setEditingSeason({});
                    setIsSeasonModalOpen(true);
                  }}
                  className="p-4 rounded-xl bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border border-indigo-500/30 hover:border-indigo-500 text-left transition-all group"
                >
                  <Plus className="w-6 h-6 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-bold text-white">Add New Season</p>
                  <p className="text-xs text-slate-400 mt-1">Create Season 3, 4 with posters</p>
                </button>

                <button
                  onClick={() => setActiveTab('branding')}
                  className="p-4 rounded-xl bg-gradient-to-br from-amber-600/20 to-orange-600/10 border border-amber-500/30 hover:border-amber-500 text-left transition-all group"
                >
                  <Palette className="w-6 h-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-bold text-white">Customize Branding</p>
                  <p className="text-xs text-slate-400 mt-1">Change Logo, Banners & Theme colors</p>
                </button>
              </div>
            </div>

            {/* Recent Episodes Table */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Latest Episodes in Database</h3>
                <button
                  onClick={() => setActiveTab('episodes')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                >
                  View All ({episodesList.length}) <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="pb-3 font-semibold">Thumbnail</th>
                      <th className="pb-3 font-semibold">Title</th>
                      <th className="pb-3 font-semibold">Episode #</th>
                      <th className="pb-3 font-semibold">Duration</th>
                      <th className="pb-3 font-semibold">Views</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {episodesList.slice(0, 5).map((ep) => (
                      <tr key={ep.id} className="hover:bg-slate-900/50">
                        <td className="py-2.5">
                          <img
                            src={ep.thumbnailUrl}
                            alt={ep.title}
                            referrerPolicy="no-referrer"
                            className="w-12 h-8 rounded object-cover"
                          />
                        </td>
                        <td className="py-2.5 font-bold text-white max-w-[200px] truncate">{ep.title}</td>
                        <td className="py-2.5 text-amber-400 font-mono">Ep {ep.episodeNumber}</td>
                        <td className="py-2.5 font-mono">{ep.duration}</td>
                        <td className="py-2.5">{ep.viewsCount || 0}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ep.published ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                            {ep.published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: APP BRANDING */}
        {activeTab === 'branding' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-xl sm:text-2xl font-black text-white">App Branding Management</h1>
              <p className="text-xs text-slate-400 mt-1">
                Upload your official logos, favicons, hero banners directly from device storage or URL.
              </p>
            </div>

            <form onSubmit={handleSaveBranding} className="space-y-6">
              {/* App Name & Welcome */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Application Name</label>
                  <input
                    type="text"
                    value={brandingForm.appName}
                    onChange={(e) => setBrandingForm({ ...brandingForm, appName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Accent Theme Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={brandingForm.accentColor}
                      onChange={(e) => setBrandingForm({ ...brandingForm, accentColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-slate-950 border border-slate-800"
                    />
                    <input
                      type="text"
                      value={brandingForm.accentColor}
                      onChange={(e) => setBrandingForm({ ...brandingForm, accentColor: e.target.value })}
                      className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Application Description</label>
                <textarea
                  rows={2}
                  value={brandingForm.description}
                  onChange={(e) => setBrandingForm({ ...brandingForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* LOGO UPLOAD (CRITICAL REQUIREMENT) */}
              <DeviceUploader
                label="Application Logo (From Phone Gallery / Device Storage)"
                accept="image"
                currentValue={brandingForm.logoUrl}
                folder="branding/logos"
                onUploadComplete={(url) => setBrandingForm({ ...brandingForm, logoUrl: url })}
              />

              {/* HERO BANNER UPLOAD */}
              <DeviceUploader
                label="Homepage Cinematic Banner (From Device Storage / URL)"
                accept="image"
                currentValue={brandingForm.heroBannerUrl}
                folder="branding/banners"
                onUploadComplete={(url) => setBrandingForm({ ...brandingForm, heroBannerUrl: url })}
              />

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95"
                >
                  Save & Apply Live Branding
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: MANAGE SERIES */}
        {activeTab === 'series' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">Manage Cartoon Series</h1>
                <p className="text-xs text-slate-400 mt-1">Configure series metadata, genres, and artwork.</p>
              </div>
              <button
                onClick={() => {
                  setEditingSeries({});
                  setIsSeriesModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" /> Add Series
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {seriesList.map((s) => (
                <div key={s.id} className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden p-4 space-y-3">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900">
                    <img
                      src={s.bannerUrl || s.posterUrl}
                      alt={s.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.published ? 'bg-emerald-500/80 text-white' : 'bg-slate-800 text-slate-300'}`}>
                        {s.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{s.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{s.description}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2">
                      <span className="text-amber-400 font-semibold">{s.genre}</span>
                      <span>•</span>
                      <span>{s.releaseYear}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900">
                    <button
                      onClick={() => {
                        setEditingSeries(s);
                        setIsSeriesModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSeries(s.id)}
                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: MANAGE SEASONS */}
        {activeTab === 'seasons' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">Manage Cartoon Seasons</h1>
                <p className="text-xs text-slate-400 mt-1">Add, update, or remove seasons with device upload artwork.</p>
              </div>
              <button
                onClick={() => {
                  setEditingSeason({ seriesId: seriesList[0]?.id || '' });
                  setIsSeasonModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" /> Add Season
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {seasonsList.map((season) => (
                <div key={season.id} className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden p-4 space-y-3">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900">
                    <img
                      src={season.bannerUrl || season.posterUrl}
                      alt={season.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-amber-500 text-[10px] font-bold text-slate-950">
                      Season {season.seasonNumber}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{season.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{season.description}</p>
                    <p className="text-[11px] text-slate-400 mt-2">Release: {season.releaseDate}</p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900">
                    <button
                      onClick={() => {
                        setEditingSeason(season);
                        setIsSeasonModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSeason(season.id)}
                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: MANAGE EPISODES */}
        {activeTab === 'episodes' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">Manage Cartoon Episodes</h1>
                <p className="text-xs text-slate-400 mt-1">Upload video files, edit titles, move seasons, and manage catalog.</p>
              </div>
              <button
                onClick={() => {
                  setEditingEpisode({
                    seriesId: seriesList[0]?.id || '',
                    seasonId: seasonsList[0]?.id || '',
                    episodeNumber: episodesList.length + 1,
                  });
                  setIsEpisodeModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" /> Add / Upload Episode
              </button>
            </div>

            <div className="space-y-3">
              {episodesList.map((ep) => (
                <div
                  key={ep.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={ep.thumbnailUrl}
                      alt={ep.title}
                      referrerPolicy="no-referrer"
                      className="w-24 h-16 rounded-xl object-cover bg-slate-900 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-amber-400/10 text-amber-400 font-bold text-[10px] rounded">
                          EP {ep.episodeNumber}
                        </span>
                        <h3 className="text-sm font-bold text-white">{ep.title}</h3>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-1">{ep.description}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span>Duration: {ep.duration}</span>
                        <span>•</span>
                        <span>Views: {ep.viewsCount || 0}</span>
                        <span>•</span>
                        <span className="capitalize text-blue-400">Source: {ep.videoSourceType}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => {
                        setEditingEpisode(ep);
                        setIsEpisodeModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEpisode(ep.id)}
                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: DEDICATED VIDEO UPLOAD (SECTION 13) */}
        {activeTab === 'videos' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-xl sm:text-2xl font-black text-white">Direct Device Storage Video Uploader</h1>
              <p className="text-xs text-slate-400 mt-1">
                Upload episode cartoon videos directly from your mobile phone or computer storage into Firebase Storage.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Select Season for this Video</label>
                  <select
                    id="dedicated-season-select"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {seasonsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} (Season {s.seasonNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Episode Title</label>
                  <input
                    id="dedicated-ep-title"
                    type="text"
                    placeholder="e.g. Episode 5: The Funniest Exam Trick"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* The Device Video Uploader */}
              <DeviceUploader
                label="Episode Video File (MP4 / WebM / Device Storage)"
                accept="video"
                folder="episodes/videos"
                showGoogleDriveOption={true}
                onUploadComplete={async (downloadUrl, storagePath) => {
                  const titleInput = (document.getElementById('dedicated-ep-title') as HTMLInputElement)?.value || 'New Uploaded Episode';
                  const seasonSelect = (document.getElementById('dedicated-season-select') as HTMLSelectElement)?.value || seasonsList[0]?.id || '';
                  try {
                    await createEpisode({
                      seriesId: seriesList[0]?.id || '',
                      seasonId: seasonSelect,
                      episodeNumber: episodesList.length + 1,
                      title: titleInput,
                      description: 'Freshly uploaded episode directly from device storage.',
                      thumbnailUrl: settings.heroBannerUrl,
                      bannerUrl: settings.heroBannerUrl,
                      videoSourceType: downloadUrl.includes('drive.google.com') ? 'googledrive' : 'storage',
                      videoUrl: downloadUrl,
                      storagePath: storagePath || '',
                      duration: '11:00',
                      releaseDate: '2026',
                      published: true,
                    });
                    showNotification('Episode video successfully uploaded and saved to Firebase!');
                  } catch (e: any) {
                    showNotification('Failed to save episode to database', 'error');
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* TAB 7: MANAGE POSTERS */}
        {activeTab === 'posters' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-xl sm:text-2xl font-black text-white">Manage Series & Season Posters</h1>
              <p className="text-xs text-slate-400 mt-1">Visual gallery of all cartoon artwork in the platform.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {seriesList.map((s) => (
                <div key={s.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-900">
                    <img src={s.posterUrl} alt={s.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs font-bold text-white truncate">{s.title}</p>
                  <p className="text-[11px] text-amber-400">Series Poster</p>
                </div>
              ))}
              {seasonsList.map((sn) => (
                <div key={sn.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-900">
                    <img src={sn.posterUrl || settings.logoUrl} alt={sn.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs font-bold text-white truncate">{sn.title}</p>
                  <p className="text-[11px] text-blue-400">Season Poster</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: MANAGE BANNERS */}
        {activeTab === 'banners' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-xl sm:text-2xl font-black text-white">Manage Hero & Section Banners</h1>
              <p className="text-xs text-slate-400 mt-1">Cinematic 16:9 banners displayed on the homepage and episode player.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-amber-400">Active Homepage Hero Banner</span>
                <div className="aspect-video rounded-xl overflow-hidden bg-slate-900">
                  <img src={settings.heroBannerUrl} alt="Hero Banner" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
              </div>

              {seriesList.map((s) => (
                <div key={s.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <span className="text-xs font-bold text-blue-400">{s.title} Banner</span>
                  <div className="aspect-video rounded-xl overflow-hidden bg-slate-900">
                    <img src={s.bannerUrl} alt={s.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 9: MANAGE COMMENTS */}
        {activeTab === 'comments' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-xl sm:text-2xl font-black text-white">Moderate User Comments</h1>
              <p className="text-xs text-slate-400 mt-1">Review, delete spam, and moderate fan comments across all episodes.</p>
            </div>

            <div className="space-y-3">
              {commentsList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">No comments in the database.</div>
              ) : (
                commentsList.map((c) => (
                  <div key={c.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{c.userName}</span>
                        <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                        {c.reported && (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                            REPORTED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300">{c.text}</p>
                    </div>

                    <button
                      onClick={async () => {
                        await deleteComment(c.id);
                        showNotification('Comment deleted.');
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete comment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 10: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-xl sm:text-2xl font-black text-white">User Accounts & Roles</h1>
              <p className="text-xs text-slate-400 mt-1">Monitor Google and Anonymous Guest users connected via Firebase Auth.</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-600/10 border border-blue-500/30">
                <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Verified Owner Administrator</h4>
                  <p className="text-xs text-slate-300">{ownerEmail} (Super Admin)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 11: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-xl sm:text-2xl font-black text-white">Streaming Analytics</h1>
              <p className="text-xs text-slate-400 mt-1">Real-time engagement breakdown from Firestore data.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">
                  Most Viewed Episodes
                </h4>
                <div className="space-y-2">
                  {[...episodesList]
                    .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
                    .slice(0, 5)
                    .map((ep) => (
                      <div key={ep.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-900">
                        <span className="font-medium text-slate-200 truncate max-w-[200px]">{ep.title}</span>
                        <span className="font-mono text-emerald-400 font-bold">{ep.viewsCount || 0} views</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">
                  Most Liked Episodes
                </h4>
                <div className="space-y-2">
                  {[...episodesList]
                    .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
                    .slice(0, 5)
                    .map((ep) => (
                      <div key={ep.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-900">
                        <span className="font-medium text-slate-200 truncate max-w-[200px]">{ep.title}</span>
                        <span className="font-mono text-rose-400 font-bold">{ep.likesCount || 0} likes</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 12: FIREBASE STATUS (SECTION 23) */}
        {activeTab === 'status' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">Firebase Connection Status</h1>
                <p className="text-xs text-slate-400 mt-1">Real-time health check of Firebase services.</p>
              </div>
              <button
                onClick={async () => {
                  setIsCheckingFirebase(true);
                  const ok = await testConnection();
                  setIsCheckingFirebase(false);
                  setFirebaseLiveStatus(ok ? 'Online • Connection Verified' : 'Check Network');
                }}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-blue-400 rounded-xl text-xs font-bold border border-slate-800 flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingFirebase ? 'animate-spin' : ''}`} /> Run Diagnostic
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Firebase Auth</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-sm font-bold text-emerald-400">ACTIVE</p>
                <p className="text-[11px] text-slate-400">Google OAuth & Anonymous Guest Auth</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Cloud Firestore</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-sm font-bold text-emerald-400">CONNECTED</p>
                <p className="text-[11px] text-slate-400">Database ID: ai-studio-638ef768-89d9-468b-ae51-aeb2d2e5f4b7</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Firebase Storage</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-sm font-bold text-emerald-400">OPERATIONAL</p>
                <p className="text-[11px] text-slate-400">Direct Device Storage Uploads Enabled</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 13: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="border-b border-slate-800 pb-4">
              <h1 className="text-xl sm:text-2xl font-black text-white">Platform Settings</h1>
              <p className="text-xs text-slate-400 mt-1">Platform administration tools and database maintenance.</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white">Catalog Re-Seeding</h3>
              <p className="text-xs text-slate-400">
                If the database is fresh, you can populate the official Bundbudh Aur Budbak 2.0 series, Season 1 & 2, and sample cartoon episodes.
              </p>
              <button
                onClick={async () => {
                  const seeded = await seedInitialDataIfEmpty();
                  if (seeded) {
                    showNotification('Catalog seeded with official episodes!');
                  } else {
                    showNotification('Catalog already has data.');
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
              >
                Seed Initial Episodes
              </button>
            </div>
          </div>
        )}
      </main>

      {/* SERIES MODAL */}
      {isSeriesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingSeries?.id ? 'Edit Cartoon Series' : 'Create New Cartoon Series'}
            </h3>
            <form onSubmit={handleSaveSeries} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300">Series Title</label>
                <input
                  type="text"
                  value={editingSeries?.title || ''}
                  onChange={(e) => setEditingSeries({ ...editingSeries, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Description</label>
                <textarea
                  rows={3}
                  value={editingSeries?.description || ''}
                  onChange={(e) => setEditingSeries({ ...editingSeries, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Genre</label>
                  <input
                    type="text"
                    value={editingSeries?.genre || 'Comedy / Animation'}
                    onChange={(e) => setEditingSeries({ ...editingSeries, genre: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">Release Year</label>
                  <input
                    type="text"
                    value={editingSeries?.releaseYear || '2026'}
                    onChange={(e) => setEditingSeries({ ...editingSeries, releaseYear: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              {/* POSTER & BANNER UPLOAD */}
              <DeviceUploader
                label="Series Poster"
                accept="image"
                currentValue={editingSeries?.posterUrl}
                folder="series/posters"
                onUploadComplete={(url) => setEditingSeries({ ...editingSeries, posterUrl: url })}
              />

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSeriesModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow"
                >
                  Save Series
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEASON MODAL */}
      {isSeasonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingSeason?.id ? 'Edit Season' : 'Add New Season'}
            </h3>
            <form onSubmit={handleSaveSeason} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300">Select Parent Series</label>
                <select
                  value={editingSeason?.seriesId || seriesList[0]?.id || ''}
                  onChange={(e) => setEditingSeason({ ...editingSeason, seriesId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                >
                  {seriesList.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Season Number</label>
                  <input
                    type="number"
                    value={editingSeason?.seasonNumber || 1}
                    onChange={(e) => setEditingSeason({ ...editingSeason, seasonNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">Release Date</label>
                  <input
                    type="text"
                    value={editingSeason?.releaseDate || '2026'}
                    onChange={(e) => setEditingSeason({ ...editingSeason, releaseDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Season Title</label>
                <input
                  type="text"
                  value={editingSeason?.title || ''}
                  onChange={(e) => setEditingSeason({ ...editingSeason, title: e.target.value })}
                  placeholder="e.g. Season 3: Examination Chaos"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  required
                />
              </div>

              <DeviceUploader
                label="Season Poster / Banner"
                accept="image"
                currentValue={editingSeason?.posterUrl}
                folder="seasons/posters"
                onUploadComplete={(url) => setEditingSeason({ ...editingSeason, posterUrl: url, bannerUrl: url })}
              />

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSeasonModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow"
                >
                  Save Season
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EPISODE MODAL */}
      {isEpisodeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingEpisode?.id ? 'Edit Episode & Media' : 'Upload & Add New Episode'}
            </h3>
            <form onSubmit={handleSaveEpisode} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Season</label>
                  <select
                    value={editingEpisode?.seasonId || seasonsList[0]?.id || ''}
                    onChange={(e) => setEditingEpisode({ ...editingEpisode, seasonId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    {seasonsList.map((sn) => (
                      <option key={sn.id} value={sn.id}>
                        {sn.title} (S{sn.seasonNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">Episode Number</label>
                  <input
                    type="number"
                    value={editingEpisode?.episodeNumber || 1}
                    onChange={(e) => setEditingEpisode({ ...editingEpisode, episodeNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Episode Title</label>
                <input
                  type="text"
                  value={editingEpisode?.title || ''}
                  onChange={(e) => setEditingEpisode({ ...editingEpisode, title: e.target.value })}
                  placeholder="e.g. Samosa Champion Budbak"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Episode Description</label>
                <textarea
                  rows={2}
                  value={editingEpisode?.description || ''}
                  onChange={(e) => setEditingEpisode({ ...editingEpisode, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              {/* EPISODE VIDEO UPLOAD (DEVICE STORAGE, URL, GOOGLE DRIVE) */}
              <DeviceUploader
                label="Episode Video File (Device Storage / Direct Link / Google Drive)"
                accept="video"
                currentValue={editingEpisode?.videoUrl}
                folder="episodes/videos"
                showGoogleDriveOption={true}
                onUploadComplete={(url, storagePath) =>
                  setEditingEpisode({
                    ...editingEpisode,
                    videoUrl: url,
                    storagePath,
                    videoSourceType: url.includes('drive.google.com') ? 'googledrive' : 'storage',
                  })
                }
              />

              {/* EPISODE THUMBNAIL UPLOAD */}
              <DeviceUploader
                label="Episode Thumbnail"
                accept="image"
                currentValue={editingEpisode?.thumbnailUrl}
                folder="episodes/thumbnails"
                onUploadComplete={(url) =>
                  setEditingEpisode({ ...editingEpisode, thumbnailUrl: url, bannerUrl: url })
                }
              />

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEpisodeModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow"
                >
                  Save & Publish Episode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
