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
      {/* Titre du mois - Passé en blanc pour la visibilité */}
      <p className="text-sm font-bold text-white text-center mb-6 uppercase tracking-widest">
        {monthLabelCap}
      </p>

      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS[lang].map(d => (
          <div key={d} className="text-center text-[10px] text-gray-500 font-black uppercase tracking-tighter py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const otherMonth = !isSameMonth(day, viewDate);
          const past = isBefore(day, today);
          const status = (!otherMonth && !past) ? getStatus(day) : null;
          const isToday = !otherMonth && isSameDay(day, today);

          if (otherMonth) return <div key={day.toISOString()} className="h-9" />;

          let cls = 'h-9 flex flex-col items-center justify-center text-xs rounded-lg transition-all relative border ';

          if (past) {
            cls += 'text-gray-700 border-transparent ';
          } else if (status === 'booked') {
            cls += 'bg-gnRed/10 text-gnRed border-gnRed/20 line-through ';
          } else if (status === 'blocked') {
            cls += 'bg-orange-400/10 text-orange-400 border-orange-400/20 line-through ';
          } else {
            // État Disponible
            cls += `text-white border-white/5 hover:border-gnYellow/50 hover:bg-white/5 ${isToday ? 'ring-1 ring-gnYellow/50 border-gnYellow/50' : ''} `;
          }

          return (
            <div key={day.toISOString()} className={cls}>
              <span className="z-10">{format(day, 'd')}</span>
              {/* Petit point indicateur pour le style */}
              {!past && !otherMonth && (
                <div className={`w-1 h-1 rounded-full mt-0.5 ${
                  status === 'booked' ? 'bg-gnRed' : 
                  status === 'blocked' ? 'bg-orange-400' : 'bg-gnGreen'
                }`} />
              )}
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
    <div className="card p-6 border border-white/5 bg-luxuryDark/20 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-gnYellow font-bold text-xs uppercase tracking-[0.2em]">
          {lang === 'fr' ? 'Disponibilité' : 'Availability'}
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStartMonth(m => addMonths(m, -1))}
            disabled={isSameDay(startMonth, today) || isBefore(startMonth, today)}
            className="p-2 rounded-full hover:bg-white/10 disabled:opacity-10 transition-colors text-white"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setStartMonth(m => addMonths(m, 1))}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 overflow-x-auto pb-2">
        <MonthGrid viewDate={startMonth} bookedRanges={bookedRanges} lang={lang} />
        <div className="hidden md:block w-px bg-white/5 self-stretch" />
        <MonthGrid viewDate={nextMonth} bookedRanges={bookedRanges} lang={lang} />
      </div>

      {/* Légende stylisée */}
      <div className="flex items-center gap-6 mt-8 pt-6 border-t border-white/5 flex-wrap justify-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gnGreen"></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{lang === 'fr' ? 'Libre' : 'Free'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gnRed"></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{lang === 'fr' ? 'Occupé' : 'Booked'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-400"></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{lang === 'fr' ? 'Bloqué' : 'Blocked'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-800"></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{lang === 'fr' ? 'Passé' : 'Past'}</span>
        </div>
      </div>
    </div>
  );
}