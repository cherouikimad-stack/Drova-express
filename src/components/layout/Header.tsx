import React, { useState, useEffect } from 'react';
import {
  Plus,
  Download,
  ShieldCheck,
  Bell,
  LogOut,
  User,
  CheckCheck,
  AlertCircle,
  Info,
  Calendar,
  CheckCircle2,
  X
} from 'lucide-react';
import { NavView } from './Sidebar';
import { LanguageSelector } from './LanguageSelector';
import { storage } from '../../services/storage';
import { i18n } from '../../services/i18n';
import { NotificationItem, UserRole } from '../../types';

interface HeaderProps {
  currentView: NavView;
  title: string;
  subtitle?: string;
  onNavigate: (view: NavView, params?: Record<string, any>) => void;
  onQuickExport?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onNavigate,
  onQuickExport,
  onLogout,
}) => {
  const [session, setSession] = useState(() => storage.getUserSession());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    storage.getNotifications(session.role, session.user_id)
  );
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const unsub = storage.subscribe(() => {
      const freshSession = storage.getUserSession();
      setSession(freshSession);
      setNotifications(storage.getNotifications(freshSession.role, freshSession.user_id));
    });
    return unsub;
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    storage.markAllNotificationsRead();
    setNotifications(storage.getNotifications(session.role, session.user_id));
  };

  const handleNotificationClick = (item: NotificationItem) => {
    storage.markNotificationRead(item.id);
    if (item.link_view) {
      onNavigate(item.link_view as NavView);
    }
    setShowNotifications(false);
  };

  const handleLogoutClick = () => {
    storage.logout();
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className="h-16 bg-[#0C0C0C] border-b border-[#262626] px-5 flex items-center justify-between gap-4 shrink-0 z-20">
      {/* Breadcrumb & Section Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span>{title}</span>
            <span className="text-xs text-[#545458] font-normal">|</span>
            <span className="text-xs text-[#8E8E93] font-normal flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-400" />
              <span>{i18n.t('app.quality_badge') || 'معتمد - DROVA Express'}</span>
            </span>
          </h1>
          {subtitle && (
            <p className="text-xs text-[#8E8E93] truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Action Zone, Notifications, User Badge & Logout */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Language Selector */}
        <LanguageSelector />

        {/* Quick Export (for management / admin) */}
        {onQuickExport && session.role !== 'commercial' && (
          <button
            onClick={onQuickExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#EDEDED] bg-[#1C1C1C] hover:bg-[#262626] border border-[#333333] transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download size={14} className="text-[#8E8E93]" />
            <span>{i18n.t('app.quick_export') || 'تصدير سريع'}</span>
          </button>
        )}

        {/* New Campaign Button (only for admin / marketing) */}
        {(session.role === 'super_admin' || session.role === 'admin_marketing') && (
          <button
            onClick={() => onNavigate('campaigns_new')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#FF0000] hover:bg-[#E00000] shadow-sm shadow-red-950/40 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus size={14} />
            <span>{i18n.t('app.new_campaign') || 'حملة استكشاف'}</span>
          </button>
        )}

        {/* Notifications Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-[#8E8E93] hover:text-white bg-[#141414] hover:bg-[#1E1E1E] border border-[#262626] transition-colors cursor-pointer"
            title="الإشعارات والتنبيهات"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#FF0000] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '+9' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#141414] border border-[#333333] shadow-2xl z-50 text-xs">
              <div className="p-3 border-b border-[#262626] flex items-center justify-between bg-[#101010]">
                <div className="flex items-center gap-2">
                  <Bell size={15} className="text-[#FF0000]" />
                  <span className="font-bold text-white text-xs">الإشعارات والتنبيهات المباشرة</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-red-950 text-red-400 px-1.5 py-0.2 font-mono">
                      {unreadCount} غير مقروء
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-[#8E8E93] hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck size={13} />
                      <span>قراءة الكل</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-[#8E8E93] hover:text-white cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[#222222]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-[#71717A] text-xs">
                    لا توجد تنبيهات جديدة في الوقت الحالي
                  </div>
                ) : (
                  notifications.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`p-3 transition-colors cursor-pointer flex items-start gap-2.5 ${
                        item.read ? 'bg-[#141414] hover:bg-[#1A1A1A] opacity-75' : 'bg-[#1C1515] hover:bg-[#241A1A]'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {item.type === 'warning' ? (
                          <AlertCircle size={15} className="text-amber-400" />
                        ) : item.type === 'error' ? (
                          <AlertCircle size={15} className="text-[#FF0000]" />
                        ) : (
                          <Info size={15} className="text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-white text-[12px] truncate">{item.title}</h4>
                          <span className="text-[9px] text-[#71717A] shrink-0 font-mono">
                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#A1A1AA] mt-0.5 line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                      {!item.read && (
                        <div className="w-2 h-2 rounded-full bg-[#FF0000] shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Session Badge & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#262626]">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-white leading-none truncate max-w-[120px]">
              {session.name}
            </div>
            <div className="text-[10px] text-[#FF0000] font-mono leading-none mt-1">
              {session.role}
            </div>
          </div>

          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#141414] hover:bg-rose-950/60 border border-[#2E2E2E] hover:border-rose-800 text-[#8E8E93] hover:text-rose-300 text-xs transition-colors cursor-pointer"
            title="تسجيل الخروج الآمن"
          >
            <LogOut size={14} />
            <span className="hidden md:inline">خروج</span>
          </button>
        </div>
      </div>
    </header>
  );
};
