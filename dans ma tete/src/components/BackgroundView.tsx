/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';

interface BackgroundViewProps {
  customBgUrl: string | null;
}

export const BackgroundView: React.FC<BackgroundViewProps> = ({ customBgUrl }) => {
  // Realistic artistic rain particles
  const rainDrops = useMemo(() => {
    return Array.from({ length: 65 }).map((_, i) => ({
      id: i,
      left: `${(i * 1.6 + (i % 7) * 0.35) % 100}%`,
      delay: `${((i * 0.11) % 2.2).toFixed(2)}s`,
      duration: `${(1.0 + (i % 6) * 0.18).toFixed(2)}s`,
      opacity: 0.28 + (i % 4) * 0.15,
      height: `${38 + (i % 8) * 20}px`,
      width: i % 4 === 0 ? '1.5px' : '1px',
    }));
  }, []);

  // Condensation / glass raindrops
  const staticDroplets = useMemo(() => {
    return Array.from({ length: 26 }).map((_, i) => ({
      id: i,
      left: `${(i * 4.1 + 2) % 96}%`,
      top: `${(i * 4.9 + 5) % 90}%`,
      size: `${2.5 + (i % 4) * 2}px`,
      opacity: 0.25 + (i % 3) * 0.2,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden select-none -z-10 bg-[#070e1b]">
      {/* 1. Base Layer with CSS 'Freeze' Filter (Desaturation + Cold Blue Hues) */}
      <div className="absolute inset-0 filter-freeze">
        {customBgUrl ? (
          // Custom background uploaded by Kaïna in admin
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-90 scale-105 transition-transform duration-1000"
              style={{
                backgroundImage: `url(${customBgUrl})`,
                filter: 'saturate(0.68) contrast(1.12) brightness(0.92) hue-rotate(190deg)',
              }}
            />
          </div>
        ) : (
          // Artistic, melancholic backdrop faithful to Kaïna's photo-output.jpeg DA
          <div className="absolute inset-0 overflow-hidden">
            {/* Cold moody sky gradient */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, #091322 0%, #0e1c31 40%, #172b49 65%, #122137 85%, #0a1424 100%)',
              }}
            />

            {/* Central Photographic Composition with 3D Anaglyph Freeze Effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full max-w-xl h-[85vh] flex flex-col items-center justify-end pb-12 opacity-90">
                {/* Cyan 3D shift left */}
                <div className="absolute bottom-28 w-44 sm:w-56 h-64 sm:h-76 opacity-50 blur-[1px] translate-x-[-4px] pointer-events-none">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto bg-cyan-400/40" />
                  <div className="w-28 sm:w-36 h-36 sm:h-44 mx-auto rounded-t-3xl bg-cyan-500/30 mt-1" />
                  <div className="w-36 sm:w-48 h-16 sm:h-20 mx-auto rounded-3xl bg-cyan-400/35 -mt-3" />
                </div>

                {/* Red 3D shift right */}
                <div className="absolute bottom-28 w-44 sm:w-56 h-64 sm:h-76 opacity-50 blur-[1px] translate-x-[4px] pointer-events-none">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto bg-rose-400/35" />
                  <div className="w-28 sm:w-36 h-36 sm:h-44 mx-auto rounded-t-3xl bg-rose-500/30 mt-1" />
                  <div className="w-36 sm:w-48 h-16 sm:h-20 mx-auto rounded-3xl bg-rose-400/35 -mt-3" />
                </div>

                {/* Central figure silhouette (Kaïna in denim dress sitting on clouds) */}
                <div className="relative z-10 w-44 sm:w-56 h-64 sm:h-76 flex flex-col items-center justify-end mb-6">
                  {/* Hair & Head */}
                  <div className="w-16 h-22 sm:w-20 sm:h-26 rounded-full bg-[#0d1624] border border-cyan-400/20 shadow-lg relative">
                    <div className="absolute top-4 -inset-x-2 bottom-0 bg-[#090f19] rounded-b-2xl" />
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-10 bg-[#e4ba9d]/30 rounded-full blur-[1px]" />
                  </div>

                  {/* Denim Dress body */}
                  <div className="w-28 sm:w-36 h-32 sm:h-40 bg-gradient-to-b from-[#1b3452] to-[#14263c] rounded-t-2xl shadow-xl mt-1 border-t border-cyan-200/20 relative">
                    <div className="absolute top-0 left-4 w-3 h-14 bg-[#152940] rounded-sm" />
                    <div className="absolute top-0 right-4 w-3 h-14 bg-[#152940] rounded-sm" />
                  </div>

                  {/* Seated cross-legged posture */}
                  <div className="w-36 sm:w-48 h-14 sm:h-18 bg-gradient-to-b from-[#172d46] to-[#0e1a2b] rounded-3xl -mt-4 shadow-xl" />
                </div>

                {/* Soft Cumulus Cloud Bed */}
                <div className="absolute bottom-0 inset-x-[-20%] h-48 sm:h-60 pointer-events-none">
                  <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-white/60 via-slate-200/40 to-transparent blur-xl rounded-t-[100%]" />
                  <div className="absolute bottom-4 left-[-10%] w-[60%] h-36 bg-white/50 blur-lg rounded-full" />
                  <div className="absolute bottom-2 right-[-10%] w-[65%] h-36 bg-slate-200/55 blur-lg rounded-full" />
                  <div className="absolute bottom-0 inset-x-0 h-28 bg-white/45 blur-md rounded-t-full" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Cold Frosted Glaze Overlay (Blue cold tints / freeze effect) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a182b]/30 via-[#071324]/20 to-[#040c17]/40 pointer-events-none mix-blend-color" />
      <div className="absolute inset-0 bg-cyan-900/15 pointer-events-none" />

      {/* 3. Subtle Storm Lightning Flash (Intermittent soft lightning illuminating the sky & clouds) */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200/40 via-cyan-100/25 to-transparent pointer-events-none animate-lightning mix-blend-screen" />
      <div className="absolute top-0 inset-x-0 h-[60vh] bg-radial from-white/30 to-transparent pointer-events-none animate-lightning" />

      {/* 4. Realistic Falling Rain Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {rainDrops.map((drop) => (
          <div
            key={drop.id}
            className="absolute bg-gradient-to-b from-transparent via-cyan-100/70 to-white/90 animate-rain"
            style={{
              left: drop.left,
              top: '-100px',
              width: drop.width,
              height: drop.height,
              opacity: drop.opacity,
              animationDelay: drop.delay,
              animationDuration: drop.duration,
            }}
          />
        ))}
      </div>

      {/* 5. Static Droplets on Glass */}
      <div className="absolute inset-0 pointer-events-none">
        {staticDroplets.map((d) => (
          <div
            key={d.id}
            className="absolute rounded-full bg-cyan-100/35 backdrop-blur-xs shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
            style={{
              left: d.left,
              top: d.top,
              width: d.size,
              height: d.size,
              opacity: d.opacity,
            }}
          />
        ))}
      </div>

      {/* 6. Cinematic Matte & Vignette for text legibility */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#060e1b]/35 to-[#040912]/80 pointer-events-none" />
    </div>
  );
};
