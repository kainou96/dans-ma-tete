/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SiteConfig, findFanByEmail, registerOrGetFan } from '../services/store';
import { Check, Mail, ExternalLink, AlertCircle } from 'lucide-react';

interface LandingGateProps {
  config: SiteConfig;
  onUnlock: (email: string) => void;
}

export const LandingGate: React.FC<LandingGateProps> = ({ config, onUnlock }) => {
  const [email, setEmail] = useState('');
  const [hasPresaved, setHasPresaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Email validation regex
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = isEmailValid && hasPresaved;

  const handleSpotifyPresaveClick = () => {
    // Open presave URL in a new window/tab
    window.open(config.spotifyPresaveUrl, '_blank', 'noopener,noreferrer');
    // Automatically mark presave as completed
    setHasPresaved(true);
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailValid) {
      setErrorMessage('Merci de saisir une adresse email valide.');
      return;
    }
    if (!hasPresaved) {
      setErrorMessage('Merci de pré-sauvegarder la chanson sur Spotify.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const normalizedEmail = email.trim().toLowerCase();
    const existing = findFanByEmail(normalizedEmail);

    if (existing && existing.hasPlayed) {
      setIsLoading(false);
      setErrorMessage(
        'Cette adresse email a déjà profité de son écoute unique. L’accès exclusif est strictement limité à une seule écoute.'
      );
      return;
    }

    // Register fan or retrieve existing fan who hadn't clicked play yet
    registerOrGetFan(normalizedEmail, true);
    setIsLoading(false);
    onUnlock(normalizedEmail);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[80vh] z-10">
      {/* 1. Album Artwork Header exact reproduction (DANS MA TÊTE / K A Ï N A / Sortie le [date]) */}
      <div className="text-center space-y-1 mb-8 w-full select-none">
        <h1 className="font-bebas text-6xl sm:text-7xl md:text-8xl tracking-[0.03em] text-[#FCEEE3] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] leading-none">
          {config.songTitle.toUpperCase()}
        </h1>

        <p className="font-sans text-lg sm:text-xl md:text-2xl font-light tracking-[0.45em] sm:tracking-[0.6em] text-[#FCEEE3] uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] pl-[0.45em] sm:pl-[0.6em] mt-0.5">
          {config.artistName.includes(' ')
            ? config.artistName.toUpperCase()
            : config.artistName.toUpperCase().split('').join(' ')}
        </p>

        <p className="text-black font-extrabold text-xs sm:text-sm tracking-wide uppercase drop-shadow-[0_1px_4px_rgba(255,255,255,0.4)] pt-1.5">
          Sortie le {config.releaseDate}
        </p>
      </div>

      {/* 2. Error message if already listened or invalid */}
      {errorMessage && (
        <div className="w-full mb-5 p-3.5 rounded-2xl bg-rose-950/80 backdrop-blur-md border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 shadow-xl">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <p>{errorMessage}</p>
            {errorMessage.includes('déjà profité') && (
              <a
                href={config.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-rose-300 underline hover:text-white"
              >
                Suivre Kaïna sur Instagram <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* 3. Form Floating Freely (NO rectangle container card, background fully visible!) */}
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {/* Email Input */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-semibold text-[#FCEEE3] drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            Adresse e-mail
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4 text-[#E8DCD4]/70" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="ton.adresse@email.com"
              required
              className="w-full pl-10 pr-10 py-3.5 rounded-2xl bg-black/50 backdrop-blur-md border border-white/25 text-[#FDF6F0] placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#FCEEE3]/40 focus:border-[#FCEEE3]/70 transition-all shadow-xl shadow-black/60"
            />
            {isEmailValid && (
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-emerald-400">
                <Check className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>

        {/* Spotify Presave Button */}
        <div className="space-y-1.5 pt-1">
          <button
            type="button"
            onClick={handleSpotifyPresaveClick}
            className={`w-full py-3.5 px-4 rounded-2xl flex items-center justify-between transition-all duration-300 font-medium text-sm group cursor-pointer shadow-xl ${
              hasPresaved
                ? 'bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/35 backdrop-blur-md shadow-black/60'
                : 'bg-[#1DB954] hover:bg-[#1ed760] text-black shadow-black/80 hover:scale-[1.01]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {/* Spotify SVG Icon */}
              <svg className="w-5 h-5 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.496 17.306c-.215.353-.674.464-1.026.249-2.812-1.718-6.353-2.106-10.523-1.154-.403.092-.806-.16-.898-.564-.092-.403.16-.806.564-.898 4.567-1.042 8.487-.605 11.634 1.341.353.215.464.674.249 1.026zm1.467-3.262c-.27.44-.847.579-1.287.31-3.219-1.979-8.127-2.55-11.935-1.393-.497.151-1.025-.133-1.176-.63-.151-.497.133-1.025.63-1.176 4.356-1.323 9.775-.683 13.458 1.58.44.27.579.847.31 1.287zm.126-3.411c-3.859-2.292-10.228-2.503-13.896-1.389-.59.18-1.217-.156-1.397-.746-.18-.59.156-1.217.746-1.397 4.225-1.283 11.266-1.037 15.706 1.597.531.315.704 1.004.389 1.535-.315.531-1.004.704-1.535.389z" />
              </svg>
              <span className="font-semibold">
                {hasPresaved ? 'Presave Spotify confirmé' : 'Pré-sauvegarder la chanson'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {hasPresaved ? (
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  <Check className="w-3.5 h-3.5" /> Fait
                </span>
              ) : (
                <ExternalLink className="w-4 h-4 opacity-75 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              )}
            </div>
          </button>
        </div>

        {/* Validate Button: "VALIDER ET ECOUTER" as requested */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            className={`w-full py-3.5 px-6 rounded-2xl font-syne font-bold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-300 ${
              canSubmit && !isLoading
                ? 'bg-gradient-to-r from-[#223d64] via-[#1a3152] to-[#12233b] hover:from-[#2a4a79] hover:to-[#172c4a] text-[#FCEEE3] border border-[#FCEEE3]/40 shadow-xl shadow-black/80 cursor-pointer hover:scale-[1.01]'
                : 'bg-black/40 text-slate-400 cursor-not-allowed border border-white/10 backdrop-blur-sm'
            }`}
          >
            <span>{isLoading ? 'Vérification...' : 'VALIDER ET ECOUTER'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
