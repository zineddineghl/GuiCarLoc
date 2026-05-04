export const calculateRentalPrice = (car, startDate, endDate) => {
  if (!startDate || !endDate) return { error: 'Dates manquantes' };

  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - start.getTime();
  const totalDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) || 1; // Au moins 1 jour

  if (totalDays <= 0) return { error: 'Dates invalides' };

  // 1. Comptage exact des jours (Semaine vs Week-end)
  let weekDays = 0;
  let weekendDays = 0;
  let currentDate = new Date(start);

  for (let i = 0; i < totalDays; i++) {
    const dayOfWeek = currentDate.getDay(); // 0 = Dimanche, 6 = Samedi
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendDays++;
    } else {
      weekDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // 2. Calcul du sous-total
  const standardPrice = Number(car.price_per_day);
  const wEPrice = car.weekend_price ? Number(car.weekend_price) : standardPrice;

  const totalWeek = weekDays * standardPrice;
  const totalWeekend = weekendDays * wEPrice;
  const subtotal = totalWeek + totalWeekend;

  // 3. Application de la réduction dynamique (JSONB)
  let percentage = 0;
  if (car.discounts) {
    const discArray = typeof car.discounts === 'string' ? JSON.parse(car.discounts) : car.discounts;
    if (Array.isArray(discArray) && discArray.length > 0) {
      const sorted = [...discArray].sort((a, b) => b.days - a.days);
      const rule = sorted.find(r => totalDays >= r.days);
      if (rule) percentage = parseFloat(rule.percentage);
    }
  }

  const discountAmount = (subtotal * percentage) / 100;
  const finalTotal = subtotal - discountAmount;

  return {
    totalDays,
    weekDays,
    weekendDays,
    standardPrice,
    wEPrice,
    totalWeek,
    totalWeekend,
    subtotal,
    discountAmount,
    percentage,
    total: finalTotal
  };
};