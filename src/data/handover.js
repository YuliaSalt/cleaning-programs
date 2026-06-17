// העברת משמרת – אפיון גסטרו + שמירה/קריאה מהארכיון דרך ה-StorageAdapter.

import { storage } from './storage.js'
import { pushHandover } from './cloudSync.js'

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
  'בדיקת מערכת ניטור טמפרטורה',
]

// סעיפים שמופיעים רק ביחידות מסוימות; כל שאר הסעיפים מופיעים בכל היחידות.
// "ביצוע בדיקת עגלת החייאה" – רק ביחידות עם עגלת החייאה (התאוששות ואשפוז ג;
//   גסטרו משתמשת בטופס נפרד שבו עגלת החייאה כבר נכללת).
// "בדיקת מערכת ניטור טמפרטורה" – רק בהתאוששות IVF.
const UNIT_ONLY_ITEMS = {
  'ביצוע בדיקת עגלת החייאה': new Set(['recovery', 'recovery-1', 'recovery-2', 'inpatient-c']),
  'בדיקת מערכת ניטור טמפרטורה': new Set(['ivf-recovery']),
}

// רשימת סעיפי הצ׳קליסט הרלוונטיים ליחידה, תוך שמירה על האינדקס המקורי
// (כדי שדו״חות שמורים ישנים לא יוסטו). מחזיר מערך של { i, label }.
export function genCheckItemsFor(unitId) {
  return GEN_CHECK_ITEMS
    .map((label, i) => ({ i, label }))
    .filter(({ label }) => !UNIT_ONLY_ITEMS[label] || UNIT_ONLY_ITEMS[label].has(unitId))
}

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

// ===== העברת משמרת – מרפאה IVF (טופס ייעודי) =====
// אותו סגנון, אותן הגדרות ואותו איצוב כמו שאר דו״חות אחראית המשמרת,
// אך עם רשימת סעיפים ייחודית למרפאה.
// type: 'done'  – שני כפתורים: בוצע / לא בוצע (+ הערות אם notes)
//       'yesno' – כן / לא (+ פירוט אם נבחר "כן")
//       'text'  – כתיבה חופשית בלבד
export const IVF_CLINIC_ITEMS = [
  { id: 'fetCheck', label: 'בדיקת תיק של מטופלות העוברות FET מחר', type: 'done', notes: true, required: true },
  { id: 'firstSecondCheck', label: 'בדיקת תיק ראשונה ושניה', type: 'done', notes: true, required: true },
  { id: 'assignments', label: 'שיבוצים', type: 'done', notes: true, required: true },
  { id: 'instructions', label: 'מסירת הנחיות עבור בטות מהחושלים', type: 'done', notes: true, required: true },
  { id: 'fertSummary', label: 'שליחת סיכום הפריות', type: 'done', notes: true, required: true },
  { id: 'crm', label: 'CRM - פניות בטיפול', type: 'text', placeholder: 'פירוט הפניות בטיפול (כתיבה חופשית)...', required: true },
  { id: 'thaw', label: 'הפשרת ביציות ל-3 הימים הקרובים - נמסר לבני הזוג כי עליהם להגיע למתן זרע ביום ההפריה', type: 'done', notes: false, required: true },
  { id: 'events', label: 'אירועים חריגים', type: 'yesno', notes: true, required: false },
]

export function emptyIvfClinicHandover(unitId, unitName, shift) {
  return {
    kind: 'ivf-clinic',
    unitId,
    unitName,
    date: new Date().toLocaleDateString('en-CA'),
    shift,
    nurseOut: { first: '', last: '' },
    nurseIn: { first: '', last: '' },
    items: Object.fromEntries(IVF_CLINIC_ITEMS.map((it) => [it.id, { val: null, note: '', text: '' }])),
    nurse: '',
  }
}

export function fullName(n) {
  if (!n) return ''
  return ((n.first || '') + ' ' + (n.last || '')).trim()
}

// שם האחות המוסרת נשמר קבוע במכשיר, ומולא מראש בכל פתיחת טופס (כל אחד מהמכשיר שלו).
const DEVICE_NURSE_KEY = 'hmc:device:nurse'
export function getDeviceNurse() {
  return storage.getItem(DEVICE_NURSE_KEY) || ''
}
export function rememberDeviceNurse(name) {
  const v = (name || '').trim()
  if (v) storage.setItem(DEVICE_NURSE_KEY, v)
}

