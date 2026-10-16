import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Series,
  Season,
  Episode,
  Comment,
  Reaction,
  WatchProgress,
  AppSettings,
  ReactionType,
} from '../types';

export const DEFAULT_LOGO = '/src/assets/images/bandbudh_budbak_logo_1792155787010.jpg';
export const DEFAULT_BANNER = '/src/assets/images/bandbudh_hero_banner_1792155804824.jpg';

export const DEFAULT_SETTINGS: AppSettings = {
  appName: 'BUNDBUDH AUR BUDBAK',
  logoUrl: DEFAULT_LOGO,
  faviconUrl: DEFAULT_LOGO,
  heroBannerUrl: DEFAULT_BANNER,
  accentColor: '#3b82f6',
  welcomeMessage: 'Welcome to the Official OTT Streaming Platform of Bundbudh Aur Budbak!',
  description: 'Join Badrinath and Budhdeb in their hilarious classroom adventures, clever pranks, and non-stop comedy at Apna School!',
};

// ---------------- APP SETTINGS ----------------
export function subscribeAppSettings(callback: (settings: AppSettings) => void) {
  const settingsDocRef = doc(db, 'appSettings', 'global');
  return onSnapshot(
    settingsDocRef,
    (snap) => {
      if (snap.exists()) {
        callback({ ...DEFAULT_SETTINGS, ...(snap.data() as AppSettings) });
      } else {
        // Create initial default settings doc
        setDoc(settingsDocRef, DEFAULT_SETTINGS).catch(() => {});
        callback(DEFAULT_SETTINGS);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'appSettings/global');
    }
  );
}

export async function updateAppSettings(updates: Partial<AppSettings>): Promise<void> {
  const ref = doc(db, 'appSettings', 'global');
  try {
    await setDoc(ref, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'appSettings/global');
  }
}

// ---------------- SERIES ----------------
export function subscribeSeries(callback: (series: Series[]) => void) {
  const colRef = collection(db, 'series');
  return onSnapshot(
    colRef,
    (snap) => {
      const items: Series[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Series, 'id'>),
      }));
      items.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      callback(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'series');
    }
  );
}

export async function createSeries(data: Partial<Series>): Promise<string> {
  const colRef = collection(db, 'series');
  const now = new Date().toISOString();
  try {
    const docRef = await addDoc(colRef, {
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    // Sync seriesId with generated ID
    await updateDoc(docRef, { seriesId: docRef.id });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'series');
    return '';
  }
}

export async function updateSeries(id: string, updates: Partial<Series>): Promise<void> {
  const ref = doc(db, 'series', id);
  try {
    await updateDoc(ref, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `series/${id}`);
  }
}

export async function deleteSeries(id: string, cascade = true): Promise<void> {
  try {
    if (cascade) {
      // Find seasons under this series
      const seasonsSnap = await getDocs(query(collection(db, 'seasons'), where('seriesId', '==', id)));
      for (const seasonDoc of seasonsSnap.docs) {
        await deleteSeason(seasonDoc.id, true);
      }
    }
    await deleteDoc(doc(db, 'series', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `series/${id}`);
  }
}

// ---------------- SEASONS ----------------
export function subscribeSeasons(callback: (seasons: Season[]) => void, seriesId?: string) {
  const colRef = collection(db, 'seasons');
  const q = seriesId ? query(colRef, where('seriesId', '==', seriesId)) : colRef;
  return onSnapshot(
    q,
    (snap) => {
      const items: Season[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Season, 'id'>),
      }));
      items.sort((a, b) => a.seasonNumber - b.seasonNumber);
      callback(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'seasons');
    }
  );
}

export async function createSeason(data: Partial<Season>): Promise<string> {
  const colRef = collection(db, 'seasons');
  const now = new Date().toISOString();
  try {
    const docRef = await addDoc(colRef, {
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    await updateDoc(docRef, { seasonId: docRef.id });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'seasons');
    return '';
  }
}

export async function updateSeason(id: string, updates: Partial<Season>): Promise<void> {
  const ref = doc(db, 'seasons', id);
  try {
    await updateDoc(ref, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `seasons/${id}`);
  }
}

export async function deleteSeason(id: string, cascade = true): Promise<void> {
  try {
    if (cascade) {
      const episodesSnap = await getDocs(query(collection(db, 'episodes'), where('seasonId', '==', id)));
      for (const epDoc of episodesSnap.docs) {
        await deleteDoc(doc(db, 'episodes', epDoc.id));
      }
    }
    await deleteDoc(doc(db, 'seasons', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `seasons/${id}`);
  }
}

// ---------------- EPISODES ----------------
export function subscribeEpisodes(
  callback: (episodes: Episode[]) => void,
  filter?: { seriesId?: string; seasonId?: string }
) {
  const colRef = collection(db, 'episodes');
  let q = query(colRef);
  if (filter?.seasonId) {
    q = query(colRef, where('seasonId', '==', filter.seasonId));
  } else if (filter?.seriesId) {
    q = query(colRef, where('seriesId', '==', filter.seriesId));
  }

  return onSnapshot(
    q,
    (snap) => {
      const items: Episode[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Episode, 'id'>),
      }));
      items.sort((a, b) => a.episodeNumber - b.episodeNumber);
      callback(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'episodes');
    }
  );
}

