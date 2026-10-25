import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { validateEmail } from '../lib/validation';
import { ArrowLeft, CheckCircle2, Mail, Lock } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPasswordEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const val = validateEmail(email);
    if (!val.valid) {
      setError(val.error || 'Email noto‘g‘ri formatda');
      return;
    }

    setLoading(true);
    const res = await resetPasswordEmail(email);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden font-sans select-none">
      {/* Background with David Goggins / Discipline theme */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=2000&q=80"
          alt="Discipline runner"
          className="w-full h-full object-cover object-center opacity-25 mix-blend-luminosity scale-105 filter brightness-75 contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/90" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-600/15 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/15 backdrop-blur-2xl bg-slate-900/70 p-7 sm:p-9 shadow-2xl space-y-6">
        <div>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-4 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kirish sahifasiga qaytish</span>
          </Link>

          <h2 className="text-2xl font-black tracking-tight text-white">
            Parolni qayta tiklash
          </h2>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            Email manzilingizni kiriting, biz hisobingizni tiklash havolasini yuboramiz.
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-3 py-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">
              Havola yuborildi
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white">{email}</strong> manziliga parolni tiklash bo‘yicha ko‘rsatma yuborildi. Iltimos, pochtangizni tekshiring.
            </p>
            <Link to="/login" className="inline-block mt-4">
              <button className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer">
                Kirish sahifasiga o‘tish
              </button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email manzil
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="foydalanuvchi@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 focus:bg-white/10 focus:ring-1 focus:ring-blue-500 outline-none text-xs sm:text-sm text-white placeholder-slate-500 transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <span>Tiklash havolasini yuborish</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
