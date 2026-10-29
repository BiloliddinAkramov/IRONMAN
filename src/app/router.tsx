import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { useChallenge } from '../features/challenges/ChallengeContext';
import { AppLayout } from '../components/layout/AppLayout';

import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TimerPage } from '../pages/TimerPage';
import { StudyPage } from '../pages/StudyPage';
import { FitnessPage } from '../pages/FitnessPage';
import { SleepPage } from '../pages/SleepPage';
import { MusicPage } from '../pages/MusicPage';
import { ExpensesPage } from '../pages/ExpensesPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { MobileCompanionPage } from '../pages/MobileCompanionPage';

import { IronmanLogo } from '../components/ui/IronmanLogo';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { activeChallenge, loading: challengeLoading } = useChallenge();
  const location = useLocation();

  if (authLoading || challengeLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <IronmanLogo size="lg" showText={false} className="animate-pulse" />
          <span className="text-xs text-slate-500 font-medium">IRONMAN yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If user is authenticated but has no active challenge and not on onboarding
  if (!activeChallenge && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // If user already has an active challenge and tries to visit onboarding
  if (activeChallenge && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Mobile Companion Route (Accessed by 6-digit PIN code) */}
      <Route path="/mobile" element={<MobileCompanionPage />} />

      {/* Onboarding */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Protected App Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="timer" element={<TimerPage />} />
        <Route path="study" element={<StudyPage />} />
        <Route path="fitness" element={<FitnessPage />} />
        <Route path="sleep" element={<SleepPage />} />
        <Route path="music" element={<MusicPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="finances" element={<ExpensesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