export async function createEpisode(data: Partial<Episode>): Promise<string> {
  const colRef = collection(db, 'episodes');
  const now = new Date().toISOString();
  try {
    const docRef = await addDoc(colRef, {
      viewsCount: 0,
      likesCount: 0,
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    await updateDoc(docRef, { episodeId: docRef.id });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'episodes');
    return '';
  }
}

export async function updateEpisode(id: string, updates: Partial<Episode>): Promise<void> {
  const ref = doc(db, 'episodes', id);
  try {
    await updateDoc(ref, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `episodes/${id}`);
  }
}

export async function deleteEpisode(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'episodes', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `episodes/${id}`);
  }
}

export async function recordEpisodeView(episodeId: string): Promise<void> {
  try {
    const ref = doc(db, 'episodes', episodeId);
    await updateDoc(ref, {
      viewsCount: increment(1),
    });
  } catch {
    // Non-blocking view increment
  }
}

// ---------------- COMMENTS ----------------
export function subscribeEpisodeComments(episodeId: string, callback: (comments: Comment[]) => void) {
  const colRef = collection(db, 'comments');
  const q = query(colRef, where('episodeId', '==', episodeId));
  return onSnapshot(
    q,
    (snap) => {
      const items: Comment[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Comment, 'id'>),
      }));
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `comments?episodeId=${episodeId}`);
    }
  );
}

export function subscribeAllComments(callback: (comments: Comment[]) => void) {
  const colRef = collection(db, 'comments');
  return onSnapshot(
    colRef,
    (snap) => {
      const items: Comment[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Comment, 'id'>),
      }));
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'comments');
    }
  );
}

export async function addComment(comment: Omit<Comment, 'id' | 'commentId' | 'createdAt'>): Promise<string> {
  const colRef = collection(db, 'comments');
  const now = new Date().toISOString();
  try {
    const docRef = await addDoc(colRef, {
      ...comment,
      reported: false,
      createdAt: now,
      updatedAt: now,
    });
    await updateDoc(docRef, { commentId: docRef.id });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'comments');
    return '';
  }
}

export async function deleteComment(commentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'comments', commentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `comments/${commentId}`);
  }
}

export async function reportComment(commentId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'comments', commentId), { reported: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `comments/${commentId}`);
  }
}

// ---------------- REACTIONS ----------------
export function subscribeEpisodeReactions(episodeId: string, callback: (reactions: Reaction[]) => void) {
  const colRef = collection(db, 'reactions');
  const q = query(colRef, where('episodeId', '==', episodeId));
  return onSnapshot(
    q,
    (snap) => {
      const items: Reaction[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Reaction, 'id'>),
      }));
      callback(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `reactions?episodeId=${episodeId}`);
    }
  );
}

export async function setReaction(
  episodeId: string,
  userId: string,
  reactionType: ReactionType | null
): Promise<void> {
  const reactionDocId = `${episodeId}_${userId}`;
  const ref = doc(db, 'reactions', reactionDocId);
  const now = new Date().toISOString();

  try {
    if (!reactionType) {
      await deleteDoc(ref);
      await updateDoc(doc(db, 'episodes', episodeId), {
        likesCount: increment(-1),
      }).catch(() => {});
    } else {
      const prevDoc = await getDoc(ref);
      await setDoc(ref, {
        episodeId,
        userId,
        reactionType,
        createdAt: prevDoc.exists() ? prevDoc.data().createdAt : now,
        updatedAt: now,
      });

      if (!prevDoc.exists()) {
        await updateDoc(doc(db, 'episodes', episodeId), {
          likesCount: increment(1),
        }).catch(() => {});
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `reactions/${reactionDocId}`);
  }
}

// ---------------- WATCH HISTORY ----------------
export function subscribeUserWatchHistory(userId: string, callback: (items: WatchProgress[]) => void) {
  const colRef = collection(db, 'watchHistory');
  const q = query(colRef, where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const items: WatchProgress[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<WatchProgress, 'id'>),
      }));
      items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      callback(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `watchHistory?userId=${userId}`);
    }
  );
}

