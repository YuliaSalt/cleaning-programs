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

// ===== IVF – רשימת תרופות לפי קטגוריות =====
const IVF_MEDS = [
  { name: 'I.AUGMENTIN 1g CLAVENIR', sku: '30500040', group: 'אנטיביוטיקה (Antibiotics)' },
  { name: 'I.CEFAZOLIN 1g', sku: '30500017', group: 'אנטיביוטיקה (Antibiotics)' },
  { name: 'I.CLINDAMYCIN 600mg', sku: '30500053', group: 'אנטיביוטיקה (Antibiotics)' },
  { name: 'I.BUPIVACAINE 0.5% 20ml MARCAINE', sku: '32000021', group: 'אלחושים מקומיים (Local Anesthetics)' },
  { name: 'I.LIDOCAINE 1% 100 mg/10ml', sku: '32000109', group: 'אלחושים מקומיים (Local Anesthetics)' },
  { name: 'I.LIDOCAINE 2% 200 mg/10ml', sku: '32000108', group: 'אלחושים מקומיים (Local Anesthetics)' },
  { name: 'I.MIDAZOLAM 5mg/5ml DORMICUM', sku: '39000013', group: 'חומרי הרדמה, הרגעה ונוגדי חרדה (Anesthetics & Sedatives)' },
  { name: 'I.PROPOFOL 1% 20ml', sku: '32000026', group: 'חומרי הרדמה, הרגעה ונוגדי חרדה (Anesthetics & Sedatives)' },
  { name: 'I.NEOSTIGMINE 2.5mg/ml', sku: '32000287', group: 'משתקי שרירים ונוגדי היפוך (Neuromuscular Blockers & Reversal)' },
  { name: 'I.SUCCINYLCHOLINE 100mg PWD for INJ', sku: '32000792', group: 'משתקי שרירים ונוגדי היפוך (Neuromuscular Blockers & Reversal)' },
  { name: 'I.COMBODEX IBUPR 0.3g+PARACET 1g/100ml', sku: '32000654', group: 'משככי כאבים, מורידי חום ונוגדי דלקת (Analgesics, Antipyretics & NSAIDs)' },
  { name: 'I.DICLOFENAC 75mg/3ml VOLTAREN', sku: '32000046', group: 'משככי כאבים, מורידי חום ונוגדי דלקת (Analgesics, Antipyretics & NSAIDs)' },
  { name: 'I.DIPYRONE 1g/2ml OPTALGIN', sku: '32000680', group: 'משככי כאבים, מורידי חום ונוגדי דלקת (Analgesics, Antipyretics & NSAIDs)' },
  { name: 'I.KETOROLAC 30mg', sku: '32000010', group: 'משככי כאבים, מורידי חום ונוגדי דלקת (Analgesics, Antipyretics & NSAIDs)' },
  { name: 'I.PARACETAMOL 1g', sku: '32000681', group: 'משככי כאבים, מורידי חום ונוגדי דלקת (Analgesics, Antipyretics & NSAIDs)' },
  { name: 'I.TRAMADOL 100mg TRAMAL', sku: '32000391', group: 'משככי כאבים, מורידי חום ונוגדי דלקת (Analgesics, Antipyretics & NSAIDs)' },
  { name: 'SUPP.PARACETAMOL 0.5g SUPRAMOL', sku: '33000003', group: 'משככי כאבים, מורידי חום ונוגדי דלקת (Analgesics, Antipyretics & NSAIDs)' },
  { name: 'SYR.DIPYRONE 1.25g/5ml 50ml V-DALGIN OPTALGIN', sku: '32500041', group: 'משככי כאבים, מורידי חום ונוגדי דלקת (Analgesics, Antipyretics & NSAIDs)' },
  { name: 'T.DIPYRONE 500mg OPTALGIN', sku: '32000016', group: 'משככי כאבים, מורידי חום ונוגדי דלקת (Analgesics, Antipyretics & NSAIDs)' },
  { name: 'T.PARACETAMOL 0.5g ACAMOL', sku: '32000013', group: 'משככי כאבים, מורידי חום ונוגדי דלקת (Analgesics, Antipyretics & NSAIDs)' },
  { name: 'I.METOCLOPRAMIDE 10mg/2ml PRAMIN', sku: '32000267', group: 'מערכת העיכול ונוגדי בחילות/הקאות (Gastrointestinal & Antiemetics)' },
  { name: 'I.ONDANSETRON 8mg/4ml ZOFRAN', sku: '32000389', group: 'מערכת העיכול ונוגדי בחילות/הקאות (Gastrointestinal & Antiemetics)' },
  { name: 'I.PAPAVERINE 40mg/2ml', sku: '32000005', group: 'מערכת העיכול ונוגדי בחילות/הקאות (Gastrointestinal & Antiemetics)' },
  { name: 'T.METOCLOPRAMIDE 10mg PRAMIN', sku: '32000262', group: 'מערכת העיכול ונוגדי בחילות/הקאות (Gastrointestinal & Antiemetics)' },
  { name: 'I.DEXAMETHASONE 4mg/ml DEXACORT', sku: '32000056', group: 'סטרואידים (Corticosteroids)' },
  { name: 'I.HYDROCORTISONE 100mg SOLU-CORTEF', sku: '32000065', group: 'סטרואידים (Corticosteroids)' },
  { name: 'I.ATROPINE 1 mg/ml', sku: '32000244', group: 'מערכת לבבית וכלי דם / נוגדי לחץ דם (Cardiovascular & Antihypertensives)' },
  { name: 'I.LABETALOL 100mg/20ml TRANDATE', sku: '32000135', group: 'מערכת לבבית וכלי דם / נוגדי לחץ דם (Cardiovascular & Antihypertensives)' },
  { name: 'I.PROMETHAZINE 50mg/2ml PROTHIAZINE', sku: '32000290', group: 'נוגדי אלרגיה ואנטי-היסטמינים (Antihistamines)' },
  { name: 'T.LORATADINE 10mg LORASTINE', sku: '32000041', group: 'נוגדי אלרגיה ואנטי-היסטמינים (Antihistamines)' },
  { name: 'I.FLUMAZENIL 0.5 mg/5ml ANEXATE', sku: '32000009', group: 'נוגדי רעלים / חומרי היפוך (Antidotes)' },
  { name: 'I.NALOXONE 0.4mg NARCAN', sku: '32000007', group: 'נוגדי רעלים / חומרי היפוך (Antidotes)' },
  { name: 'I.TRANEXAMIC ACID 0.5g/5ml HEXAKAPRON', sku: '32000037', group: 'נוגדי דימום (Antifibrinolytics)' },
  { name: 'I.GLUCOSE / DEXTROSE 50% 10g/20ml', sku: '32000236', group: 'נוזלים, תמיסות וסוכרים לעירוי (Fluids & Electrolytes)' },
  { name: 'I.SODIUM CHLORIDE 0.9% 10ml', sku: '32000279', group: 'נוזלים, תמיסות וסוכרים לעירוי (Fluids & Electrolytes)' },
  { name: 'I.WATER for INJECTION 10ml', sku: '32000277', group: 'נוזלים, תמיסות וסוכרים לעירוי (Fluids & Electrolytes)' },
  { name: 'CR.DIMETHICONE 100g SILICONE', sku: '33500032', group: 'קרמים, משחות ותכשירים לעור (Topical & Skin Care)' },
  { name: 'CR.VASELIN IN TUBE 25g', sku: '33500029', group: 'קרמים, משחות ותכשירים לעור (Topical & Skin Care)' },
  { name: 'SILVER NITRATE APPLICATORS', sku: '33000031', group: 'קרמים, משחות ותכשירים לעור (Topical & Skin Care)' },
  { name: 'S.ALCOHOL 45%+PROPANOL 18% SOFTA-MAN', sku: '36500029', group: 'חומרי חיטוי (Antiseptics & Disinfectants)' },
  { name: 'S.ALCOXIDINE ALCOSEPT 1L', sku: '36500006', group: 'חומרי חיטוי (Antiseptics & Disinfectants)' },
  { name: 'S.CHLORHEXIDINE 0.05% 10ml CEDIUM', sku: '36500035', group: 'חומרי חיטוי (Antiseptics & Disinfectants)' },
  { name: 'S.CHLORHEXIDINE GLUC. 4% SEPTAL SCRUB', sku: '36500011', group: 'חומרי חיטוי (Antiseptics & Disinfectants)' },
  { name: 'S.POVIDONE 10% 300ml IODO-VIT', sku: '36500024', group: 'חומרי חיטוי (Antiseptics & Disinfectants)' },
  { name: 'S.SEPTOL SEPTADINE 0.5L', sku: '36500015', group: 'חומרי חיטוי (Antiseptics & Disinfectants)' },
]

