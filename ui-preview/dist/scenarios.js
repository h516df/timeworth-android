/* Compare a proposed change with the user's current situation, without saving it. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TimeWorthScenarios = api;
})(typeof window === 'undefined' ? null : window, () => {
  const number = (value, min, max) => {
    if (typeof value !== 'string' || !/^-?\d{1,8}(?:\.\d{1,2})?$/.test(value.trim())) return null;
    const n = Number(value);
    return Number.isFinite(n) && n >= min && n <= max ? n : null;
  };
  function compare(input, hourlyRate) {
    const income = number(input.income, -9999999, 9999999);
    const monthlyCost = number(input.cost, -9999999, 9999999);
    const hoursSaved = number(input.hours, -744, 744);
    const upfront = number(input.upfront, 0, 9999999);
    const cashDelta = income !== null && monthlyCost !== null ? Math.round((income - monthlyCost) * 100) / 100 : null;
    const timeValue = hoursSaved !== null && Number.isFinite(hourlyRate) && hourlyRate > 0
      ? Math.round(hoursSaved * hourlyRate * 100) / 100 : null;
    const combined = cashDelta !== null && timeValue !== null ? Math.round((cashDelta + timeValue) * 100) / 100 : null;
    const payback = upfront !== null && upfront > 0 && combined !== null && combined > 0
      ? Math.ceil(upfront / combined) : null;
    return { income, monthlyCost, hoursSaved, upfront, cashDelta, timeValue, combined, payback };
  }
  return { compare };
});