// ===== העברת משמרת – חדרי ניתוח (טופס ייעודי מבוסס מתגי אין/יש עם פתיחת שדות) =====
export const OR_SECTIONS = [
  { part: 'חלק א׳: סטטוס וזרימת התוכנית הניתוחית' },
  {
    id: 'waiting', label: 'מטופלים ממתינים / עיכובים בבלוקים', good: 'אין', bad: 'יש',
    fields: [{ id: 'detail', label: 'פירוט (מטופל / סיבה / צפי כניסה)', type: 'textarea' }],
  },
  {
    id: 'blockerSolution', label: 'פתרון חסמים / עיכובים', good: 'אין', bad: 'יש',
    fields: [{ id: 'detail', label: 'פירוט הפתרון שננקט', type: 'textarea' }],
  },
  {
    id: 'surgeonDelay', label: 'איחורים של מנתחים', good: 'אין', bad: 'יש',
    fields: [
      { id: 'surgeon', label: 'שם המנתח / חדר', type: 'text' },
      { id: 'details', label: 'פרטי האיחור וצפי הגעה', type: 'textarea' },
    ],
  },
  {
    id: 'roomChanges', label: 'שינוי חדרים והתאמת התוכנית', good: 'אין', bad: 'יש',
    fields: [{ id: 'detail', label: 'פירוט ההעברות (מחדר X לחדר Y)', type: 'textarea' }],
  },
  { part: 'חלק ב׳: לוגיסטיקה, ציוד ותשתיות' },
  {
    id: 'equipMissing', label: 'חוסר בציוד הנדרש לניתוח', good: 'אין', bad: 'יש',
    fields: [{ id: 'detail', label: 'פירוט הציוד החסר וסטטוס טיפול (למי פנינו)', type: 'textarea' }],
  },
  {
    id: 'faults', label: 'ליקויים בציוד, ריהוט ותשתיות', good: 'אין', bad: 'יש',
    fields: [
      { id: 'detail', label: 'תיאור התקלה', type: 'textarea' },
      { id: 'service', label: 'מספר קריאת שירות (אם נפתחה)', type: 'text' },
    ],
  },
  { part: 'חלק ג׳: כוח אדם ואירועים חריגים' },
  {
    id: 'staffing', label: 'התאמת כוח אדם לתוכנית', good: 'מותאם', bad: 'לא מותאם',
    fields: [{ id: 'detail', label: 'פירוט חוסרים / היערכות נדרשת', type: 'textarea' }],
  },
  {
    id: 'eventClinical', label: 'אירועים חריגים – מטופלים', good: 'אין', bad: 'יש',
    fields: [{ id: 'detail', label: 'תיאור האירוע הקליני וההתערבות', type: 'textarea' }],
  },
  {
    id: 'eventMgmt', label: 'אירועים חריגים – ניהול / צוות', good: 'אין', bad: 'יש',
    fields: [{ id: 'detail', label: 'תיאור האירוע הניהולי', type: 'textarea' }],
  },
  { part: 'הערות' },
  {
    id: 'notes', label: 'הערות כלליות', good: 'אין', bad: 'יש',
    fields: [{ id: 'note', label: 'הערות', type: 'textarea' }],
  },
]

const emptyFields = (s) => Object.fromEntries(s.fields.map((f) => [f.id, '']))

export function emptyORHandover(unitId, unitName, shift) {
  const sections = {}
  for (const s of OR_SECTIONS) {
    if (!s.id) continue
    sections[s.id] = s.multi ? { flag: false, rows: [emptyFields(s)] } : { flag: false, fields: emptyFields(s) }
  }
  return { kind: 'or', unitId, unitName, date: new Date().toLocaleDateString('en-CA'), shift, sections }
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

// ייצוג קריא של העברת משמרת לגיליון (meta + עמודות label/value), בדומה לדוחות.
// תומך בשני הסוגים: כללית (kind === 'general') וגסטרו.
export function buildHandoverReadable(rec) {
  const isGeneral = rec.kind === 'general'
  const isIvfClinic = rec.kind === 'ivf-clinic'
  const fmtReport = (r) => (r && r.has ? 'יש' + (r.text ? ' · ' + r.text : '') : 'אין')
  const columns = []
  if (isIvfClinic) {
    columns.push(['אחות מקבלת', fullName(rec.nurseIn)])
    IVF_CLINIC_ITEMS.forEach((it) => {
      const v = (rec.items && rec.items[it.id]) || {}
      let value
      if (it.type === 'text') value = v.text || ''
      else if (it.type === 'yesno') value = (v.val === 'yes' ? 'כן' : v.val === 'no' ? 'לא' : '—') + (v.note ? ' · ' + v.note : '')
      else value = (v.val === 'done' ? 'בוצע' : v.val === 'notDone' ? 'לא בוצע' : '—') + (v.note ? ' · ' + v.note : '')
      columns.push([it.label, value])
    })
  } else if (isGeneral) {
    columns.push(['אחות מקבלת', fullName(rec.nurseIn)])
    GEN_OCC_NUMBERS.forEach((it) => columns.push([it.label, rec.numbers ? rec.numbers[it.id] ?? '' : '']))
    if (rec.occNote) columns.push(['הערת תפוסה', rec.occNote])
    GEN_REPORT_ITEMS.forEach((it) => columns.push([it.label, fmtReport(rec.reports && rec.reports[it.id])]))
    genCheckItemsFor(rec.unitId).forEach(({ i, label }) => {
      const c = (rec.checks && rec.checks[i]) || {}
      columns.push([label, (c.on ? '✓' : '✗') + (c.note ? ' · ' + c.note : '')])
    })
  } else {
    GASTRO_REPORT_ITEMS.forEach((it) => columns.push([it.label, fmtReport(rec.reports && rec.reports[it.id])]))
    GASTRO_CHECK_BLOCKS.forEach((b) => {
      const blk = (rec.checks && rec.checks[b.id]) || {}
      b.items.forEach((label, i) => columns.push([b.title + ' – ' + label, blk[i] ? '✓' : '✗']))
    })
  }
  return {
    meta: {
      savedAt: rec.savedAt,
      unitName: rec.unitName,
      date: rec.date,
      shift: rec.shift,
      by: isGeneral || isIvfClinic ? fullName(rec.nurseOut) : rec.nurse || '',
      kind: isIvfClinic ? 'מרפאה IVF' : isGeneral ? 'כללית' : 'גסטרו',
    },
    columns,
  }
}

export function saveHandover(record) {
  const rec = { ...record, savedAt: record.savedAt || new Date().toISOString() }
  const key = `${PREFIX}${rec.unitId}:${rec.date}:${rec.shift}:${Date.now()}`
  storage.setJSON(key, rec)
  pushHandover(key, rec, buildHandoverReadable(rec)) // גיבוי/סנכרון ענן + שורה קריאה בגיליון (best-effort)
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
