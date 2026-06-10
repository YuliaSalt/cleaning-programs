// בקרת תרופות חודשית – רשימת תרופות לכל מחלקה + שמירה/קריאה של דוחות (מקומי).
// הרשימות כרגע דמה עד לקבלת הרשימות האמיתיות. להוספת מחלקה: הוסיפו מפתח unitId.

import { storage } from './storage.js'
import { pushReport } from './cloudSync.js'
import { findUnit } from './departments.js'

// כל פריט: { name, sku, group }. group משמש לכותרות ביניים בתצוגה.
const G_IV = 'תרופות IV – מתן תוך-ורידי / זריקות ונוזלים'
const G_PO = 'תרופות PO – מתן דרך הפה'
const G_OTHER = 'תרופות וציוד נוסף'

const GASTRO_MEDS = [
  { name: 'I.ADRENALINE 1 mg/ml', sku: '32000191', group: G_IV },
  { name: 'I.AMPICILLIN 1g PENIBRIN', sku: '30500035', group: G_IV },
  { name: 'I.ATROPINE 1 mg/ml', sku: '32000244', group: G_IV },
  { name: 'I.BETHAMETHASONE DIPROPIONATE DIPROSPAN 2ml', sku: '32000447', group: G_IV },
  { name: 'I.BETHAMETHASONE. 3+3 CELESTONE', sku: '32000054', group: G_IV },
  { name: 'I.BUPIVACAINE (0.5%) 5mg /ml 10ml', sku: '32000768', group: G_IV },
  { name: 'I.CEFAZOLIN 1g', sku: '30500017', group: G_IV },
  { name: 'I.CEFUROXIME 750mg ZINACEF', sku: '30500020', group: G_IV },
  { name: 'I.DEXAMETHASONE 4mg/ml DEXACORT', sku: '32000056', group: G_IV },
  { name: 'I.EPHEDRINE 50mg/ml', sku: '32000192', group: G_IV },
  { name: 'I.FLUMAZENIL 0.5 mg/5ml ANEXATE', sku: '32000009', group: G_IV },
  { name: 'I.FUROSEMIDE 20mg/ 2ml FUSID', sku: '32000219', group: G_IV },
  { name: 'I.GLUCAGON 1mg', sku: '32000460', group: G_IV },
  { name: 'I.GLUCOSE / DEXTROSE 50% 10g/20ml', sku: '32000236', group: G_IV },
  { name: 'I.GLUCOSE /DEXTR. 5% 0.5L', sku: '35500002', group: G_IV },
  { name: 'I.GLUCOSE /DEXTR. 5% 100 ml', sku: '35500032', group: G_IV },
  { name: 'I.HYDROCORTISONE 100mg SOLU-CORTEF', sku: '32000065', group: G_IV },
  { name: 'I.INDIGOCARMINE 0.4% 20mg/5ml', sku: '32000750', group: G_IV },
  { name: 'I.IOHEXOL 350 OMNIPAQUE 100ml', sku: '37000015', group: G_IV },
  { name: 'I.ISOKET 10mg/10ml', sku: '32000081', group: G_IV },
  { name: 'I.LABETALOL 100mg/20ml TRANDATE', sku: '32000135', group: G_IV },
  { name: 'I.LIDOCAINE 1% 100 mg/10ml', sku: '32000109', group: G_IV },
  { name: 'I.LIDOCAINE 2% 200 mg/10ml', sku: '32000108', group: G_IV },
  { name: 'I.METHYLPREDNISOLONE DEPO-MEDROL 40mg', sku: '32000624', group: G_IV },
  { name: 'I.MIDAZOLAM 5mg/5ml DORMICUM', sku: '39000013', group: G_IV },
  { name: 'I.NALOXONE 0.4mg NARCAN', sku: '32000007', group: G_IV },
  { name: 'I.NEOSTIGMINE 2.5mg/ml', sku: '32000287', group: G_IV },
  { name: 'I.ONDANSETRON 8mg/4ml ZOFRAN', sku: '32000389', group: G_IV },
  { name: 'I.PAPAVERINE 40mg/2ml', sku: '32000005', group: G_IV },
  { name: 'I.PARACETAMOL 1g', sku: '32000681', group: G_IV },
  { name: 'I.PROMETHAZINE 50mg/2ml PROTHIAZINE', sku: '32000290', group: G_IV },
  { name: 'I.PROPOFOL 1% 20ml', sku: '32000026', group: G_IV },
  { name: 'I.RINGER LACTATE 0.5L', sku: '35500008', group: G_IV },
  { name: 'I.ROCURONIUM 50mg/5ml ESMERON', sku: '32000247', group: G_IV },
  { name: 'I.SOD.BICARBONATE 8.4% 100ml', sku: '32000416', group: G_IV },
  { name: 'I.SOD.CHLORIDE 0.9% 0.5L', sku: '35500010', group: G_IV },
  { name: 'I.SOD.CHLORIDE 0.9% 100ml', sku: '35500022', group: G_IV },
  { name: 'I.SODIUM CHLORIDE 0.9% 10ml', sku: '32000279', group: G_IV },
  { name: 'I.SUCCINYLCHOLINE 100mg PWD for INJ', sku: '32000792', group: G_IV },
  { name: 'I.TRANEXAMIC ACID 0.5g/5ml HEXAKAPRON', sku: '32000037', group: G_IV },
  { name: 'I.WATER for INJECTION 10ml', sku: '32000277', group: G_IV },
  { name: 'SOL.DR.TRAMADOL 100mg/ml TRAMAL', sku: '32000324', group: G_PO },
  { name: 'SOL.SIMETHICONE 40mg/0.6ml SIMICOL', sku: '32500074', group: G_PO },
  { name: 'SYR.DIPYRONE 1.25g/5ml 50ml V-DALGIN OPTALGIN', sku: '32500041', group: G_PO },
  { name: 'T.ASPIRIN 100mg CARTIA', sku: '32000017', group: G_PO },
  { name: 'T.CAPTOPRIL 12.5mg', sku: '32000179', group: G_PO },
  { name: 'T.DIPYRONE 500mg OPTALGIN', sku: '32000016', group: G_PO },
  { name: 'T.IBUPROFEN 400mg ARTOFEN', sku: '32000048', group: G_PO },
  { name: 'T.PARACETAMOL 0.5g ACAMOL', sku: '32000013', group: G_PO },
  { name: 'BOT.WATER STERILE IRRIGATION 1L', sku: '35500004', group: G_OTHER },
  { name: 'CR.LIDOCAINE 2% JELLY 30g', sku: '33000004', group: G_OTHER },
  { name: 'INH.SALBUTAMOL 100mcg VENTOLIN', sku: '32500014', group: G_OTHER },
  { name: 'NOZZLES For XYLOCAINE SHORT', sku: '38500047', group: G_OTHER },
  { name: 'S.ALCOHOL 70%+PROPANOL 18% SOFTA-MAN', sku: '36500029', group: G_OTHER },
  { name: 'S.ALCOXIDINE ALCOSEPT 1L', sku: '36500006', group: G_OTHER },
  { name: 'S.CHLORHEXIDINE GLUC. 4% SEPTAL SCRUB', sku: '36500011', group: G_OTHER },
  { name: 'S.SEPTOL SEPTADINE 0.5L', sku: '36500015', group: G_OTHER },
  { name: 'SP.LIDOCAINE 10% 80g XYLOCAINE', sku: '33000009', group: G_OTHER },
  { name: 'SP.NITROLINGUAL 0.4mg /dose', sku: '32000734', group: G_OTHER },
  { name: 'SYR.LUBRICANT JELLY 8ml STERILE', sku: '33000085', group: G_OTHER },
  { name: 'CARPULE LIDOCAINE ADRENALINE', sku: '32000020', group: G_OTHER },
  { name: "ג'ל עזרקאין סטרילי במזרקים (10 בחבילה)", sku: '33000092', group: G_OTHER },
  { name: 'LUGOL 25ml תמיסת יוד למריחה', sku: '34300001', group: G_OTHER },
]

