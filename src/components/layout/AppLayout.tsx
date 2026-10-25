import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  BookOpen,
  Dumbbell,
  Moon,
  BarChart3,
  Music2,
  Settings,
  LogOut,
  Play,
  Pause,
  SkipForward,
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { useChallenge } from '../../features/challenges/ChallengeContext';
import { useAudio } from '../../features/audio/AudioContext';
import { useTimer } from '../../features/timer/TimerContext';

import { IronmanLogo } from '../ui/IronmanLogo';
import { PWAInstallButton } from '../ui/PWAInstallButton';
import { OfflineIndicator } from '../ui/OfflineIndicator';

export const AppLayout: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const { dayInfo } = useChallenge();
  const { playerState, play, pause, next } = useAudio();
  const { isActive: isTimerActive, isPaused: isTimerPaused, elapsedSeconds } = useTimer();
  const location = useLocation();

  const primaryNavItems = [
    { to: '/', label: 'Bosh sahifa', icon: LayoutDashboard },
    { to: '/timer', label: 'Fokus Taymer', icon: Clock },
    { to: '/study', label: 'SAT va English', icon: BookOpen },
    { to: '/fitness', label: 'Fitness', icon: Dumbbell },
    { to: '/sleep', label: 'Uyqu', icon: Moon },
    { to: '/analytics', label: 'Analitika', icon: BarChart3 },
  ];

  const secondaryNavItems = [
    { to: '/music', label: 'Musiqa', icon: Music2 },
    { to: '/settings', label: 'Sozlamalar', icon: Settings },
  ];

  const formatTimerShort = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans antialiased">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-slate-200 bg-white shrink-0 sticky top-0 h-screen select-none">
        {/* Brand */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
          <IronmanLogo size="md" subtitle="Intizom • Maqsad • Natija" />
        </div>

        {/* Live Active Timer Alert Chip in Sidebar */}
        {isTimerActive && location.pathname !== '/timer' && (
          <div className="px-3 pt-3">
            <NavLink
              to="/timer"
              className="flex items-center justify-between p-2.5 rounded-xl bg-blue-600 text-white shadow-xs hover:bg-blue-700 transition-colors animate-pulse"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold">Fokus faol:</span>
              </div>
              <span className="font-mono font-bold text-xs tabular-nums">
                {formatTimerShort(elapsedSeconds)}
              </span>
            </NavLink>
          </div>
        )}

        {/* Primary Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div className="space-y-1">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-50/80 text-blue-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.to === '/timer' && isTimerActive && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </NavLink>
              );
            })}
          </div>

          <div className="space-y-1">
            <span className="px-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              QO‘SHIMCHA
            </span>
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-50/80 text-blue-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* PWA Install Button in Desktop Sidebar */}
        <div className="px-3 pb-2">
          <PWAInstallButton />
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="p-3 border-t border-slate-100 bg-white">
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 uppercase">
                {profile?.display_name?.charAt(0) || 'B'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {profile?.display_name || 'Biloliddin'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {user?.email || 'Akramov@gmail.com'}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              title="Chiqish"
              aria-label="Tizimdan chiqish"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-white border-b border-slate-200">
        <IronmanLogo size="sm" />

        <div className="flex items-center gap-2">
          <PWAInstallButton compact />
          {isTimerActive && location.pathname !== '/timer' && (
            <NavLink
              to="/timer"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-mono font-bold animate-pulse"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimerShort(elapsedSeconds)}</span>
            </NavLink>
          )}

          {dayInfo && !dayInfo.isUpcoming && (
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 tabular-nums">
              {dayInfo.dayNumber}-kun
            </span>
          )}
          <NavLink
            to="/music"
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-md"
            title="Musiqa"
          >
            <Music2 className="w-4 h-4" />
          </NavLink>
          <NavLink
            to="/settings"
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-md"
            title="Sozlamalar"
          >
            <Settings className="w-4 h-4" />
          </NavLink>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="flex-1 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 pb-28 md:pb-12">
          <Outlet />
        </div>

        {/* Global Floating Mini Audio Player when active */}
        {playerState.currentTrack && location.pathname !== '/music' && (
          <div className="fixed bottom-16 md:bottom-4 left-4 right-4 md:left-72 md:right-8 z-40 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 p-3 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center shrink-0">
                <Music2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {playerState.currentTrack.title}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  Musiqa Pleyleri
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => (playerState.isPlaying ? pause() : play())}
                className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
                aria-label={playerState.isPlaying ? 'Pauza' : 'Ijro'}
              >
                {playerState.isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>
              <button
                onClick={() => next()}
                className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Keyingi trek"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)] select-none shadow-sm">
        <div className="flex items-center justify-around h-14 px-1">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-colors ${
                    isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="truncate max-w-[64px] text-center">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Global Offline Status Indicator */}
      <OfflineIndicator />
    </div>
  );
};
