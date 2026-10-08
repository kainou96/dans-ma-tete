import { createClient } from '@supabase/supabase-js';

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
 * Sign up a new artist / user
 */
export async function signUpArtist(email: string, password: string, username: string) {
  if (!supabase) {
    throw new Error('Supabase n\'est pas encore configuré avec vos clés d\'API.');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Sign in existing artist / user
 */
export async function signInArtist(email: string, password: string) {
  if (!supabase) {
    throw new Error('Supabase n\'est pas encore configuré avec vos clés d\'API.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
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

  const fileExt = file.name.split('.').pop() || 'dat';
  const cleanExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
  const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;
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
