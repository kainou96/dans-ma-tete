/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SiteConfig {
  bgImage: string | null;
  coverImage: string | null;
  audioSrc: string | null;
  audioFileName: string;
  instrumentalSrc: string | null;
  instrumentalFileName: string;
  spotifyPresaveUrl: string;
  instagramUrl: string;
  instagramAvatar: string | null;
  instagramUsername: string;
  songTitle: string;
  artistName: string;
  releaseDate: string;
  warningText: string;
  thanksMessage: string;
}

export interface FanRecord {
  id: string;
  email: string;
  presaved: boolean;
  presavedAt: string;
  hasPlayed: boolean;
  hasCompleted: boolean;
  playedAt: string | null;
  completedAt: string | null;
}

const DEFAULT_CONFIG: SiteConfig = {
  bgImage: null,
  coverImage: null,
  audioSrc: null,
  audioFileName: 'Dans ma tête - Kaïna (Démo Exclu).wav',
  instrumentalSrc: null,
  instrumentalFileName: 'Dans ma tête - Bande Instrumentale.mp3',
  spotifyPresaveUrl: 'https://open.spotify.com/search/Ka%C3%AFna',
  instagramUrl: 'https://www.instagram.com/kaina_officiel/',
  instagramAvatar: null,
  instagramUsername: 'kaina_officiel',
  songTitle: 'Dans ma tête',
  artistName: 'Kaïna',
  releaseDate: '16 Octobre 2026',
  warningText: 'Attention ! Installe toi confortablement, met des écouteurs et écoute ça au calme. Tu a accès à une seule unique écoute de mon titre avant la sortie officielle.',
  thanksMessage: 'Merci énormément d’avoir écouter ma chanson jusqu’au bout 🥹 j’espère vraiment qu’elle t’a plu, si tu as le temps de me laisser ton impression, ça compte vraiment pour moi ❤️ J\'ai trop hâte de te lire !',
};

import { setMediaItem, getMediaItem } from './db';

const CONFIG_STORAGE_KEY = 'kaina_site_config_v4';
const FANS_STORAGE_KEY = 'kaina_fans_registry_v3';
const SESSION_STORAGE_KEY = 'kaina_current_session_v3';

const MEDIA_KEYS = ['audioSrc', 'instrumentalSrc', 'bgImage', 'coverImage', 'instagramAvatar'] as const;
type MediaKey = typeof MEDIA_KEYS[number];

let inMemoryConfig: SiteConfig = { ...DEFAULT_CONFIG };
let isIndexedDBLoaded = false;
const configListeners = new Set<(config: SiteConfig) => void>();

function notifyConfigListeners() {
  const cfg = { ...inMemoryConfig };
  configListeners.forEach((fn) => {
    try {
      fn(cfg);
    } catch (e) {
      console.error('Error notifying config listener', e);
    }
  });
}

export function subscribeToConfigUpdates(listener: (config: SiteConfig) => void): () => void {
  configListeners.add(listener);
  // Emit current config right away
  listener({ ...inMemoryConfig });
  return () => {
    configListeners.delete(listener);
  };
}

// Initial bootstrap from localStorage (metadata)
function initFromLocalStorage(): void {
  try {
    let raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) {
      const oldRaw = localStorage.getItem('kaina_site_config_v3');
      if (oldRaw) raw = oldRaw;
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.thanksMessage && !parsed.thanksMessage.includes("J'ai trop hâte de te lire !")) {
        parsed.thanksMessage = DEFAULT_CONFIG.thanksMessage;
      }
      inMemoryConfig = { ...DEFAULT_CONFIG, ...parsed };

      // If localStorage had any legacy media, migrate them to IndexedDB
      MEDIA_KEYS.forEach((key) => {
        if (parsed[key]) {
          setMediaItem(key, parsed[key]);
        }
      });
    }
  } catch (err) {
    console.error('Failed reading initial config from localStorage', err);
    inMemoryConfig = { ...DEFAULT_CONFIG };
  }
}

