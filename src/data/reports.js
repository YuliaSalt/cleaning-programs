// קריאת דוחות הביצוע השמורים (סקשני חתימה נעולים) של יחידה, מתוך ה-StorageAdapter.

import { getCleaningPlan, getMergedDailySection } from './cleaningTemplates.js'
import { findUnit } from './departments.js'
import { storage } from './storage.js'

const PREFIX = 'hmc:plan:'

// פירוק מפתח: hmc:plan:{unitId}:{room}:{tabId}:{sectionId}:{period}
// (התקופה ביומי מכילה נקודתיים – לכן מאחדים את החלקים שאחרי ה-4 הראשונים)
function parseKey(key) {
  const parts = key.slice(PREFIX.length).split(':')
  return {
    unitId: parts[0],
    room: parts[1],
    tabId: parts[2],
    sectionId: parts[3],
    period: parts.slice(4).join(':'),
  }
}

function findSection(plan, tabId, sectionId) {
  if (!plan) return null
  const tab = plan.tabs.find((t) => t.id === tabId)
  if (!tab) return null
  return tab.sections.find((s) => s.id === sectionId) || null
}

// שיטוח משימות הסקשן לאינדקס רץ אחיד (תואם ל-CleaningPlan)
export function flattenSectionTasks(section) {
  if (!section) return []
  if (section.items) return section.items.map((label) => ({ label }))
  const out = []
  ;(section.groups || []).forEach((g) => {
    g.items.forEach((label, ii) =>
      out.push({ label, group: g.subtitle, firstInGroup: ii === 0 })
    )
  })
  return out
}

export function listReports(unitId) {
  const plan = getCleaningPlan(unitId)
  const prefix = PREFIX + unitId + ':'
  const out = []
  for (const key of storage.keys()) {
    if (!key.startsWith(prefix)) continue
    const rec = storage.getJSON(key)
    if (!rec || !rec.savedAt) continue // רק דוחות חתומים (לא מוני "בין מטופלים")
    const p = parseKey(key)
    const saved = new Date(rec.savedAt)
    const shift = p.tabId === 'daily' ? p.period.split(':')[1] || '' : ''
    // 'day' = רשומת יומי ממוזגת (מחלקות אשפוז) – משחזרים את הסקשן הממוזג לתצוגה
    const section = p.sectionId === 'day'
      ? getMergedDailySection(plan, shift)
      : findSection(plan, p.tabId, p.sectionId)
    // שם הדוח: "[שם מחלקה] - יומי בוקר / יומי ערב" (תדירות + משמרת)
    const unit = findUnit(p.unitId)
    const unitName = unit ? unit.name : p.unitId
    const freqLabel = TYPE_LABELS[p.tabId] || p.tabId
    const title = `${unitName} - ${freqLabel}${shift ? ' ' + shift : ''}`
    out.push({
      key,
      room: p.room === '-' ? null : p.room,
      tabId: p.tabId,
      sectionId: p.sectionId,
      period: p.period,
      section,
      title,
      record: rec,
      savedAt: rec.savedAt,
      sortTs: saved.getTime(),
      year: saved.getFullYear(),
      month: saved.getMonth(),
      day: saved.getDate(),
      dateLabel: saved.toLocaleDateString('he-IL'),
      timeLabel: saved.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      dateISO: saved.toLocaleDateString('en-CA'),
      shift,
      performers: Object.values(rec.names || {}).map((v) => (v || '').trim()).filter(Boolean),
      by: rec.by || '',
    })
  }
  out.sort((a, b) => b.sortTs - a.sortTs)
  return out
}

export const TYPE_LABELS = {
  daily: 'יומי',
  weekly: 'שבועי',
  monthly: 'חודשי',
  isolation: 'חולה בבידוד',
}

export const HE_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]
