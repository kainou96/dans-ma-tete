/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { SiteConfig, markFanHasStartedPlaying, markFanHasCompleted } from '../services/store';
import { CoverArtView } from './CoverArtView';
import { Play, Pause, Volume2, VolumeX, ArrowLeft, Send, Phone, Video, Info, ChevronLeft } from 'lucide-react';

interface ExclusivePlayerProps {
  config: SiteConfig;
  userEmail: string;
  defaultAudioUrl: string;
  onExit: () => void;
}

export const ExclusivePlayer: React.FC<ExclusivePlayerProps> = ({
  config,
  userEmail,
  defaultAudioUrl,
  onExit,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioSource = config.audioSrc || defaultAudioUrl;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // When user hits Play for the first time, mark as started
  const handleTogglePlay = () => {
    if (isFinished) return;
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!hasStartedPlaying) {
        setHasStartedPlaying(true);
        markFanHasStartedPlaying(userEmail);
      }

      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setAudioError(null);
        })
        .catch((err) => {
          console.error('Audio play error:', err);
          setAudioError('Impossible de démarrer la lecture. Vérifie les autorisations de ton navigateur.');
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!duration && audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // When track ends: switch to Instagram DM view directly replacing the audio session!
  const handleEnded = () => {
    setIsPlaying(false);
    setIsFinished(true);
    markFanHasCompleted(userEmail);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-5 sm:py-8 flex flex-col items-center justify-center min-h-[calc(100dvh-130px)] sm:min-h-[85vh]">
      {/* Audio Element Hidden */}
      <audio
        ref={audioRef}
        src={audioSource}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="auto"
      />

      {/* STATE 1: POST-LISTENING INSTAGRAM DM VIEW (Directly replaces the audio session as requested!) */}
      {isFinished ? (
        <div className="w-full max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500">
          {/* Authentic Instagram Direct Message Mockup Frame */}
          <div className="w-full rounded-3xl bg-black/85 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black overflow-hidden relative text-white">
            {/* Instagram Header with back chevron, round profile photo, username, verified badge and call icons */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-black/60">
              <div className="flex items-center gap-3">
                <ChevronLeft className="w-5 h-5 text-white/80 cursor-pointer" />
                <div className="relative">
                  {/* Round Instagram profile photo */}
                  <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shadow-md">
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center">
                      {config.instagramAvatar ? (
                        <img
                          src={config.instagramAvatar}
                          alt={config.instagramUsername}
                          className="w-full h-full object-cover"
                        />
                      ) : config.coverImage ? (
                        <img
                          src={config.coverImage}
                          alt={config.instagramUsername}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#182847] flex items-center justify-center font-bebas text-base text-[#FCEEE3]">
                          K
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm tracking-tight text-white font-sans">
                      {config.instagramUsername || 'kaina_officiel'}
                    </span>
                    {/* Instagram Verified Badge */}
                    <span className="w-3.5 h-3.5 rounded-full bg-[#0095F6] text-white flex items-center justify-center text-[9px] font-black">
                      ✓
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8e8e8e] font-sans">Actif(ve) maintenant</p>
                </div>
              </div>

              {/* Decorative Instagram DM top right icons */}
              <div className="flex items-center gap-3.5 text-white/80">
                <Phone className="w-4 h-4 cursor-pointer hover:text-white" />
                <Video className="w-4 h-4 cursor-pointer hover:text-white" />
                <Info className="w-4 h-4 cursor-pointer hover:text-white" />
              </div>
            </div>

            {/* Instagram Conversation Body */}
            <div className="p-4 sm:p-5 space-y-4">
              {/* Date stamp */}
              <div className="text-center">
                <span className="text-[11px] text-[#8e8e8e] font-sans font-medium">Aujourd&apos;hui</span>
              </div>

              {/* Message from Kaïna with mini round avatar */}
              <div className="flex items-end gap-2.5 max-w-[92%]">
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-white/20 bg-slate-900 mb-5">
                  {config.instagramAvatar ? (
                    <img src={config.instagramAvatar} alt="" className="w-full h-full object-cover" />
                  ) : config.coverImage ? (
                    <img src={config.coverImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#182847] flex items-center justify-center font-bebas text-xs text-[#FCEEE3]">
                      K
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="rounded-3xl rounded-bl-sm bg-[#262626] border border-white/10 px-4 py-3 text-white text-sm sm:text-base leading-relaxed font-sans shadow-md">
                    {config.thanksMessage}
                  </div>

                  {/* "Vu" status below the message bubble as requested */}
                  <div className="text-[11px] text-[#8e8e8e] font-sans pl-2 flex items-center gap-1">
                    <span>Vu</span>
                  </div>
                </div>
              </div>

              {/* "Envoyer sur Insta" Button with Instagram Typography & Colors */}
              <div className="pt-4 flex flex-col items-center">
                <a
                  href={config.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-2xl font-sans font-bold text-sm sm:text-base text-white flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-95 shadow-xl shadow-pink-900/40 transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  {/* Official Instagram Icon */}
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  <span>Envoyer sur Insta</span>
                  <Send className="w-4 h-4 ml-1" />
                </a>
                <span className="text-[11px] text-[#8e8e8e] mt-2 font-sans text-center">
                  Ouvre directement la conversation avec @{config.instagramUsername || 'kaina_officiel'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STATE 2: AUDIO LISTENING SESSION (COMPLETELY OPEN & FLOATING OVER BACKGROUND, NO RECTANGLE CARD!) */
        <div className="w-full flex flex-col items-center">
          {/* Return button if play hasn't started yet */}
          {!hasStartedPlaying && (
            <div className="w-full max-w-xl flex justify-start mb-6">
              <button
                onClick={onExit}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm border border-white/20 text-xs text-[#E8DCD4] hover:text-white transition-all shadow-md cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Revenir plus tard</span>
              </button>
            </div>
          )}

          {/* Warning Text: Floating directly over background with drop shadow, NO rectangle card */}
          <div className="w-full max-w-xl text-center mb-8 px-4">
            <p className="text-xs sm:text-sm text-[#FCEEE3] font-medium leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              {config.warningText}
            </p>
          </div>

          {/* Audio Player Row: NO RECTANGLE CARD BEHIND AUDIO, Maximum Background Visibility */}
          <div className="w-full max-w-xl flex flex-col sm:flex-row items-center gap-5 sm:gap-6 py-2">
            {/* Small Album Cover on the LEFT */}
            <div className="shrink-0">
              <CoverArtView
                customCoverUrl={config.coverImage}
                size="sm"
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl shadow-2xl border border-white/25 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
              />
            </div>

            {/* Right section: Title, Artist, Timeline bar and Controls floating cleanly */}
            <div className="flex-1 w-full flex flex-col justify-center space-y-3">
              {/* Title & Artist */}
              <div className="text-center sm:text-left">
                <h2 className="font-bebas text-4xl sm:text-5xl text-[#FCEEE3] tracking-wide leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
                  {config.songTitle}
                </h2>
                <p className="font-syne text-xs sm:text-sm tracking-[0.3em] text-[#E8DCD4] uppercase font-semibold pl-[0.3em] mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                  {config.artistName}
                </p>
              </div>

              {/* Playback Timeline Bar (display-only, no seeking) */}
              <div className="space-y-1">
                <div
                  className="w-full h-2.5 bg-black/50 backdrop-blur-xs rounded-full overflow-hidden border border-white/20 relative select-none cursor-default shadow-lg shadow-black/80"
                  title="Lecture continue"
                >
                  <div
                    className="h-full bg-gradient-to-r from-[#e8dcd4] via-cyan-200 to-[#FCEEE3] rounded-full transition-all duration-100 ease-linear shadow-[0_0_12px_rgba(252,238,227,0.85)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-[#FCEEE3] px-0.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Player Controls: Button "ECOUTER", Volume */}
              <div className="flex items-center justify-center sm:justify-between gap-4 pt-1">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className={`px-8 py-3 rounded-full flex items-center justify-center gap-2.5 font-syne font-bold text-xs sm:text-sm tracking-wider uppercase transition-all duration-300 shadow-xl cursor-pointer ${
                    isPlaying
                      ? 'bg-black/80 hover:bg-black text-[#FCEEE3] border border-[#FCEEE3]/50 shadow-black'
                      : 'bg-gradient-to-r from-[#2a466d] via-[#1d3557] to-[#142642] hover:from-[#355787] hover:to-[#223d66] text-[#FCEEE3] border border-[#FCEEE3]/50 shadow-black/80 hover:scale-105 active:scale-95'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>PAUSE</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>ECOUTER</span>
                    </>
                  )}
                </button>

                {/* Volume Slider */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-[#E8DCD4] transition-colors border border-white/20 shadow-md"
                    title={isMuted ? 'Activer le son' : 'Couper le son'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-rose-300" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                      setIsMuted(false);
                    }}
                    className="w-16 accent-[#FCEEE3] bg-black/50 rounded-lg h-1.5 cursor-pointer hidden sm:block"
                    title="Volume"
                  />
                </div>
              </div>

              {audioError && (
                <p className="text-xs text-rose-300 pt-1 text-center sm:text-left drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                  {audioError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