// Load large media assets from IndexedDB (runs immediately on module load)
export async function loadMediaFromIndexedDB(): Promise<SiteConfig> {
  if (isIndexedDBLoaded) return inMemoryConfig;

  try {
    const loadedMedia: Partial<Record<MediaKey, string | null>> = {};
    for (const key of MEDIA_KEYS) {
      const item = await getMediaItem(key);
      if (item !== null) {
        loadedMedia[key] = item;
      }
    }

    inMemoryConfig = {
      ...inMemoryConfig,
      ...loadedMedia,
    };
    isIndexedDBLoaded = true;
    notifyConfigListeners();
  } catch (err) {
    console.error('Error loading media from IndexedDB:', err);
  }

  return inMemoryConfig;
}

// Run bootstrap immediately
initFromLocalStorage();
if (typeof window !== 'undefined') {
  loadMediaFromIndexedDB();
}

export function getSiteConfig(): SiteConfig {
  return inMemoryConfig;
}

export function saveSiteConfig(config: Partial<SiteConfig>): SiteConfig {
  inMemoryConfig = { ...inMemoryConfig, ...config };

  // 1. Asynchronously save media files to IndexedDB
  MEDIA_KEYS.forEach((key) => {
    if (key in config) {
      setMediaItem(key, config[key] ?? null).catch((err) =>
        console.error(`Failed to persist ${key} in IndexedDB`, err)
      );
    }
  });

  // 2. Save lightweight metadata to localStorage (WITHOUT heavy base64 media to never exceed 5MB quota)
  try {
    const lightweightConfig: Record<string, unknown> = { ...inMemoryConfig };
    MEDIA_KEYS.forEach((key) => {
      // Don't clutter localStorage with megabytes of base64 strings
      lightweightConfig[key] = null;
    });
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(lightweightConfig));
  } catch (err) {
    console.warn('Could not save metadata to localStorage (falling back to IndexedDB/memory)', err);
  }

  notifyConfigListeners();
  return inMemoryConfig;
}

export async function saveSiteConfigAsync(config: Partial<SiteConfig>): Promise<SiteConfig> {
  inMemoryConfig = { ...inMemoryConfig, ...config };

  // Await all IndexedDB writes so heavy audio files are guaranteed to be saved
  const mediaPromises: Promise<void>[] = [];
  MEDIA_KEYS.forEach((key) => {
    if (key in config) {
      mediaPromises.push(setMediaItem(key, config[key] ?? null));
    }
  });

  try {
    await Promise.all(mediaPromises);
  } catch (err) {
    console.error('Error during async media save to IndexedDB:', err);
  }

  // Save lightweight metadata to localStorage
  try {
    const lightweightConfig: Record<string, unknown> = { ...inMemoryConfig };
    MEDIA_KEYS.forEach((key) => {
      lightweightConfig[key] = null;
    });
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(lightweightConfig));
  } catch (err) {
    console.warn('Could not save metadata to localStorage', err);
  }

  notifyConfigListeners();
  return inMemoryConfig;
}

