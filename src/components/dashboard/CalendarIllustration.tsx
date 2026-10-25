import React from 'react';

export const CalendarIllustration: React.FC = () => {
  return (
    <div className="relative w-28 h-28 flex items-center justify-center shrink-0 select-none">
      <svg
        className="w-full h-full"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft Background Leaf Sprays */}
        <g opacity="0.45">
          {/* Left leaves */}
          <path
            d="M20 70 C10 65, 8 50, 18 42 C24 52, 28 62, 20 70 Z"
            fill="#93C5FD"
          />
          <path
            d="M15 85 C6 82, 2 70, 12 62 C18 70, 20 78, 15 85 Z"
            fill="#BFDBFE"
          />
          <path
            d="M30 95 C20 95, 14 85, 22 78 C28 85, 32 90, 30 95 Z"
            fill="#93C5FD"
          />
          {/* Right subtle leaf */}
          <path
            d="M95 60 C105 55, 110 40, 98 35 C92 45, 90 52, 95 60 Z"
            fill="#BFDBFE"
          />
        </g>

        {/* Calendar Body */}
        <rect
          x="32"
          y="30"
          width="56"
          height="62"
          rx="12"
          fill="#FFFFFF"
          stroke="#2563EB"
          strokeWidth="3.5"
        />

        {/* Calendar Left Edge Accent in Purple */}
        <path
          d="M32 42 C32 35.4 36.4 30 42 30 H43 V92 H42 C36.4 92 32 86.6 32 80 Z"
          fill="#8B5CF6"
        />

        {/* Calendar Spiral Rings / Pegs */}
        <rect x="42" y="24" width="4" height="10" rx="2" fill="#2563EB" />
        <rect x="58" y="24" width="4" height="10" rx="2" fill="#2563EB" />
        <rect x="74" y="24" width="4" height="10" rx="2" fill="#2563EB" />

        {/* Calendar Grid Dots */}
        <circle cx="44" cy="50" r="2.5" fill="#2563EB" />
        <circle cx="60" cy="50" r="2.5" fill="#2563EB" />
        <circle cx="76" cy="50" r="2.5" fill="#2563EB" />

        <circle cx="44" cy="64" r="2.5" fill="#2563EB" />
        <circle cx="60" cy="64" r="2.5" fill="#2563EB" />
        <circle cx="76" cy="64" r="2.5" fill="#2563EB" />

        <circle cx="44" cy="78" r="2.5" fill="#2563EB" />
        <circle cx="60" cy="78" r="2.5" fill="#2563EB" />

        {/* Small Clock attached at bottom right */}
        <circle
          cx="82"
          cy="84"
          r="14"
          fill="#2563EB"
          stroke="#FFFFFF"
          strokeWidth="2.5"
        />
        {/* Clock hands */}
        <path
          d="M82 76 V84 H88"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