// ===== התאוששות (1 ו-2) – רשימת תרופות לפי קטגוריות, משותפת לשני החדרים =====
const RECOVERY_MEDS = [
  { name: 'CR.CHLORAMPHENICOL 3% 10g SYNTHO', sku: '33500021', group: 'אנטיביוטיקה ותכשירים אנטי-מיקרוביאליים (Antibiotics & Antimicrobials)' },
  { name: 'E.UNG.CHLORAMPHENICOL 5% SYNTHO', sku: '33500020', group: 'אנטיביוטיקה ותכשירים אנטי-מיקרוביאליים (Antibiotics & Antimicrobials)' },
  { name: 'I.AMPICILLIN 1g PENIBRIN', sku: '30500035', group: 'אנטיביוטיקה ותכשירים אנטי-מיקרוביאליים (Antibiotics & Antimicrobials)' },
  { name: 'I.CEFAZOLIN 1g', sku: '30500017', group: 'אנטיביוטיקה ותכשירים אנטי-מיקרוביאליים (Antibiotics & Antimicrobials)' },
  { name: 'I.CEFTRIAXONE 1g ROCEPHIN', sku: '30500015', group: 'אנטיביוטיקה ותכשירים אנטי-מיקרוביאליים (Antibiotics & Antimicrobials)' },
  { name: 'I.GENTAMICIN 80mg/2ml', sku: '30500013', group: 'אנטיביוטיקה ותכשירים אנטי-מיקרוביאליים (Antibiotics & Antimicrobials)' },
  { name: 'I.METRONIDAZOLE 500mg/100ml', sku: '30500003', group: 'אנטיביוטיקה ותכשירים אנטי-מיקרוביאליים (Antibiotics & Antimicrobials)' },
  { name: 'T.CIPROFLOXACIN 500mg', sku: '30500019', group: 'אנטיביוטיקה ותכשירים אנטי-מיקרוביאליים (Antibiotics & Antimicrobials)' },
  { name: 'T.DOXYCYCLINE 100mg', sku: '30500052', group: 'אנטיביוטיקה ותכשירים אנטי-מיקרוביאליים (Antibiotics & Antimicrobials)' },
  { name: 'T.OFLOXACIN 200mg TARIVID', sku: '30500014', group: 'אנטיביוטיקה ותכשירים אנטי-מיקרוביאליים (Antibiotics & Antimicrobials)' },
  { name: 'CR.LIDOCAINE 2% JELLY 30g', sku: '33000004', group: 'אלחושים מקומיים ותכשירים לאלחוש (Local Anesthetics)' },
  { name: 'CR.LIDOCAINE+PRILOCAINE EMLA 5% 30g', sku: '33000008', group: 'אלחושים מקומיים ותכשירים לאלחוש (Local Anesthetics)' },
  { name: 'I.LIDOCAINE 1% 100 mg/10ml', sku: '32000109', group: 'אלחושים מקומיים ותכשירים לאלחוש (Local Anesthetics)' },
  { name: 'I.LIDOCAINE 2% 200 mg/10ml', sku: '32000108', group: 'אלחושים מקומיים ותכשירים לאלחוש (Local Anesthetics)' },
  { name: 'INSTILLAgel LIDOCAINE & CHLORHEXIDINE 11ml', sku: '33000092', group: 'אלחושים מקומיים ותכשירים לאלחוש (Local Anesthetics)' },
  { name: 'NOZZLES For XYLOCAINE SHORT', sku: '38500047', group: 'אלחושים מקומיים ותכשירים לאלחוש (Local Anesthetics)' },
  { name: 'SP.LIDOCAINE 10% 80g XYLOCAINE', sku: '33000009', group: 'אלחושים מקומיים ותכשירים לאלחוש (Local Anesthetics)' },
  { name: 'I.DEXMEDETOMIDINE 200mcg PRECEDEX', sku: '32000683', group: 'חומרי הרדמה, הרגעה ונוגדי חרדה (Anesthetics, Sedatives & Anxiolytics)' },
  { name: 'I.MIDAZOLAM 5mg/5ml DORMICUM', sku: '39000013', group: 'חומרי הרדמה, הרגעה ונוגדי חרדה (Anesthetics, Sedatives & Anxiolytics)' },
  { name: 'I.MIDAZOLAM 5mg/ml DORMICUM', sku: '39000014', group: 'חומרי הרדמה, הרגעה ונוגדי חרדה (Anesthetics, Sedatives & Anxiolytics)' },
  { name: 'I.PROPOFOL 1% 20ml', sku: '32000026', group: 'חומרי הרדמה, הרגעה ונוגדי חרדה (Anesthetics, Sedatives & Anxiolytics)' },
  { name: 'T.DIAZEPAM 5mg ASSIVAL', sku: '39000005', group: 'חומרי הרדמה, הרגעה ונוגדי חרדה (Anesthetics, Sedatives & Anxiolytics)' },
  { name: 'T.LORAZEPAM 1mg LORIVAN', sku: '39000008', group: 'חומרי הרדמה, הרגעה ונוגדי חרדה (Anesthetics, Sedatives & Anxiolytics)' },
  { name: 'T.OXAZEPAM 10mg VABEN', sku: '39000007', group: 'חומרי הרדמה, הרגעה ונוגדי חרדה (Anesthetics, Sedatives & Anxiolytics)' },
  { name: 'I.NEOSTIGMINE 2.5mg/ml', sku: '32000287', group: 'משתקי שרירים וחומרי היפוך להרפיה (Neuromuscular Blockers & Reversal)' },
  { name: 'I.SUGAMMADEX 200mg/2ml BRIDION', sku: '32000763', group: 'משתקי שרירים וחומרי היפוך להרפיה (Neuromuscular Blockers & Reversal)' },
  { name: 'I.DICLOFENAC 75mg/3ml VOLTAREN', sku: '32000046', group: 'משככי כאבים, מורידי חום ונוגדי דלקת (Analgesics, Antipyretics & NSAIDs)' },
  { name: 'I.DIPYRONE 1g/2ml OPTALGIN', sku: '32000680', group: 'משככי כאבים, מורידי חום ונוגדי דלקת (Analgesics, Antipyretics & NSAIDs)' },
  { name: 'I.PARACETAMOL 1g', sku: '32000681', group: 'משככי כאבים, מורידי חום ונוגדי דלקת (Analgesics, Antipyretics & NSAIDs)' },
  { name: 'I.TRAMADOL 100mg TRAMAL', sku: '32000391', group: 'משככי כאבים, מורידי חום ונוגדי דלקת (Analgesics, Antipyretics & NSAIDs)' },
  { name: 'SOL.PARACETAMOL 100mg/ml NOVIMOL 15ml', sku: '32500077', group: 'משככי כאבים, מורידי חום ונוגדי דלקת (Analgesics, Antipyretics & NSAIDs)' },
  { name: 'SUPP.DICLOFENAC 50mg VOLTAREN', sku: '33000012', group: 'משככי כאבים, מורידי חום ונוגדי דלקת (Analgesics, Antipyretics & NSAIDs)' },
  { name: 'SUPP.IBUPROFEN 125mg NUROFEN', sku: '33000081', group: 'משככי כאבים, מורידי חום ונוגדי דלקת (Analgesics, Antipyretics & NSAIDs)' },
  { name: 'SUPP.PARACETAMOL 0.5g SUPRAMOL', sku: '33000003', group: 'משככי כאבים, מורידי חום ונוגדי דלקת (Analgesics, Antipyretics & NSAIDs)' },
  { name: 'SYR.DIPYRONE 1.25g/5ml 50ml V-DALGIN OPTALGIN', sku: '32500041', group: 'משככי כאבים, מורידי חום ונוגדי דלקת (Analgesics, Antipyretics & NSAIDs)' },
  { name: 'SYR.IBUPROFEN 100mg/5ml NUROFEN', sku: '32500001', group: 'משככי כאבים, מורידי חום ונוגדי דלקת (Analgesics, Antipyretics & NSAIDs)' },
  { name: 'T.DIPYRONE 500mg OPTALGIN', sku: '32000016', group: 'משככי כאבים, מורידי חום ונוגדי דלקת (Analgesics, Antipyretics & NSAIDs)' },
  { name: 'T.PARACETAMOL 0.5g ACAMOL', sku: '32000013', group: 'משככי כאבים, מורידי חום ונוגדי דלקת (Analgesics, Antipyretics & NSAIDs)' },
  { name: 'I.ADENOSINE 6 mg ADENOCOR', sku: '32000111', group: 'מערכת לבבית, כלי דם ותרופות החייאה (Cardiovascular, Inotropes & Antiarrythmics)' },
  { name: 'I.ADRENALINE 1 mg/ml', sku: '32000191', group: 'מערכת לבבית, כלי דם ותרופות החייאה (Cardiovascular, Inotropes & Antiarrythmics)' },
  { name: 'I.AMIODARONE 150mg /3ml PROCOR', sku: '32000101', group: 'מערכת לבבית, כלי דם ותרופות החייאה (Cardiovascular, Inotropes & Antiarrythmics)' },
  { name: 'I.ATROPINE 1 mg/ml', sku: '32000244', group: 'מערכת לבבית, כלי דם ותרופות החייאה (Cardiovascular, Inotropes & Antiarrythmics)' },
  { name: 'I.DOPAMINE 200mg/5ml', sku: '32000190', group: 'מערכת לבבית, כלי דם ותרופות החייאה (Cardiovascular, Inotropes & Antiarrythmics)' },
  { name: 'I.EPHEDRINE 50mg/ml', sku: '32000192', group: 'מערכת לבבית, כלי דם ותרופות החייאה (Cardiovascular, Inotropes & Antiarrythmics)' },
  { name: 'I.HYDRALAZINE 20mg/ml', sku: '32000423', group: 'מערכת לבבית, כלי דם ותרופות החייאה (Cardiovascular, Inotropes & Antiarrythmics)' },
  { name: 'I.ISOKET 10mg/10ml', sku: '32000081', group: 'מערכת לבבית, כלי דם ותרופות החייאה (Cardiovascular, Inotropes & Antiarrythmics)' },
  { name: 'I.LABETALOL 100mg/20ml TRANDATE', sku: '32000135', group: 'מערכת לבבית, כלי דם ותרופות החייאה (Cardiovascular, Inotropes & Antiarrythmics)' },
  { name: 'I.METOPROLOL 5mg/5ml LOPRESSOR', sku: '32000129', group: 'מערכת לבבית, כלי דם ותרופות החייאה (Cardiovascular, Inotropes & Antiarrythmics)' },
  { name: 'I.PROPRANOLOL 1mg INDERAL', sku: '32000133', group: 'מערכת לבבית, כלי דם ותרופות החייאה (Cardiovascular, Inotropes & Antiarrythmics)' },
  { name: 'I.VERAPAMIL 5mg/2ml IKACOR', sku: '32000114', group: 'מערכת לבבית, כלי דם ותרופות החייאה (Cardiovascular, Inotropes & Antiarrythmics)' },
  { name: 'SP.NITROLINGUAL 0.4mg /dose', sku: '32000734', group: 'מערכת לבבית, כלי דם ותרופות החייאה (Cardiovascular, Inotropes & Antiarrythmics)' },
  { name: 'T.ATENOLOL 25mg NORMITEN', sku: '32500001', group: 'מערכת לבבית, כלי דם ותרופות החייאה (Cardiovascular, Inotropes & Antiarrythmics)' },
  { name: 'T.CAPTOPRIL 12.5mg', sku: '32000179', group: 'מערכת לבבית, כלי דם ותרופות החייאה (Cardiovascular, Inotropes & Antiarrythmics)' },
  { name: 'T.CLONIDINE 0.15mg NORMOPRESAN', sku: '32000151', group: 'מערכת לבבית, כלי דם ותרופות החייאה (Cardiovascular, Inotropes & Antiarrythmics)' },
  { name: 'I.ENOXAPARINE 40mg CLEXANE 40', sku: '32000164', group: 'נוגדי קרישה (Anticoagulants)' },
  { name: 'I.ENOXAPARINE 60mg CLEXANE 60', sku: '32000167', group: 'נוגדי קרישה (Anticoagulants)' },
  { name: 'I.HEPARIN 5000 units/ml 5ml', sku: '32000157', group: 'נוגדי קרישה (Anticoagulants)' },
  { name: 'INH.SALBUTAMOL 100mcg VENTOLIN', sku: '32500014', group: 'מערכת הנשימה ומשאפים (Respiratory & Bronchodilators)' },
  { name: 'INH.SUSP.BUDESONIDE 1mg BUDICORT', sku: '32500050', group: 'מערכת הנשימה ומשאפים (Respiratory & Bronchodilators)' },
  { name: 'SOL.BROMHEXINE 2mg/ml MOVEX', sku: '32500022', group: 'מערכת הנשימה ומשאפים (Respiratory & Bronchodilators)' },
  { name: 'SOL.IPRATROPIUM 0.25mg/ml AEROVENT', sku: '32500015', group: 'מערכת הנשימה ומשאפים (Respiratory & Bronchodilators)' },
  { name: 'SOL.SALBUTAMOL 5mg/ml VENTOLIN', sku: '32500013', group: 'מערכת הנשימה ומשאפים (Respiratory & Bronchodilators)' },
  { name: 'I.METOCLOPRAMIDE 10mg/2ml PRAMIN', sku: '32000267', group: 'מערכת העיכול, נוגדי בחילות והגנה על הקיבה (Gastrointestinal & Antiemetics)' },
  { name: 'I.ONDANSETRON 8mg/4ml ZOFRAN', sku: '32000389', group: 'מערכת העיכול, נוגדי בחילות והגנה על הקיבה (Gastrointestinal & Antiemetics)' },
  { name: 'I.PANTOPRAZOLE 40mg CONTROLOC', sku: '32000576', group: 'מערכת העיכול, נוגדי בחילות והגנה על הקיבה (Gastrointestinal & Antiemetics)' },
  { name: 'I.PAPAVERINE 40mg/2ml', sku: '32000005', group: 'מערכת העיכול, נוגדי בחילות והגנה על הקיבה (Gastrointestinal & Antiemetics)' },
  { name: 'T.DIMENHYDRINATE 100mg TRAVAMIN', sku: '32000272', group: 'מערכת העיכול, נוגדי בחילות והגנה על הקיבה (Gastrointestinal & Antiemetics)' },
  { name: 'T.METOCLOPRAMIDE 10mg PRAMIN', sku: '32000262', group: 'מערכת העיכול, נוגדי בחילות והגנה על הקיבה (Gastrointestinal & Antiemetics)' },
  { name: 'T.MISOPROSTOL 200mcg CYTOTEC', sku: '32000257', group: 'מערכת העיכול, נוגדי בחילות והגנה על הקיבה (Gastrointestinal & Antiemetics)' },
  { name: 'I.DEXAMETHASONE 4mg/ml DEXACORT', sku: '32000056', group: 'סטרואידים (Corticosteroids)' },
  { name: 'I.HYDROCORTISONE 100mg SOLU-CORTEF', sku: '32000065', group: 'סטרואידים (Corticosteroids)' },
  { name: 'I.METHYLPREDNISOLONE 0.5g SOLU-MEDROL', sku: '32000058', group: 'סטרואידים (Corticosteroids)' },
  { name: 'I.METHYLPREDNISOLONE DEPO-MEDROL 40mg', sku: '32000624', group: 'סטרואידים (Corticosteroids)' },
  { name: 'T.PREDNISONE 5mg', sku: '32000057', group: 'סטרואידים (Corticosteroids)' },
  { name: 'I.HALOPERIDOLE 5mg/ml', sku: '32000268', group: 'נוגדי אלרגיה ואנטי-היסטמינים / פסיכיאטריה (Antihistamines & Psychotropics)' },
  { name: 'I.PROMETHAZINE 50mg/2ml PROTHIAZINE', sku: '32000290', group: 'נוגדי אלרגיה ואנטי-היסטמינים / פסיכיאטריה (Antihistamines & Psychotropics)' },
  { name: 'T.LORATADINE 10mg LORASTINE', sku: '32000041', group: 'נוגדי אלרגיה ואנטי-היסטמינים / פסיכיאטריה (Antihistamines & Psychotropics)' },
  { name: 'I.FLUMAZENIL 0.5 mg/5ml ANEXATE', sku: '32000009', group: 'נוגדי רעלים, חומרי היפוך וויטמינים (Antidotes, Reversal Agents & Vitamins)' },
  { name: 'I.NALOXONE 0.4mg NARCAN', sku: '32000007', group: 'נוגדי רעלים, חומרי היפוך וויטמינים (Antidotes, Reversal Agents & Vitamins)' },
  { name: 'I.PHYTOMENADIONE 10mg/ml KONAKION', sku: '32000033', group: 'נוגדי רעלים, חומרי היפוך וויטמינים (Antidotes, Reversal Agents & Vitamins)' },
  { name: 'I.TRANEXAMIC ACID 0.5g/5ml HEXAKAPRON', sku: '32000037', group: 'נוגדי דימום (Antifibrinolytics)' },
  { name: 'I.FUROSEMIDE 20mg/2ml FUSID', sku: '32000219', group: 'משתנים, הורמונים ואינסולין (Diuretics & Endocrine)' },
  { name: 'I.INSULIN APART NOVORAPID 100 units/ml 10ml', sku: '32000691', group: 'משתנים, הורמונים ואינסולין (Diuretics & Endocrine)' },
  { name: 'I.CALCIUM GLUCONATE 10% 10ml', sku: '32000195', group: 'נוזלים, תמיסות, אלקטרוליטים וסוכרים (Fluids, Electrolytes & Nutrients)' },
  { name: 'I.GLUCOSE / DEXTROSE 50% 10g/20ml', sku: '32000236', group: 'נוזלים, תמיסות, אלקטרוליטים וסוכרים (Fluids, Electrolytes & Nutrients)' },
  { name: 'I.SODIUM CHLORIDE 0.9% 10ml', sku: '32000279', group: 'נוזלים, תמיסות, אלקטרוליטים וסוכרים (Fluids, Electrolytes & Nutrients)' },
  { name: 'I.WATER for INJECTION 100ml', sku: '32000669', group: 'נוזלים, תמיסות, אלקטרוליטים וסוכרים (Fluids, Electrolytes & Nutrients)' },
  { name: 'I.WATER for INJECTION 10ml', sku: '32000277', group: 'נוזלים, תמיסות, אלקטרוליטים וסוכרים (Fluids, Electrolytes & Nutrients)' },
  { name: 'CR.DIMETHICONE 100g SILICONE', sku: '33500032', group: 'תכשירים לעור, הגנה ועיניים (Topical, Skin & Ophthalmic Care)' },
  { name: 'CR.NASAL MUPIROCIN 2% 3g BACTROBAN', sku: '33500023', group: 'תכשירים לעור, הגנה ועיניים (Topical, Skin & Ophthalmic Care)' },
  { name: 'CR.VASELIN IN TUBE 25g', sku: '33500029', group: 'תכשירים לעור, הגנה ועיניים (Topical, Skin & Ophthalmic Care)' },
  { name: 'E.UNG.DURATEARS 3.5g', sku: '31700058', group: 'תכשירים לעור, הגנה ועיניים (Topical, Skin & Ophthalmic Care)' },
  { name: 'S.ALCOHOL 45%+PROPANOL 18% SOFTA-MAN', sku: '36500029', group: 'חומרי חיטוי (Antiseptics & Disinfectants)' },
  { name: 'S.ALCOXIDINE ALCOSEPT 1L', sku: '36500006', group: 'חומרי חיטוי (Antiseptics & Disinfectants)' },
  { name: 'S.CHLORHEXIDINE 0.05% 10ml CEDIUM', sku: '36500035', group: 'חומרי חיטוי (Antiseptics & Disinfectants)' },
  { name: 'S.CHLORHEXIDINE GLUC. 4% SEPTAL SCRUB', sku: '36500011', group: 'חומרי חיטוי (Antiseptics & Disinfectants)' },
  { name: 'S.SEPTOL SEPTADINE 0.5L', sku: '36500015', group: 'חומרי חיטוי (Antiseptics & Disinfectants)' },
  { name: 'I.DANTROLENE 20mg DANTRIUM', sku: '32000343', group: 'חומרים אחרים / מיוחדים (Other Agents)' },
]

