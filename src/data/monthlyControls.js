// בקרות חודשיות לניהול תור: לכל מחלקה ולכל חודש שתי רובריקות בלבד —
// "בקרת תרופות" ו"בקרת עגלת החייאה" — כל אחת עם שם אחות + מלל חופשי.
// מטרה: ניהול תור מי מבצע. נשמר מקומית ומסונכרן לענן (מפתח אחד למחלקה).

import { storage } from './storage.js'
import { pushReport } from './cloudSync.js'

const PREFIX = 'hmc:monthctl:'

export const MONTH_NAMES_HE = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

// מפתח חודש: "YYYY-MM" (month1: 1..12)
export function ymKey(year, month1) {
  return year + '-' + String(month1).padStart(2, '0')
}
export function currentYear() {
  return new Date().getFullYear()
}
export function currentMonth1() {
  return new Date().getMonth() + 1
}
export function currentYM() {
  return ymKey(currentYear(), currentMonth1())
}
export function monthName(month1) {
  return MONTH_NAMES_HE[month1 - 1] || ''
}

const recKey = (unitId) => PREFIX + unitId

function emptyEntry() {
  return { meds: { name: '', note: '' }, crash: { name: '', note: '' } }
}

// מנרמל רשומת חודש בודדת (גם אם חסרים שדות) למבנה אחיד.
function normEntry(e) {
  if (!e) return emptyEntry()
  return {
    meds: { name: (e.meds && e.meds.name) || '', note: (e.meds && e.meds.note) || '' },
    crash: { name: (e.crash && e.crash.name) || '', note: (e.crash && e.crash.note) || '' },
  }
}

// כל החודשים השמורים למחלקה: מפה לפי "YYYY-MM" (עזר פנימי).
function getUnitControls(unitId) {
  const rec = storage.getJSON(recKey(unitId))
  return (rec && rec.data) || {}
}

// רשומת חודש בודד (תמיד מבנה מלא, גם אם ריק).
export function getMonthEntry(unitId, ym) {
  return normEntry(getUnitControls(unitId)[ym])
}

// שמירת רשומת חודש בודד (ממזג לתוך רשומת המחלקה) + סנכרון לענן.
export function saveMonthEntry(unitId, ym, entry) {
  const rec = storage.getJSON(recKey(unitId)) || { unitId, data: {} }
  rec.unitId = unitId
  rec.data = { ...(rec.data || {}), [ym]: normEntry(entry) }
  rec.savedAt = new Date().toISOString()
  storage.setJSON(recKey(unitId), rec)
  pushReport(recKey(unitId), rec, 'save', null) // גיבוי/שחזור בין מכשירים (ללא שורה קריאה בגיליון)
  return rec
}
