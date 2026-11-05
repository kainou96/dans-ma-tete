import { createClient } from '@supabase/supabase-js';
import type { FanRecord, SiteConfig } from './store';

// Environment variables configured on Netlify or in .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.startsWith('https://')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  instagram?: string;
  created_at?: string;
}

export interface TrackRelease {
  id: string;
  user_id: string;
  title: string;
  artist_name: string;
  access_code: string;
  release_date: string;
  cover_url?: string;
  audio_url?: string;
  instrumental_url?: string;
  created_at?: string;
}

/**
 * Sign in and verify the account is explicitly allowlisted as a site admin.
 */
export async function signInAdmin(email: string, password: string) {
  if (!supabase) {
    throw new Error('Supabase n\'est pas encore configuré avec vos clés d\'API.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  const { data: isAdmin, error: authorizationError } = await supabase.rpc('is_site_admin');
  if (authorizationError || isAdmin !== true) {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error('Failed to end unauthorized admin session:', signOutError);
    }
    if (authorizationError) throw authorizationError;
    throw new Error('Ce compte n’est pas autorisé à administrer le site.');
  }

  return data.user;
}

export async function getCurrentAdmin() {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session) return null;

  const { data: isAdmin, error: authorizationError } = await supabase.rpc('is_site_admin');
  if (authorizationError) throw authorizationError;
  if (isAdmin !== true) {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
    return null;
  }

  return data.session.user;
}

export async function loadSiteConfigFromSupabase(): Promise<Partial<SiteConfig> | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('site_settings')
    .select('config')
    .eq('id', 'main')
    .maybeSingle();

  if (error) throw error;
  return data?.config ?? null;
}

export async function saveSiteConfigToSupabase(config: SiteConfig): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase n’est pas configuré.');
  }

  const { error } = await supabase
    .from('site_settings')
    .upsert({ id: 'main', config, updated_at: new Date().toISOString() });

  if (error) throw error;
}

export async function registerFanInSupabase(email: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase n’est pas configuré.');
  }

  const { error } = await supabase.rpc('register_fan', {
    p_email: email.trim().toLowerCase(),
  });
  if (error) throw error;
}

export async function loadFansFromSupabase(): Promise<FanRecord[]> {
  if (!supabase) {
    throw new Error('Supabase n’est pas configuré.');
  }

  const { data, error } = await supabase
    .from('fan_signups')
    .select('id, email, presaved_at, has_played, has_completed, played_at, completed_at')
    .order('presaved_at', { ascending: false });

  if (error) throw error;

  return data.map((fan) => ({
    id: fan.id,
    email: fan.email,
    presaved: true,
    presavedAt: fan.presaved_at,
    hasPlayed: fan.has_played,
    hasCompleted: fan.has_completed,
    playedAt: fan.played_at,
    completedAt: fan.completed_at,
  }));
}

export async function deleteFanFromSupabase(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase n’est pas configuré.');
  const { error } = await supabase.from('fan_signups').delete().eq('id', id);
  if (error) throw error;
}

export async function resetFanListenInSupabase(email: string): Promise<void> {
  if (!supabase) throw new Error('Supabase n’est pas configuré.');
  const { error } = await supabase
    .from('fan_signups')
    .update({ has_played: false, has_completed: false, played_at: null, completed_at: null })
    .eq('email', email);
  if (error) throw error;
}

export async function clearAllFanListensInSupabase(): Promise<void> {
  if (!supabase) throw new Error('Supabase n’est pas configuré.');
  const { error } = await supabase
    .from('fan_signups')
    .update({ has_played: false, has_completed: false, played_at: null, completed_at: null })
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}

/**
 * Upload a file (image or audio) to Supabase Storage and return its public URL
 */
export async function uploadMediaToSupabase(
  bucket: 'covers' | 'audio',
  file: File,
  prefix: string = 'media'
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase n\'est pas encore configuré.');
  }

  const user = await getCurrentAdmin();
  if (!user) {
    throw new Error('Connecte-toi avec le compte administrateur avant d’envoyer un fichier.');
  }

  const fileExt = file.name.split('.').pop() || 'dat';
  const cleanExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
  const safePrefix = prefix.toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'media';
  const fileName = `${safePrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;
  const filePath = fileName;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    console.error('Supabase upload error:', uploadError);
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

/**
 * Sign out
 */
export async function signOutArtist() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get current session user
 */
export async function getCurrentUser() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
