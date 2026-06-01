// מפתחות אחסון משותפים + חישוב אחוזי ביצוע לדשבורד.
// המקור היחיד לאמת לגבי מבנה מפתח ה-localStorage ולחישוב התקופה.

import { getCleaningPlan } from './cleaningTemplates.js'
import { storage } from './storage.js'

export function dateStr(d = new Date()) {
  return d.toLocaleDateString('en-CA') // YYYY-MM-DD
}
export function isoWeek(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((t - yearStart) / 86400000 + 1) / 7)
  return t.getUTCFullYear() + '-W' + String(week).padStart(2, '0')
}
export function monthStr(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
}

// מפתח התקופה לפי סוג הטאב (ביומי כולל משמרת)
export function periodKey(tabId, shift) {
  if (tabId === 'daily') return dateStr() + (shift ? ':' + shift : '')
  if (tabId === 'weekly') return isoWeek()
  if (tabId === 'monthly') return monthStr()
  return dateStr() // isolation – אירוע ליום
}

// מפתח רשומת סקשן חתום
export function planKey(unitId, room, tabId, sectionId, period) {
  return `hmc:plan:${unitId}:${room || '-'}:${tabId}:${sectionId}:${period}`
}

// אחוז ביצוע ליחידה לכל תדירות (daily/weekly/monthly) מתוך הרשומות השמורות.
// מחזיר null כשאין סקשני חתימה בתדירות זו, אחרת 0..100.
export function computeUnitProgress(unitId) {
  const plan = getCleaningPlan(unitId)
  const res = { daily: null, weekly: null, monthly: null }
  if (!plan) return res
  for (const tab of plan.tabs) {
    if (!(tab.id in res)) continue
    const signed = tab.sections.filter((s) => s.kind === 'signed')
    if (signed.length === 0) {
      res[tab.id] = null
      continue
    }
    let sum = 0
    for (const s of signed) {
      // ביומי: סקשן עם משמרת נשמר תחת אותה משמרת; סקשן ללא משמרת עשוי להישמר תחת כל משמרת
      let periods
      if (tab.id === 'daily') {
        periods = s.shift ? [periodKey('daily', s.shift)] : (plan.shifts || []).map((sh) => periodKey('daily', sh))
      } else {
        periods = [periodKey(tab.id, s.shift)]
      }
      const rooms = s.roomScoped && plan.rooms ? plan.rooms : ['-']
      const done = rooms.filter((r) =>
        periods.some((per) => storage.has(planKey(unitId, r, tab.id, s.id, per)))
      ).length
      sum += done / rooms.length
    }
    res[tab.id] = Math.round((sum / signed.length) * 100)
  }
  return res
}
