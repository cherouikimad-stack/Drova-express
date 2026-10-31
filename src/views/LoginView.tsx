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
  const [username, setUsername] = useState('cherouik');
  const [password, setPassword] = useState('admin123@');
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

  const quickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  return (
    <div
      className="min-h-screen w-full bg-[#080808] text-[#EDEDED] flex flex-col justify-between selection:bg-[#FF0000] selection:text-white"
      dir={dir}
      lang={currentLang}
    >
      {/* Top Bar with Language Selector */}
      <div className="h-16 border-b border-[#1E1E1E] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#FF0000] text-white flex items-center justify-center font-black tracking-wider text-base font-latin shadow-lg shadow-red-950/40">
            D
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-latin font-extrabold text-white text-lg tracking-tight">DROVA</span>
              <span className="text-xs font-latin text-[#FF0000] font-bold tracking-wider">EXPRESS</span>
            </div>
            <p className="text-[10px] text-[#71717A] tracking-wider uppercase mt-1">
              National Logistics & Merchant Intelligence
            </p>
          </div>
        </div>

        {/* Language buttons */}
        <div className="flex items-center gap-1 bg-[#121212] border border-[#27272A] p-1">
          <button
            type="button"
            onClick={() => handleLanguageChange('ar')}
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              currentLang === 'ar' ? 'bg-[#FF0000] text-white font-bold' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            العربية
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('fr')}
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              currentLang === 'fr' ? 'bg-[#FF0000] text-white font-bold' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            Français
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('en')}
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              currentLang === 'en' ? 'bg-[#FF0000] text-white font-bold' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-[#111111] border border-[#262626] shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-950/40 border border-red-800/50 text-[#FF0000] mb-2">
              <Lock size={22} />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {currentLang === 'ar' ? 'بوابة الدخول الداخلية' : currentLang === 'fr' ? 'Portail Interne Sécurisé' : 'Internal Secure Portal'}
            </h2>
            <p className="text-xs text-[#8E8E93] max-w-sm mx-auto leading-relaxed">
              {currentLang === 'ar'
                ? 'نظام استخبارات التجار وإدارة الشاحنين (Expéditeurs CRM) الحصري لشركة DROVA Express الجزائر'
                : currentLang === 'fr'
                ? 'Plateforme exclusive d\'intelligence marchande et CRM expéditeurs de DROVA Express Algérie'
                : 'DROVA Express Algeria exclusive merchant prospect intelligence & CRM system'}
            </p>
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
                  placeholder="cherouik"
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

          {/* Quick Demo Access Bar */}
          <div className="border-t border-[#262626] pt-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[#8E8E93]">
              <span className="font-semibold text-white">
                {currentLang === 'ar' ? 'حسابات تجريبية سريعة:' : 'Accès rapides de démonstration:'}
              </span>
              <span className="text-[10px] text-[#71717A]">انقر للتعبئة الفورية</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => quickFill('cherouik', 'admin123@')}
                className="p-2 bg-[#171717] hover:bg-[#222222] border border-[#2E2E2E] hover:border-[#FF0000] text-right text-[11px] transition-all cursor-pointer group"
              >
                <div className="font-bold text-white group-hover:text-[#FF0000]">Cherouik Imad</div>
                <div className="text-[10px] text-[#8E8E93]">Super Admin (cherouik)</div>
              </button>

              <button
                type="button"
                onClick={() => quickFill('mouradkarmoula', 'mourad123@')}
                className="p-2 bg-[#171717] hover:bg-[#222222] border border-[#2E2E2E] hover:border-[#FF0000] text-right text-[11px] transition-all cursor-pointer group"
              >
                <div className="font-bold text-white group-hover:text-[#FF0000]">Mourad Karmoula</div>
                <div className="text-[10px] text-[#8E8E93]">Commercial Rep (mourad)</div>
              </button>

              <button
                type="button"
                onClick={() => quickFill('karim_k', 'karim123@')}
                className="p-2 bg-[#171717] hover:bg-[#222222] border border-[#2E2E2E] hover:border-[#FF0000] text-right text-[11px] transition-all cursor-pointer group"
              >
                <div className="font-bold text-white group-hover:text-[#FF0000]">Karim Khelifi</div>
                <div className="text-[10px] text-[#8E8E93]">Commercial Manager</div>
              </button>

              <button
                type="button"
                onClick={() => quickFill('reda_mkt', 'reda123@')}
                className="p-2 bg-[#171717] hover:bg-[#222222] border border-[#2E2E2E] hover:border-[#FF0000] text-right text-[11px] transition-all cursor-pointer group"
              >
                <div className="font-bold text-white group-hover:text-[#FF0000]">Reda Marketing</div>
                <div className="text-[10px] text-[#8E8E93]">Admin Marketing</div>
              </button>
            </div>
          </div>
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
