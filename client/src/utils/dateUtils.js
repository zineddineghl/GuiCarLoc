export const diffInDays = (dateStart, dateEnd) => {
  if (!dateStart || !dateEnd) return 0;
  const start = new Date(dateStart);
  const end = new Date(dateEnd);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffInMs = end.getTime() - start.getTime();
  const days = Math.round(diffInMs / (24 * 60 * 60 * 1000));
  return days <= 0 ? 1 : days;
};

export const containsWeekend = (dateStart, dateEnd) => {
  if (!dateStart || !dateEnd) return false;
  let start = new Date(dateStart);
  let end = new Date(dateEnd);
  while (start <= end) {
    let day = start.getDay();
    if (day === 0 || day === 6) return true; // 0 = Dimanche, 6 = Samedi
    start.setDate(start.getDate() + 1);
  }
  return false;
};