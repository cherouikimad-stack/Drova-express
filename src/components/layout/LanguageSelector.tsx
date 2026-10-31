/**
 * DROVA Express Language Selector Component
 * Supports العربية (RTL), Français (LTR), and English (LTR)
 */
import React from 'react';
import { Globe, Check } from 'lucide-react';
import { i18n } from '../../services/i18n';
import { Language } from '../../types';

interface LanguageSelectorProps {
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '' }) => {
  const [currentLang, setCurrentLang] = React.useState<Language>(() => i18n.getLanguage());
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const unsub = i18n.subscribe(lang => setCurrentLang(lang));
    return unsub;
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages: { code: Language; label: string; dir: 'rtl' | 'ltr' }[] = [
    { code: 'ar', label: 'العربية', dir: 'rtl' },
    { code: 'fr', label: 'Français', dir: 'ltr' },
    { code: 'en', label: 'English', dir: 'ltr' },
  ];

  const handleSelect = (code: Language) => {
    i18n.setLanguage(code);
    setIsOpen(false);
  };

  const activeLabel = languages.find(l => l.code === currentLang)?.label || 'العربية';

  return (
    <div className={`relative inline-block text-right ${className}`} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#181818] hover:bg-[#222222] border border-[#333333] text-xs text-white transition-colors"
        title="تغيير لغة الواجهة / Changer la langue / Change Language"
      >
        <Globe size={14} className="text-[#FF0000]" />
        <span className="font-medium text-[11px]">{activeLabel}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-32 bg-[#141414] border border-[#2E2E2E] shadow-xl z-50 py-1 text-xs">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-xs transition-colors ${
                currentLang === lang.code
                  ? 'bg-[#1F1F1F] text-white font-bold'
                  : 'text-[#8E8E93] hover:text-white hover:bg-[#181818]'
              }`}
            >
              <span>{lang.label}</span>
              {currentLang === lang.code && <Check size={12} className="text-[#FF0000]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
