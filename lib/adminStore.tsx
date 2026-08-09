'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { VideoExplanation, Ayah, AUDIO_YOUTUBE_IDS } from '@/lib/mock-data';
import { getDb } from '@/lib/db';
import { LocalOverlay, readLocalOverlay, writeLocalOverlay, SEEDED_DELETED_VIDEO_IDS } from '@/lib/firebaseSync';

/**
 * Unified admin store (single source of truth).
 *
 * One in-memory + localStorage overlay holds ALL admin-managed data
 * (videos, surah audio ids, surah syncs). Every admin tab reads from and
 * writes to this store, so any edit is reflected immediately everywhere
 * (overview, audio, videos, sync). Persistence algorithm:
 *   1. update the in-memory overlay (React state) + localStorage (durable,
 *      works on read-only serverless deployments)
 *   2. fire-and-forget best-effort server write (dev only)
 */

export interface CoverageRow {
  id: number;
  done: boolean;
  sh: boolean;
  sa: boolean;
  videoCount: number;
}

export interface AdminStoreValue {
  loading: boolean;
  videos: VideoExplanation[];
  audioIds: Record<number, string>;
  syncs: Record<number, Ayah[]>;
  coverage: CoverageRow[];
  refresh: () => Promise<void>;
  addVideo: (video: VideoExplanation) => Promise<void>;
  deleteVideo: (id: string) => Promise<void>;
  saveAudioIds: (updates: { surahId: number; youtubeId: string }[]) => Promise<void>;
saveAudioId: (surahId: number, youtubeId: string) => Promise<void>;
  saveSyncs: (surahId: number, ayahs: Ayah[]) => Promise<void>;
}

const AdminContext = createContext<AdminStoreValue | null>(null);

function buildBase(): LocalOverlay {
  const local = getDb();
  const overlay = readLocalOverlay() || { videos: [], surahAudioIds: {}, surahSyncs: {}, deletedVideoIds: [] };
  const deletedIds = new Set([...SEEDED_DELETED_VIDEO_IDS, ...(overlay.deletedVideoIds || [])]);
  return {
    videos: Array.from(
      new Map([...local.videos, ...(overlay.videos || [])].map((v) => [v.id, v])).values()
    ).filter((v) => !deletedIds.has(v.id)),
    surahAudioIds: { ...AUDIO_YOUTUBE_IDS, ...local.surahAudioIds, ...(overlay.surahAudioIds || {}) },
    surahSyncs: { ...local.surahSyncs, ...(overlay.surahSyncs || {}) },
    deletedVideoIds: Array.from(deletedIds),
  };
}

export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<LocalOverlay>(buildBase);
  const [loading, setLoading] = useState(false);

  // Persist every mutation to the durable browser overlay
  useEffect(() => {
    writeLocalOverlay(db);
  }, [db]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setDb(buildBase());
    } finally {
      setLoading(false);
    }
  }, []);

  const addVideo = useCallback(async (video: VideoExplanation) => {
    setDb((prev) => {
      const exists = prev.videos.some((v) => v.id === video.id);
      return {
        ...prev,
        videos: exists
          ? prev.videos.map((v) => (v.id === video.id ? video : v))
          : [...prev.videos, video],
      };
    });
    try {
      await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(video),
      });
    } catch {
      // read-only serverless filesystem — the overlay above already saved it
    }
  }, []);

  const deleteVideo = useCallback(async (id: string) => {
    setDb((prev) => ({
      ...prev,
      videos: prev.videos.filter((v) => v.id !== id),
      deletedVideoIds: Array.from(new Set([...(prev.deletedVideoIds || []), id])),
    }));
    try {
      await fetch('/api/videos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch {
      // read-only serverless filesystem — the overlay above already saved it
    }
  }, []);

  const saveAudioIds = useCallback(
    async (updates: { surahId: number; youtubeId: string }[]) => {
      if (updates.length === 0) return;
      setDb((prev) => ({
        ...prev,
        surahAudioIds: {
          ...prev.surahAudioIds,
          ...Object.fromEntries(updates.map((u) => [u.surahId, u.youtubeId.trim()])),
        },
      }));
      try {
        await fetch('/api/surah-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates }),
        });
      } catch {
        // read-only serverless filesystem — the overlay above already saved it
      }
    },
    []
  );

  const saveAudioId = useCallback(
    async (surahId: number, youtubeId: string) => {
      await saveAudioIds([{ surahId, youtubeId }]);
    },
    [saveAudioIds]
  );

  const saveSyncs = useCallback(async (surahId: number, ayahs: Ayah[]) => {
    setDb((prev) => ({ ...prev, surahSyncs: { ...prev.surahSyncs, [surahId]: ayahs } }));
  }, []);

  const coverage = useMemo<CoverageRow[]>(
    () =>
      Array.from({ length: 114 }, (_, i) => {
        const id = i + 1;
        const videosForSurah = db.videos.filter((v) => v.surahId === id);
        return {
          id,
          done: !!db.surahAudioIds[id],
          sh: videosForSurah.some((v) => v.scholar.includes('شحرور')),
          sa: videosForSurah.some((v) => v.scholar.includes('السامرائي')),
          videoCount: videosForSurah.length,
        };
      }),
    [db]
  );

  const value: AdminStoreValue = {
    loading,
    videos: db.videos,
    audioIds: db.surahAudioIds,
    syncs: db.surahSyncs,
    coverage,
    refresh,
    addVideo,
    deleteVideo,
    saveAudioIds,
    saveAudioId,
    saveSyncs,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdminStore(): AdminStoreValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdminStore must be used within AdminStoreProvider');
  return ctx;
}