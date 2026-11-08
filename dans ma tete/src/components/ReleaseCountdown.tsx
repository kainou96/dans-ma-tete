import { useEffect, useState } from 'react';

interface ReleaseCountdownProps {
  releaseDate: string;
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

export function ReleaseCountdown({ releaseDate }: ReleaseCountdownProps) {
  const [now, setNow] = useState(() => Date.now());
  const targetDate = parseReleaseDate(releaseDate);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const title = targetDate
    ? 'Compte à rebours avant la sortie'
    : 'La date de sortie sera bientôt annoncée';
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

  return (
    <section className="relative z-10 w-full px-4 pb-5 sm:px-6 sm:pb-7" aria-labelledby="release-countdown-title">
      <div className="mx-auto max-w-md rounded-2xl border border-[#FCEEE3]/20 bg-black/50 px-4 py-4 text-center shadow-xl shadow-black/40 backdrop-blur-md sm:px-6">
        <h2
          id="release-countdown-title"
          className="font-syne text-xs font-semibold uppercase tracking-[0.2em] text-[#FCEEE3]/80 sm:text-sm"
        >
          {title}
        </h2>

        {targetDate && !hasReleased ? (
          <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3" aria-label="Temps restant avant la sortie">
            {values.map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] py-2">
                <div className="font-bebas text-2xl leading-none text-[#FCEEE3] sm:text-3xl">
                  {String(value).padStart(2, '0')}
                </div>
                <div className="mt-1 text-[9px] uppercase tracking-wider text-slate-400 sm:text-[10px]">
                  {label}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm font-medium text-[#FCEEE3]">
            {targetDate && isReleaseDay ? 'C’est le jour de la sortie !' : targetDate ? 'La date de sortie est passée.' : releaseDate}
          </p>
        )}
      </div>
    </section>
  );
}
