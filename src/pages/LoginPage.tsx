import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { validateEmail, validatePassword } from '../lib/validation';
import {
  Eye,
  EyeOff,
  Flame,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Dumbbell,
  TrendingUp,
} from 'lucide-react';

import { IronmanLogo } from '../components/ui/IronmanLogo';

interface LoginPageProps {
  initialMode?: 'login' | 'register';
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialMode = 'login' }) => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'login' or 'register'
  const [mode, setMode] = useState<'login' | 'register'>(
    initialMode === 'register' || location.pathname === '/register' ? 'register' : 'login'
  );

  // Sync mode if location pathname changes
  useEffect(() => {
    if (location.pathname === '/register') {
      setMode('register');
    } else if (location.pathname === '/login') {
      setMode('login');
    }
  }, [location.pathname]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regInfo, setRegInfo] = useState<string | null>(null);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const emailVal = validateEmail(loginEmail);
    if (!emailVal.valid) {
      setLoginError(emailVal.error || 'Email noto‘g‘ri formatda');
      return;
    }

    const passVal = validatePassword(loginPassword);
    if (!passVal.valid) {
      setLoginError(passVal.error || 'Parol kamida 8 ta belgi bo‘lishi lozim');
      return;
    }

    setLoginLoading(true);
    const result = await signIn(loginEmail, loginPassword);
    setLoginLoading(false);

    if (result.error) {
      setLoginError(result.error);
    } else {
      navigate('/');
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegInfo(null);

    if (!regName.trim()) {
      setRegError('Ismingizni kiritishingiz shart');
      return;
    }

    const emailVal = validateEmail(regEmail);
    if (!emailVal.valid) {
      setRegError(emailVal.error || 'Email noto‘g‘ri formatda');
      return;
    }

    const passVal = validatePassword(regPassword);
    if (!passVal.valid) {
      setRegError(passVal.error || 'Parol kamida 8 ta belgidan iborat bo‘lishi lozim');
      return;
    }

    if (regPassword !== regPasswordConfirm) {
      setRegError('Parollar bir-biriga mos kelmadi');
      return;
    }

    setRegLoading(true);
    const result = await signUp(regEmail, regPassword, regName);
    setRegLoading(false);

    if (result.error) {
      setRegError(result.error);
    } else if (result.requiresEmailConfirmation) {
      setRegInfo('Tasdiqlash xati emailingizga yuborildi. Iltimos, pochtangizni tekshiring.');
    } else {
      navigate('/onboarding');
    }
  };

  const isRegister = mode === 'register';

  return (
    <div className="relative w-screen h-screen min-h-screen overflow-hidden bg-white text-slate-900 flex font-sans select-none">
      {/* Top Floating Brand Bar - Slides with white form pane */}
      <div
        className={`absolute top-6 z-40 pointer-events-auto transition-all duration-700 ease-in-out ${
          isRegister
            ? 'left-6 sm:left-12 lg:left-1/2 lg:translate-x-16 xl:lg:translate-x-24'
            : 'left-6 sm:left-12 lg:left-16 xl:left-24'
        }`}
      >
        <IronmanLogo size="md" />
      </div>

      {/* FULL SCREEN DUAL-PANE CONTAINER */}
      <div className="relative w-full h-full flex flex-col lg:flex-row">
        {/* ========================================================= */}
        {/* LEFT FORM PANE: TIZIMGA KIRISH (LOGIN) - WHITE THEME */}
        {/* ========================================================= */}
        <div
          className={`w-full lg:w-1/2 h-full flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 bg-white transition-all duration-700 ease-in-out ${
            isRegister ? 'lg:opacity-0 lg:pointer-events-none' : 'opacity-100 pointer-events-auto'
          } ${isRegister ? 'hidden lg:flex' : 'flex'}`}
        >
          <div className="max-w-md w-full mx-auto space-y-5 pt-16 lg:pt-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Tizimga kirish
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                Kundalik odatlar, fitness va shaxsiy intizom rejangizni davom ettiring.
              </p>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium animate-in fade-in">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  EMAIL MANZIL
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="foydalanuvchi@email.uz"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-all shadow-xs"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    PAROL
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                  >
                    Unutdingizmi?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Kamida 8 ta belgi"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-all shadow-xs"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    aria-label="Parolni ko‘rsatish"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Tizimga kirish va uning ostida Ro'yxatdan o'tish */}
              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loginLoading ? (
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <span>Tizimga kirish</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Divider yoki */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200" />
                  <span className="shrink mx-3 text-xs text-slate-400 font-medium">yoki</span>
                  <div className="flex-grow border-t border-slate-200" />
                </div>

                {/* Ro'yxatdan o'tish tugmasi */}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="w-full py-3 px-5 rounded-xl border border-blue-600 hover:bg-blue-50/70 text-blue-600 font-bold text-xs sm:text-sm transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <User className="w-4 h-4" />
                  <span>Ro‘yxatdan o‘tish</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT FORM PANE: RO‘YXATDAN O‘TISH (REGISTER) - WHITE THEME */}
        {/* ========================================================= */}
        <div
          className={`w-full lg:w-1/2 h-full flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 bg-white transition-all duration-700 ease-in-out ${
            !isRegister ? 'lg:opacity-0 lg:pointer-events-none' : 'opacity-100 pointer-events-auto'
          } ${!isRegister ? 'hidden lg:flex' : 'flex'}`}
        >
          <div className="max-w-md w-full mx-auto space-y-4 pt-16 lg:pt-8">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Ro‘yxatdan o‘tish
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                3 oylik shaxsiy intizom dasturiga bugunoq qo‘shiling.
              </p>
            </div>

            {regError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium animate-in fade-in">
                {regError}
              </div>
            )}

            {regInfo && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium animate-in fade-in">
                {regInfo}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  TO‘LIQ ISMINGIZ *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Biloliddin"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-all shadow-xs"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  EMAIL MANZIL *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="foydalanuvchi@email.uz"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-all shadow-xs"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  PAROL (KAMIDA 8 TA BELGI) *
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Kamida 8 ta belgi"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-all shadow-xs"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    aria-label="Parolni ko‘rsatish"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  PAROLNI TASDIQLASH *
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={regPasswordConfirm}
                    onChange={(e) => setRegPasswordConfirm(e.target.value)}
                    placeholder="Parolni qayta tering"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-all shadow-xs"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Ro'yxatdan o'tish tugmasi va uning ostida Tizimga kirish tugmasi */}
              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {regLoading ? (
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <span>Ro‘yxatdan o‘tish</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200" />
                  <span className="shrink mx-3 text-xs text-slate-400 font-medium">yoki</span>
                  <div className="flex-grow border-t border-slate-200" />
                </div>

                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full py-3 px-5 rounded-xl border border-blue-600 hover:bg-blue-50/70 text-blue-600 font-bold text-xs sm:text-sm transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <User className="w-4 h-4" />
                  <span>Tizimga kirish</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ========================================================= */}
        {/* FULL SCREEN SLIDING BLUE PANEL WITH CLEAN STRAIGHT BORDER */}
        {/* ========================================================= */}
        <div
          className={`hidden lg:block absolute top-0 bottom-0 w-1/2 h-full z-30 transition-transform duration-700 ease-in-out shadow-2xl border-slate-200/40 overflow-hidden ${
            isRegister ? 'translate-x-0 border-r' : 'translate-x-full border-l'
          }`}
        >
          {/* Main Blue Container */}
          <div className="relative w-full h-full bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 text-white p-10 xl:p-14 flex flex-col justify-between">
            {/* Sunrise Mountain Silhouette Image */}
            <img
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80"
              alt="Discipline Horizon"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-30 mix-blend-overlay filter contrast-125 brightness-110 pointer-events-none"
            />

            {/* Atmosphere gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-900/50 to-blue-700/30 pointer-events-none" />
            <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full bg-amber-500/15 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-cyan-400/20 blur-[140px] pointer-events-none" />

            {/* Top Badge: 90 KUNLIK SHAXSIY CHAQIRIQ */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs font-semibold text-white shadow-xs">
                <ShieldCheck className="w-4 h-4 text-cyan-300" />
                <span>90 KUNLIK SHAXSIY CHAQIRIQ</span>
              </div>
            </div>

            {/* Central Glassmorphic Card with David Goggins Quotes */}
            <div className="relative z-10 my-auto max-w-xl space-y-5 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md p-6 sm:p-8 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                    {isRegister
                      ? '“Sen kurashayotgan yagona raqib — bu kechagi o‘zingdir.”'
                      : '“To‘xtama. Charchaganingda emas, vazifani to‘liq yakunlaganingda to‘xta.”'}
                  </h3>
                  <span className="text-[11px] text-cyan-300 font-bold uppercase tracking-wider block">
                    — David Goggins
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-blue-100 font-normal leading-relaxed border-l-2 border-cyan-400 pl-3">
                {isRegister
                  ? '“If you want to be uncommon, you have to be willing to do the things other people don’t want to do.” Har bir kichik qadam katta maqsad sari olib boradi.'
                  : '“You have to build calluses on your brain just like you build calluses on your hands.” Intizom bugungi muvaffaqiyating kalitidir.'}
              </p>

              {/* 3 Pillars: SAT & English, Fitness, Fokus va intizom */}
              <div className="flex items-center justify-between pt-4 border-t border-white/15 text-xs text-blue-100 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                  <span>SAT & English</span>
                </div>
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-cyan-300" />
                  <span>Fitness</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-300" />
                  <span>Fokus va intizom</span>
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
};
