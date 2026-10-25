import React from 'react';

interface IronmanLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  className?: string;
  variant?: 'blue' | 'white' | 'dark';
}

export const IronmanLogo: React.FC<IronmanLogoProps> = ({
  size = 'md',
  showText = true,
  subtitle,
  className = '',
  variant = 'blue',
}) => {
  const sizeMap = {
    sm: { box: 'w-7 h-7', icon: 16, text: 'text-sm', sub: 'text-[9px]' },
    md: { box: 'w-9 h-9', icon: 20, text: 'text-base', sub: 'text-[11px]' },
    lg: { box: 'w-11 h-11', icon: 24, text: 'text-lg', sub: 'text-xs' },
    xl: { box: 'w-14 h-14', icon: 32, text: 'text-2xl', sub: 'text-xs' },
  };

  const { box, text: textSize, sub: subSize } = sizeMap[size];

  // Colors
  const bgClasses =
    variant === 'blue'
      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
      : variant === 'white'
      ? 'bg-white text-blue-600 shadow-md'
      : 'bg-slate-900 text-cyan-400 border border-slate-800 shadow-md';

  const textColor = variant === 'white' ? 'text-white' : 'text-slate-900';
  const subColor = variant === 'white' ? 'text-blue-200' : 'text-slate-400';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Iconic Ironman M-Dot Emblem Badge */}
      <div
        className={`${box} rounded-xl ${bgClasses} flex items-center justify-center shrink-0 transition-transform active:scale-95`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-3/5 h-3/5 fill-current"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top Dot / Head of the Athlete */}
          <circle cx="50" cy="24" r="13" />
          {/* The Muscular M-Dot Body */}
          <path d="M 16 88 L 16 48 L 34 48 L 50 66 L 66 48 L 84 48 L 84 88 L 70 88 L 70 66 L 50 84 L 30 66 L 30 88 Z" />
        </svg>
      </div>

      {showText && (
        <div className="leading-none">
          <span
            className={`font-black ${textSize} tracking-wider ${textColor} block uppercase select-none`}
            style={{ letterSpacing: '0.08em' }}
          >
            IRONMAN
          </span>
          {subtitle && (
            <span className={`${subSize} ${subColor} font-medium block mt-0.5 select-none`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
