/**
 * DROVA Express Algeria — Internal Authentication Gateway
 * Secure login screen strictly guarding company platform
 */
import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2, Globe, Truck } from 'lucide-react';
import { storage } from '../services/storage';
import { i18n } from '../services/i18n';
import { Language, UserRole } from '../types';

interface LoginViewProps {
  onLoginSuccess: (role: UserRole) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [currentLang, setCurrentLang] = useState<Language>(() => i18n.getCurrentLanguage());
  const dir = i18n.getDirection();

  const handleLanguageChange = (lang: Language) => {
    i18n.setLanguage(lang);
    setCurrentLang(lang);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await storage.login(username, password);
      if (result.success && result.session) {
        onLoginSuccess(result.session.role);
      } else {
        setErrorMessage(result.message || 'فشل تسجيل الدخول. يرجى التحقق من اسم المستخدم وكلمة المرور.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'حدث خطأ غير متوقع أثناء تسجيل الدخول.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await storage.loginWithGoogle();
      if (result.success && result.session) {
        onLoginSuccess(result.session.role);
      } else {
        setErrorMessage(result.message || 'فشل تسجيل الدخول بواسطة Google.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'حدث خطأ غير متوقع أثناء تسجيل الدخول عبر Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-[#080808] text-[#EDEDED] flex flex-col justify-between selection:bg-[#FF0000] selection:text-white"
      dir={dir}
      lang={currentLang}
    >
      {/* Top Bar with Language Selector */}
      <div className="h-16 border-b border-[#1E1E1E] px-3 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center justify-center shrink-0">
            <img
              src="/logo.png"
              alt="DROVA Express"
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-latin font-extrabold text-white text-sm sm:text-base tracking-tight">DROVA</span>
              <span className="text-[10px] sm:text-xs font-latin text-[#FF0000] font-bold tracking-wider">EXPRESS</span>
            </div>
            <p className="text-[9px] text-[#71717A] tracking-wider uppercase mt-0.5 truncate hidden sm:block">
              National Logistics & Merchant Intelligence · 69 Wilayas
            </p>
          </div>
        </div>

        {/* Language buttons */}
        <div className="flex items-center gap-1 bg-[#121212] border border-[#27272A] p-0.5 sm:p-1 shrink-0">
          <button
            type="button"
            onClick={() => handleLanguageChange('ar')}
            className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-medium transition-colors ${
              currentLang === 'ar' ? 'bg-[#FF0000] text-white font-bold' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            العربية
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('fr')}
            className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-medium transition-colors ${
              currentLang === 'fr' ? 'bg-[#FF0000] text-white font-bold' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            Français
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('en')}
            className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-medium transition-colors ${
              currentLang === 'en' ? 'bg-[#FF0000] text-white font-bold' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-6">
        <div className="w-full max-w-md bg-[#111111] border border-[#262626] shadow-2xl p-4 sm:p-8 space-y-5 sm:space-y-6">
          {/* Header with Centered DROVA Express Logo (No Background) */}
          <div className="text-center space-y-4">
            <div className="flex justify-center items-center py-2">
              <img
                src="/logo.png"
                alt="DROVA Express Algérie"
                className="h-12 sm:h-14 w-auto max-w-[260px] object-contain drop-shadow-md"
              />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {currentLang === 'ar' ? 'بوابة الدخول الداخلية' : currentLang === 'fr' ? 'Portail Interne Sécurisé' : 'Internal Secure Portal'}
              </h2>
              <p className="text-xs text-[#8E8E93] max-w-sm mx-auto leading-relaxed">
                {currentLang === 'ar'
                  ? 'نظام استخبارات التجار وإدارة الشاحنين (Expéditeurs CRM) الحصري لشركة DROVA Express الجزائر — 69 ولاية'
                  : currentLang === 'fr'
                  ? 'Plateforme exclusive d\'intelligence marchande et CRM expéditeurs de DROVA Express Algérie — 69 Wilayas'
                  : 'DROVA Express Algeria exclusive merchant prospect intelligence & CRM system — 69 Wilayas'}
              </p>
            </div>
          </div>

          {/* Internal Strict Warning */}
          <div className="bg-[#181818] border border-[#2A2A2A] p-3 flex items-start gap-2.5 text-[11px] text-[#A1A1AA]">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <span>
              {currentLang === 'ar'
                ? 'حسابات موثقة ومحمية بتشفير PBKDF2 الملح (100k rounds). الدخول مراقب ومسجل في سجل التدقيق الإداري.'
                : 'Comptes sécurisés par hachage salé PBKDF2. Tout accès est consigné dans le journal d\'audit.'}
            </span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-rose-950/50 border border-rose-800 p-3 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white block">
                {currentLang === 'ar' ? 'اسم المستخدم (Username)' : 'Nom d\'utilisateur'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={currentLang === 'ar' ? 'اسم المستخدم' : 'Nom d\'utilisateur'}
                  className="w-full bg-[#181818] border border-[#333333] px-3.5 py-2.5 text-sm text-white placeholder-[#52525B] outline-none focus:border-[#FF0000] transition-colors"
                  dir="ltr"
                />
                <User size={16} className="absolute left-3 top-3 text-[#71717A] pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white block">
                  {currentLang === 'ar' ? 'كلمة المرور المشفرة (Password)' : 'Mot de passe sécurisé'}
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#181818] border border-[#333333] px-3.5 py-2.5 text-sm text-white placeholder-[#52525B] outline-none focus:border-[#FF0000] transition-colors"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3 text-[#71717A] hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#FF0000] hover:bg-[#E00000] text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-red-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <span>{currentLang === 'ar' ? 'جاري التحقق والولوج...' : 'Vérification...'}</span>
              ) : (
                <>
                  <span>{currentLang === 'ar' ? 'تسجيل الدخول الآمن' : 'Connexion Sécurisée'}</span>
                  <ArrowRight size={16} className={dir === 'rtl' ? 'rotate-180' : ''} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#262626]"></div>
            <span className="flex-shrink mx-3 text-[11px] text-[#71717A] uppercase font-mono">
              {currentLang === 'ar' ? 'أو عبر حساب Google' : 'Ou via Google'}
            </span>
            <div className="flex-grow border-t border-[#262626]"></div>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleLogin}
            className="w-full py-2.5 bg-[#181818] hover:bg-[#222222] text-white border border-[#333333] hover:border-[#555555] font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 shadow-md"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{currentLang === 'ar' ? 'الدخول بحساب Google المعتمد' : 'Se connecter avec Google'}</span>
          </button>
        </div>
      </div>

      {/* Footer & Developer Credits */}
      <div className="h-14 border-t border-[#1E1E1E] px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#71717A] gap-2">
        <div className="flex items-center gap-2">
          <Truck size={14} className="text-[#FF0000]" />
          <span>DROVA Express Algérie © 2026 · Tous droits réservés</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#A1A1AA]">Developed by Cherouik Imad</span>
          <span>•</span>
          <span>DROVA Enterprise Intelligence Platform v2.0</span>
        </div>
      </div>
    </div>
  );
};
