/**
 * Whole years completed since a date.
 *
 * Call at module scope, not during render: reading the clock while rendering
 * is impure and would cost the page its static prerender. The number then
 * advances on the first deploy after an anniversary rather than on the day.
 */
export function yearsSince(iso: string, now: Date = new Date()): number {
  // Compared as string parts: `new Date("2022-06-01")` is UTC midnight, and
  // reading it with local getters fired the anniversary a day early west of UTC.
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return 0;

  const beforeAnniversary =
    now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day);

  return Math.max(0, now.getFullYear() - year - (beforeAnniversary ? 1 : 0));
}
