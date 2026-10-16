import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  SkipForward,
  SkipBack,
  Settings,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Episode } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { saveWatchProgress, recordEpisodeView } from '../../services/dataService';

interface VideoPlayerProps {
  episode: Episode;
  allEpisodes?: Episode[];
  onSelectEpisode?: (ep: Episode) => void;
  initialProgress?: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  episode,
  allEpisodes = [],
  onSelectEpisode,
  initialProgress = 0,
}) => {
  const { currentUser } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(initialProgress);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isGoogleDrive = episode.videoUrl?.includes('drive.google.com');

  // Record view once when episode mounts
  useEffect(() => {
    recordEpisodeView(episode.id);
  }, [episode.id]);

  // Initial resume progress
  useEffect(() => {
    if (videoRef.current && initialProgress > 0) {
      videoRef.current.currentTime = initialProgress;
    }
  }, [initialProgress, episode.id]);

  // Periodic watch progress saver
  useEffect(() => {
    if (!currentUser || isGoogleDrive) return;

    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused && duration > 0) {
        saveWatchProgress(
          currentUser.uid,
          episode.id,
          episode.seriesId,
          videoRef.current.currentTime,
          duration
        );
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser, episode.id, episode.seriesId, duration, isGoogleDrive]);

  // Handle Fullscreen Change event
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
      if (initialProgress > 0) {
        videoRef.current.currentTime = initialProgress;
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      setIsMuted(newVol === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleSpeedSelect = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSpeedMenu(false);
      }
    }, 3500);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Find next and prev episodes
  const currentIndex = allEpisodes.findIndex((e) => e.id === episode.id);
  const prevEp = currentIndex > 0 ? allEpisodes[currentIndex - 1] : null;
  const nextEp = currentIndex >= 0 && currentIndex < allEpisodes.length - 1 ? allEpisodes[currentIndex + 1] : null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl group border border-slate-800"
    >
      {/* GOOGLE DRIVE EMBED PLAYER */}
      {isGoogleDrive ? (
        <div className="w-full h-full relative">
          <iframe
            src={episode.videoUrl}
            title={episode.title}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
          {/* Drive Navigation Bar Overlay */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <span className="px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-xs font-semibold text-white border border-white/10">
              Episode {episode.episodeNumber}: {episode.title}
            </span>
            <div className="pointer-events-auto flex items-center gap-2">
              {prevEp && onSelectEpisode && (
                <button
                  onClick={() => onSelectEpisode(prevEp)}
                  className="px-3 py-1 bg-black/80 hover:bg-black text-white text-xs rounded-full border border-white/20 transition-all flex items-center gap-1"
                >
                  <SkipBack className="w-3.5 h-3.5" /> Prev
                </button>
              )}
              {nextEp && onSelectEpisode && (
                <button
                  onClick={() => onSelectEpisode(nextEp)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-full shadow transition-all flex items-center gap-1"
                >
                  Next <SkipForward className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD HTML5 OTT VIDEO PLAYER */
        <>
          <video
            ref={videoRef}
            src={episode.videoUrl}
            poster={episode.bannerUrl || episode.thumbnailUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onWaiting={() => setIsLoading(true)}
            onPlaying={() => {
              setIsPlaying(true);
              setIsLoading(false);
            }}
            onPause={() => setIsPlaying(false)}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
            onEnded={() => {
              setIsPlaying(false);
              if (nextEp && onSelectEpisode) {
                onSelectEpisode(nextEp);
              }
            }}
            onClick={togglePlay}
            className="w-full h-full object-contain cursor-pointer"
            playsInline
          />

          {/* LOADING SPINNER */}
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-2" />
              <p className="text-xs font-medium text-slate-300">Buffering Episode...</p>
            </div>
          )}

          {/* ERROR OVERLAY */}
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center">
              <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Playback Error</h3>
              <p className="text-xs text-slate-400 max-w-md mb-4">
                Unable to play this video stream. Please check that the URL or Firebase Storage file is accessible.
              </p>
              <button
                onClick={() => {
                  setHasError(false);
                  setIsLoading(true);
                  if (videoRef.current) {
                    videoRef.current.load();
                    videoRef.current.play().catch(() => {});
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Retry Playback
              </button>
            </div>
          )}

          {/* TOP OVERLAY INFO */}
          <div
            className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 via-black/30 to-transparent transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 mr-2">
                  EPISODE {episode.episodeNumber}
                </span>
                <span className="text-sm font-bold text-white drop-shadow">
                  {episode.title}
                </span>
              </div>

              {/* Next/Prev Navigation */}
              <div className="flex items-center gap-2">
                {prevEp && onSelectEpisode && (
                  <button
                    onClick={() => onSelectEpisode(prevEp)}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-full backdrop-blur transition-all flex items-center gap-1"
                  >
                    <SkipBack className="w-3.5 h-3.5" /> Prev
                  </button>
                )}
                {nextEp && onSelectEpisode && (
                  <button
                    onClick={() => onSelectEpisode(nextEp)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-full shadow transition-all flex items-center gap-1"
                  >
                    Next <SkipForward className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* CENTER BIG PLAY/PAUSE PULSE */}
          {!isPlaying && !isLoading && !hasError && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl hover:bg-blue-500"
            >
              <Play className="w-8 h-8 ml-1" />
            </button>
          )}

          {/* BOTTOM CONTROLS BAR */}
          <div
            className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 space-y-2 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Timeline Seek Bar */}
            <div className="group/seek relative w-full flex items-center">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-white/20 hover:h-2.5 rounded-lg appearance-none cursor-pointer accent-blue-500 transition-all"
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>

                {/* Rewind 10s */}
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                    }
                  }}
                  className="p-1.5 hover:bg-white/20 rounded-full text-slate-300 hover:text-white transition-colors"
                  title="Rewind 10s"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Volume slider */}
                <div className="flex items-center gap-1.5 group/vol">
                  <button
                    onClick={toggleMute}
                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-rose-400" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Timestamps */}
                <span className="text-xs font-mono text-slate-300">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Right tools: Speed & Fullscreen */}
              <div className="flex items-center gap-2 relative">
                {/* Playback speed button */}
                <div className="relative">
                  <button
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="px-2 py-1 text-xs font-semibold bg-white/10 hover:bg-white/20 rounded-md transition-colors flex items-center gap-1"
                  >
                    <span>{playbackRate}x</span>
                    <Settings className="w-3.5 h-3.5 text-slate-300" />
                  </button>

                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 w-24 text-center z-50">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => handleSpeedSelect(rate)}
                          className={`w-full py-1 text-xs block hover:bg-blue-600 ${
                            playbackRate === rate ? 'text-blue-400 font-bold bg-blue-600/10' : 'text-slate-300'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
