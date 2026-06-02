// תחזוקה: ניקוי חד-פעמי של כל הדוחות השמורים מקומית (לפי גרסה).
//
// בכל העלאת גרסת PURGE_VERSION, כל מכשיר מנקה פעם אחת את כל הדוחות שנשמרו עד כה
// (דוחות ניקיון, העברות משמרת ודוחות פעולות) + תור הסנכרון הממתין.
// הניקוי של הענן (Google Sheets) נעשה בנפרד דרך clearAllReports ב-Apps Script.

import { storage } from './storage.js'

const PURGE_KEY = 'hmc:purge-version'
// העלאת המספר תפעיל ניקוי חד-פעמי נוסף בכל המכשירים.
const PURGE_VERSION = 1

// קידומות המפתחות של דוחות שמורים בלבד (לא נוגעים בשמות מכשיר/העדפות).
const REPORT_PREFIXES = ['hmc:plan:', 'hmc:handover:', 'hmc:proc:']

export function purgeAllReportsOnce() {
  const done = Number(storage.getItem(PURGE_KEY)) || 0
  if (done >= PURGE_VERSION) return
  for (const k of storage.keys()) {
    if (REPORT_PREFIXES.some((p) => k.startsWith(p))) storage.removeItem(k)
  }
  // ניקוי תור הסנכרון כדי שלא יידחפו שמירות ישנות חזרה לענן
  storage.removeItem('hmc:syncqueue')
  storage.setItem(PURGE_KEY, String(PURGE_VERSION))
}
