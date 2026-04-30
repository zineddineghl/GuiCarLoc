import React, { useState } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isBefore, isAfter,
  isSameDay, format, addMonths,
} from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const DAY_LABELS = {
  fr: ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
};

function MonthGrid({ viewDate, bookedRanges, lang }) {
  const locale = lang === 'fr' ? fr : enUS;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calStart = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 });
  const calEnd = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getStatus = (date) => {
    for (const range of bookedRanges) {
      const s = new Date(range.start_date + 'T00:00:00');
      const e = new Date(range.end_date + 'T00:00:00');
      if (!isBefore(date, s) && !isAfter(date, e)) {
        return range.type === 'blocked' ? 'blocked' : 'booked';
      }
    }
    return 'available';
  };

  const monthLabel = format(viewDate, 'MMMM yyyy', { locale });
  const monthLabelCap = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-700 text-center mb-3">{monthLabelCap}</p>

      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS[lang].map(d => (
          <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map(day => {
          const otherMonth = !isSameMonth(day, viewDate);
          const past = isBefore(day, today);
          const status = (!otherMonth && !past) ? getStatus(day) : null;
          const todayDay = !otherMonth && isSameDay(day, today);

          let cls = 'h-7 flex items-center justify-center text-xs rounded ';

          if (otherMonth) {
            cls += 'invisible ';
          } else if (past) {
            cls += 'text-gray-300 ';
          } else if (status === 'booked') {
            cls += 'bg-red-100 text-red-400 line-through ';
          } else if (status === 'blocked') {
            cls += 'bg-orange-100 text-orange-400 line-through ';
          } else {
            cls += `bg-green-50 text-green-700 font-medium ${todayDay ? 'ring-1 ring-primary-400' : ''} `;
          }

          return (
            <div key={day.toISOString()} className={cls}>
              {otherMonth ? '' : format(day, 'd')}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AvailabilityCalendar({ bookedRanges = [], lang = 'fr' }) {
  const [startMonth, setStartMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const nextMonth = addMonths(startMonth, 1);
  const today = new Date();
  today.setDate(1);
  today.setHours(0, 0, 0, 0);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">
          {lang === 'fr' ? 'Disponibilité' : 'Availability'}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setStartMonth(m => addMonths(m, -1))}
            disabled={isSameDay(startMonth, today) || isBefore(startMonth, today)}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={() => setStartMonth(m => addMonths(m, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRightIcon className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto">
        <MonthGrid viewDate={startMonth} bookedRanges={bookedRanges} lang={lang} />
        <div className="w-px bg-gray-100 flex-shrink-0 hidden sm:block" />
        <MonthGrid viewDate={nextMonth} bookedRanges={bookedRanges} lang={lang} />
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-green-50 border border-green-200 rounded inline-block"></span>
          {lang === 'fr' ? 'Disponible' : 'Available'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-red-100 rounded inline-block"></span>
          {lang === 'fr' ? 'Réservé' : 'Booked'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-orange-100 rounded inline-block"></span>
          {lang === 'fr' ? 'Bloqué' : 'Blocked'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-gray-100 rounded inline-block"></span>
          {lang === 'fr' ? 'Passé' : 'Past'}
        </span>
      </div>
    </div>
  );
}
