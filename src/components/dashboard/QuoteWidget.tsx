import React from 'react';
import { Quote } from 'lucide-react';

export const QuoteWidget: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-amber-50/80 via-orange-50/30 to-white rounded-2xl border border-amber-200/80 border-l-[5px] border-l-amber-500 p-5 shadow-xs relative overflow-hidden">
      <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-amber-200/20 blur-xs pointer-events-none" />
      <div className="flex items-start gap-3 relative z-10">
        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Quote className="w-4 h-4 fill-white" />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs text-slate-800 font-semibold leading-relaxed">
            “Katta muvaffaqiyatlar kichik, ammo muntazam qadamlardan boshlanadi.”
          </p>
          <span className="text-[11px] text-amber-700/80 block font-medium">
            — Noma’lum
          </span>
        </div>
      </div>
    </div>
  );
};
