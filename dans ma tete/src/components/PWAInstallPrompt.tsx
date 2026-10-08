import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone, CheckCircle, Sparkles, ShieldCheck, MoreVertical } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAInstallPromptProps {
  inline?: boolean;
}

export function PWAInstallPrompt({ inline = false }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<'ios' | 'android'>('ios');
  const [isDismissed, setIsDismissed] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };

    checkStandalone();

    // Detect platform
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIos(isAppleDevice);
    setGuidePlatform(isAppleDevice ? 'ios' : 'android');

    // Listen for beforeinstallprompt (Chrome, Android, Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error('Erreur lors de l\'installation:', err);
        setShowIosModal(true);
      }
    } else {
      setShowIosModal(true);
    }
  };

  return (
    <>
      {/* Inline Mode: Directement sous le formulaire de connexion administrateur */}
      {inline ? (
        <div className="w-full mt-4">
          {isInstalled ? (
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Application déjà installée sur cet appareil</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>Ajouter à l'écran d'accueil du téléphone</span>
            </button>
          )}
        </div>
      ) : (
        /* Si non-inline : Masqué par défaut sur les pages publiques */
        null
      )}

      {/* Success Notification Toast */}
      {showSuccessToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 shadow-2xl backdrop-blur-md animate-in slide-in-from-top duration-300">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">Application installée sur votre écran d'accueil !</span>
        </div>
      )}

      {/* Modal Guide d'installation iOS / Android */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 shadow-2xl text-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Background glowing gradient */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 p-0.5 shadow-lg shadow-rose-500/25 shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center overflow-hidden">
                    <img src="/icons/icon-192.png" alt="Icone App" className="w-9 h-9 object-cover rounded-xl" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-white">Ajouter à l'écran d'accueil</h3>
                  <p className="text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                    <Sparkles className="w-3 h-3" /> Expérience plein écran sans barre d'adresse
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIosModal(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Platform Selector Tabs: iPhone vs Android */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-white/10 mb-4">
              <button
                type="button"
                onClick={() => setGuidePlatform('ios')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  guidePlatform === 'ios'
                    ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🍎 Sur iPhone (iOS)
              </button>
              <button
                type="button"
                onClick={() => setGuidePlatform('android')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  guidePlatform === 'android'
                    ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🤖 Sur Android (Chrome)
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-slate-300">
              {guidePlatform === 'ios' ? (
                /* iOS Safari Steps */
                <>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Ouvrez ce lien dans le navigateur <strong>Safari</strong> sur votre iPhone, puis :
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                      <div className="w-7 h-7 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center font-bold text-xs shrink-0">
                        1
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          Appuyez sur <Share2 className="w-3.5 h-3.5 text-sky-400 inline" /> Partager
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          L'icône de partage se trouve en bas au centre de Safari.
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                      <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                        2
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          Sélectionnez <PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" /> « Sur l'écran d'accueil »
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Faites glisser les options vers le bas jusqu'à voir ce texte.
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                        3
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-white">
                          Appuyez sur « Ajouter »
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          En haut à droite de l'écran. L'icône de l'app apparaîtra avec vos autres applications !
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Android Chrome Steps */
                <>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Ouvrez ce lien dans <strong>Google Chrome</strong> sur votre smartphone Android, puis :
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                      <div className="w-7 h-7 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center font-bold text-xs shrink-0">
                        1
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          Appuyez sur le menu <MoreVertical className="w-3.5 h-3.5 text-sky-400 inline" /> (3 points)
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          En haut à droite de Chrome.
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                      <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                        2
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          Sélectionnez « Installer l'application » ou « Ajouter à l'écran d'accueil »
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Dans la liste qui s'affiche.
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                        3
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-white">
                          Confirmez en appuyant sur « Installer »
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          L'application se placera immédiatement sur votre écran d'accueil comme toute application native !
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 mt-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zéro stockage lourd, lancement instantané en plein écran.</span>
              </div>
            </div>

            <button
              onClick={() => setShowIosModal(false)}
              className="mt-4 w-full py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white shadow-lg shadow-rose-500/25 transition-all text-xs sm:text-sm cursor-pointer"
            >
              J'ai compris !
            </button>
          </div>
        </div>
      )}
    </>
  );
}
