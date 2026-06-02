// ניתוב חכם: מעקב אחרי המחלקה הנצפית ביותר ברצף, להפניה אוטומטית בכניסה.
//
// בכל בחירת יחידה נספר רצף הצפיות באותה יחידה. אם המשתמש/ת נכנס/ה לאותה
// מחלקה ברצף (סף קבוע), בעליית האפליקציה מדלגים על מסך הבחירה ונכנסים ישר אליה.

import { storage } from './storage.js'

const LAST_KEY = 'hmc:visit:last'
const STREAK_KEY = 'hmc:visit:streak'

// כמה כניסות רצופות לאותה מחלקה נדרשות כדי להפעיל הפניה אוטומטית.
export const REDIRECT_THRESHOLD = 3

// תיעוד כניסה ליחידה: מגדיל את הרצף אם זו אותה יחידה, אחרת מאפס ל-1.
export function recordVisit(unitId) {
  if (!unitId) return
  const last = storage.getItem(LAST_KEY)
  const streak = Number(storage.getItem(STREAK_KEY)) || 0
  if (last === unitId) {
    storage.setItem(STREAK_KEY, String(streak + 1))
  } else {
    storage.setItem(LAST_KEY, unitId)
    storage.setItem(STREAK_KEY, '1')
  }
}

// מחזיר את מזהה היחידה להפניה אוטומטית אם הרצף עבר את הסף, אחרת null.
export function getAutoRedirectUnit() {
  const last = storage.getItem(LAST_KEY)
  const streak = Number(storage.getItem(STREAK_KEY)) || 0
  return last && streak >= REDIRECT_THRESHOLD ? last : null
}