// ===== טיפול נמרץ (ICU) – רשימת תרופות לפי קטגוריות =====
const ICU_MEDS = [
  // אלקטרוליטים
  { name: 'CALCIUM GLUCONATE 10% 10ml', sku: '32000010', group: 'אלקטרוליטים (Electrolytes) · זריקות, עירוי ואחר' },
  { name: 'MAGNESIUM SULFATE 50% 10ml', sku: '32000055', group: 'אלקטרוליטים (Electrolytes) · זריקות, עירוי ואחר' },
  { name: 'POTASSIUM CHLORIDE 15% 10ml', sku: '32000015', group: 'אלקטרוליטים (Electrolytes) · זריקות, עירוי ואחר' },
  { name: 'SODIUM BICARBONATE 8.4% 10ml', sku: '32000017', group: 'אלקטרוליטים (Electrolytes) · זריקות, עירוי ואחר' },
  { name: 'POTASSIUM CHLORIDE 600mg (SLOW-K)', sku: '32000071', group: 'אלקטרוליטים (Electrolytes) · כדורים (דרך הפה)' },
  // נוזלים – עירוי בלבד
  { name: 'ALBUMIN HUMAN 25% 50ml', sku: '31500012', group: 'נוזלים (Fluids / Volume Expanders)' },
  { name: 'GLUCOSE + DEXTROSE HYPOTONIC', sku: '32000008', group: 'נוזלים (Fluids / Volume Expanders)' },
  { name: 'MANNITOL 20% 100ml', sku: '32000055', group: 'נוזלים (Fluids / Volume Expanders)' },
  { name: 'SODIUM CHLORIDE 0.9% 10ml', sku: '32000010', group: 'נוזלים (Fluids / Volume Expanders)' },
  { name: 'WATER FOR INJECTION', sku: '32000055', group: 'נוזלים (Fluids / Volume Expanders)' },
  // אנטיביוטיקה – זריקות/עירוי בלבד
  { name: 'AMPICILLIN 1g', sku: '32000033', group: 'אנטיביוטיקה ותכשירים אנטי-מיקרוביאליים (Antibiotics & Antimicrobials)' },
  { name: 'CEFTRIAXONE 1g (ROCEPHIN)', sku: '32000021', group: 'אנטיביוטיקה ותכשירים אנטי-מיקרוביאליים (Antibiotics & Antimicrobials)' },
  { name: 'CIPROFLOXACIN 200mg/100ml', sku: '32000020', group: 'אנטיביוטיקה ותכשירים אנטי-מיקרוביאליים (Antibiotics & Antimicrobials)' },
  { name: 'CLINDAMYCIN 600mg/4ml (DALACIN)', sku: '32000006', group: 'אנטיביוטיקה ותכשירים אנטי-מיקרוביאליים (Antibiotics & Antimicrobials)' },
  { name: 'ERYTHROMYCIN 1g', sku: '32000054', group: 'אנטיביוטיקה ותכשירים אנטי-מיקרוביאליים (Antibiotics & Antimicrobials)' },
  { name: 'GENTAMICIN 80mg/2ml', sku: '32000013', group: 'אנטיביוטיקה ותכשירים אנטי-מיקרוביאליים (Antibiotics & Antimicrobials)' },
  { name: 'METRONIDAZOLE 500mg/100ml (FLAGYL)', sku: '32000023', group: 'אנטיביוטיקה ותכשירים אנטי-מיקרוביאליים (Antibiotics & Antimicrobials)' },
  // לב וכלי דם
  { name: 'FUROSEMIDE 250mg/25ml', sku: '32000021', group: 'מערכת הלב וכלי הדם (Cardiovascular) · זריקות, עירוי ואחר' },
  { name: 'LABETALOL 100mg/20ml (TRANDATE)', sku: '32000035', group: 'מערכת הלב וכלי הדם (Cardiovascular) · זריקות, עירוי ואחר' },
  { name: 'AMIODARONE 200mg (PROCOR)', sku: '32000016', group: 'מערכת הלב וכלי הדם (Cardiovascular) · כדורים (דרך הפה)' },
  { name: 'AMLODIPINE 5mg (NORVASC)', sku: '32000022', group: 'מערכת הלב וכלי הדם (Cardiovascular) · כדורים (דרך הפה)' },
  { name: 'ATENOLOL 50mg (NORMITEN)', sku: '32000035', group: 'מערכת הלב וכלי הדם (Cardiovascular) · כדורים (דרך הפה)' },
  { name: 'ATORVASTATIN 10mg (LIPITOR)', sku: '32000010', group: 'מערכת הלב וכלי הדם (Cardiovascular) · כדורים (דרך הפה)' },
  { name: 'BISOPROLOL 2.5mg (CONCOR)', sku: '32000024', group: 'מערכת הלב וכלי הדם (Cardiovascular) · כדורים (דרך הפה)' },
  { name: 'CAPTOPRIL 12.5mg', sku: '32000018', group: 'מערכת הלב וכלי הדם (Cardiovascular) · כדורים (דרך הפה)' },
  { name: 'CARVEDILOL 12.5mg', sku: '32000015', group: 'מערכת הלב וכלי הדם (Cardiovascular) · כדורים (דרך הפה)' },
  { name: 'ENALAPRIL 10mg (ENALADEX)', sku: '32000022', group: 'מערכת הלב וכלי הדם (Cardiovascular) · כדורים (דרך הפה)' },
  { name: 'FUROSEMIDE 20mg (FUSID)', sku: '32000001', group: 'מערכת הלב וכלי הדם (Cardiovascular) · כדורים (דרך הפה)' },
  { name: 'HYDRALAZINE 20mg', sku: '32000022', group: 'מערכת הלב וכלי הדם (Cardiovascular) · כדורים (דרך הפה)' },
  { name: 'HYDROCHLOROTHIAZIDE 12.5ml', sku: '31100022', group: 'מערכת הלב וכלי הדם (Cardiovascular) · כדורים (דרך הפה)' },
  { name: 'ISOSORBIDE DINITRATE 5mg (ISORDIL)', sku: '32000033', group: 'מערכת הלב וכלי הדם (Cardiovascular) · כדורים (דרך הפה)' },
  { name: 'LOSARTAN 50mg (OCSAAR)', sku: '32000022', group: 'מערכת הלב וכלי הדם (Cardiovascular) · כדורים (דרך הפה)' },
  { name: 'METOLAZONE 5mg (ZAROXOLYN)', sku: '32000014', group: 'מערכת הלב וכלי הדם (Cardiovascular) · כדורים (דרך הפה)' },
  { name: 'PROPRANOLOL 10mg (DERALIN)', sku: '32000012', group: 'מערכת הלב וכלי הדם (Cardiovascular) · כדורים (דרך הפה)' },
  { name: 'RAMIPRIL 2.5mg (TRITACE)', sku: '32000073', group: 'מערכת הלב וכלי הדם (Cardiovascular) · כדורים (דרך הפה)' },
  { name: 'VALSARTAN 80mg (DIOVAN)', sku: '32000027', group: 'מערכת הלב וכלי הדם (Cardiovascular) · כדורים (דרך הפה)' },
  // מערכת העצבים, שיכוך כאב והרדמה
  { name: 'HALOPERIDOL 5mg/ml', sku: '32000020', group: 'מערכת העצבים, שיכוך כאב והרדמה (Analgesics & CNS) · זריקות, עירוי ואחר' },
  { name: 'KETAMINE 500mg/10ml', sku: '32000013', group: 'מערכת העצבים, שיכוך כאב והרדמה (Analgesics & CNS) · זריקות, עירוי ואחר' },
  { name: 'LIDOCAINE 2% SPRAY', sku: '31400034', group: 'מערכת העצבים, שיכוך כאב והרדמה (Analgesics & CNS) · זריקות, עירוי ואחר' },
  { name: 'LIDOCAINE HCl 2% JELLY 30g', sku: '33200004', group: 'מערכת העצבים, שיכוך כאב והרדמה (Analgesics & CNS) · זריקות, עירוי ואחר' },
  { name: 'MIDAZOLAM 5mg/5ml (DORMICUM)', sku: '32000013', group: 'מערכת העצבים, שיכוך כאב והרדמה (Analgesics & CNS) · זריקות, עירוי ואחר' },
  { name: 'PHENYTOIN 250mg/5ml', sku: '32000055', group: 'מערכת העצבים, שיכוך כאב והרדמה (Analgesics & CNS) · זריקות, עירוי ואחר' },
  { name: 'PROPOFOL 1% 20ml', sku: '32000015', group: 'מערכת העצבים, שיכוך כאב והרדמה (Analgesics & CNS) · זריקות, עירוי ואחר' },
  { name: 'COLACHICINE 0.5mg', sku: '32000022', group: 'מערכת העצבים, שיכוך כאב והרדמה (Analgesics & CNS) · כדורים (דרך הפה)' },
  { name: 'DIAZEPAM 5mg (ASSIVAL)', sku: '32000005', group: 'מערכת העצבים, שיכוך כאב והרדמה (Analgesics & CNS) · כדורים (דרך הפה)' },
  { name: 'IBUPROFEN 400mg (ADEX)', sku: '31500011', group: 'מערכת העצבים, שיכוך כאב והרדמה (Analgesics & CNS) · כדורים (דרך הפה)' },
  { name: 'LORAZEPAM 1mg (LORIVAN)', sku: '32000032', group: 'מערכת העצבים, שיכוך כאב והרדמה (Analgesics & CNS) · כדורים (דרך הפה)' },
  { name: 'PARACETAMOL 500mg (ACAMOL)', sku: '32000013', group: 'מערכת העצבים, שיכוך כאב והרדמה (Analgesics & CNS) · כדורים (דרך הפה)' },
  { name: 'QUETIAPINE 25mg (SEROQUEL)', sku: '32000003', group: 'מערכת העצבים, שיכוך כאב והרדמה (Analgesics & CNS) · כדורים (דרך הפה)' },
  { name: 'SODIUM VALPROATE 300mg', sku: '32000029', group: 'מערכת העצבים, שיכוך כאב והרדמה (Analgesics & CNS) · כדורים (דרך הפה)' },
  { name: 'TRAMADOL 50mg (TRAMAL)', sku: '32000034', group: 'מערכת העצבים, שיכוך כאב והרדמה (Analgesics & CNS) · כדורים (דרך הפה)' },
  { name: 'TRAMADOL 37.5mg + PARACETAMOL (ZALDIAR)', sku: '32000004', group: 'מערכת העצבים, שיכוך כאב והרדמה (Analgesics & CNS) · כדורים (דרך הפה)' },
  // מערכת הנשימה ואלרגיות
  { name: 'AMINOPHYLLINE 250mg/10ml', sku: '32000017', group: 'מערכת הנשימה ואלרגיות (Respiratory & Allergy) · זריקות, אינהלציה ואחר' },
  { name: 'BUDESONIDE (BUDICORT)', sku: '32500011', group: 'מערכת הנשימה ואלרגיות (Respiratory & Allergy) · זריקות, אינהלציה ואחר' },
  { name: 'IPRATROPIUM BROMIDE (ATROVENT)', sku: '32500010', group: 'מערכת הנשימה ואלרגיות (Respiratory & Allergy) · זריקות, אינהלציה ואחר' },
  { name: 'SALBUTAMOL (VENTOLIN)', sku: '32500011', group: 'מערכת הנשימה ואלרגיות (Respiratory & Allergy) · זריקות, אינהלציה ואחר' },
  { name: 'CHLORPHENIRAMINE 10mg', sku: '32000045', group: 'מערכת הנשימה ואלרגיות (Respiratory & Allergy) · כדורים (דרך הפה)' },
  // הורמונים וסוכרת
  { name: 'DEXAMETHASONE 4mg/ml', sku: '32000005', group: 'הורמונים וסוכרת (Endocrine & Diabetes) · זריקות, עירוי ואחר' },
  { name: 'GLUCAGON 1mg', sku: '32000003', group: 'הורמונים וסוכרת (Endocrine & Diabetes) · זריקות, עירוי ואחר' },
  { name: 'INSULIN ASPART (NOVORAPID)', sku: '32000001', group: 'הורמונים וסוכרת (Endocrine & Diabetes) · זריקות, עירוי ואחר' },
  { name: 'INSULIN HUMAN (HUMULIN R)', sku: '32000015', group: 'הורמונים וסוכרת (Endocrine & Diabetes) · זריקות, עירוי ואחר' },
  { name: 'METHYLPREDNISOLONE 125mg', sku: '32000002', group: 'הורמונים וסוכרת (Endocrine & Diabetes) · זריקות, עירוי ואחר' },
  { name: 'LEVOTHYROXINE 200mcg', sku: '32000012', group: 'הורמונים וסוכרת (Endocrine & Diabetes) · כדורים (דרך הפה)' },
  { name: 'PREDNISONE 20mg', sku: '32000001', group: 'הורמונים וסוכרת (Endocrine & Diabetes) · כדורים (דרך הפה)' },
  // מערכת העיכול
  { name: 'METOCLOPRAMIDE 10mg/2ml (PRAMIN)', sku: '32000007', group: 'מערכת העיכול (Gastrointestinal) · זריקות, עירוי ואחר' },
  { name: 'OMEPRAZOLE 40mg (CONTROLOC)', sku: '32000010', group: 'מערכת העיכול (Gastrointestinal) · כדורים (דרך הפה)' },
]

