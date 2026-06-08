// סנכרון דוחות ביצוע והעברות משמרת אל/מ-Google Sheets (גיבוי ענן, offline-first).
//
// עיקרון: localStorage הוא האחסון המהיר/אופליין. כל שמירה ומחיקה נדחפת גם לענן,
// ובעליית האפליקציה מושכים מהענן וממזגים חזרה – כך שאם הדפדפן התאפס, הנתונים משוחזרים.
// מסונכרנים שני סוגי רשומות לפי קידומת המפתח:
//   hmc:plan:...      – דוחות ביצוע (סקשני חתימה נעולים)
//   hmc:handover:...  – העברות משמרת
//
// המבנה בגיליון (טאב טכני "ReportsRaw"): key | savedAt | payload(JSON) – משותף לשני הסוגים.

import { storage } from './storage.js'
import { SHEETS_API_URL, cloudEnabled } from './cloudConfig.js'

const QUEUE_KEY = 'hmc:syncqueue'
const REPORT_PREFIX = 'hmc:plan:'
const HANDOVER_PREFIX = 'hmc:handover:'
const CLOSURE_PREFIX = 'hmc:closure:'

// מפתח שמסונכרן לענן (דוח ביצוע / העברת משמרת / סגירת יחידה).
function isSyncableKey(key) {
  return (
    key.indexOf(REPORT_PREFIX) === 0 ||
    key.indexOf(HANDOVER_PREFIX) === 0 ||
    key.indexOf(CLOSURE_PREFIX) === 0
  )
}

/* ===================== תור ניסיונות חוזרים (לאופליין) ===================== */
function loadQueue() {
  const q = storage.getJSON(QUEUE_KEY)
  return Array.isArray(q) ? q : []
}
function saveQueue(q) {
  storage.setJSON(QUEUE_KEY, q)
}
function enqueue(item) {
  const q = loadQueue()
  // שמירה אחרונה לכל מפתח גוברת – מסירים כפילויות ישנות לאותו key
  const filtered = q.filter((x) => x.key !== item.key)
  filtered.push(item)
  saveQueue(filtered)
}

/* ===================== דחיפה לענן ===================== */
// POST עם text/plain כדי להימנע מ-preflight של CORS; no-cors = שליחה ללא קריאת תגובה.
async function postToCloud(body) {
  await fetch(SHEETS_API_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  })
}

// action: 'save' | 'delete'. readable = ייצוג קריא לטבלה (meta+columns). נכשל בשקט ונכנס לתור.
export async function pushReport(key, rec, action = 'save', readable = null) {
  if (!cloudEnabled()) return
  const item = {
    key,
    action,
    rec: action === 'save' ? rec : null,
    readable: action === 'save' ? readable : null,
  }
  try {
    await postToCloud({ ...item, ts: Date.now() })
  } catch {
    enqueue(item)
  }
}

// דחיפת העברת משמרת לענן – אותו מנגנון כמו דוחות. readable (אופציונלי) נכתב
// לטאב הקריא "Handovers" בגיליון. כל שמירה היא מפתח חדש (חותמת זמן) → לוג מצטבר.
export function pushHandover(key, rec, readable = null) {
  return pushReport(key, rec, 'save', readable)
}

// ניסיון חוזר לכל הפריטים שבתור.
export async function flushQueue() {
  if (!cloudEnabled()) return
  const q = loadQueue()
  if (q.length === 0) return
  const remaining = []
  for (const item of q) {
    try {
      await postToCloud({ ...item, ts: Date.now() })
    } catch {
      remaining.push(item)
    }
  }
  saveQueue(remaining)
}

/* ===================== משיכה מהענן + מיזוג ===================== */
// מונה מודולרי – מבטיח שם callback ייחודי גם בקריאות באותה מילישנייה (StrictMode וכו').
let jsonpSeq = 0

// קריאה ראשית: fetch GET רגיל (Apps Script מחזיר JSON עם CORS). ללא callback גלובלי.
async function fetchReportsViaFetch() {
  const sep = SHEETS_API_URL.indexOf('?') === -1 ? '?' : '&'
  const res = await fetch(SHEETS_API_URL + sep + 'action=reports', { method: 'GET' })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  return res.json()
}

// fallback: JSONP עמיד – שם ייחודי (מונה+זמן), והגלובל לא נמחק באופן שגורם ל-ReferenceError.
function fetchReportsViaJsonp() {
  return new Promise((resolve, reject) => {
    const cb = '__hmc_reports_cb_' + Date.now() + '_' + (++jsonpSeq)
    const sep = SHEETS_API_URL.indexOf('?') === -1 ? '?' : '&'
    const s = document.createElement('script')
    let done = false
    const timer = setTimeout(() => finish(null, new Error('JSONP timeout')), 20000)
    // במקום למחוק את הגלובל (מה שמסכן ReferenceError אם הסקריפט רץ מאוחר) –
    // מחליפים אותו ב-no-op ומסירים רק אחרי השהייה. כל קריאה מאוחרת תהיה לא-מזיקה.
    function finish(data, err) {
      if (done) return
      done = true
      clearTimeout(timer)
      if (s.parentNode) s.parentNode.removeChild(s)
      window[cb] = function () {}
      setTimeout(() => { try { delete window[cb] } catch { /* noop */ } }, 60000)
      err ? reject(err) : resolve(data)
    }
    window[cb] = (data) => finish(data, null)
    s.onerror = () => finish(null, new Error('JSONP error'))
    s.src = SHEETS_API_URL + sep + 'action=reports&callback=' + cb
    document.body.appendChild(s)
  })
}

function fetchReports() {
  return fetchReportsViaFetch().catch(() => fetchReportsViaJsonp())
}

// מושך את כל הדוחות מהענן וממזג ל-localStorage: כותב מפתח אם חסר מקומית
// או אם גרסת הענן חדשה יותר (savedAt). מחזיר מספר הרשומות שעודכנו.
export async function pullReports() {
  if (!cloudEnabled()) return 0
  let payload
  try {
    payload = await fetchReports()
  } catch {
    return 0
  }
  if (!payload || !payload.ok || !Array.isArray(payload.data)) return 0

  let merged = 0
  for (const row of payload.data) {
    const key = row.key
    if (!key || !isSyncableKey(key)) continue
    let cloudRec = row.payload
    if (typeof cloudRec === 'string') {
      try { cloudRec = JSON.parse(cloudRec) } catch { continue }
    }
    if (!cloudRec || !cloudRec.savedAt) continue

    const local = storage.getJSON(key)
    const localTs = local && local.savedAt ? Date.parse(local.savedAt) : 0
    const cloudTs = Date.parse(cloudRec.savedAt) || 0
    if (cloudTs > localTs) {
      storage.setJSON(key, cloudRec)
      merged++
    }
  }
  return merged
}

// סנכרון מלא: דחיפת תור ממתין + משיכת עדכונים מהענן.
export async function syncReports() {
  if (!cloudEnabled()) return 0
  await flushQueue()
  return pullReports()
}
