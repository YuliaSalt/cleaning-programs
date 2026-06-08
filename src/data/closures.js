// סגירות יחידה (מחלקה / מכון / חדר ניתוח) לטווח תאריכים.
// נשמר ב-StorageAdapter ומגובה לענן כמו דוחות והעברות משמרת.
// שימושים: באנר "סגור" בדף היחידה, השתקת התראות בימים הסגורים, ותיעוד בארכיון הדוחות.

import { storage } from './storage.js'
import { pushReport } from './cloudSync.js'

const PREFIX = 'hmc:closure:'

const today = () => new Date().toLocaleDateString('en-CA')

// ייצוג קריא לגיליון (meta + עמודות), בדומה לדוחות והעברות משמרת.
export function buildClosureReadable(rec) {
  return {
    meta: {
      savedAt: rec.savedAt,
      unitName: rec.unitName,
      date: rec.from,
      shift: '',
      by: rec.by || '',
      kind: 'סגירה',
    },
    columns: [
      ['מתאריך', rec.from || ''],
      ['עד תאריך', rec.to || ''],
      ['סיבה', rec.reason || ''],
      ['דווח עי', rec.by || ''],
    ],
  }
}

export function saveClosure({ unitId, unitName, from, to, reason, by }) {
  const rec = {
    unitId,
    unitName,
    from,
    to,
    reason: (reason || '').trim(),
    by: (by || '').trim(),
    savedAt: new Date().toISOString(),
  }
  const key = `${PREFIX}${unitId}:${from}:${to}:${Date.now()}`
  storage.setJSON(key, rec)
  pushReport(key, rec, 'save', buildClosureReadable(rec)) // גיבוי/סנכרון ענן (best-effort)
  return key
}

export function deleteClosure(key) {
  storage.removeItem(key)
  pushReport(key, null, 'delete')
}

// כל הסגירות של יחידה, מהחדשה לישנה (לפי תאריך התחלה).
export function listClosures(unitId) {
  const pre = PREFIX + unitId + ':'
  const out = []
  for (const k of storage.keys()) {
    if (!k.startsWith(pre)) continue
    const r = storage.getJSON(k)
    if (!r || !r.savedAt) continue
    out.push({ key: k, record: r })
  }
  out.sort((a, b) => (a.record.from < b.record.from ? 1 : -1))
  return out
}

// רשומת הסגירה החלה על תאריך נתון (ברירת מחדל: היום), אחרת null.
export function unitClosureOn(unitId, dateISO = today()) {
  const pre = PREFIX + unitId + ':'
  for (const k of storage.keys()) {
    if (!k.startsWith(pre)) continue
    const r = storage.getJSON(k)
    if (!r || !r.from || !r.to) continue
    if (dateISO >= r.from && dateISO <= r.to) return r
  }
  return null
}

export function isUnitClosed(unitId, dateISO = today()) {
  return !!unitClosureOn(unitId, dateISO)
}
