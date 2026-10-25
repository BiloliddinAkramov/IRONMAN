import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTashkentTodayString, UZBEK_MONTHS } from '../../lib/dates';

interface CalendarWidgetProps {
  onSelectDate?: (dateStr: string) => void;
  selectedDate?: string;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  onSelectDate,
  selectedDate,
}) => {
  const todayStr = getTashkentTodayString();
  const [todayYear, todayMonth, todayDay] = todayStr.split('-').map(Number);

  const [currentYear, setCurrentYear] = useState(todayYear);
  const [currentMonth, setCurrentMonth] = useState(todayMonth); // 1-12

  const activeSelected = selectedDate || todayStr;

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Days in month
  const daysInMonth = new Date(Date.UTC(currentYear, currentMonth, 0)).getUTCDate();
  // First day of month (0=Sun, 1=Mon, ..., 6=Sat)
  const firstDayWeekday = new Date(Date.UTC(currentYear, currentMonth - 1, 1)).getUTCDay();
  // We want Monday as start (0=Mon ... 6=Sun)
  const startOffset = (firstDayWeekday + 6) % 7;

  const weekdays = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

  const monthNameUzbek =
    UZBEK_MONTHS[currentMonth - 1].charAt(0).toUpperCase() +
    UZBEK_MONTHS[currentMonth - 1].slice(1);

  return (
    <div className="bg-gradient-to-br from-blue-50/40 via-white to-slate-50/50 rounded-2xl border border-slate-200/90 border-l-[5px] border-l-purple-600 p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 border border-purple-200/70 flex items-center justify-center shadow-xs">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Kalendar</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Oldingi oy"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Keyingi oy"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Month Label */}
      <div className="text-center font-bold text-xs text-slate-800 mb-3">
        {monthNameUzbek} {currentYear}
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400 mb-2">
        {weekdays.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {/* Empty cells before month start */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="h-7 w-7" />
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const dayNum = i + 1;
          const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(
            dayNum
          ).padStart(2, '0')}`;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === activeSelected;

          return (
            <button
              key={dayNum}
              onClick={() => onSelectDate && onSelectDate(dateStr)}
              className={`h-7 w-7 mx-auto rounded-full flex items-center justify-center font-medium transition-all text-xs cursor-pointer ${
                isToday
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : isSelected
                  ? 'border border-blue-600 text-blue-600 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
};
