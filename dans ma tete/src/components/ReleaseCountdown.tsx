import { useEffect, useState } from 'react';

interface ReleaseCountdownProps {
  releaseDate: string;
  title: string;
  titleSize: 'small' | 'medium' | 'large';
  color: string;
  size: 'small' | 'medium' | 'large';
}

const MONTHS: Record<string, number> = {
  janvier: 0,
  fevrier: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  aout: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  decembre: 11,
};

function createLocalDate(year: number, month: number, day: number): Date | null {
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return date;
}

function parseReleaseDate(value: string): Date | null {
  const normalized = value.trim().toLocaleLowerCase('fr-FR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const isoDate = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(normalized);
  if (isoDate) {
    return createLocalDate(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3]));
  }

  const numericDate = /^(\d{1,2})[/. -](\d{1,2})[/. -](\d{4})$/.exec(normalized);
  if (numericDate) {
    return createLocalDate(Number(numericDate[3]), Number(numericDate[2]) - 1, Number(numericDate[1]));
  }

  const frenchDate = /^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/.exec(normalized);
  if (frenchDate && frenchDate[2] in MONTHS) {
    return createLocalDate(Number(frenchDate[3]), MONTHS[frenchDate[2]], Number(frenchDate[1]));
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }
  return createLocalDate(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
}

const TIME_UNITS = [
  { label: 'Jours', seconds: 86_400 },
  { label: 'Heures', seconds: 3_600 },
  { label: 'Minutes', seconds: 60 },
  { label: 'Secondes', seconds: 1 },
];

export function ReleaseCountdown({ releaseDate, title, titleSize, color, size }: ReleaseCountdownProps) {
  const [now, setNow] = useState(() => Date.now());
  const targetDate = parseReleaseDate(releaseDate);
  const accentColor = /^#[\da-f]{6}$/i.test(color) ? color : '#FCEEE3';

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const heading = title.trim() || 'Compte à rebours avant la sortie';
  const isReleaseDay = targetDate
    && new Date(now).toDateString() === targetDate.toDateString();
  const hasReleased = targetDate && now >= targetDate.getTime();
  const totalSeconds = targetDate
    ? Math.max(0, Math.floor((targetDate.getTime() - now) / 1_000))
    : 0;

  let remainingSeconds = totalSeconds;
  const values = TIME_UNITS.map(({ label, seconds }) => {
    const value = Math.floor(remainingSeconds / seconds);
    remainingSeconds %= seconds;
    return { label, value };
  });
  const sizeClasses = {
    small: {
      container: 'max-w-xs px-3 py-2.5',
      number: 'text-xl sm:text-2xl',
      label: 'text-[8px] sm:text-[9px]',
      grid: 'gap-1.5',
    },
    medium: {
      container: 'max-w-md px-4 py-4 sm:px-6',
      number: 'text-2xl sm:text-3xl',
      label: 'text-[9px] sm:text-[10px]',
      grid: 'gap-2 sm:gap-3',
    },
    large: {
      container: 'max-w-xl px-5 py-5 sm:px-8 sm:py-6',
      number: 'text-4xl sm:text-5xl',
      label: 'text-[10px] sm:text-xs',
      grid: 'gap-3 sm:gap-4',
    },
  }[size];
  const titleSizeClass = {
    small: 'text-[10px]',
    medium: 'text-xs sm:text-sm',
    large: 'text-sm sm:text-base',
  }[titleSize];

  return (
    <section className="relative z-10 w-full px-4 py-2 sm:px-6" aria-labelledby="release-countdown-title">
      <div className={`mx-auto rounded-2xl border border-[#FCEEE3]/20 bg-black/50 text-center shadow-xl shadow-black/40 backdrop-blur-md ${sizeClasses.container}`}>
        <h2
          id="release-countdown-title"
          className={`font-syne font-semibold uppercase tracking-[0.2em] ${titleSizeClass}`}
          style={{ color: accentColor }}
        >
          {heading}
        </h2>

        {targetDate && !hasReleased ? (
          <div className={`mt-3 grid grid-cols-4 ${sizeClasses.grid}`} aria-label="Temps restant avant la sortie">
            {values.map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] py-2">
                <div className={`font-bebas leading-none ${sizeClasses.number}`} style={{ color: accentColor }}>
                  {String(value).padStart(2, '0')}
                </div>
                <div className={`mt-1 uppercase tracking-wider text-slate-400 ${sizeClasses.label}`}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={`mt-2 font-medium ${titleSizeClass}`} style={{ color: accentColor }}>
            {targetDate && isReleaseDay ? 'C’est le jour de la sortie !' : targetDate ? 'La date de sortie est passée.' : releaseDate}
          </p>
        )}
      </div>
    </section>
  );
}
