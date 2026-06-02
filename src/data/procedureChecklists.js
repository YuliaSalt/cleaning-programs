// צ'ק-ליסטים להכנת ציוד לפעולות מיוחדות (גסטרו).
// כל פעולה: כותרת מסך, כותרת להודעת וואטסאפ, ורשימת סעיפים.
// פריט מתחיל ב-✕ אדום (חסר) והופך ל-✓ ירוק בלחיצה. נשלחים לוואטסאפ רק הפריטים שנותרו אדומים.

import { storage } from './storage.js'

// המלצה זהה בראש הסעיף הראשון בכל הפעולות.
const RECOMMENDATION =
  'המלצה לבדיקה לפני פעולה: יש לבצע את בדיקת המערך האופטי בזמן סביר לפני תחילת הפעולה ' +
  'על מנת לאפשר טווח ביטחון לטיפול בתקלות טכניות אפשריות.'

// הערה משפטית ומקצועית מעל החתימה – משותפת לכל הפעולות.
export const SIGN_NOTE =
  'הערה: חתימה על טופס זה מהווה אישור רשמי לכך שקיים מספיק ציוד תקין וזמין לצורך יום העבודה הבא.'

export const PROCEDURE_CHECKLISTS = {
  cystoscopy: {
    title: "צ'ק-ליסט הכנת ציוד · Cystoscopy",
    waTitle: 'ציסטוסקופיה (Cystoscopy) - ציוד חסר',
    blocks: [
      {
        id: 'optic',
        title: 'מערך אופטי וטכני כולל בדיקה מקדימה',
        note: RECOMMENDATION,
        items: [
          'מגדל אופטי: מחובר, דולק ותקין',
          'פרוססור: מחובר למסך ונבדק תמונה תקינה',
          'ציסטוסקופ גמיש: לוודא שהמכשור חד-פעמי, באריזה סגורה ובתוקף',
          'מקור אור: ציסטוסקופ דמה (לא סטרילי) מחובר למקור אור ונבדק באופן תקין לפני הפעולה',
        ],
      },
      {
        id: 'patient',
        title: 'סביבת המטופל והשכבה',
        items: [
          'כיסוי מיטה: סדין נייר סופג או ספונג׳טקס סטרילים',
          'נוחות: סדין סטרילי וכרית נקייה',
          'וידוא תנוחה: גברים בפרקדן Supine / נשים בליטוטומי רגליות',
        ],
      },
      {
        id: 'sterile',
        title: 'ציוד סטרילי על עגלת נירוסטה',
        items: [
          'כיסויים: Back Table Cover / סט כיסוי כחול / Drape Towel לגברים בלבד',
          'סט רחצה כולל: כליה, 2 כוסות וכוסית אחת, מחזיק ספוג',
          'גזות וספוגיות סטריליות מרפד 25 גרם',
          'מיגון: כפפות סטריליות מידה 7.5 לרופא/ה / כפפות לאח/ות',
        ],
      },
      {
        id: 'fluids',
        title: 'נוזלים, חיטוי ואלחוש',
        items: [
          'חיטוי: פולידין לרחצה / 5-6 יחידות נוזל חיטוי קטן',
          'ג׳ל לידוקאין / עזרקאין זמין',
          'שקית סליין NaCl 0.9% בנפח 500ml',
          'סט עירוי מחובר לשקית ומוכן לציסטוסקופ',
        ],
      },
    ],
  },

  broncho: {
    title: "צ'ק-ליסט הכנת ציוד · Bronchoscopy",
    waTitle: 'ברונכוסקופיה (Bronchoscopy) - ציוד חסר',
    blocks: [
      {
        id: 'core',
        title: 'ציוד ליבה',
        note: RECOMMENDATION,
        items: [`ברונכוסקופ (חד-פעמי): 1 יח'`],
      },
      {
        id: 'anesthesia',
        title: 'אלחוש ותרופות',
        items: [
          `לידוקאין 1% (לאלחוש מקומי): 8 מזרקים של 2.5 מ"ל`,
          `לידוקאין 10% (תרסיס לוע): 1 יח' (מיכל ספריי אחד)`,
        ],
      },
      {
        id: 'irrigation',
        title: 'שטיפות ונוזלים',
        items: [
          `NaCl 0.9% (לשטיפות): 8 מזרקים של 20 מ"ל`,
          `מיכלי איסוף (סקשן): 4 יחידות של 70 מ"ל (לשימוש גם עבור ציטולוגיה ומעבדה)`,
        ],
      },
      {
        id: 'biopsy',
        title: 'ביופסיה ודגימות',
        items: [
          `מלקחי ביופסיה (ביופטר): 1 יח' (מתאים לתעלת עבודה 1.9-2.0 מ"מ)`,
          `מיכלי פורמלין: 4 יחידות (להיסטולוגיה / ציטולוגיה)`,
          `אלכוהול 70% (לציטולוגיה): 1 יח' (יחס דילול 1:1)`,
        ],
      },
      {
        id: 'extra',
        title: 'ציוד משלים',
        items: [`מגן שיניים: 1 יח'`],
      },
    ],
  },
}

// מצב ריק: כל הפריטים מסומנים ✕ (false = חסר).
export function emptyChecks(blocks) {
  return Object.fromEntries(blocks.map((b) => [b.id, {}]))
}

// ===== שמירת דוחות חתומים (נשמרים מקומית במכשיר ושורדים רענון) =====
const REPORT_PREFIX = 'hmc:proc:'

export function saveProcedureReport(rec) {
  const r = { ...rec, savedAt: rec.savedAt || new Date().toISOString() }
  const key = `${REPORT_PREFIX}${r.procId}:${Date.now()}`
  storage.setJSON(key, r)
  return key
}

export function listProcedureReports(procId) {
  const pre = REPORT_PREFIX + procId + ':'
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
      dateLabel: d.toLocaleDateString('he-IL'),
      timeLabel: d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    })
  }
  out.sort((a, b) => b.sortTs - a.sortTs)
  return out
}

export function deleteProcedureReport(key) {
  storage.removeItem(key)
}
