import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Don't show if dismissed recently (24h)
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - Number(dismissed) < 24 * 60 * 60 * 1000) return;

    // Detect iOS Safari (no beforeinstallprompt support)
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroidDevice = /Android/.test(ua);

    if (isIOSDevice) {
      setIsIOS(true);
      // Show after a short delay so the page loads first
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    if (isAndroidDevice) {
      setIsAndroid(true);
    }

    // Android / Chrome: listen for the native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", bounce: 0.3 }}
          className="fixed bottom-16 md:bottom-4 left-3 right-3 z-[60] max-w-md mx-auto"
        >
          <div className="bg-card border-2 border-border rounded-2xl shadow-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-sm text-foreground">
                  Install Fomuso Family 🏠
                </p>
                {isIOS ? (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Tap the <strong>Share</strong> button{" "}
                    <span className="inline-block align-middle text-base">⬆️</span> then{" "}
                    <strong>"Add to Home Screen"</strong> to install this app.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Add to your home screen for quick access — works offline too! ✨
                    </p>
                    {isAndroid && (
                      <p className="text-xs text-muted-foreground/80 mt-1 leading-relaxed italic">
                        If your old home-screen icon opens a 404 page, remove it and reinstall from here.
                      </p>
                    )}
                  </>
                )}
                <div className="flex items-center gap-2 mt-3">
                  {!isIOS && deferredPrompt && (
                    <Button
                      size="sm"
                      className="rounded-full font-display text-xs h-8 px-4"
                      onClick={handleInstall}
                    >
                      Install App 🚀
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full font-display text-xs h-8 px-3 text-muted-foreground"
                    onClick={handleDismiss}
                  >
                    Not now
                  </Button>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
