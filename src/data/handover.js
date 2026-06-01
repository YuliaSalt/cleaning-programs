// העברת משמרת – אפיון גסטרו + שמירה/קריאה מהארכיון דרך ה-StorageAdapter.

import { storage } from './storage.js'

// בלוק 1 – דיווח ובקרה (יש/אין דינמי עם טקסט חופשי)
export const GASTRO_REPORT_ITEMS = [
  { id: 'event', label: 'אירוע חריג', placeholder: 'לדוגמה: נפילת מטופל בחדר 3...' },
  { id: 'faults', label: 'תקלות פתוחות', placeholder: 'לדוגמה: מסך מחשב בעמדה 2 מהבהב...' },
  { id: 'notes', label: 'הערות כלליות', placeholder: 'הודעות למשמרת הבאה...' },
]

// בלוקים 2-4 – צ׳קליסטים
export const GASTRO_CHECK_BLOCKS = [
  {
    id: 'safety',
    title: 'בטיחות וקליניקה',
    items: [
      'עגלת החייאה (תקינות ומוכנות)',
      'מוניטורים (Alarm + Admit)',
      'סגירת חמצן - התאוששות',
      'סגירת חמצן - חדרי פעולות',
      'סגירת חמצן - חדר שיקוף',
      'מוניטורים (Discharge)',
    ],
  },
  {
    id: 'ops',
    title: 'תפעול וציוד',
    items: [
      'פתולוגיה (ספירה ומסירה)',
      'ניקיון עמדות ועגלות',
      'סדר בחדר שיקוף',
      'מכשור בטעינה',
      'תוכנית עבודה (וידוא וחתימה)',
    ],
  },
  {
    id: 'security',
    title: 'ביטחון וסדר',
    items: [
      'נעילת ארון תרופות/ציוד',
      'פינוי מזון למקרר',
      'סגירת דלת פרוזדור גסטרו ודלת אחורית ליד חדר',
    ],
  },
]

// ===== טופס כללי (מחלקות אשפוז, טיפול נמרץ, חדרי ניתוח, התאוששות, צינתורים, IVF) =====
// בלוק 1 – נתוני תפוסה וצוות:
//   שמות (שם פרטי + שם משפחה) – אחות מוסרת (חובה/חתימה) ואחות מקבלת
export const GEN_OCC_NAMES = [
  { id: 'nurseOut', label: 'אחות מוסרת', required: true },
  { id: 'nurseIn', label: 'אחות מקבלת', required: false },
]
//   מונים מספריים (בחירה או הקלדה)
export const GEN_OCC_NUMBERS = [
  { id: 'patients', label: 'מספר מטופלים במחלקה' },
  { id: 'discharges', label: 'מספר משוחררים' },
  { id: 'admissions', label: 'מספר קבלות' },
]

// בלוק 2 – דיווח ובקרה קליני וניהולי (יש/אין דינמי + מלל חופשי, ללא הערות בצד)
export const GEN_REPORT_ITEMS = [
  { id: 'staffing', label: 'הפקדת כח אדם - אחיות וכוחות עזר', placeholder: 'פירוט הפקדת כח האדם...' },
  { id: 'specialTests', label: 'בדיקות וטיפולים מיוחדים', placeholder: 'פירוט בדיקות וטיפולים...' },
  { id: 'complexClinical', label: 'מצבים קליניים מורכבים / התערבות נדרשת', placeholder: 'פירוט המצב הקליני וההתערבות...' },
  { id: 'event', label: 'אירוע חריג', placeholder: 'לדוגמה: נפילת מטופל בחדר 3...' },
  { id: 'faults', label: 'תקלות פתוחות', placeholder: 'לדוגמה: מסך מחשב בעמדה 2 מהבהב...' },
  { id: 'generalNotes', label: 'הערות כלליות', placeholder: 'הודעות למשמרת הבאה...' },
]

// בלוק 3 – משימות ובטיחות המחלקה (צ׳קליסט + הערות)
export const GEN_CHECK_ITEMS = [
  'ביצוע העברת מידע על פי דוח ISBAR',
  'ביצוע ספירת נרקוטיקה',
  'ביצוע בדיקת עגלת החייאה',
  'ליקויים בציוד ריהוט ותשתיות',
]

export function emptyGeneralHandover(unitId, unitName, shift) {
  return {
    kind: 'general',
    unitId,
    unitName,
    date: new Date().toLocaleDateString('en-CA'),
    shift,
    nurseOut: { first: '', last: '' },
    nurseIn: { first: '', last: '' },
    numbers: Object.fromEntries(GEN_OCC_NUMBERS.map((it) => [it.id, ''])),
    occNote: '',
    reports: Object.fromEntries(GEN_REPORT_ITEMS.map((it) => [it.id, { has: false, text: '' }])),
    checks: Object.fromEntries(GEN_CHECK_ITEMS.map((_, i) => [i, { on: false, note: '' }])),
    nurse: '',
  }
}

export function fullName(n) {
  if (!n) return ''
  return ((n.first || '') + ' ' + (n.last || '')).trim()
}

const PREFIX = 'hmc:handover:'

export function emptyHandover(unitId, unitName, shift) {
  return {
    unitId,
    unitName,
    date: new Date().toLocaleDateString('en-CA'),
    shift,
    reports: Object.fromEntries(GASTRO_REPORT_ITEMS.map((it) => [it.id, { has: false, text: '' }])),
    checks: Object.fromEntries(GASTRO_CHECK_BLOCKS.map((b) => [b.id, {}])),
  }
}

export function saveHandover(record) {
  const rec = { ...record, savedAt: record.savedAt || new Date().toISOString() }
  const key = `${PREFIX}${rec.unitId}:${rec.date}:${rec.shift}:${Date.now()}`
  storage.setJSON(key, rec)
  return key
}

export function listHandovers(unitId) {
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
      sortTs: d.getTime(),
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
      dateLabel: d.toLocaleDateString('he-IL'),
      timeLabel: d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    })
  }
  out.sort((a, b) => b.sortTs - a.sortTs)
  return out
}

export const HE_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]