export function getAllFans(): FanRecord[] {
  try {
    const raw = localStorage.getItem(FANS_STORAGE_KEY);
    if (!raw) {
      const initial: FanRecord[] = [
        {
          id: 'fan_demo_1',
          email: 'fan.kaina@gmail.com',
          presaved: true,
          presavedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          hasPlayed: true,
          hasCompleted: true,
          playedAt: new Date(Date.now() - 3600000 * 23).toISOString(),
          completedAt: new Date(Date.now() - 3600000 * 23 + 180000).toISOString(),
        },
        {
          id: 'fan_demo_2',
          email: 'lea.music@outlook.fr',
          presaved: true,
          presavedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          hasPlayed: false,
          hasCompleted: false,
          playedAt: null,
          completedAt: null,
        }
      ];
      localStorage.setItem(FANS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveFans(fans: FanRecord[]): void {
  try {
    localStorage.setItem(FANS_STORAGE_KEY, JSON.stringify(fans));
  } catch (err) {
    console.error('Failed to save fans list', err);
  }
}

export function findFanByEmail(email: string): FanRecord | undefined {
  const normalized = email.trim().toLowerCase();
  const fans = getAllFans();
  return fans.find(f => f.email.trim().toLowerCase() === normalized);
}

export function registerOrGetFan(email: string, presaved: boolean = true): FanRecord {
  const normalized = email.trim().toLowerCase();
  const fans = getAllFans();
  const existing = fans.find(f => f.email.trim().toLowerCase() === normalized);

  if (existing) {
    if (presaved && !existing.presaved) {
      existing.presaved = true;
      existing.presavedAt = new Date().toISOString();
      saveFans(fans);
    }
    return existing;
  }

  const newRecord: FanRecord = {
    id: 'fan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    email: normalized,
    presaved: presaved,
    presavedAt: new Date().toISOString(),
    hasPlayed: false,
    hasCompleted: false,
    playedAt: null,
    completedAt: null,
  };

  fans.unshift(newRecord);
  saveFans(fans);
  return newRecord;
}

export function markFanHasStartedPlaying(email: string): void {
  const normalized = email.trim().toLowerCase();
  const fans = getAllFans();
  const fan = fans.find(f => f.email.trim().toLowerCase() === normalized);
  if (fan) {
    fan.hasPlayed = true;
    if (!fan.playedAt) {
      fan.playedAt = new Date().toISOString();
    }
    saveFans(fans);
  }
}

export function markFanHasCompleted(email: string): void {
  const normalized = email.trim().toLowerCase();
  const fans = getAllFans();
  const fan = fans.find(f => f.email.trim().toLowerCase() === normalized);
  if (fan) {
    fan.hasPlayed = true;
    fan.hasCompleted = true;
    fan.completedAt = new Date().toISOString();
    saveFans(fans);
  }
}

export function resetFanListen(email: string): void {
  const normalized = email.trim().toLowerCase();
  const fans = getAllFans();
  const fan = fans.find(f => f.email.trim().toLowerCase() === normalized);
  if (fan) {
    fan.hasPlayed = false;
    fan.hasCompleted = false;
    fan.playedAt = null;
    fan.completedAt = null;
    saveFans(fans);
  }
}

export function deleteFan(id: string): void {
  const fans = getAllFans().filter(f => f.id !== id);
  saveFans(fans);
}

export function clearAllListens(): void {
  const fans = getAllFans().map(f => ({
    ...f,
    hasPlayed: false,
    hasCompleted: false,
    playedAt: null,
    completedAt: null
  }));
  saveFans(fans);
}

export interface CurrentSession {
  email: string | null;
  page: 'gate' | 'player';
}

export function getCurrentSession(): CurrentSession {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { email: null, page: 'gate' };
}

export function saveCurrentSession(session: CurrentSession): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {}
}

export function clearCurrentSession(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {}
}

export function exportFansToCSV(): void {
  const fans = getAllFans();
  if (fans.length === 0) return;

  const headers = ['Email', 'Presave Effectué', 'Date Presave', 'A cliqué Play', 'Écoute Terminée', 'Date Écoute'];
  const rows = fans.map(f => [
    f.email,
    f.presaved ? 'OUI' : 'NON',
    f.presavedAt ? new Date(f.presavedAt).toLocaleString('fr-FR') : '-',
    f.hasPlayed ? 'OUI' : 'NON',
    f.hasCompleted ? 'OUI' : 'NON',
    f.playedAt ? new Date(f.playedAt).toLocaleString('fr-FR') : '-',
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
    headers.join(';'),
    ...rows.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(';'))
  ].join('\r\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `kaina_fans_dans_ma_tete_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