export async function saveWatchProgress(
  userId: string,
  episodeId: string,
  seriesId: string,
  progressSeconds: number,
  durationSeconds: number
): Promise<void> {
  if (!userId || !episodeId || progressSeconds <= 0) return;
  const historyId = `${userId}_${episodeId}`;
  const ref = doc(db, 'watchHistory', historyId);
  const percentage = durationSeconds > 0 ? Math.round((progressSeconds / durationSeconds) * 100) : 0;

  try {
    await setDoc(
      ref,
      {
        userId,
        episodeId,
        seriesId,
        progressSeconds: Math.round(progressSeconds),
        durationSeconds: Math.round(durationSeconds),
        percentage,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch {
    // Non-blocking watch history persistence
  }
}

// ---------------- INITIAL SEEDING HELPER ----------------
export async function seedInitialDataIfEmpty(): Promise<boolean> {
  try {
    const seriesSnap = await getDocs(collection(db, 'series'));
    if (!seriesSnap.empty) {
      return false; // Already seeded
    }

    console.log('Seeding official Bundbudh Aur Budbak OTT initial data...');
    const now = new Date().toISOString();

    // 1. Create main series
    const seriesRef = await addDoc(collection(db, 'series'), {
      title: 'Bandbudh Aur Budbak 2.0',
      description: 'Follow two best friends Badrinath and Budhdeb who turn Apna School upside down with their mischievous antics, funny excuse stories, and innocent classroom pranks while escaping teacher Rathi Sir and Principal Rathi!',
      posterUrl: DEFAULT_LOGO,
      bannerUrl: DEFAULT_BANNER,
      genre: 'Comedy / Animation / School Life',
      releaseYear: '2026',
      language: 'Hindi / English Subs',
      status: 'Ongoing',
      featured: true,
      published: true,
      displayOrder: 1,
      createdAt: now,
      updatedAt: now,
    });
    const seriesId = seriesRef.id;
    await updateDoc(seriesRef, { seriesId });

    // 2. Create Season 1
    const s1Ref = await addDoc(collection(db, 'seasons'), {
      seriesId,
      seasonNumber: 1,
      title: 'Season 1: Classroom Mischief & Magic',
      description: 'The iconic first adventures of Badrinath and Budhdeb at Apna School Class IV-A.',
      posterUrl: DEFAULT_LOGO,
      bannerUrl: DEFAULT_BANNER,
      releaseDate: '2025',
      published: true,
      displayOrder: 1,
      createdAt: now,
      updatedAt: now,
    });
    const s1Id = s1Ref.id;
    await updateDoc(s1Ref, { seasonId: s1Id });

    // 3. Create Season 2
    const s2Ref = await addDoc(collection(db, 'seasons'), {
      seriesId,
      seasonNumber: 2,
      title: 'Season 2: Budbak Returns!',
      description: 'Even more high-energy school escapades, sports day hilarity, and exam day panic!',
      posterUrl: DEFAULT_LOGO,
      bannerUrl: DEFAULT_BANNER,
      releaseDate: '2026',
      published: true,
      displayOrder: 2,
      createdAt: now,
      updatedAt: now,
    });
    const s2Id = s2Ref.id;
    await updateDoc(s2Ref, { seasonId: s2Id });

    // 4. Seed initial working cartoon episodes
    // High-quality open animated video samples so the video player plays immediately
    const sampleVideos = [
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    ];

    const initialEpisodes = [
      {
        seasonId: s1Id,
        episodeNumber: 1,
        title: 'Episode 1: The Homework Excuse Machine',
        description: 'Badrinath and Budhdeb invent the most ridiculous excuse when Dubey Sir asks for yesterday’s math assignment.',
        duration: '11:24',
        videoUrl: sampleVideos[0],
      },
      {
        seasonId: s1Id,
        episodeNumber: 2,
        title: 'Episode 2: Samosa Championship Panic',
        description: 'Canteen Uncle announces a free Samosa contest and Budhdeb enters without reading the spicy chili rules!',
        duration: '10:52',
        videoUrl: sampleVideos[1],
      },
      {
        seasonId: s1Id,
        episodeNumber: 3,
        title: 'Episode 3: Rathi Sir’s Surprise Test',
        description: 'A surprise inspection from the education board has the entire class trembling, but Badrinath has a chaotic plan.',
        duration: '12:15',
        videoUrl: sampleVideos[2],
      },
      {
        seasonId: s2Id,
        episodeNumber: 1,
        title: 'Episode 1: School Picnic Havoc',
        description: 'The annual school trip to the wildlife sanctuary turns into Budhdeb’s personal playground with mischievous monkeys!',
        duration: '11:48',
        videoUrl: sampleVideos[3],
      },
    ];

    for (const ep of initialEpisodes) {
      const epRef = await addDoc(collection(db, 'episodes'), {
        seriesId,
        seasonId: ep.seasonId,
        episodeNumber: ep.episodeNumber,
        title: ep.title,
        description: ep.description,
        thumbnailUrl: DEFAULT_BANNER,
        bannerUrl: DEFAULT_BANNER,
        videoSourceType: 'direct',
        videoUrl: ep.videoUrl,
        duration: ep.duration,
        releaseDate: '2026',
        published: true,
        viewsCount: Math.floor(Math.random() * 850) + 120,
        likesCount: Math.floor(Math.random() * 140) + 25,
        createdAt: now,
        updatedAt: now,
      });
      await updateDoc(epRef, { episodeId: epRef.id });
    }

    return true;
  } catch (error) {
    console.error('Error seeding initial data:', error);
    return false;
  }
}
