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

  // מרפאת כאב – פריטים עם מק"ט. המק"ט מוסתר במסך ונשלח רק בהודעת החוסרים בוואטסאפ.
  pain: {
    title: "צ'ק-ליסט הכנת ציוד · מרפאת כאב",
    waTitle: 'מרפאת כאב - ציוד חסר',
    blocks: [
      {
        id: 'meds',
        title: 'רשימת תרופות',
        note: RECOMMENDATION,
        items: [
          { name: `I.BETHAMETHASONE (CELESTONE)`, sku: '32000054' },
          { name: `I.BETHAMETHASONE (DIPROSPAN) 2ml`, sku: '32000447' },
          { name: `I.BUPIVACAINE (0.5%) 10ml`, sku: '32000768' },
          { name: `I.DEXAMETHASONE (DEXACORT)`, sku: '32000056' },
          { name: `I.IOHEXOL 350 (OMNIPAQUE) 100ml`, sku: '37000015' },
          { name: `I.LIDOCAINE 1% 10ml`, sku: '32000109' },
          { name: `I.LIDOCAINE 2% 10ml`, sku: '32000108' },
          { name: `I.METHYLPREDNISOLONE (DEPO-MEDROL)`, sku: '32000624' },
          { name: `SOL.DR.TRAMADOL (TRAMAL)`, sku: '32000324' },
          { name: `I.SOD.BICARBONATE 8.4% 100ml`, sku: '32000416' },
          { name: `CR.LIDOCAINE 2% JELLY 30g`, sku: '33000004' },
          { name: `T.IBUPROFEN 400mg (ARTOFEN)`, sku: '32000048' },
          { name: `T.LORATADINE 10mg (LORASTINE)`, sku: '32000041' },
          { name: `T.DIPYRONE 500mg (OPTALGIN)`, sku: '32000016' },
          { name: `ATROPINE 1MG/ML`, sku: '32000244' },
        ],
      },
      {
        id: 'rf',
        title: 'RF, אפידורל, ספיינל ו-US',
        items: [
          { name: `מדבקות RF`, sku: '20000989' },
          { name: `RF CANULA 10CM 20GA (מחט בזוויט)`, sku: '10100597' },
          { name: `RF CANULA 10CM (מחט ישר)`, sku: '10100596' },
          { name: `RF CANULA 5CM (מחט)`, sku: '10100594' },
          { name: `RF CANULA 15CM (מחט)`, sku: '10100595' },
          { name: `SONOTAP CANN. 22G*80MM (קופסא ירוקה)`, sku: '20000944' },
          { name: `STRAIGHT RF CANNULA 5MM 22G`, sku: '11701044' },
          { name: `STRAIGHT RF CANNULA 10MM 22G`, sku: '11701043' },
          { name: `STRAIGHT RF CANNULA 150MM 20G`, sku: '11701132' },
          { name: `מחט ULTRASOUNDS 21G*90MM`, sku: '20000723' },
          { name: `מחט ULTRASOUNDS 21G*120MM`, sku: '20000731' },
          { name: `מחט ULTRASOUNDS 22G*70MM`, sku: '20000440' },
          { name: `מחט ULTRASOUNDS 22G*50MM`, sku: '20000439' },
          { name: `SPINAL NEEDLE 22G*103MM 40 MM`, sku: '10100554' },
          { name: `מחט ספיינל 22G שחורה`, sku: '10100027' },
          { name: `סט אפידורל (MINIPACK)`, sku: '10100088' },
        ],
      },
      {
        id: 'gloves',
        title: 'כפפות ניטריל סטריליות (ללא לטקס)',
        items: [
          { name: `כפפה ניטריל סטרילית 6.5 (ללא לטקס)`, sku: '20000336' },
          { name: `כפפה ניטריל סטרילית 7 (ללא לטקס)`, sku: '20000337' },
          { name: `כפפה ניטריל סטרילית 7.5 (ללא לטקס)`, sku: '20000338' },
          { name: `כפפה ניטריל סטרילית 8 (ללא לטקס)`, sku: '20000339' },
          { name: `כפפה ניטריל סטרילית 8.5 (ללא לטקס)`, sku: '20000340' },
        ],
      },
      {
        id: 'syringes',
        title: 'מזרקים ומחטים',
        items: [
          { name: `מזרק אינסולין 1CC + מחט 29G`, sku: '20000113' },
          { name: `מזרק 3 סמ"ק (3 חלקים)`, sku: '20000100' },
          { name: `מזרק 5 סמ"ק`, sku: '20000101' },
          { name: `מזרק 10 סמ"ק`, sku: '20000102' },
          { name: `מזרק 20 סמ"ק`, sku: '20000103' },
          { name: `מחט 18G (ורודה)`, sku: '20000118' },
          { name: `מחט 21G (ירוקה)`, sku: '20000121' },
          { name: `מחט 25G (כתומה)`, sku: '20000123' },
        ],
      },
      {
        id: 'infusion',
        title: 'עירוי ומתכלים',
        items: [
          { name: `ונפלונים`, sku: 'Multiple' },
          { name: `סט עירוי (Infusion Set)`, sku: '20000233' },
          { name: `ברז 3-Way לעירוי`, sku: '20000163' },
          { name: `קיבוע Tegaderm 6*8`, sku: '20000076' },
          { name: `ג'ל אולטרסאונד סטרילי`, sku: '15400003' },
          { name: `כיסוי סטרילי לאולטרסאונד`, sku: '20800026' },
        ],
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
