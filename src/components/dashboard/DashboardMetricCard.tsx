import React from 'react';
import { ChevronRight } from 'lucide-react';

interface DashboardMetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor?: string;
  iconTextColor?: string;
  cardBgClass?: string;
  borderClass?: string;
  labelColorClass?: string;
  valueColorClass?: string;
  subValueColorClass?: string;
  waveColor?: string;
  onClick?: () => void;
}

export const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  label,
  value,
  subValue,
  icon: Icon,
  iconBgColor = 'bg-blue-600',
  iconTextColor = 'text-white',
  cardBgClass = 'bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-white',
  borderClass = 'border-blue-200/90 hover:border-blue-400',
  labelColorClass = 'text-blue-900',
  valueColorClass = 'text-blue-950',
  subValueColorClass = 'text-blue-700/80',
  waveColor = '#60A5FA',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl border ${borderClass} ${cardBgClass} p-5 shadow-xs transition-all hover:shadow-md overflow-hidden flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      {/* Decorative gradient glow orb in bottom-right */}
      <div
        className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full pointer-events-none opacity-35 blur-md transition-transform group-hover:scale-125"
        style={{ backgroundColor: waveColor }}
      />

      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${iconBgColor} ${iconTextColor}`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <span className={`text-[11px] font-bold uppercase tracking-wider ${labelColorClass}`}>
            {label}
          </span>
        </div>

        <div className="w-6 h-6 rounded-full bg-white/80 border border-slate-200/60 shadow-xs flex items-center justify-center text-slate-400 group-hover:text-slate-700 transition-colors">
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Value & Subtext Row */}
      <div className="flex items-baseline gap-2 z-10 mt-1">
        <span className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight ${valueColorClass}`}>
          {value}
        </span>
        {subValue && (
          <span className={`text-xs font-semibold truncate ${subValueColorClass}`}>
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
};
