import React from 'react';
import { Target } from 'lucide-react';

interface GoalsProgressWidgetProps {
  satPercent?: number;
  englishPercent?: number;
  fitnessPercent?: number;
  sleepPercent?: number;
}

export const GoalsProgressWidget: React.FC<GoalsProgressWidgetProps> = ({
  satPercent = 0,
  englishPercent = 0,
  fitnessPercent = 0,
  sleepPercent = 0,
}) => {
  const items = [
    {
      label: 'SAT',
      percent: Math.min(100, Math.max(0, satPercent)),
      strokeColor: '#2563EB',
      trackColor: '#EFF6FF',
      textColor: 'text-blue-700',
    },
    {
      label: 'English',
      percent: Math.min(100, Math.max(0, englishPercent)),
      strokeColor: '#059669',
      trackColor: '#ECFDF5',
      textColor: 'text-emerald-700',
    },
    {
      label: 'Fitness',
      percent: Math.min(100, Math.max(0, fitnessPercent)),
      strokeColor: '#D97706',
      trackColor: '#FFFBEB',
      textColor: 'text-amber-700',
    },
    {
      label: 'Uyqu',
      percent: Math.min(100, Math.max(0, sleepPercent)),
      strokeColor: '#9333EA',
      trackColor: '#FAF5FF',
      textColor: 'text-purple-700',
    },
  ];

  const size = 52;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 border-l-[5px] border-l-emerald-600 p-5 shadow-xs space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <Target className="w-4 h-4" />
        </div>
        <h3 className="text-xs font-bold text-slate-900">
          Maqsadlar uchun progress
        </h3>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        {items.map((item) => {
          const offset = circumference - (item.percent / 100) * circumference;

          return (
            <div key={item.label} className="flex flex-col items-center">
              <div className="relative w-13 h-13 flex items-center justify-center mb-1.5">
                <svg className="w-13 h-13 -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={item.trackColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={item.strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <span className={`absolute text-[11px] font-bold font-mono ${item.textColor}`}>
                  {item.percent}%
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-600">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
