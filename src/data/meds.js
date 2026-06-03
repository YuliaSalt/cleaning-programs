// בקרת תרופות חודשית – רשימת תרופות לכל מחלקה + שמירה/קריאה של דוחות (מקומי).
// הרשימות כרגע דמה עד לקבלת הרשימות האמיתיות. להוספת מחלקה: הוסיפו מפתח unitId.

import { storage } from './storage.js'

// רשימת דמה (תוחלף ברשימה האמיתית). אותה רשימה משמשת כברירת מחדל לכל מחלקה.
const PLACEHOLDER = [
  'תרופה לדוגמה 1',
  'תרופה לדוגמה 2',
  'תרופה לדוגמה 3',
  'תרופה לדוגמה 4',
  'תרופה לדוגמה 5',
]

export const MED_LISTS = {
  gastro: PLACEHOLDER,
}

export function getMedList(unitId) {
  return MED_LISTS[unitId] || PLACEHOLDER
}

// סטטוסים: ok=תקין(✓ ירוק) · missing=חסר(− צהוב) · expired=לא בתוקף(✗ אדום)
export function emptyMedState(list) {
  return list.map(() => ({ status: 'ok', expiry: '', order: false }))
}

const PREFIX = 'hmc:meds:'

export function saveMedReport(unitId, month, items, by) {
  const rec = { unitId, month, items, by: by || '', savedAt: new Date().toISOString() }
  const key = `${PREFIX}${unitId}:${month}:${Date.now()}`
  storage.setJSON(key, rec)
  return key
}

export function listMedReports(unitId) {
  const pre = PREFIX + unitId + ':'
  const out = []
  for (const k of storage.keys()) {
    if (!k.startsWith(pre)) continue
    const r = storage.getJSON(k)
    if (!r || !r.savedAt) continue
    const d = new Date(r.savedAt)
    out.push({
      key: k,
      record: r,
      savedAt: r.savedAt,
      sortTs: d.getTime(),
      year: d.getFullYear(),
      month: d.getMonth(),
      dateISO: d.toLocaleDateString('en-CA'),
      dateLabel: d.toLocaleDateString('he-IL'),
      timeLabel: d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    })
  }
  out.sort((a, b) => b.sortTs - a.sortTs)
  return out
}
