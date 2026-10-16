export type VideoSourceType = 'direct' | 'storage' | 'googledrive';

export type ReactionType = 'love' | 'funny' | 'amazing' | 'surprised' | 'like';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  accountType: 'google' | 'anonymous';
  role?: 'user' | 'admin';
  createdAt: string;
  lastLogin: string;
}

export interface Series {
  id: string;
  seriesId: string;
  title: string;
  description: string;
  posterUrl: string;
  bannerUrl: string;
  genre: string;
  releaseYear: string;
  language: string;
  status: 'Ongoing' | 'Completed' | 'Upcoming';
  featured: boolean;
  published: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Season {
  id: string;
  seasonId: string;
  seriesId: string;
  seasonNumber: number;
  title: string;
  description: string;
  posterUrl: string;
  bannerUrl: string;
  releaseDate: string;
  published: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Episode {
  id: string;
  episodeId: string;
  seriesId: string;
  seasonId: string;
  episodeNumber: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  bannerUrl: string;
  videoSourceType: VideoSourceType;
  videoUrl: string;
  storagePath?: string;
  duration: string;
  releaseDate: string;
  published: boolean;
  viewsCount: number;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  commentId: string;
  episodeId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  parentId?: string | null;
  reported?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Reaction {
  id: string;
  episodeId: string;
  userId: string;
  reactionType: ReactionType;
  createdAt: string;
  updatedAt: string;
}

export interface WatchProgress {
  id: string;
  userId: string;
  episodeId: string;
  seriesId?: string;
  progressSeconds: number;
  durationSeconds: number;
  percentage: number;
  updatedAt: string;
}

export interface AppSettings {
  appName: string;
  logoUrl: string;
  faviconUrl: string;
  heroBannerUrl: string;
  accentColor: string;
  welcomeMessage: string;
  description: string;
  updatedAt?: string;
}

export interface UploadProgressInfo {
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
  isUploading: boolean;
  isPaused: boolean;
  error: string | null;
  downloadUrl: string | null;
  storagePath?: string;
}
