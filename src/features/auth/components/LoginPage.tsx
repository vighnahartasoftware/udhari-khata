import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthAdapter } from '@/services/auth.adapter';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/components/feedback/ToastStore';
import { Store, Lock, Delete, ArrowRight, Loader2, KeyRound } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const { addToast } = useToastStore();

  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUnlock = useCallback(async (pinToSubmit: string) => {
    if (pinToSubmit.length !== 6) {
      setErrorMessage('कृपया ६-अंकी पिन प्रविष्ट करा. (Please enter 6-digit PIN)');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const adapter = getAuthAdapter();
      const userProfile = await adapter.loginWithPin(pinToSubmit);

      setUser(userProfile);
      addToast({
        type: 'success',
        message: `स्वागत आहे, ${userProfile.displayName}!`,
      });

      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'अनावृत करताना त्रुटी आली';
      setErrorMessage(msg);
      setPin('');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, navigate, setUser]);

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMessage(null);
      if (nextPin.length === 6) {
        void handleUnlock(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  // Support physical keyboard typing
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 6) {
          const nextPin = pin + e.key;
          setPin(nextPin);
          setErrorMessage(null);
          if (nextPin.length === 6) {
            void handleUnlock(nextPin);
          }
        }
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
        setErrorMessage(null);
      } else if (e.key === 'Escape') {
        setPin('');
        setErrorMessage(null);
      } else if (e.key === 'Enter' && pin.length === 6) {
        void handleUnlock(pin);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUnlock, pin]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white">
      {/* Background Decorative Ambient Glows */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm glass-card p-6 md:p-8 rounded-3xl shadow-2xl space-y-6 relative z-10 border-slate-800/90 glow-sky text-center">
        {/* Header Branding */}
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-emerald-400 p-[2px] mx-auto shadow-xl shadow-sky-500/25 glow-sky animate-pulse-glow">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-white">
              <Store className="w-8 h-8 text-sky-400" />
            </div>
          </div>

          <div>
            <h1 className="heading-font text-2xl font-black text-slate-100 tracking-tight gradient-text-sky">
              उधारी खाता
            </h1>
            <p className="text-xs text-slate-400 font-medium">सुरक्षा पिनने अनलॉक करा (PIN Lock)</p>
          </div>
        </div>

        {/* PIN Indicators */}
        <div className="space-y-3">
          <div className="flex items-center justify-center space-x-1 text-slate-400 text-xs font-semibold">
            <KeyRound className="w-3.5 h-3.5 text-sky-400" />
            <span>६-अंकी सिक्युरिटी पिन टाका</span>
          </div>

          {/* 6 Digit Circles */}
          <div className="flex items-center justify-center space-x-3 py-2">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const isFilled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    isFilled
                      ? 'bg-sky-400 ring-4 ring-sky-500/20 scale-110 shadow-lg shadow-sky-500/40 glow-sky'
                      : 'bg-slate-800 border border-slate-700'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="p-3 bg-rose-950/80 border border-rose-700/50 rounded-2xl text-xs text-rose-300 font-semibold animate-bounce"
          >
            {errorMessage}
          </div>
        )}

        {/* Touch Keypad */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="py-3.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 rounded-2xl font-black text-xl text-slate-100 transition-all active:scale-95 shadow-md flex items-center justify-center"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={handleDelete}
            aria-label="Delete last digit"
            className="py-3.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-2xl text-slate-400 hover:text-slate-200 transition-all active:scale-95 flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="py-3.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 rounded-2xl font-black text-xl text-slate-100 transition-all active:scale-95 shadow-md flex items-center justify-center"
          >
            0
          </button>

          <button
            type="button"
            onClick={() => void handleUnlock(pin)}
            disabled={isLoading || pin.length !== 6}
            aria-label="Unlock app"
            className="py-3.5 bg-gradient-to-br from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white border border-sky-400/40 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-sky-500/25 flex items-center justify-center disabled:opacity-40"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500 font-medium">
          <Lock className="w-3 h-3 text-slate-500" />
          <span>सुरक्षित पिन संरक्षण | Udhari Khata</span>
        </div>
      </div>
    </div>
  );
};
