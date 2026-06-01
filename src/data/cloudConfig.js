// הגדרת גיבוי הדוחות לענן (Google Sheets / Apps Script Web App).
//
// כדי להפעיל: פרסי את sheets-integration/Code.gs כ-Web App
// (Deploy → New deployment → Web app, Execute as: Me, Who has access: Anyone)
// והדביקי כאן את כתובת ה-/exec שקיבלת.
//
// כל עוד הערך הוא placeholder – האפליקציה עובדת רגיל מול localStorage בלבד,
// וללא ניסיונות סנכרון (לא ייזרקו שגיאות).
export const SHEETS_API_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SHEETS_API_URL) ||
  'https://script.google.com/macros/s/AKfycbz31AXe4_sG6gw-BVPBCacWMKFCgWuqj3BMFT3s5KRPdidGgl1dHFYXuPiFqqMIb9MW/exec'

// האם הסנכרון מוגדר בפועל
export function cloudEnabled() {
  return typeof SHEETS_API_URL === 'string' && SHEETS_API_URL.indexOf('http') === 0
}
