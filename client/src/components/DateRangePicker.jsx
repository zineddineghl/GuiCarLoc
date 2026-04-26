import React, { useState } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isBefore, isAfter,
  isSameDay, format, addMonths, subMonths
} from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const DAY_LABELS = {
  fr: ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
};

export default function DateRangePicker({ startDate, endDate, onChange, bookedRanges = [], lang = 'fr' }) {
  const locale = lang === 'fr' ? fr : enUS;
  const [viewDate, setViewDate] = useState(() => startDate ? new Date(startDate + 'T00:00:00') : new Date());
  const [hoverDate, setHoverDate] = useState(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startVal = startDate ? new Date(startDate + 'T00:00:00') : null;
  const endVal = endDate ? new Date(endDate + 'T00:00:00') : null;

  const calStart = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 });
  const calEnd = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const isBooked = (date) =>
    bookedRanges.some(range => {
      const s = new Date(range.start_date + 'T00:00:00');
      const e = new Date(range.end_date + 'T00:00:00');
      return !isBefore(date, s) && !isAfter(date, e);
    });

  const isPast = (date) => isBefore(date, today);
  const isDisabled = (date) => isPast(date) || isBooked(date);

  const isInRange = (date) => {
    if (!startVal) return false;
    const rangeEnd = endVal || hoverDate;
    if (!rangeEnd) return false;
    const [from, to] = isAfter(startVal, rangeEnd) ? [rangeEnd, startVal] : [startVal, rangeEnd];
    return isAfter(date, from) && isBefore(date, to);
  };

  const hasBookedInRange = (from, to) =>
    eachDayOfInterval({ start: from, end: to }).some(d => isBooked(d));

  const handleDayClick = (day) => {
    if (isDisabled(day)) return;

    if (!startVal || endVal) {
      onChange({ start_date: format(day, 'yyyy-MM-dd'), end_date: '' });
    } else {
      if (isBefore(day, startVal) || isSameDay(day, startVal)) {
        onChange({ start_date: format(day, 'yyyy-MM-dd'), end_date: '' });
      } else if (hasBookedInRange(startVal, day)) {
        onChange({ start_date: format(day, 'yyyy-MM-dd'), end_date: '' });
      } else {
        onChange({ start_date: startDate, end_date: format(day, 'yyyy-MM-dd') });
      }
    }
  };

  const isPrevDisabled = isSameMonth(viewDate, today);
  const monthLabel = format(viewDate, 'MMMM yyyy', { locale });
  const monthLabelCap = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  return (
    <div className="select-none w-full">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setViewDate(subMonths(viewDate, 1))}
          disabled={isPrevDisabled}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
        </button>
        <span className="text-sm font-semibold text-gray-800">{monthLabelCap}</span>
        <button
          type="button"
          onClick={() => setViewDate(addMonths(viewDate, 1))}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <ChevronRightIcon className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS[lang] && DAY_LABELS[lang].map(d => (
          <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map(day => {
          const otherMonth = !isSameMonth(day, viewDate);
          const booked = !otherMonth && isBooked(day);
          const past = !otherMonth && isPast(day);
          const start = !otherMonth && startVal && isSameDay(day, startVal);
          const end = !otherMonth && endVal && isSameDay(day, endVal);
          const inRange = !otherMonth && isInRange(day);
          const todayDay = !otherMonth && isSameDay(day, today);

          let cls = 'h-8 flex items-center justify-center text-xs transition-colors ';

          if (otherMonth) {
            cls += 'invisible ';
          } else if (booked) {
            cls += 'bg-gray-100 text-gray-300 line-through cursor-not-allowed rounded ';
          } else if (past) {
            cls += 'text-gray-300 cursor-not-allowed ';
          } else if (start || end) {
            cls += 'bg-primary-600 text-white font-bold rounded-full cursor-pointer ';
          } else if (inRange) {
            cls += 'bg-primary-100 text-primary-700 cursor-pointer ';
          } else {
            cls += `cursor-pointer rounded-full hover:bg-gray-100 ${todayDay ? 'font-bold text-primary-600' : 'text-gray-700'} `;
          }

          return (
            <div
              key={day.toISOString()}
              className={cls}
              onClick={() => !otherMonth && handleDayClick(day)}
              onMouseEnter={() => !otherMonth && !isDisabled(day) && setHoverDate(day)}
              onMouseLeave={() => setHoverDate(null)}
            >
              {otherMonth ? '' : format(day, 'd')}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-gray-100 rounded inline-block border border-gray-200"></span>
          {lang === 'fr' ? 'Indisponible' : 'Unavailable'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-primary-600 rounded-full inline-block"></span>
          {lang === 'fr' ? 'Sélectionné' : 'Selected'}
        </span>
      </div>
    </div>
  );
}
