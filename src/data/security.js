// אבטחה: קוד PIN למחיקת דוחות.
//
// הקוד אינו מוטמע ברכיב UI גלוי – הוא נקבע כאן ממשתנה סביבה (VITE_DELETE_PIN)
// עם ערך ברירת מחדל כקבוע. כדי לשנותו ללא נגיעה בקוד: הגדירי VITE_DELETE_PIN
// בקובץ .env / במשתני הסביבה של הבנייה.
const DELETE_PIN =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_DELETE_PIN) ||
  '4271'

// השוואה בטוחה (trim) – מחזיר true רק אם הקוד תואם.
export function verifyDeletePin(input) {
  return String(input ?? '').trim() === String(DELETE_PIN).trim()
}