export const MED_LISTS = {
  gastro: GASTRO_MEDS,
}

export function getMedList(unitId) {
  return MED_LISTS[unitId] || []
}

// האם למחלקה יש בקרת תרופות מוגדרת
export function hasMedList(unitId) {
  return Array.isArray(MED_LISTS[unitId]) && MED_LISTS[unitId].length > 0
}

// סטטוסים: ok=תקין(✓ ירוק) · missing=חסר(− צהוב) · expired=לא בתוקף(✗ אדום)
export function emptyMedState(list) {
  return list.map(() => ({ status: 'ok', expiry: '', order: false }))
}

const PREFIX = 'hmc:meds:'

// תיאור סטטוס קריא לגיליון
const MED_STATUS_LABEL = { ok: 'תקין', missing: 'חסר', expired: 'לא בתוקף' }

// ייצוג קריא של דוח בקרת התרופות לגיליון (meta + עמודה לכל תרופה), בדומה לדוחות והעברות משמרת.
export function buildMedReadable(rec) {
  const list = getMedList(rec.unitId)
  const unit = findUnit(rec.unitId)
  const columns = list.map((def, i) => {
    const it = (rec.items && rec.items[i]) || {}
    const parts = [MED_STATUS_LABEL[it.status] || 'תקין']
    if (it.expiry) parts.push('תוקף: ' + it.expiry)
    if (it.order) parts.push('להזמין')
    return [def.name, parts.join(' · ')]
  })
  return {
    meta: {
      savedAt: rec.savedAt,
      unitName: unit ? unit.name : rec.unitId,
      date: rec.month,
      shift: '',
      by: rec.by || '',
      kind: 'בקרת תרופות',
    },
    columns,
  }
}

export function saveMedReport(unitId, month, items, by) {
  const rec = { unitId, month, items, by: by || '', savedAt: new Date().toISOString() }
  const key = `${PREFIX}${unitId}:${month}:${Date.now()}`
  storage.setJSON(key, rec)
  pushReport(key, rec, 'save', buildMedReadable(rec)) // גיבוי/סנכרון ענן + שורה קריאה בגיליון (best-effort)
  return key
}

// מצב התחלתי לטופס: ממשיכים מהדוח האחרון שנחתם (תוקף/סטטוס נשמרים בין פתיחות).
// משתנה רק כשמזינים מחדש וחותמים שוב. אם אין דוח קודם – מצב נקי (הכל תקין).
export function getLatestMedItems(unitId, list) {
  const base = emptyMedState(list)
  const reports = listMedReports(unitId) // ממוין מהחדש לישן
  if (!reports.length) return base
  const prev = reports[0].record.items || []
  return base.map((def, i) =>
    prev[i] ? { status: prev[i].status || 'ok', expiry: prev[i].expiry || '', order: !!prev[i].order } : def
  )
}

export function listMedReports(unitId) {
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
      savedAt: r.savedAt,
      sortTs: d.getTime(),
      year: d.getFullYear(),
      month: d.getMonth(),
      dateISO: d.toLocaleDateString('en-CA'),
      dateLabel: d.toLocaleDateString('he-IL'),
      timeLabel: d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    })
  }
  out.sort((a, b) => b.sortTs - a.sortTs)
  return out
}
