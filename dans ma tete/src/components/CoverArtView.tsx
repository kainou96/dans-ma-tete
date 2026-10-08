/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface CoverArtViewProps {
  customCoverUrl: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CoverArtView: React.FC<CoverArtViewProps> = ({
  customCoverUrl,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-24 h-24 sm:w-28 sm:h-28 text-xs',
    md: 'w-48 h-48 sm:w-60 sm:h-60 text-sm',
    lg: 'w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 text-base',
  }[size];

  if (customCoverUrl) {
    return (
      <div className={`relative aspect-square overflow-hidden rounded-2xl shadow-2xl shadow-sky-950/60 border border-white/10 group ${sizeClasses} ${className}`}>
        <img
          src={customCoverUrl}
          alt="Pochette du single Dans ma tête - Kaïna"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none" />
      </div>
    );
  }

  // High-fidelity cover reproduction matching "35e1b026.png"
  return (
    <div
      className={`relative aspect-square overflow-hidden rounded-2xl shadow-2xl shadow-cyan-950/70 border border-white/15 select-none ${sizeClasses} ${className}`}
      style={{
        background: 'linear-gradient(180deg, #182847 0%, #1c3258 45%, #2a416a 70%, #15223c 100%)',
      }}
    >
      {/* Rain Texture in cover */}
      <div className="absolute inset-0 opacity-40 bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] bg-[length:2px_32px] bg-repeat-y" />

      {/* Atmospheric vignette */}
      <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/60" />

      {/* Typography Top Header matching artwork */}
      <div className="absolute top-4 sm:top-6 inset-x-0 flex flex-col items-center justify-center text-center z-10 px-2">
        <h1 className="font-bebas text-3xl sm:text-5xl md:text-6xl tracking-wider text-[#FCEEE3] drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] leading-none">
          DANS MA TÊTE
        </h1>
        <p className="font-syne text-[10px] sm:text-xs md:text-sm tracking-[0.45em] text-[#E8DCD4] font-medium mt-1 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pl-[0.45em]">
          KAÏNA
        </p>
      </div>

      {/* Cloudscape Artwork in Cover */}
      <div className="absolute bottom-0 inset-x-0 h-1/2 flex items-end justify-center pointer-events-none">
        {/* Dreamy fluffy cumulus cloud silhouettes */}
        <div className="absolute bottom-[-15%] inset-x-[-15%] h-[80%] bg-gradient-to-t from-white/90 via-slate-200/70 to-transparent blur-md rounded-t-[100%]" />
        <div className="absolute bottom-[-10%] inset-x-[-5%] h-[65%] bg-gradient-to-t from-white/80 via-sky-100/60 to-transparent blur-sm rounded-t-[90%]" />
        <div className="absolute bottom-0 inset-x-0 h-[40%] bg-white/75 blur-xs rounded-t-full" />

        {/* Artistic Seated Figure Silhouette in clouds */}
        <div className="relative mb-4 sm:mb-6 z-10 flex flex-col items-center">
          <div className="w-14 sm:w-20 md:w-24 h-18 sm:h-26 md:h-30 relative flex flex-col items-center">
            {/* Soft glow behind figure */}
            <div className="absolute inset-0 bg-cyan-300/20 rounded-full blur-md" />
            {/* Stylized silhouette outline */}
            <div className="w-5 sm:w-7 h-5 sm:h-7 rounded-full bg-slate-900/90 border border-white/20 mt-1 shadow" />
            <div className="w-9 sm:w-13 h-10 sm:h-14 bg-gradient-to-b from-sky-900 to-indigo-950 rounded-t-xl mt-1 border border-white/10 shadow" />
            <div className="w-11 sm:w-16 h-5 sm:h-7 bg-slate-900/90 rounded-b-xl -mt-1" />
          </div>
        </div>
      </div>

      {/* 3D Anaglyph subtle fringe on border */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-rose-500/10 pointer-events-none" />
    </div>
  );
};