// ===== אשפוז ג – רשימת תרופות לפי קטגוריות (ללא מק״ט) =====
const INPATIENT_C_MEDS = [
  { name: 'AMOXICILLIN 250mg CAPS', sku: '', group: 'אנטיביוטיקה (Antibiotics) · כדורים וקפסולות' },
  { name: 'AMOXICILLIN 500mg CAPS', sku: '', group: 'אנטיביוטיקה (Antibiotics) · כדורים וקפסולות' },
  { name: 'AZITHROMYCIN 250mg ZITHROMAX', sku: '', group: 'אנטיביוטיקה (Antibiotics) · כדורים וקפסולות' },
  { name: 'AZITHROMYCIN 500mg ZITHROMAX', sku: '', group: 'אנטיביוטיקה (Antibiotics) · כדורים וקפסולות' },
  { name: 'CEFALEXIN 250mg CAPS', sku: '', group: 'אנטיביוטיקה (Antibiotics) · כדורים וקפסולות' },
  { name: 'CEFALEXIN 500mg CAPS', sku: '', group: 'אנטיביוטיקה (Antibiotics) · כדורים וקפסולות' },
  { name: 'CEFUROXIME 250mg ZINNAT', sku: '', group: 'אנטיביוטיקה (Antibiotics) · כדורים וקפסולות' },
  { name: 'CEFUROXIME 500mg ZINNAT', sku: '', group: 'אנטיביוטיקה (Antibiotics) · כדורים וקפסולות' },
  { name: 'CIPROFLOXACIN 250mg CIPROXIN', sku: '', group: 'אנטיביוטיקה (Antibiotics) · כדורים וקפסולות' },
  { name: 'CIPROFLOXACIN 500mg CIPROXIN', sku: '', group: 'אנטיביוטיקה (Antibiotics) · כדורים וקפסולות' },
  { name: 'CLARITHROMYCIN 250mg KLACID', sku: '', group: 'אנטיביוטיקה (Antibiotics) · כדורים וקפסולות' },
  { name: 'CLARITHROMYCIN 500mg KLACID', sku: '', group: 'אנטיביוטיקה (Antibiotics) · כדורים וקפסולות' },
  { name: 'ERYTHROMYCIN 250mg', sku: '', group: 'אנטיביוטיקה (Antibiotics) · כדורים וקפסולות' },
  { name: 'ERYTHROMYCIN 500mg', sku: '', group: 'אנטיביוטיקה (Antibiotics) · כדורים וקפסולות' },
  { name: 'AMOXICILLIN SUSPENSION 125mg/5ml', sku: '', group: 'אנטיביוטיקה (Antibiotics) · נוזלים, זריקות וטיפות' },
  { name: 'AMOXICILLIN SUSPENSION 250mg/5ml', sku: '', group: 'אנטיביוטיקה (Antibiotics) · נוזלים, זריקות וטיפות' },
  { name: 'AZITHROMYCIN SUSPENSION 200mg/5ml', sku: '', group: 'אנטיביוטיקה (Antibiotics) · נוזלים, זריקות וטיפות' },
  { name: 'CEFALEXIN SUSPENSION 125mg/5ml', sku: '', group: 'אנטיביוטיקה (Antibiotics) · נוזלים, זריקות וטיפות' },
  { name: 'CEFALEXIN SUSPENSION 250mg/5ml', sku: '', group: 'אנטיביוטיקה (Antibiotics) · נוזלים, זריקות וטיפות' },
  { name: 'CEFUROXIME SUSPENSION 125mg/5ml', sku: '', group: 'אנטיביוטיקה (Antibiotics) · נוזלים, זריקות וטיפות' },
  { name: 'CIPROFLOXACIN EYE DROPS 0.3%', sku: '', group: 'אנטיביוטיקה (Antibiotics) · נוזלים, זריקות וטיפות' },
  { name: 'CLINDAMYCIN PHOSPHATE TOPICAL SOLUTION', sku: '', group: 'אנטיביוטיקה (Antibiotics) · נוזלים, זריקות וטיפות' },
  { name: 'CLOTRIMAZOLE CREAM 1%', sku: '', group: 'אנטיביוטיקה (Antibiotics) · נוזלים, זריקות וטיפות' },
  { name: 'ERYTHROMYCIN SUSPENSION 125mg/5ml', sku: '', group: 'אנטיביוטיקה (Antibiotics) · נוזלים, זריקות וטיפות' },
  { name: 'ERYTHROMYCIN SUSPENSION 250mg/5ml', sku: '', group: 'אנטיביוטיקה (Antibiotics) · נוזלים, זריקות וטיפות' },
  { name: 'GENTAMICIN INJECTION 80mg/2ml', sku: '', group: 'אנטיביוטיקה (Antibiotics) · נוזלים, זריקות וטיפות' },
  { name: 'METRONIDAZOLE INFUSION 500mg/100ml', sku: '', group: 'אנטיביוטיקה (Antibiotics) · נוזלים, זריקות וטיפות' },
  { name: 'AMLODIPINE 5mg NORVASC', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'AMLODIPINE 10mg NORVASC', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'ATORVASTATIN 10mg LIPITOR', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'ATORVASTATIN 20mg LIPITOR', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'ATORVASTATIN 40mg LIPITOR', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'BISOPROLOL 5mg CONCOR', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'BISOPROLOL 10mg CONCOR', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'CAPTOPRIL 25mg', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'CAPTOPRIL 50mg', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'CLOPIDOGREL 75mg PLAVIX', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'DIGOXIN 0.25mg LANOXIN', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'DILTIAZEM 60mg TILDIEM', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'DILTIAZEM 90mg TILDIEM', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'ENALAPRIL 5mg RENITEC', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'ENALAPRIL 10mg RENITEC', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'ENALAPRIL 20mg RENITEC', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'FUROSEMIDE 40mg LASIX (משתן)', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'ISOSORBIDE DINITRATE 10mg ISORDIL', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'ISOSORBIDE MONONITRATE 20mg IMDUR', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'ISOSORBIDE MONONITRATE 40mg IMDUR', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'LOSARTAN 25mg COZAAR', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'LOSARTAN 50mg COZAAR', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'LOSARTAN 100mg COZAAR', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'PROPRANOLOL 10mg DERALIN', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'PROPRANOLOL 40mg DERALIN', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'RAMIPRIL 2.5mg TRITACE', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'RAMIPRIL 5mg TRITACE', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'RAMIPRIL 10mg TRITACE', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'SIMVASTATIN 10mg SIMVAVAC', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'SIMVASTATIN 20mg SIMVAVAC', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'SIMVASTATIN 40mg SIMVAVAC', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'SPIRONOLACTONE 25mg ALDACTONE (משתן)', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'SPIRONOLACTONE 100mg ALDACTONE (משתן)', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'VERAPAMIL 40mg IKACOR', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'VERAPAMIL 80mg IKACOR', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'WARFARIN 1mg COUMADIN (מדלל דם)', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'WARFARIN 2mg COUMADIN (מדלל דם)', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'WARFARIN 5mg COUMADIN (מדלל דם)', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · כדורים וקפסולות' },
  { name: 'FUROSEMIDE INJECTION 20mg/2ml', sku: '', group: 'לב, לחץ דם וכולסטרול (Cardiovascular & Cholesterol) · נוזלים וזריקות' },
  { name: 'GLIBENCLAMIDE 5mg DAONIL', sku: '', group: 'סוכרת (Diabetes / Antidiabetics) · כדורים בלבד' },
  { name: 'GLICLAZIDE 80mg DIAMICRON', sku: '', group: 'סוכרת (Diabetes / Antidiabetics) · כדורים בלבד' },
  { name: 'GLICLAZIDE MR 30mg', sku: '', group: 'סוכרת (Diabetes / Antidiabetics) · כדורים בלבד' },
  { name: 'GLIMEPIRIDE 1mg AMARYL', sku: '', group: 'סוכרת (Diabetes / Antidiabetics) · כדורים בלבד' },
  { name: 'GLIMEPIRIDE 2mg AMARYL', sku: '', group: 'סוכרת (Diabetes / Antidiabetics) · כדורים בלבד' },
  { name: 'GLIMEPIRIDE 3mg AMARYL', sku: '', group: 'סוכרת (Diabetes / Antidiabetics) · כדורים בלבד' },
  { name: 'GLIMEPIRIDE 4mg AMARYL', sku: '', group: 'סוכרת (Diabetes / Antidiabetics) · כדורים בלבד' },
  { name: 'METFORMIN 500mg GLUCOPHAGE', sku: '', group: 'סוכרת (Diabetes / Antidiabetics) · כדורים בלבד' },
  { name: 'METFORMIN 850mg GLUCOPHAGE', sku: '', group: 'סוכרת (Diabetes / Antidiabetics) · כדורים בלבד' },
  { name: 'METFORMIN XR 500mg', sku: '', group: 'סוכרת (Diabetes / Antidiabetics) · כדורים בלבד' },
  { name: 'DICLOFENAC 50mg VOLTAREN', sku: '', group: 'שיכוך כאב ונוגדי דלקת (Analgesics & NSAIDs) · כדורים וקפסולות' },
  { name: 'DICLOFENAC SR 100mg', sku: '', group: 'שיכוך כאב ונוגדי דלקת (Analgesics & NSAIDs) · כדורים וקפסולות' },
  { name: 'IBUPROFEN 200mg ADVIL/NURAFEN', sku: '', group: 'שיכוך כאב ונוגדי דלקת (Analgesics & NSAIDs) · כדורים וקפסולות' },
  { name: 'IBUPROFEN 400mg ADVIL/NURAFEN', sku: '', group: 'שיכוך כאב ונוגדי דלקת (Analgesics & NSAIDs) · כדורים וקפסולות' },
  { name: 'PARACETAMOL 500mg ACAMOL', sku: '', group: 'שיכוך כאב ונוגדי דלקת (Analgesics & NSAIDs) · כדורים וקפסולות' },
  { name: 'TRAMADOL 50mg CAPSULES', sku: '', group: 'שיכוך כאב ונוגדי דלקת (Analgesics & NSAIDs) · כדורים וקפסולות' },
  { name: 'DICLOFENAC SODIUM INJECTION 75mg/3ml', sku: '', group: 'שיכוך כאב ונוגדי דלקת (Analgesics & NSAIDs) · נוזלים, סירופים וזריקות' },
  { name: 'IBUPROFEN SUSPENSION 100mg/5ml', sku: '', group: 'שיכוך כאב ונוגדי דלקת (Analgesics & NSAIDs) · נוזלים, סירופים וזריקות' },
  { name: 'LIDOCAINE INJECTION 1% (אלחוש מקומי)', sku: '', group: 'שיכוך כאב ונוגדי דלקת (Analgesics & NSAIDs) · נוזלים, סירופים וזריקות' },
  { name: 'LIDOCAINE INJECTION 2% (אלחוש מקומי)', sku: '', group: 'שיכוך כאב ונוגדי דלקת (Analgesics & NSAIDs) · נוזלים, סירופים וזריקות' },
  { name: 'PARACETAMOL SYRUP 125mg/5ml', sku: '', group: 'שיכוך כאב ונוגדי דלקת (Analgesics & NSAIDs) · נוזלים, סירופים וזריקות' },
  { name: 'TRAMADOL INJECTION 100mg/2ml', sku: '', group: 'שיכוך כאב ונוגדי דלקת (Analgesics & NSAIDs) · נוזלים, סירופים וזריקות' },
  { name: 'OMEPRAZOLE 20mg LOSEC', sku: '', group: 'מערכת העיכול (Gastrointestinal) · כדורים בלבד' },
  { name: 'METOCLOPRAMIDE INJECTION 10mg/2ml (לבחילות/הקאות)', sku: '', group: 'מערכת העיכול (Gastrointestinal) · נוזלים וזריקות' },
  { name: 'OMEPRAZOLE INJECTION 40mg IV', sku: '', group: 'מערכת העיכול (Gastrointestinal) · נוזלים וזריקות' },
  { name: 'SALBUTAMOL NEBULIZER SOLUTION 5mg/ml', sku: '', group: 'מערכת הנשימה (Respiratory) · נוזלים וסירופים בלבד' },
  { name: 'SALBUTAMOL SYRUP 2mg/5ml', sku: '', group: 'מערכת הנשימה (Respiratory) · נוזלים וסירופים בלבד' },
  { name: 'CARBAMAZEPINE 200mg TEGRETOL', sku: '', group: 'נוירולוגיה, בריאות הנפש ואפילפסיה (CNS / Neurology & Psychiatry) · כדורים בלבד' },
  { name: 'CARBAMAZEPINE CR 200mg', sku: '', group: 'נוירולוגיה, בריאות הנפש ואפילפסיה (CNS / Neurology & Psychiatry) · כדורים בלבד' },
  { name: 'CARBAMAZEPINE CR 400mg', sku: '', group: 'נוירולוגיה, בריאות הנפש ואפילפסיה (CNS / Neurology & Psychiatry) · כדורים בלבד' },
  { name: 'FLUOXETINE 20mg PROZAC', sku: '', group: 'נוירולוגיה, בריאות הנפש ואפילפסיה (CNS / Neurology & Psychiatry) · כדורים בלבד' },
  { name: 'VALPROIC ACID 200mg DEPAKENE', sku: '', group: 'נוירולוגיה, בריאות הנפש ואפילפסיה (CNS / Neurology & Psychiatry) · כדורים בלבד' },
  { name: 'VALPROIC ACID 500mg DEPAKENE', sku: '', group: 'נוירולוגיה, בריאות הנפש ואפילפסיה (CNS / Neurology & Psychiatry) · כדורים בלבד' },
  { name: 'FLUCONAZOLE 50mg DIFLUCAN (נוגד פטריות)', sku: '', group: 'סטרואידים, פטריות ואחרים (Steroids, Antifungals & Misc) · כדורים' },
  { name: 'FLUCONAZOLE 150mg DIFLUCAN (נוגד פטריות)', sku: '', group: 'סטרואידים, פטריות ואחרים (Steroids, Antifungals & Misc) · כדורים' },
  { name: 'PREDNISOLONE 5mg (סטרואידים)', sku: '', group: 'סטרואידים, פטריות ואחרים (Steroids, Antifungals & Misc) · כדורים' },
  { name: 'PREDNISOLONE 20mg (סטרואידים)', sku: '', group: 'סטרואידים, פטריות ואחרים (Steroids, Antifungals & Misc) · כדורים' },
  { name: 'TAMOXIFEN 10mg NOLVADEX (אונקולוגי/הורמונלי)', sku: '', group: 'סטרואידים, פטריות ואחרים (Steroids, Antifungals & Misc) · כדורים' },
  { name: 'TAMOXIFEN 20mg NOLVADEX (אונקולוגי/הורמונלי)', sku: '', group: 'סטרואידים, פטריות ואחרים (Steroids, Antifungals & Misc) · כדורים' },
  { name: 'DEXAMETHASONE EYE DROPS 0.1% (טיפות עיניים סטרואידיות)', sku: '', group: 'סטרואידים, פטריות ואחרים (Steroids, Antifungals & Misc) · נוזלים, קרמים וטיפות' },
  { name: 'HYDROCORTISONE CREAM 1% (קרם סטרואידי)', sku: '', group: 'סטרואידים, פטריות ואחרים (Steroids, Antifungals & Misc) · נוזלים, קרמים וטיפות' },
  { name: 'WATER FOR INJECTION 5ml (מים להזרקה)', sku: '', group: 'סטרואידים, פטריות ואחרים (Steroids, Antifungals & Misc) · נוזלים, קרמים וטיפות' },
  { name: 'WATER FOR INJECTION 10ml (מים להזרקה)', sku: '', group: 'סטרואידים, פטריות ואחרים (Steroids, Antifungals & Misc) · נוזלים, קרמים וטיפות' },
]

export const MED_LISTS = {
  gastro: GASTRO_MEDS,
  ivf: IVF_MEDS,
  'recovery-1': RECOVERY_MEDS, // התאוששות 1 – רשימת ההתאוששות, אותן הגדרות
  'recovery-2': RECOVERY_MEDS, // התאוששות 2 – אותה רשימה
  icu: ICU_MEDS, // טיפול נמרץ – רשימה ייעודית, אותן הגדרות
  'inpatient-c': INPATIENT_C_MEDS, // אשפוז ג – רשימה ייעודית (ללא מק״ט), אותן הגדרות
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
  columns.push(['ניקיון וסדר כללי ארון תרופות', rec.cabinetClean ? 'בוצע' : 'לא בוצע'])
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

export function saveMedReport(unitId, month, items, by, cabinetClean = false) {
  const rec = { unitId, month, items, by: by || '', cabinetClean: !!cabinetClean, savedAt: new Date().toISOString() }
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
