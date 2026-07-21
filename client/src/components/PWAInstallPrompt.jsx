import React, { useState, useEffect } from 'react';
import { Download, X, Zap, CloudOff, Smartphone, Sparkles } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI to show the install promotion
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the native browser install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, discard it
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full p-1 animate-slide-up">
      {/* Outer gradient container matching the reference card */}
      <div className="relative rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-800 p-6 shadow-2xl overflow-hidden border border-white/10 text-white">
        
        {/* Glow decorative background bubble */}
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={handleDismiss} 
          className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-all cursor-pointer border-none outline-none"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Block */}
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10 shrink-0 shadow-inner flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-yellow-300 fill-yellow-300/10" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight tracking-wide">Install Connectify</h3>
            <p className="text-white/80 text-xs mt-1.5 font-medium leading-relaxed">
              Faster loading, offline access, full app experience.
            </p>
          </div>
        </div>

        {/* Badges Info Grid */}
        <div className="grid grid-cols-3 gap-3.5 my-6">
          <div className="rounded-2xl bg-white/5 border border-white/5 py-3 flex flex-col items-center justify-center gap-1.5 shadow-inner">
            <Zap className="h-5 w-5 text-yellow-300 fill-yellow-300/10" />
            <span className="text-[10px] font-bold tracking-wider uppercase opacity-90">Fast</span>
          </div>
          
          <div className="rounded-2xl bg-white/5 border border-white/5 py-3 flex flex-col items-center justify-center gap-1.5 shadow-inner">
            <CloudOff className="h-5 w-5 text-blue-300" />
            <span className="text-[10px] font-bold tracking-wider uppercase opacity-90">Offline</span>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/5 py-3 flex flex-col items-center justify-center gap-1.5 shadow-inner">
            <Smartphone className="h-5 w-5 text-purple-300" />
            <span className="text-[10px] font-bold tracking-wider uppercase opacity-90">Native</span>
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between gap-4 mt-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-white text-purple-800 hover:bg-white/95 px-5 py-3.5 text-sm font-bold shadow-lg shadow-black/10 transition-all cursor-pointer active:scale-95 border-none outline-none"
          >
            <Download className="h-4 w-4" />
            <span>Install App</span>
          </button>
          
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white text-sm font-bold px-4 py-2 cursor-pointer transition-all border-none bg-transparent outline-none"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
