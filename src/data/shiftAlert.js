// התראת צבע לכפתורי משמרת לפי שעה, כל עוד לא נחתם/מולא דוח למשמרת.
// בוקר: צהוב 14:00, אדום 14:30 · ערב: צהוב 22:00, אדום 23:00 · לילה: צהוב 06:00, אדום 07:00.
// משנחתם הדוח – חוזר לצבע רגיל (null). לילה: מ-22:00 לא מתריעים (משמרת לילה חדשה מתחילה).

const M = (h, m = 0) => h * 60 + m

export function shiftAlertLevel(shift, done, now = new Date()) {
  if (done) return null // נחתם/מולא – צבע רגיל
  const t = now.getHours() * 60 + now.getMinutes()
  if (shift === 'בוקר') {
    if (t >= M(14, 30)) return 'red'
    if (t >= M(14)) return 'yellow'
    return null
  }
  if (shift === 'ערב') {
    if (t >= M(23)) return 'red'
    if (t >= M(22)) return 'yellow'
    return null
  }
  if (shift === 'לילה') {
    // משמרת לילה 23:00→07:00: בעיצומה (23:00–06:00) ללא התראה; 06:00 צהוב, 07:00 אדום;
    // נשאר אדום עד שמתחילה משמרת לילה חדשה ב-23:00.
    if (t >= M(23)) return null
    if (t >= M(7)) return 'red'
    if (t >= M(6)) return 'yellow'
    return null
  }
  return null
}
