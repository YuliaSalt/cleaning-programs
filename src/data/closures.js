// סגירות יחידה (מחלקה / מכון / חדר ניתוח) לטווח תאריכים.
// נשמר ב-StorageAdapter ומגובה לענן כמו דוחות והעברות משמרת.
// שימושים: באנר "סגור" בדף היחידה, השתקת התראות בימים הסגורים, ותיעוד בארכיון הדוחות.

import { storage } from './storage.js'
import { pushReport } from './cloudSync.js'

const PREFIX = 'hmc:closure:'

const today = () => new Date().toLocaleDateString('en-CA')

// ===== סגירה אוטומטית: גסטרו, חדרי ניתוח וצינתורים סגורים בשבתות ובחגי ישראל (יו״ט) =====
const AUTO_CLOSED_UNITS = new Set(['gastro', 'or', 'cath'])
// תחילת התיעוד האוטומטי בארכיון (סגירות שבת/חג מחושבות מתאריך זה ואילך).
const AUTO_ANCHOR = '2026-01-01'

// שם החג אם התאריך הוא יום טוב בישראל, אחרת '' – לפי הלוח העברי דרך Intl (ללא ספרייה).
function hebrewHoliday(date) {
  let day, month
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric', month: 'long' }).formatToParts(date)
    day = Number(parts.find((p) => p.type === 'day').value)
    month = parts.find((p) => p.type === 'month').value // לדוגמה: Tishri / Nisan / Sivan
  } catch {
    return ''
  }
  const is = (name) => month && month.startsWith(name)
  if (is('Tishri') && (day === 1 || day === 2)) return 'ראש השנה'
  if (is('Tishri') && day === 10) return 'יום כיפור'
  if (is('Tishri') && day === 15) return 'סוכות'
  if (is('Tishri') && day === 22) return 'שמיני עצרת'
  if (is('Nisan') && day === 15) return 'פסח'
  if (is('Nisan') && day === 21) return 'שביעי של פסח'
  if (is('Sivan') && day === 6) return 'שבועות'
  return ''
}

// סוג הסגירה האוטומטית בתאריך נתון ליחידה: שם החג, 'שבת', או '' אם פתוחה.
export function autoClosureKind(unitId, dateISO = today()) {
  if (!AUTO_CLOSED_UNITS.has(unitId)) return ''
  const d = new Date(dateISO + 'T00:00:00')
  const holiday = hebrewHoliday(d)
  if (holiday) return holiday
  if (d.getDay() === 6) return 'שבת' // יום שבת
  return ''
}

// ימי הסגירה האוטומטית שכבר חלפו (מתאריך העוגן ועד היום) – לתיעוד בארכיון.
export function listAutoClosures(unitId) {
  if (!AUTO_CLOSED_UNITS.has(unitId)) return []
  const out = []
  const end = new Date(today() + 'T00:00:00')
  const d = new Date(AUTO_ANCHOR + 'T00:00:00')
  let guard = 0
  while (d <= end && guard < 1500) {
    const iso = d.toLocaleDateString('en-CA')
    const kind = autoClosureKind(unitId, iso)
    if (kind) out.push({ dateISO: iso, kind })
    d.setDate(d.getDate() + 1)
    guard++
  }
  return out
}

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
// קודם סגירה ידנית מתועדת, אחרת סגירה אוטומטית (שבת/חג) ליחידות הרלוונטיות.
export function unitClosureOn(unitId, dateISO = today()) {
  const pre = PREFIX + unitId + ':'
  for (const k of storage.keys()) {
    if (!k.startsWith(pre)) continue
    const r = storage.getJSON(k)
    if (!r || !r.from || !r.to) continue
    if (dateISO >= r.from && dateISO <= r.to) return r
  }
  const kind = autoClosureKind(unitId, dateISO)
  if (kind) return { auto: true, kind, from: dateISO, to: dateISO, reason: kind }
  return null
}

export function isUnitClosed(unitId, dateISO = today()) {
  return !!unitClosureOn(unitId, dateISO)
}
