/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import {
  getSiteConfig,
  SiteConfig,
  getCurrentSession,
  saveCurrentSession,
  clearCurrentSession,
  findFanByEmail,
  subscribeToConfigUpdates,
} from './services/store';
import { generateDefaultTrackWavBlob } from './services/audioSynthesizer';
import { BackgroundView } from './components/BackgroundView';
import { LandingGate } from './components/LandingGate';
import { ExclusivePlayer } from './components/ExclusivePlayer';
import { AdminModal } from './components/AdminModal';
import { Lock, Volume2, VolumeX } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<SiteConfig>(() => getSiteConfig());
  const [currentPage, setCurrentPage] = useState<'gate' | 'player'>('gate');
  const [userEmail, setUserEmail] = useState<string>('');
  const [defaultAudioUrl, setDefaultAudioUrl] = useState<string>('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Subscribe to config updates (e.g. when IndexedDB completes initial load of heavy audio assets)
  useEffect(() => {
    const unsubscribe = subscribeToConfigUpdates((updatedConfig) => {
      setConfig(updatedConfig);
    });
    return unsubscribe;
  }, []);

  // Background instrumental audio on gate page
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isBgAudioPlaying, setIsBgAudioPlaying] = useState(false);
  const [isBgMuted, setIsBgMuted] = useState(false);

  const instrumentalUrl = config.instrumentalSrc || defaultAudioUrl;

  // Synthesize default audio track in background
  useEffect(() => {
    generateDefaultTrackWavBlob().then((url) => {
      setDefaultAudioUrl(url);
    });
  }, []);

  // Restore current session if user entered email, hasn't started playing, and refreshes
  useEffect(() => {
    const session = getCurrentSession();
    if (session.email) {
      const fan = findFanByEmail(session.email);
      // If user hasn't clicked play yet, restore their player access
      if (fan && !fan.hasPlayed) {
        setUserEmail(session.email);
        setCurrentPage('player');
      } else {
        // If they already played, clear the session and return to gate
        clearCurrentSession();
      }
    }
  }, []);

  // Control background instrumental audio: ONLY on gate page until user unlocks the player!
  useEffect(() => {
    if (currentPage === 'gate' && instrumentalUrl) {
      if (bgAudioRef.current) {
        bgAudioRef.current.volume = isBgMuted ? 0 : 0.4;
        bgAudioRef.current
          .play()
          .then(() => setIsBgAudioPlaying(true))
          .catch(() => {
            // Browser autoplay policy might hold until user touches or clicks the document
            setIsBgAudioPlaying(false);
          });
      }

      // User interaction listener to trigger audio if browser policy blocked autoplay
      const handleFirstInteraction = () => {
        if (currentPage === 'gate' && bgAudioRef.current) {
          bgAudioRef.current.volume = isBgMuted ? 0 : 0.4;
          bgAudioRef.current
            .play()
            .then(() => setIsBgAudioPlaying(true))
            .catch(() => {});
        }
      };

      window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
      window.addEventListener('mousedown', handleFirstInteraction, { once: true });
      window.addEventListener('touchstart', handleFirstInteraction, { once: true });
      window.addEventListener('click', handleFirstInteraction, { once: true });
      window.addEventListener('keydown', handleFirstInteraction, { once: true });
      window.addEventListener('scroll', handleFirstInteraction, { once: true });

      return () => {
        window.removeEventListener('pointerdown', handleFirstInteraction);
        window.removeEventListener('mousedown', handleFirstInteraction);
        window.removeEventListener('touchstart', handleFirstInteraction);
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
        window.removeEventListener('scroll', handleFirstInteraction);
      };
    } else if (currentPage === 'player') {
      // STOP background audio immediately when on player page!
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
        bgAudioRef.current.currentTime = 0;
      }
      setIsBgAudioPlaying(false);
    }
  }, [currentPage, instrumentalUrl, isBgMuted]);

  const handleUnlockPlayer = (email: string) => {
    // Instantly kill background instrumental audio when validating to player page!
    if (bgAudioRef.current) {
      bgAudioRef.current.pause();
      bgAudioRef.current.currentTime = 0;
    }
    setIsBgAudioPlaying(false);

    setUserEmail(email);
    setCurrentPage('player');
    saveCurrentSession({ email, page: 'player' });
  };

  const handleExitPlayer = () => {
    clearCurrentSession();
    setCurrentPage('gate');
  };

  const handleToggleBgMute = () => {
    if (!bgAudioRef.current) return;
    if (!isBgMuted && isBgAudioPlaying) {
      setIsBgMuted(true);
      bgAudioRef.current.volume = 0;
    } else {
      setIsBgMuted(false);
      bgAudioRef.current.volume = 0.4;
      bgAudioRef.current
        .play()
        .then(() => setIsBgAudioPlaying(true))
        .catch(() => {});
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between text-slate-100 overflow-x-hidden selection:bg-cyan-500/30">
      {/* Immersive Background */}
      <BackgroundView customBgUrl={config.bgImage} />

      {/* Background Instrumental Audio (ONLY for gate page) */}
      {instrumentalUrl && (
        <audio
          ref={bgAudioRef}
          src={instrumentalUrl}
          loop
          autoPlay
          playsInline
          preload="auto"
          onPlay={() => setIsBgAudioPlaying(true)}
          onPause={() => setIsBgAudioPlaying(false)}
        />
      )}

      {/* Floating Ambient Instrumental Audio indicator / mute control (ONLY on page 1) */}
      {currentPage === 'gate' && (
        <div className="absolute top-4 right-4 z-30 animate-in fade-in duration-300">
          <button
            type="button"
            onClick={handleToggleBgMute}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border text-xs shadow-lg transition-all cursor-pointer select-none ${
              !isBgMuted
                ? 'bg-black/50 hover:bg-black/70 border-cyan-400/40 text-[#FCEEE3]'
                : 'bg-black/30 hover:bg-black/50 border-white/10 text-slate-400'
            }`}
            title={!isBgMuted ? 'Couper le son de la bande instrumentale' : 'Activer le son de la bande instrumentale'}
          >
            {!isBgMuted ? (
              <>
                <span className="flex items-center gap-0.5 h-3">
                  <span className={`w-0.5 h-3 bg-cyan-300 rounded-full ${isBgAudioPlaying ? 'animate-pulse' : 'opacity-70'}`} />
                  <span className={`w-0.5 h-2 bg-cyan-300 rounded-full ${isBgAudioPlaying ? 'animate-pulse delay-75' : 'opacity-70'}`} />
                  <span className={`w-0.5 h-3.5 bg-cyan-300 rounded-full ${isBgAudioPlaying ? 'animate-pulse delay-150' : 'opacity-70'}`} />
                </span>
                <Volume2 className="w-3.5 h-3.5 text-cyan-300" />
                <span className="text-[11px] font-medium hidden sm:inline">
                  {isBgAudioPlaying ? 'Bande instrumentale activée' : 'Bande instrumentale (Son activé)'}
                </span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-300 hidden sm:inline">Son coupé</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Main Content Area: Page 1 (Gate) or Page 2 (Exclusive Player) */}
      <main className="flex-1 flex items-center justify-center relative z-10 px-2 sm:px-4">
        {currentPage === 'gate' ? (
          <LandingGate config={config} onUnlock={handleUnlockPlayer} />
        ) : (
          <ExclusivePlayer
            config={config}
            userEmail={userEmail}
            defaultAudioUrl={defaultAudioUrl}
            onExit={handleExitPlayer}
          />
        )}
      </main>

      {/* Bottom Footer: Minimal with subtle Admin Lock button as requested */}
      <footer className="w-full px-6 py-4 flex items-center justify-between z-20 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <a
            href={config.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <span>Instagram @{config.instagramUsername || 'kaina_officiel'}</span>
          </a>
        </div>

        <div className="text-[11px] text-slate-400 hidden sm:block">
          © 2026 {config.artistName} · Tous droits réservés
        </div>

        {/* Discreet Padlock button for Kaïna's admin access */}
        <div>
          <button
            type="button"
            onClick={() => setIsAdminOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer group"
            title="Accès Administrateur (kainou96)"
            aria-label="Accès Administrateur"
          >
            <Lock className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:text-cyan-400 transition-opacity" />
          </button>
        </div>
      </footer>

      {/* Admin Panel Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        config={config}
        onConfigChange={(newCfg) => setConfig(newCfg)}
      />
    </div>
  );
}
