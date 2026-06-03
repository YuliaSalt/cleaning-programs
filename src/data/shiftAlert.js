// התראת צבע לכפתורים כל עוד לא נחתם/מולא הדוח לתקופה. משנחתם – חוזר לצבע רגיל (null).
//
// משמרת (לפי שעה):
//   בוקר: צהוב 14:00, אדום 14:30 · ערב: צהוב 22:00, אדום 23:00 · לילה (23:00→07:00): צהוב 06:00, אדום 07:00.
// תדירות (לפי תאריך):
//   חודשי: צהוב מה-3 לחודש, אדום מה-5 לחודש · שבועי: ללא צבע (טרם הוגדר).

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
    // 23:00–06:00 בעיצומה (ללא התראה); 06:00 צהוב; 07:00 אדום; מ-23:00 מתאפס (לילה חדש)
    if (t >= M(23)) return null
    if (t >= M(7)) return 'red'
    if (t >= M(6)) return 'yellow'
    return null
  }
  return null
}

// התראת צבע לתדירות (חודשי/שבועי) לפי תאריך, כל עוד לא נחתם הדוח לתקופה.
export function freqAlertLevel(tabId, done, now = new Date()) {
  if (done) return null
  if (tabId === 'monthly') {
    const d = now.getDate()
    if (d >= 5) return 'red'
    if (d >= 3) return 'yellow'
    return null
  }
  if (tabId === 'weekly') {
    // רק ביום ראשון: צהוב מ-15:00, אדום מ-18:00
    if (now.getDay() !== 0) return null
    const t = now.getHours() * 60 + now.getMinutes()
    if (t >= M(18)) return 'red'
    if (t >= M(15)) return 'yellow'
    return null
  }
  return null
}
