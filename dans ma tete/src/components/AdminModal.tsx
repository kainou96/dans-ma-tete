/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  SiteConfig,
  FanRecord,
  saveSiteConfig,
  saveSiteConfigAsync,
  getAllFans,
  resetFanListen,
  deleteFan,
  clearAllListens,
  exportFansToCSV,
} from '../services/store';
import {
  Lock,
  X,
  Upload,
  Image as ImageIcon,
  Music,
  Link as LinkIcon,
  Users,
  Download,
  RotateCcw,
  Trash2,
  Check,
  AlertCircle,
  Play,
  Pause,
  Copy,
} from 'lucide-react';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { isSupabaseConfigured, uploadMediaToSupabase } from '../services/supabase';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SiteConfig;
  onConfigChange: (newConfig: SiteConfig) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigChange,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'media' | 'audio' | 'links' | 'fans'>('media');

  // Form states for settings
  const [songTitle, setSongTitle] = useState(config.songTitle);
  const [artistName, setArtistName] = useState(config.artistName);
  const [instagramUsername, setInstagramUsername] = useState(config.instagramUsername);
  const [spotifyUrl, setSpotifyUrl] = useState(config.spotifyPresaveUrl);
  const [instagramUrl, setInstagramUrl] = useState(config.instagramUrl);
  const [releaseDate, setReleaseDate] = useState(config.releaseDate);
  const [warningText, setWarningText] = useState(config.warningText);
  const [thanksMessage, setThanksMessage] = useState(config.thanksMessage);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  useEffect(() => {
    setSongTitle(config.songTitle);
    setArtistName(config.artistName);
    setInstagramUsername(config.instagramUsername);
    setSpotifyUrl(config.spotifyPresaveUrl);
    setInstagramUrl(config.instagramUrl);
    setReleaseDate(config.releaseDate);
    setWarningText(config.warningText);
    setThanksMessage(config.thanksMessage);
  }, [config]);

  // Audio preview in admin
  const [isAdminAudioPlaying, setIsAdminAudioPlaying] = useState(false);
  const adminAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isAdminInstrumentalPlaying, setIsAdminInstrumentalPlaying] = useState(false);
  const adminInstrumentalRef = useRef<HTMLAudioElement | null>(null);

  // Upload loading states
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isUploadingInstrumental, setIsUploadingInstrumental] = useState(false);
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // File upload refs
  const bgInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const instrumentalInputRef = useRef<HTMLInputElement | null>(null);

  // Fans list
  const [fans, setFans] = useState<FanRecord[]>(() => getAllFans());
  const [fanSearch, setFanSearch] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'kainou96' && password === 'Chipie59390.') {
      setIsAuthenticated(true);
      setAuthError(null);
      setFans(getAllFans());
    } else {
      setAuthError('Identifiant ou mot de passe incorrect.');
    }
  };

  const handleSaveTextSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveSiteConfig({
      songTitle: songTitle.trim() || 'Dans ma tête',
      artistName: artistName.trim() || 'Kaïna',
      instagramUsername: instagramUsername.trim().replace(/^@/, '') || 'kaina_officiel',
      spotifyPresaveUrl: spotifyUrl,
      instagramUrl: instagramUrl,
      releaseDate: releaseDate,
      warningText: warningText,
      thanksMessage: thanksMessage,
    });
    onConfigChange(updated);
    setSaveFeedback('Paramètres enregistrés avec succès !');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  // Upload Background Handler
  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingBg(true);
      try {
        let url: string;
        if (isSupabaseConfigured) {
          url = await uploadMediaToSupabase('covers', file, 'bg');
        } else {
          url = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }
        const updated = await saveSiteConfigAsync({ bgImage: url });
        onConfigChange(updated);
        setSaveFeedback(isSupabaseConfigured ? 'Image de fond synchronisée sur Supabase pour tous les visiteurs !' : 'Image de fond mise à jour et sauvegardée !');
      } catch (err) {
        console.error('Erreur upload fond:', err);
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = reader.result as string;
          const updated = await saveSiteConfigAsync({ bgImage: dataUrl });
          onConfigChange(updated);
          setSaveFeedback('Image de fond sauvegardée en cache.');
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploadingBg(false);
        setTimeout(() => setSaveFeedback(null), 3500);
      }
    }
  };

  // Upload Cover Handler
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingCover(true);
      try {
        let url: string;
        if (isSupabaseConfigured) {
          url = await uploadMediaToSupabase('covers', file, 'cover');
        } else {
          url = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }
        const updated = await saveSiteConfigAsync({ coverImage: url });
        onConfigChange(updated);
        setSaveFeedback(isSupabaseConfigured ? 'Pochette synchronisée sur Supabase pour tous les visiteurs !' : 'Pochette mise à jour et sauvegardée !');
      } catch (err) {
        console.error('Erreur upload cover:', err);
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = reader.result as string;
          const updated = await saveSiteConfigAsync({ coverImage: dataUrl });
          onConfigChange(updated);
          setSaveFeedback('Pochette sauvegardée en cache.');
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploadingCover(false);
        setTimeout(() => setSaveFeedback(null), 3500);
      }
    }
  };

  // Upload Instagram Avatar Handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingAvatar(true);
      try {
        let url: string;
        if (isSupabaseConfigured) {
          url = await uploadMediaToSupabase('covers', file, 'avatar');
        } else {
          url = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }
        const updated = await saveSiteConfigAsync({ instagramAvatar: url });
        onConfigChange(updated);
        setSaveFeedback(isSupabaseConfigured ? 'Photo Instagram synchronisée sur Supabase !' : 'Photo de profil Instagram mise à jour et sauvegardée !');
      } catch (err) {
        console.error('Erreur upload avatar:', err);
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = reader.result as string;
          const updated = await saveSiteConfigAsync({ instagramAvatar: dataUrl });
          onConfigChange(updated);
          setSaveFeedback('Photo Instagram sauvegardée en cache.');
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploadingAvatar(false);
        setTimeout(() => setSaveFeedback(null), 3500);
      }
    }
  };

  const handleResetAvatar = async () => {
    const updated = await saveSiteConfigAsync({ instagramAvatar: null });
    onConfigChange(updated);
    setSaveFeedback('Photo Instagram réinitialisée.');
    setTimeout(() => setSaveFeedback(null), 2500);
  };

  // Upload Audio Handler (Exclusive Track)
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingAudio(true);
      try {
        let url: string;
        if (isSupabaseConfigured) {
          url = await uploadMediaToSupabase('audio', file, 'track');
        } else {
          url = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }
        const updated = await saveSiteConfigAsync({
          audioSrc: url,
          audioFileName: file.name,
        });
        onConfigChange(updated);
        setSaveFeedback(isSupabaseConfigured ? `Morceau audio "${file.name}" synchronisé sur Supabase !` : `Fichier audio "${file.name}" sauvegardé avec succès !`);
      } catch (err) {
        console.error('Erreur upload audio:', err);
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = reader.result as string;
          const updated = await saveSiteConfigAsync({
            audioSrc: dataUrl,
            audioFileName: file.name,
          });
          onConfigChange(updated);
          setSaveFeedback(`Fichier audio "${file.name}" sauvegardé en cache.`);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploadingAudio(false);
        setTimeout(() => setSaveFeedback(null), 3500);
      }
    }
  };

  const handleResetBg = async () => {
    const updated = await saveSiteConfigAsync({ bgImage: null });
    onConfigChange(updated);
  };

  const handleResetCover = async () => {
    const updated = await saveSiteConfigAsync({ coverImage: null });
    onConfigChange(updated);
  };

  const handleResetAudio = async () => {
    const updated = await saveSiteConfigAsync({
      audioSrc: null,
      audioFileName: 'Dans ma tête - Kaïna (Démo Exclu).wav',
    });
    onConfigChange(updated);
    setSaveFeedback('Fichier audio exclusif réinitialisé.');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  // Upload Instrumental Handler (Home Page Ambient Audio)
  const handleInstrumentalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingInstrumental(true);
      try {
        let url: string;
        if (isSupabaseConfigured) {
          url = await uploadMediaToSupabase('audio', file, 'instrumental');
        } else {
          url = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }
        const updated = await saveSiteConfigAsync({
          instrumentalSrc: url,
          instrumentalFileName: file.name,
        });
        onConfigChange(updated);
        setSaveFeedback(isSupabaseConfigured ? `Bande son d'ambiance "${file.name}" synchronisée sur Supabase !` : `Bande instrumentale "${file.name}" sauvegardée avec succès !`);
      } catch (err) {
        console.error('Erreur upload instrumental:', err);
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = reader.result as string;
          const updated = await saveSiteConfigAsync({
            instrumentalSrc: dataUrl,
            instrumentalFileName: file.name,
          });
          onConfigChange(updated);
          setSaveFeedback(`Bande instrumentale "${file.name}" sauvegardée en cache.`);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploadingInstrumental(false);
        setTimeout(() => setSaveFeedback(null), 3500);
      }
    }
  };

  const handleResetInstrumental = async () => {
    const updated = await saveSiteConfigAsync({
      instrumentalSrc: null,
      instrumentalFileName: 'Dans ma tête - Bande Instrumentale.mp3',
    });
    onConfigChange(updated);
    setSaveFeedback('Bande instrumentale réinitialisée par défaut.');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  // Fan operations
  const handleResetSingleListen = (email: string) => {
    resetFanListen(email);
    setFans(getAllFans());
    setSaveFeedback(`Écoute réinitialisée pour ${email}`);
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const handleDeleteFan = (id: string) => {
    deleteFan(id);
    setFans(getAllFans());
  };

  const handleClearAllListens = () => {
    if (window.confirm('Voulez-vous vraiment réinitialiser l’écoute pour TOUS les inscrits ?')) {
      clearAllListens();
      setFans(getAllFans());
      setSaveFeedback('Toutes les écoutes ont été réinitialisées.');
      setTimeout(() => setSaveFeedback(null), 3000);
    }
  };

  const filteredFans = fans.filter((f) =>
    f.email.toLowerCase().includes(fanSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[96dvh] sm:max-h-[90vh] bg-slate-900 border border-white/15 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/10 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Espace Admin · Kaïna
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400">
                Gestion exclusive « Dans ma tête » (16 Octobre 2026)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {!isAuthenticated ? (
          /* Authentication Screen */
          <div className="p-4 sm:p-10 flex flex-col items-center justify-center max-w-md mx-auto w-full overflow-y-auto">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 sm:mb-6">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 sm:mb-2 text-center">
              Accès Administrateur
            </h3>
            <p className="text-xs text-slate-400 text-center mb-5 sm:mb-6 leading-relaxed">
              Connecte-toi avec tes identifiants Kaïna pour gérer le site, les auditeurs et le titre.
            </p>

            {authError && (
              <div className="w-full mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="w-full space-y-3.5 sm:space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Identifiant
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="kainou96"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-base sm:text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-base sm:text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 shadow-lg shadow-cyan-500/20 cursor-pointer mt-2 transition-all active:scale-[0.99]"
              >
                Se connecter
              </button>
            </form>

            {/* PWA Home Screen Installation Prompt (Affiché sous le formulaire de connexion cadenas) */}
            <PWAInstallPrompt inline />
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Feedback alert */}
            {saveFeedback && (
              <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-4 sm:px-6 py-2.5 text-xs text-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveFeedback}</span>
              </div>
            )}

            {/* Navigation Tabs - Optimisés mobile (sans la session app et déploiement) */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 pt-2 sm:pt-3 border-b border-white/10 bg-slate-950/40 overflow-x-auto text-xs whitespace-nowrap scrollbar-none">
              <button
                onClick={() => setActiveTab('media')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 font-medium rounded-t-xl transition-all border-b-2 shrink-0 ${
                  activeTab === 'media'
                    ? 'border-cyan-400 text-cyan-300 bg-white/5'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-4 h-4 shrink-0" />
                <span>Visuels &amp; Images</span>
              </button>

              <button
                onClick={() => setActiveTab('audio')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 font-medium rounded-t-xl transition-all border-b-2 shrink-0 ${
                  activeTab === 'audio'
                    ? 'border-cyan-400 text-cyan-300 bg-white/5'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Music className="w-4 h-4 shrink-0" />
                <span>Fichier Audio</span>
              </button>

              <button
                onClick={() => setActiveTab('links')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 font-medium rounded-t-xl transition-all border-b-2 shrink-0 ${
                  activeTab === 'links'
                    ? 'border-cyan-400 text-cyan-300 bg-white/5'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <LinkIcon className="w-4 h-4 shrink-0" />
                <span>Textes &amp; Liens</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('fans');
                  setFans(getAllFans());
                }}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 font-medium rounded-t-xl transition-all border-b-2 shrink-0 ${
                  activeTab === 'fans'
                    ? 'border-cyan-400 text-cyan-300 bg-white/5'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Auditeurs ({fans.length})</span>
              </button>
            </div>

            {/* Scrollable Tab Content */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
              {/* TAB 1: MEDIA (Background & Cover) */}
              {activeTab === 'media' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Background Card */}
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-cyan-400" />
                        Fond d&apos;écran du site
                      </h4>
                      <span className="text-[11px] text-slate-400">Photo 2</span>
                    </div>

                    <div className="w-full h-36 rounded-xl bg-slate-950 border border-white/10 overflow-hidden relative group flex items-center justify-center">
                      {config.bgImage ? (
                        <img
                          src={config.bgImage}
                          alt="Fond personnalisé"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-3 text-xs text-slate-400 space-y-1">
                          <p className="font-semibold text-cyan-300">Fond 3D Anaglyphe actif</p>
                          <p className="text-[10px] text-slate-400">
                            (Scène nuages, pluie et effet chromatic aberration)
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        ref={bgInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleBgUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => bgInputRef.current?.click()}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Téléverser mon image</span>
                      </button>

                      {config.bgImage && (
                        <button
                          type="button"
                          onClick={handleResetBg}
                          className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs"
                          title="Rétablir le fond par défaut"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cover Card */}
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-cyan-400" />
                        Pochette du single
                      </h4>
                      <span className="text-[11px] text-slate-400">Photo 1</span>
                    </div>

                    <div className="w-full h-36 rounded-xl bg-slate-950 border border-white/10 overflow-hidden relative flex items-center justify-center">
                      {config.coverImage ? (
                        <img
                          src={config.coverImage}
                          alt="Pochette personnalisée"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-3 text-xs text-slate-400 space-y-1">
                          <p className="font-semibold text-cyan-300">Pochette officielle active</p>
                          <p className="text-[10px] text-slate-400">
                            (« DANS MA TÊTE · KAÏNA » avec nuages)
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Téléverser la pochette</span>
                      </button>

                      {config.coverImage && (
                        <button
                          type="button"
                          onClick={handleResetCover}
                          className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs"
                          title="Rétablir la pochette par défaut"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Instagram Avatar Card */}
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-cyan-400" />
                        Photo de profil Instagram (@{config.instagramUsername || 'kaina_officiel'})
                      </h4>
                      <span className="text-[11px] text-slate-400">Affichée dans la conversation de fin d'écoute</span>
                    </div>

                    <div className="flex items-center gap-5 p-3 rounded-xl bg-slate-950 border border-white/10">
                      <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shadow-md shrink-0">
                        <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center">
                          {config.instagramAvatar ? (
                            <img
                              src={config.instagramAvatar}
                              alt="Photo de profil Instagram"
                              className="w-full h-full object-cover"
                            />
                          ) : config.coverImage ? (
                            <img
                              src={config.coverImage}
                              alt="Photo de profil Instagram"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#182847] flex items-center justify-center font-bebas text-lg text-[#FCEEE3]">
                              K
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-slate-300">
                        <p className="font-semibold text-white">
                          {config.instagramAvatar ? 'Photo de profil personnalisée' : 'Pochette utilisée par défaut'}
                        </p>
                        <p className="text-slate-400 text-[11px]">
                          Cette photo ronde apparaîtra au-dessus et à côté de votre message Instagram de remerciement.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Téléverser ma photo Instagram</span>
                      </button>

                      {config.instagramAvatar && (
                        <button
                          type="button"
                          onClick={handleResetAvatar}
                          className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs"
                          title="Rétablir la photo par défaut"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: AUDIO FILE */}
              {activeTab === 'audio' && (
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-base text-white flex items-center gap-2">
                        <Music className="w-5 h-5 text-cyan-400" />
                        Fichier Audio Exclusif
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Importe le fichier master de « Dans ma tête » (formats acceptés : MP3, WAV, M4A, AAC)
                      </p>
                    </div>
                    {config.audioSrc && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium">
                        Fichier personnalisé
                      </span>
                    )}
                  </div>

                  {/* Audio Card */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <Music className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {config.audioFileName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {config.audioSrc ? 'Fichier importé par Kaïna' : 'Extrait atmosphérique par défaut'}
                        </div>
                      </div>
                    </div>

                    {/* Admin Audio Preview Player */}
                    <div className="flex items-center gap-3">
                      <audio
                        ref={adminAudioRef}
                        src={config.audioSrc || undefined}
                        onEnded={() => setIsAdminAudioPlaying(false)}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (adminAudioRef.current) {
                            if (isAdminAudioPlaying) {
                              adminAudioRef.current.pause();
                              setIsAdminAudioPlaying(false);
                            } else {
                              adminAudioRef.current.play().then(() => setIsAdminAudioPlaying(true));
                            }
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center gap-2 transition-colors"
                      >
                        {isAdminAudioPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" /> Écouter (Admin)
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Upload button */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*,.mp3,.wav,.m4a,.aac"
                      onChange={handleAudioUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingAudio}
                      onClick={() => audioInputRef.current?.click()}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                        isUploadingAudio
                          ? 'bg-cyan-500/50 text-slate-900 cursor-wait'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer shadow-cyan-500/20'
                      }`}
                    >
                      <Upload className={`w-4 h-4 ${isUploadingAudio ? 'animate-bounce' : ''}`} />
                      <span>{isUploadingAudio ? 'Sauvegarde du fichier audio...' : 'Importer mon fichier audio (.mp3, .wav, etc.)'}</span>
                    </button>

                    {config.audioSrc && (
                      <button
                        type="button"
                        onClick={handleResetAudio}
                        className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Rétablir la démo</span>
                      </button>
                    )}
                  </div>

                  {/* 2. Instrumental Background Track Card */}
                  <div className="pt-6 border-t border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-base text-white flex items-center gap-2">
                          <Music className="w-5 h-5 text-cyan-400" />
                          Bande Instrumentale (Fond sonore de la page d&apos;accueil)
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Diffusée doucement en fond sonore uniquement sur la page d&apos;accueil. Dès la validation vers la page d&apos;écoute, elle se coupe automatiquement.
                        </p>
                      </div>
                      {config.instrumentalSrc && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium">
                          Fichier personnalisé
                        </span>
                      )}
                    </div>

                    {/* Audio Card */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                          <Music className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {config.instrumentalFileName}
                          </div>
                          <div className="text-xs text-slate-400">
                            {config.instrumentalSrc ? 'Bande instrumentale importée par Kaïna' : 'Extrait instrumental d\'ambiance par défaut'}
                          </div>
                        </div>
                      </div>

                      {/* Admin Instrumental Audio Preview Player */}
                      <div className="flex items-center gap-3">
                        <audio
                          ref={adminInstrumentalRef}
                          src={config.instrumentalSrc || undefined}
                          onEnded={() => setIsAdminInstrumentalPlaying(false)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (adminInstrumentalRef.current) {
                              if (isAdminInstrumentalPlaying) {
                                adminInstrumentalRef.current.pause();
                                setIsAdminInstrumentalPlaying(false);
                              } else {
                                adminInstrumentalRef.current.play().then(() => setIsAdminInstrumentalPlaying(true));
                              }
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          {isAdminInstrumentalPlaying ? (
                            <>
                              <Pause className="w-3.5 h-3.5" /> Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" /> Écouter (Admin)
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Upload button */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        ref={instrumentalInputRef}
                        type="file"
                        accept="audio/*,.mp3,.wav,.m4a,.aac"
                        onChange={handleInstrumentalUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={isUploadingInstrumental}
                        onClick={() => instrumentalInputRef.current?.click()}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                          isUploadingInstrumental
                            ? 'bg-cyan-500/50 text-slate-900 cursor-wait'
                            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer shadow-cyan-500/20'
                        }`}
                      >
                        <Upload className={`w-4 h-4 ${isUploadingInstrumental ? 'animate-bounce' : ''}`} />
                        <span>{isUploadingInstrumental ? 'Sauvegarde de la bande instrumentale...' : 'Importer la bande instrumentale (.mp3, .wav, etc.)'}</span>
                      </button>

                      {config.instrumentalSrc && (
                        <button
                          type="button"
                          onClick={handleResetInstrumental}
                          className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Rétablir par défaut</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TEXTS, TITLE & LINKS */}
              {activeTab === 'links' && (
                <form onSubmit={handleSaveTextSettings} className="space-y-5">
                  {/* Section 1: Titre & Artiste (Page principale & Lecteur) */}
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <Music className="w-4 h-4 text-cyan-400" />
                      Titre de la chanson &amp; Nom de l&apos;artiste (Page principale)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Titre de la chanson
                        </label>
                        <input
                          type="text"
                          value={songTitle}
                          onChange={(e) => setSongTitle(e.target.value)}
                          placeholder="Dans ma tête"
                          required
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                          Affiché en grand sur la page d&apos;accueil (ex : « DANS MA TÊTE »).
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Nom de l&apos;artiste
                        </label>
                        <input
                          type="text"
                          value={artistName}
                          onChange={(e) => setArtistName(e.target.value)}
                          placeholder="Kaïna"
                          required
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                          Affiché sous le titre sur la page d&apos;accueil (ex : « K A Ï N A »).
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Date de sortie officielle
                      </label>
                      <input
                        type="text"
                        value={releaseDate}
                        onChange={(e) => setReleaseDate(e.target.value)}
                        placeholder="16 Octobre 2026"
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Affiché en noir et en gras sous le nom d&apos;artiste (ex : « 16 Octobre 2026 »).
                      </p>
                    </div>
                  </div>

                  {/* Section 2: Compte Instagram & Liens */}
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-cyan-400" />
                      Compte Instagram &amp; Liens
                    </h4>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Pseudo Instagram
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-xs sm:text-sm pointer-events-none">
                          @
                        </span>
                        <input
                          type="text"
                          value={instagramUsername}
                          onChange={(e) => setInstagramUsername(e.target.value)}
                          placeholder="kaina_officiel"
                          required
                          className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Pseudo affiché dans l&apos;en-tête de la conversation Instagram après l&apos;écoute.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Lien vers la conversation Instagram avec Kaïna
                      </label>
                      <input
                        type="url"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        placeholder="https://www.instagram.com/kaina_officiel/"
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Lien direct ouvert par le bouton « Envoyer sur Insta ».
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Lien du bouton Presave Spotify
                      </label>
                      <input
                        type="url"
                        value={spotifyUrl}
                        onChange={(e) => setSpotifyUrl(e.target.value)}
                        placeholder="https://open.spotify.com/..."
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Lien ouvert lorsque le fan clique sur « Pré-sauvegarder la chanson ».
                      </p>
                    </div>
                  </div>

                  {/* Section 3: Messages & Textes */}
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                    <h4 className="font-bold text-sm text-white">Messages &amp; Textes</h4>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Message d&apos;avertissement avant l&apos;écoute (au-dessus du lecteur)
                      </label>
                      <textarea
                        value={warningText}
                        onChange={(e) => setWarningText(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Message de remerciement conversation Instagram (après l&apos;écoute)
                      </label>
                      <textarea
                        value={thanksMessage}
                        onChange={(e) => setThanksMessage(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="py-3 px-6 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 shadow-md cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    Enregistrer toutes les modifications
                  </button>
                </form>
              )}

              {/* TAB 4: AUDITEURS / FANS LIST (Optimisé pour smartphone et ordinateur) */}
              {activeTab === 'fans' && (
                <div className="space-y-4">
                  {/* Top Stats Bar - Adaptée aux écrans mobiles */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="p-3 sm:p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-center sm:text-left">
                      <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Inscrits</div>
                      <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-white mt-0.5">
                        {fans.length}
                      </div>
                    </div>
                    <div className="p-3 sm:p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-center sm:text-left">
                      <div className="text-[10px] sm:text-[11px] text-cyan-400 font-medium">Écoutes</div>
                      <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-cyan-400 mt-0.5">
                        {fans.filter((f) => f.hasPlayed).length}
                      </div>
                    </div>
                    <div className="p-3 sm:p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-center sm:text-left">
                      <div className="text-[10px] sm:text-[11px] text-amber-400 font-medium">En Attente</div>
                      <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-amber-400 mt-0.5">
                        {fans.filter((f) => !f.hasPlayed).length}
                      </div>
                    </div>
                  </div>

                  {/* Barre de recherche et actions rapides */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={fanSearch}
                        onChange={(e) => setFanSearch(e.target.value)}
                        placeholder="Rechercher un auditeur par email..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                      {fanSearch && (
                        <button
                          type="button"
                          onClick={() => setFanSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={exportFansToCSV}
                        className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 shrink-0" />
                        <span>Exporter CSV</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleClearAllListens}
                        className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="Réinitialise le compteur d'écoute pour tout le monde"
                      >
                        <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                        <span>Reset tout</span>
                      </button>
                    </div>
                  </div>

                  {/* 1. VUE MOBILE (Cartes détaillées et optimisées pour écran smartphone) */}
                  <div className="md:hidden space-y-3 pt-1">
                    {filteredFans.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 bg-white/[0.02] rounded-2xl border border-white/10 text-xs">
                        Aucun auditeur trouvé.
                      </div>
                    ) : (
                      filteredFans.map((fan) => (
                        <div
                          key={fan.id}
                          className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3"
                        >
                          {/* En-tête : Email & bouton copier */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="text-white font-semibold text-xs sm:text-sm break-all flex items-center gap-1.5">
                                <span className="font-mono">{fan.email}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(fan.email);
                                    setSaveFeedback(`Email copié : ${fan.email}`);
                                    setTimeout(() => setSaveFeedback(null), 2500);
                                  }}
                                  className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-white/10 shrink-0 cursor-pointer"
                                  title="Copier l'adresse email"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-1">
                                Inscrit le {new Date(fan.presavedAt).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Statuts : Badges lisibles sans coupure */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {/* Statut Presave */}
                            {fan.presaved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium">
                                <Check className="w-3 h-3" />
                                Presave Spotify validé
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-white/5 text-[11px]">
                                Presave non effectué
                              </span>
                            )}

                            {/* Statut Écoute */}
                            {fan.hasCompleted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold">
                                <Check className="w-3 h-3" />
                                Écouté jusqu’au bout (100%)
                              </span>
                            ) : fan.hasPlayed ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
                                Écoute consommée (1/1)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-white/5 text-[11px]">
                                En attente de lecture
                              </span>
                            )}
                          </div>

                          {/* Horodatage d'écoute si effectuée */}
                          {fan.playedAt && (
                            <div className="text-[11px] text-cyan-200/90 bg-cyan-950/40 p-2.5 rounded-xl border border-cyan-500/20 flex flex-col gap-0.5">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Date de la 1ère écoute :</span>
                                <span className="font-semibold text-white">
                                  {new Date(fan.playedAt).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              {fan.completedAt && (
                                <div className="flex items-center justify-between text-[10px] text-slate-400">
                                  <span>Fin du morceau :</span>
                                  <span className="text-cyan-300">
                                    {new Date(fan.completedAt).toLocaleTimeString('fr-FR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Boutons d'actions bien espacés pour mobile */}
                          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                            {fan.hasPlayed && (
                              <button
                                type="button"
                                onClick={() => handleResetSingleListen(fan.email)}
                                className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-[0.98]"
                              >
                                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                                <span>Réautoriser une écoute</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteFan(fan.id)}
                              className="py-2 px-3.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              title="Supprimer cet auditeur"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Supprimer</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* 2. VUE ORDINATEUR / TABLETTE (Tableau avec scroll horizontal garanti) */}
                  <div className="hidden md:block border border-white/10 rounded-2xl overflow-x-auto bg-slate-950/60">
                    <table className="w-full text-left text-xs min-w-[680px]">
                      <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Adresse Email</th>
                          <th className="py-3 px-3">Presave Spotify</th>
                          <th className="py-3 px-3">Statut Écoute</th>
                          <th className="py-3 px-3">Date Inscription / Écoute</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 tabular-nums">
                        {filteredFans.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                              Aucun auditeur trouvé.
                            </td>
                          </tr>
                        ) : (
                          filteredFans.map((fan) => (
                            <tr key={fan.id} className="hover:bg-white/[0.02]">
                              <td className="py-3 px-4 font-sans text-white font-medium">
                                <div className="flex items-center gap-1.5">
                                  <span>{fan.email}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(fan.email);
                                      setSaveFeedback(`Email copié : ${fan.email}`);
                                      setTimeout(() => setSaveFeedback(null), 2500);
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-white/10 cursor-pointer"
                                    title="Copier l'email"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                {fan.presaved ? (
                                  <span className="text-emerald-400 font-semibold font-sans text-[11px] flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Validé
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-sans text-[11px]">Non</span>
                                )}
                              </td>
                              <td className="py-3 px-3 font-sans">
                                {fan.hasCompleted ? (
                                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold">
                                    Écouté jusqu’au bout (100%)
                                  </span>
                                ) : fan.hasPlayed ? (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold">
                                    Écoute consommée (1/1)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                                    En attente d'écoute
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-[11px] text-slate-400">
                                <div>
                                  {fan.playedAt ? (
                                    <>
                                      <span className="text-white font-medium">
                                        Écouté : {new Date(fan.playedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                      </span>
                                      <div className="text-[10px] text-slate-500">
                                        Inscrit le {new Date(fan.presavedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                      </div>
                                    </>
                                  ) : (
                                    <span>Inscrit : {new Date(fan.presavedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right space-x-2">
                                {fan.hasPlayed && (
                                  <button
                                    onClick={() => handleResetSingleListen(fan.email)}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer"
                                    title="Réautoriser une écoute pour cet email"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteFan(fan.id)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Supprimer cet email"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
