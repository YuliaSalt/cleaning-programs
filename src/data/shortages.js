// דיווח על חסרים ומלאי – הַאב עם שתי קטגוריות: ציוד מתכלים כללי והזמנת תרופות.
// רשימת התרופות נשענת על meds.js (אותה רשימה המשמשת את בקרת התרופות החודשית).
//
// כל פריט: { name, sku?, group? }. מספרי המק״ט מוסתרים מהתצוגה אך נשלפים
// אוטומטית להודעת הוואטסאפ.

import { getMedList } from './meds.js'

// הערת הזמנה – מוצגת ליד כפתורי השליחה של "ציוד מתכלים כללי" בלבד.
const ORDER_NOTE = 'להשלים כל ההזמנה עד יום ראשון'

// ציוד מתכלים כללי – רשימה מלאה משותפת לכל המחלקות, מחולקת לקבוצות (group = כותרת ביניים).
const G_ENDO = 'אנדוסקופיה, ברונכוסקופיה, גסטרו ו-EUS'
const G_IV = 'עירוי, מחטים, מזרקים וצנתרים'
const G_RF = 'מרפאת כאב, גלי רדיו (RF) והרדמה אזורית'
const G_RESP = 'נשימה, חמצן ושאיבה (סקשן)'
const G_MON = 'ניטור, בדיקות וזיהוי'
const G_CLEAN = 'ניקוי, חיטוי וסטריליזציה'
const G_WEAR = 'ביגוד, מיגון וכיסויים'
const G_SURG = 'ציוד מתכלה כללי וכירורגיה'
const G_FLUID = 'נוזלים ותרופות'
const G_OFFICE = 'שונות ומשרד'

const GENERAL_CONSUMABLES = [
  // אנדוסקופיה, ברונכוסקופיה, גסטרו ו-EUS
  { name: `פקק גומי לאנדוסקופיה`, sku: '11300070', group: G_ENDO },
  { name: `AIR/WATER VALVE פקק אוויר מים לפוג'י`, sku: '11300211', group: G_ENDO },
  { name: `HYBRID IRRIGATION TUB צנרת למשאבת מים אנדוסקופית`, sku: '11300173', group: G_ENDO },
  { name: `AUX CHANNEL ADAPT 100 אדפטר עזר 100 יחידות`, sku: '11300174', group: G_ENDO },
  { name: `ANTI SLIDE POLYPECTOMY SNARE 25 סנר לכריתת פוליפים נגד החלקה`, sku: '11300196', group: G_ENDO },
  { name: `ANTI SLIDE 15 SNARE סנר נגד החלקה 15`, sku: '11300199', group: G_ENDO },
  { name: `COVER PROTECTIVE FOR SCOPE 730 שקיות הגנה לאנדוסקופ`, sku: '11300175', group: G_ENDO },
  { name: `SPOT ENDOSCOPIC MARKER דיו לסימון אנדוסקופי`, sku: '11300046', group: G_ENDO },
  { name: `Silicon oil שמן סיליקון`, sku: '11300181', group: G_ENDO },
  { name: `FNB MEDTRONIC DSC-22-01 SHARKCORE 22G SS NDL מחט לאולטרסאונד אנדוסקופי`, sku: '11300168', group: G_ENDO },
  { name: `COOK ECHO TIP ULTRA EUS FNA NEEDLE מחט דיקור אולטרסאונד אנדוסקופי`, sku: '11300164', group: G_ENDO },
  { name: `EUS מבחנות`, sku: '14000029', group: G_ENDO },
  { name: `AIR/WATER & SUCTION VALVES סט שסתומים לאוויר מים ושאיבה`, sku: '11300197', group: G_ENDO },
  { name: `לוכד פוליפים`, sku: '11300155', group: G_ENDO },
  { name: `תבחין אוראז לבדיקת הליקובקטר`, sku: '11300060', group: G_ENDO },
  { name: `מגן שיניים למבוגר`, sku: '11300044', group: G_ENDO },
  { name: `מגן שיניים לילדים`, sku: '11300092', group: G_ENDO },
  { name: `Hemoclip המוקליפ אטב לעצירת דימום`, sku: '11300110', group: G_ENDO },
  { name: `Grasping רשת תפיסה גרספינג`, sku: '11300050', group: G_ENDO },
  { name: `מחטים אנדוסקופיות`, sku: '11300043', group: G_ENDO },
  { name: `סנר קר 10`, sku: '11300142', group: G_ENDO },
  { name: `סנר קר 15`, sku: '11300143', group: G_ENDO },
  { name: `ביופטר 100 מלקחי ביופסיה`, sku: '11300041', group: G_ENDO },
  { name: `HOT מלקחי ביופסיה חמה`, sku: '11300035', group: G_ENDO },
  { name: `EUS פקק גומי`, sku: '11300184', group: G_ENDO },
  { name: `סנר 10 מי מדיקל`, sku: '11300098', group: G_ENDO },
  { name: `סנר 15 מי מדיקל`, sku: '11300200', group: G_ENDO },
  { name: `קפסולה אנדוסקופית`, sku: '11300103', group: G_ENDO },
  { name: `קפסולה דמי אנדוסקופית`, sku: '11300154', group: G_ENDO },
  { name: `בלון EUS`, sku: '11300163', group: G_ENDO },
  { name: `מיכלים לברונכוסקופיה למיקרוביולוגיה`, sku: '11300213', group: G_ENDO },
  { name: `ביופטר לברונכוסקופיה`, sku: '12500746', group: G_ENDO },
  { name: `BIOVAC עבור דיקור פלאורלי`, sku: '20000167', group: G_ENDO },
  { name: `ANOSCOPE אנוסקופ`, sku: '11300001', group: G_ENDO },
  { name: `FB 231K.A ENDOJAW FCPS 155 CM 20PCS מלקחיים אנדוסקופיים ענקיים`, sku: '11300115', group: G_ENDO },
  { name: `NITI S ESOPHGEAL COVERED STENT סטן ושט`, sku: '11300204', group: G_ENDO },
  { name: `EMR ST HOOD FOR ENDOSCIOPIE כובע לאנדוסקופיה`, sku: '11300170', group: G_ENDO },
  { name: `CY551-24EU ציסטוסקופ גמיש חד-פעמי שטורץ`, sku: 'CY551-24EU', group: G_ENDO },
  { name: `פרוססור לציסטוסקופ גמיש (ציוד קפיטלי)`, group: G_ENDO },

  // עירוי, מחטים, מזרקים וצנתרים
  { name: `VENFLON 24G ונפלון צהוב`, sku: '20000141', group: G_IV },
  { name: `VENFLON 22G ונפלון כחול / ברנולה כחולה`, sku: '20000116', group: G_IV },
  { name: `VENFLON 20G ונפלון ורוד`, sku: '20000117', group: G_IV },
  { name: `ונפלון לבן`, sku: '20000114', group: G_IV },
  { name: `ונפלון ירוק`, sku: '20000115', group: G_IV },
  { name: `מחט 18G ורודה`, sku: '20000118', group: G_IV },
  { name: `מחט 21G ירוקה`, sku: '20000121', group: G_IV },
  { name: `מחט 23G כחולה`, sku: '20000122', group: G_IV },
  { name: `מחט 25G כתומה`, sku: '20000123', group: G_IV },
  { name: `מחט דנטלית סטרילית להרדמה (מחט צהובה)`, group: G_IV },
  { name: `SET INFUSION WITH AIRVENT סט עירוי רגיל`, sku: '20000233', group: G_IV },
  { name: `TUBE EXT.M-F 150 CM LL מאריך עירוי 150 ס"מ`, sku: '20000152', group: G_IV },
  { name: `PRESSURE LINE 15CM+STOP מאריך עירוי עם סוגר 15 ס"מ`, sku: '20000224', group: G_IV },
  { name: `TOURNIQET 2.5*45CM חוסם ורידים חד-פעמי שטאונג`, sku: '10100433', group: G_IV },
  { name: `פקק אדום לעירוי`, sku: '20000166', group: G_IV },
  { name: `STOPCOCK 3WAY ברז תלת-כיווני לעירוי`, sku: '20000163', group: G_IV },
  { name: `TEGADERM 6*8 מדבקה לקיבוע ונפלון טגדרם`, sku: '20000076', group: G_IV },
  { name: `CATHETER SUCTION STRAIGHT 8FR קטטר סקשן ישר`, sku: '20000267', group: G_IV },
  { name: `CATHETER SUCTION STRAIGHT 10FR קטטר סקשן ישר`, sku: '20000263', group: G_IV },
  { name: `CATHETER SUCTION STRAIGHT 12FR קטטר סקשן ישר`, sku: '20000264', group: G_IV },
  { name: `CATHETER SUCTION STRAIGHT 14FR קטטר סקשן ישר`, sku: '20000265', group: G_IV },
  { name: `CATHETER SUCTION STRAIGHT 16FR קטטר סקשן ישר`, sku: '20000266', group: G_IV },
  { name: `SONDA 12CH זונדה 12`, sku: '20000254', group: G_IV },
  { name: `SONDA 16CH זונדה 16`, sku: '20000256', group: G_IV },
  { name: `SONDA 18CH זונדה 18`, sku: '20000257', group: G_IV },
  { name: `CATHETER RECTAL 24 CH קטטר רקטלי`, sku: '20000252', group: G_IV },
  { name: `מזרק אינסולין 1 סמ"ק עם מחט 29G`, sku: '20000113', group: G_IV },
  { name: `מזרק 3 סמ"ק`, sku: '20000100', group: G_IV },
  { name: `מזרק 3 סמ"ק לואר לוק`, sku: '20000111', group: G_IV },
  { name: `מזרק 5 סמ"ק`, sku: '20000101', group: G_IV },
  { name: `מזרק 5 סמ"ק לואר לוק`, sku: '20000544', group: G_IV },
  { name: `מזרק 10 סמ"ק`, sku: '20000102', group: G_IV },
  { name: `מזרק 20 סמ"ק`, sku: '20000103', group: G_IV },
  { name: `מזרק 50 סמ"ק`, sku: '20000104', group: G_IV },
  { name: `מזרקי סליין לשטיפה`, sku: '20000985', group: G_IV },

  // מרפאת כאב, גלי רדיו (RF) והרדמה אזורית
  { name: `SET EPIDURAL MINIPACK סט אפידורל מלא`, sku: '10100088', group: G_RF },
  { name: `SET COMBINED SPINAL/EPIDURAL MINIPACK 27G סט משולב ספיינל אפידורל`, sku: '10100307', group: G_RF },
  { name: `NEEDLE SPINAL 22G X 3.5" מחט ספיינל שחורה`, sku: '10100027', group: G_RF },
  { name: `SPINAL NEEDLE 22G*103MM 40 MM מחט ספיינל`, sku: '10100554', group: G_RF },
  { name: `TUOHY CANN. W SPEC 18G*120CM קנולה ורודה עם ספקולום`, sku: '10100555', group: G_RF },
  { name: `G18X90 קנולה ורודה ארוכה`, sku: '10100036', group: G_RF },
  { name: `RF CANULA 10CM 20GA YKRFK-C101 מחט גלי רדיו בזוויט`, sku: '10100597', group: G_RF },
  { name: `RF CANULA 10CM YKCC101022-P מחט גלי רדיו ישרה`, sku: '10100596', group: G_RF },
  { name: `LENGTH 10 CM - TIP 10MM – GAUGE RF - 20 מחט גלי רדיו ישרה`, sku: '10100638', group: G_RF },
  { name: `STRAIGHT RF CANNULA 54MM 22G 5MM TIP מחט גלי רדיו ישרה צווארית`, sku: '11701044', group: G_RF },
  { name: `STRAIGHT RF CANNULA 150MM 20G 10MM TIP מחט גלי רדיו ישרה`, sku: '11701132', group: G_RF },
  { name: `RF CANULA 5CM YKCC5422-P מחט גלי רדיו`, sku: '10100594', group: G_RF },
  { name: `RF CANULA 15CM YKCC151020-P מחט גלי רדיו`, sku: '10100595', group: G_RF },
  { name: `SONOTAP CANN. 22G*80MM מחט אולטרסאונד`, sku: '20000944', group: G_RF },
  { name: `ULTRASOUNDS 21G*90MM מחט אולטרסאונד`, sku: '20000723', group: G_RF },
  { name: `ULTRASOUNDS 21G*120MM מחט אולטרסאונד`, sku: '20000731', group: G_RF },
  { name: `ULTRASOUNDS 22G*50MM מחט אולטרסאונד`, sku: '20000439', group: G_RF },
  { name: `ULTRASOUNDS 22G*70MM מחט אולטרסאונד`, sku: '20000440', group: G_RF },
  { name: `ULTRASOUNDS 22G*80MM מחט אולטרסאונד`, sku: '20000950', group: G_RF },
  { name: `GEL FOR ULTRA. STER 20CC ג'ל לאולטרה סאונד סטירילי בשקיות`, sku: '15400003', group: G_RF },
  { name: `ג'ל אולטרסאונד בבקבוק 250 מ"ל`, sku: '15400014', group: G_RF },
  { name: `ULTRASOUNDS PROBE COVER כיסוי סטרילי לאולטרסאונד`, sku: '20800026', group: G_RF },
  { name: `TAGADERM 10CM*12CM קיבוע מדבקה שקופה לאולטרסאונד`, sku: '20000077', group: G_RF },
  { name: `ROCHESTER PEAN FCPS 105-170 פינצטה ארוכה`, sku: '10002703', group: G_RF },
  { name: `סט שדה סטרילי אפידורל`, group: G_RF },

  // נשימה, חמצן ושאיבה (סקשן)
  { name: `TUBE SUCTION 300CM צינור סקשן 3 מטר`, sku: '20000268', group: G_RESP },
  { name: `TUBE SUCTION 200CM FUNNEL/FINGER TIP צינור סקשן 2 מטר עם אצבעון`, sku: '20000269', group: G_RESP },
  { name: `FINGERTIP CONTROL אצבעון לסקשן`, sku: '20000158', group: G_RESP },
  { name: `סקשן 3 ליטר מכשיר או מיכל`, sku: '13500002', group: G_RESP },
  { name: `מיכל חד-פעמי לסקשן 1.5 ליטר`, sku: '20000006', group: G_RESP },
  { name: `מאריך חמצן`, sku: '10100002', group: G_RESP },
  { name: `OXYGEN MASK FOR ADULT מסכת חמצן למבוגר`, sku: '10100003', group: G_RESP },
  { name: `MASK NON REBREATHING מסכת חמצן עם שקית העשרה`, sku: '10100017', group: G_RESP },
  { name: `AIRWAY ORAL NO.2 מנתב אוויר איראווי ירוק`, sku: '10100047', group: G_RESP },
  { name: `AIRWAY ORAL NO.3 מנתב אוויר איראווי צהוב`, sku: '10100048', group: G_RESP },
  { name: `AIRWAY ORAL NO.4 מנתב אוויר איראווי אדום`, sku: '10100062', group: G_RESP },
  { name: `CANNULA NASAL OXYGEN משקפי חמצן למבוגר צינור 2 מטר`, sku: '10100063', group: G_RESP },
  { name: `משקפי חמצן למבוגר צינור ארוך 4.2 מטר`, sku: '10100435', group: G_RESP },
  { name: `AMBU PVC FOR ADULT W PEEP VALVE מפוח הנשמה אמבו למבוגר`, sku: '10100507', group: G_RESP },
  { name: `סט סטרילי לניקור פלאוראלי`, sku: '10100525', group: G_RESP },

  // ניטור, בדיקות וזיהוי
  { name: `מכשיר דיאטרמיה`, sku: '10500001', group: G_MON },
  { name: `PLATE FOR DIATHERMIA ADULT (REM) פלטה לדיאטרמיה למבוגר`, sku: '10500010', group: G_MON },
  { name: `לולאת דיאטרמיה 15 מ"מ ES13`, sku: '13000014', group: G_MON },
  { name: `לולאת דיאטרמיה 5 מ"מ ES07`, sku: '10500015', group: G_MON },
  { name: `לולאת דיאטרמיה 20 מ"מ ES31`, sku: '13000016', group: G_MON },
  { name: `לולאת דיאטרמיה 10 מ"מ ES11`, sku: '13000017', group: G_MON },
  { name: `נייר למכשיר דפברילטור`, sku: '13700012', group: G_MON },
  { name: `סטיקים לבדיקת סוכר גלוקומטר`, sku: '13800515', group: G_MON },
  { name: `נוזל כיול למד סוכר`, sku: '13800520', group: G_MON },
  { name: `ACCU CHECK INFORM II NON EU LA STRIP סטיקים למד סוכר`, sku: '13800384', group: G_MON },
  { name: `UNISTIC דוקרן חד-פעמי לבדיקת סוכר`, sku: '20000298', group: G_MON },
  { name: `אלקטרודה למוניטור למבוגר`, sku: '20000278', group: G_MON },
  { name: `תג זיהוי למטופל אדום`, sku: '20000271', group: G_MON },
  { name: `תג זיהוי למטופל ורוד`, sku: '20000942', group: G_MON },
  { name: `BRACELET ADULT תג זיהוי למטופל לבן`, sku: '20000272', group: G_MON },
  { name: `LABELBAND PLASTIC תג זיהוי למטופל כחול`, sku: '20000567', group: G_MON },
  { name: `BRACELET IDENT. ADULT YELLOW 120-14 תג זיהוי למטופל צהוב`, sku: '20000671', group: G_MON },
  { name: `טופס ריכוז פתולוגיה`, sku: '22400635', group: G_MON },
  { name: `מדבקה לזיהוי תרופה פרופופול PROPOFO`, sku: '22201336', group: G_MON },
  { name: `מדבקה לזיהוי תרופה מידזולם MIDAZOL`, sku: '22201255', group: G_MON },

  // ניקוי, חיטוי וסטריליזציה
  { name: `RAPICIDE PA ASSY HIGH KEVEL 20L חומר שטיפה לגסטרו`, sku: '11300111', group: G_CLEAN },
  { name: `ITERSEPT DETERGENT FOR CLEANING ENDOSCOPES 3.8L סבון לניקוי אנדוסקופים`, sku: '11300112', group: G_CLEAN },
  { name: `ENDOZIME חומר ניקוי אנזימטי`, sku: '14600239', group: G_CLEAN },
  { name: `SOLUSCOPE P5 חומר שטיפה`, sku: '14600205', group: G_CLEAN },
  { name: `SOLUSCOPE A5 חומר שטיפה`, sku: '14600206', group: G_CLEAN },
  { name: `SOLUSCOPE C+5 חומר שטיפה`, sku: '14600207', group: G_CLEAN },
  { name: `מברשת לניקוי אנדוסקופים`, sku: '11300123', group: G_CLEAN },
  { name: `ספוג לניקוי אנדוסקופים 200`, sku: '11300167', group: G_CLEAN },
  { name: `שטיחים לארון ייבוש אנדוסקופים`, sku: '11300185', group: G_CLEAN },
  { name: `נייר לארון ייבוש אנדוסקופים`, sku: '14600208', group: G_CLEAN },
  { name: `כוסות להשריית אנדוזים`, sku: '21800217', group: G_CLEAN },
  { name: `מטליות חיטוי כלור`, sku: '20500549', group: G_CLEAN },
  { name: `מטליות חיטוי אנטיגון ירוקות`, sku: '20500552', group: G_CLEAN },
  { name: `ANTIGONE 20*19 מגבונים לחיטוי מזהמים`, sku: '20500270', group: G_CLEAN },
  { name: `RTU ENZYMATIC WIPE INCL מגבונים אנזימטיים לניקוי`, sku: '20500385', group: G_CLEAN },
  { name: `BIOHAZARD שקיות אדומות לפסולת ביולוגית`, sku: '20500400', group: G_CLEAN },
  { name: `פורמלין 10 אחוז עם ברקוד`, sku: '13800544', group: G_CLEAN },
  { name: `FORMALDEHYDE 4% 20ML/40ML פורמלין במיכלים קטנים`, sku: '13800315', group: G_CLEAN },
  { name: `ETHANOL 70% BP 5L אלכוהול אתנול 70 אחוז`, sku: '13800356', group: G_CLEAN },
  { name: `LUGOL תמיסת יוד למריחה`, sku: '34300001', group: G_CLEAN },
  { name: `UNISEPT חומר חיטוי יוניספט`, group: G_CLEAN },
  { name: `פולידין לרחצה`, group: G_CLEAN },

  // ביגוד, מיגון וכיסויים
  { name: `כפפות ניטריל מידה S ללא טלק`, sku: '20000586', group: G_WEAR },
  { name: `כפפות ניטריל מידה M ללא טלק`, sku: '20000501', group: G_WEAR },
  { name: `כפפות ניטריל מידה L ללא טלק`, sku: '20000503', group: G_WEAR },
  { name: `כפפות ניטריל מידה XL ללא טלק`, sku: '20000566', group: G_WEAR },
  { name: `GLOVES SIZE 6 SURGICAL POWDER FREE STERILE כפפות כירורגיות סטריליות`, sku: '20000768', group: G_WEAR },
  { name: `GLOVES SIZE 6.5 SURGICAL POWDER FREE STERILE כפפות כירורגיות סטריליות`, sku: '20000208', group: G_WEAR },
  { name: `GLOVES SIZE 7 SURGICAL POWDER FREE STERILE כפפות כירורגיות סטריליות`, sku: '20000207', group: G_WEAR },
  { name: `GLOVES SIZE 7.5 SURGICAL POWDER FREE STERILE כפפות כירורגיות סטריליות`, sku: '20000209', group: G_WEAR },
  { name: `GLOVES SIZE 8 SURGICAL POWDER FREE STERILE כפפות כירורגיות סטריליות`, sku: '20000210', group: G_WEAR },
  { name: `כפפות ניטריל סטריליות מידה 6.5 ללא לטקס`, sku: '20000336', group: G_WEAR },
  { name: `כפפות ניטריל סטריליות מידה 7 ללא לטקס`, sku: '20000337', group: G_WEAR },
  { name: `כפפות ניטריל סטריליות מידה 7.5 ללא לטקס`, sku: '20000338', group: G_WEAR },
  { name: `כפפות ניטריל סטריליות מידה 8 ללא לטקס`, sku: '20000339', group: G_WEAR },
  { name: `כפפות ניטריל סטריליות מידה 8.5 ללא לטקס`, sku: '20000340', group: G_WEAR },
  { name: `משקפי מגן למנתח`, sku: '13500037', group: G_WEAR },
  { name: `N95 RESPIRATORS MASK מסכת מיגון נשימתי N-95`, sku: '13800295', group: G_WEAR },
  { name: `מסכה כירורגית רגילה לניתוח עם קשירה/גומי`, sku: '20800009', group: G_WEAR },
  { name: `כובע מנתחים רופא עם גומי`, sku: '20800007', group: G_WEAR },
  { name: `כובע מנתחים רופא עם קשירות`, sku: '20800002', group: G_WEAR },
  { name: `GOWN + TOWL STERILE DISP XL חלוק מנתח סטרילי`, sku: '20800015', group: G_WEAR },
  { name: `חלוק סטנדרט סטרילי`, group: G_WEAR },
  { name: `חלוק בידוד תכלת חד-פעמי למזוהמים`, sku: '20800014', group: G_WEAR },
  { name: `חלוק צהוב חד-פעמי`, sku: '20800054', group: G_WEAR },
  { name: `סינר פלסטיק חד-פעמי`, sku: '20800016', group: G_WEAR },
  { name: `כיסוי נעליים מבד חד-פעמי`, sku: '20800030', group: G_WEAR },
  { name: `תחתונים חד-פעמיים למטופל`, sku: '20800043', group: G_WEAR },

  // ציוד מתכלה כללי וכירורגיה
  { name: `קופסא לאחסון שיניים תותבות כולל מכסה`, sku: '14400071', group: G_SURG },
  { name: `סדינית מרפד חד-פעמי 90X60 ס"מ`, sku: '14400077', group: G_SURG },
  { name: `סדין חד-פעמי עם גומי למיטה`, sku: '20500471', group: G_SURG },
  { name: `סדין סטרילי`, sku: '0500501', group: G_SURG },
  { name: `סדין מטופל`, sku: '15112402', group: G_SURG },
  { name: `כיסוי מטופל`, sku: '172101', group: G_SURG },
  { name: `כיסוי מיטה חד-פעמי גליל או סדין`, sku: '14400043', group: G_SURG },
  { name: `כליה חד-פעמית מנייר`, sku: '14400144', group: G_SURG },
  { name: `פד גזה לא סטרילי 5X5 ס"מ`, sku: '20000028', group: G_SURG },
  { name: `פד גזה לא סטרילי 10X10 ס"מ`, sku: '20000029', group: G_SURG },
  { name: `גזות סטריליות מסומנות`, sku: '20000027', group: G_SURG },
  { name: `ספוגיות סטריליות`, sku: '20000018', group: G_SURG },
  { name: `פד כדורי סטריפד סטרילי`, sku: '20000494', group: G_SURG },
  { name: `פלסטר מיקרופור`, sku: '20000045', group: G_SURG },
  { name: `PAD ALCOHOL MEDI PLUS 521 פד אלכוהול לחיטוי`, sku: '20000961', group: G_SURG },
  { name: `חוט תפר ויקריל 1-0 או 2-0`, sku: '10400492 / 10400494 / 10400495', group: G_SURG },
  { name: `ספקולום חד-פעמי (אירית)`, group: G_SURG },
  { name: `מחזיק ספוג לסט רחצה`, sku: '115-107', group: G_SURG },
  { name: `סרג'צל לעצירת דימום`, sku: '10400083', group: G_SURG },
  { name: `פיברילר לעצירת דימום`, sku: '12700007', group: G_SURG },
  { name: `שקית איסוף שתן`, sku: '20000185', group: G_SURG },
  { name: `נייר טישו יבש`, sku: '20500063', group: G_SURG },
  { name: `מפית עם לוגו`, sku: '20500075', group: G_SURG },
  { name: `כוסות שתייה חד-פעמיות`, sku: '21800001', group: G_SURG },
  { name: `COVER FOR IMAGER R65 כיסוי למצלמה / אימג'ר`, sku: '14800088', group: G_SURG },
  { name: `CAMERA COVER 15*250 CM כיסוי שרוול למצלמה`, sku: '13500034', group: G_SURG },
  { name: `סט מכשירים לגרידה (מחדר ניתוח)`, group: G_SURG },
  { name: `סט רחצה: כליה, כוסות וכוסית (ציוד מחלקה)`, group: G_SURG },

  // נוזלים ותרופות
  { name: `I.SOD.CHLORIDE 0.9% 0.5L תמיסת סליין לעירוי חצי ליטר`, sku: '35500010', group: G_FLUID },
  { name: `BOT.SALINE 0.9% IRRIGATION 1L תמיסת סליין לשטיפה בקבוק 1 ליטר`, sku: '35500005', group: G_FLUID },
  { name: `תמיסת סליין שטיפה 3 ליטר`, sku: '35500025', group: G_FLUID },
  { name: `I.GLUCOSE / DEXTROSE 5% 100ml תמיסת גלוקוז 5 אחוז`, sku: '35500032', group: G_FLUID },
  { name: `מים סטריליים 1 ליטר`, sku: '35500004', group: G_FLUID },
  { name: `CARPULE LIDOCAINE ADRENALINE לידוקאין אדרנלין קרפולות`, sku: '32000020', group: G_FLUID },
  { name: `ג'ל עזרקאין סטרילי במזרקים`, sku: '33000092', group: G_FLUID },
  { name: `ACETIC ACID חומצה אצטית (בית מרקחת)`, group: G_FLUID },

  // שונות ומשרד
  { name: `נייר חלק למדפסת ללא מדבקה`, sku: '11300119', group: G_OFFICE },
  { name: `צבע למדפסת שחור`, sku: '22201355', group: G_OFFICE },
  { name: `צבע למדפסת כחול`, sku: '22201356', group: G_OFFICE },
  { name: `צבע למדפסת אדום`, sku: '22201357', group: G_OFFICE },
  { name: `צבע למדפסת צהוב`, sku: '22201358', group: G_OFFICE },
]

// הגדרת הקטגוריות עבור מחלקה נתונה.
// waTitle = כותרת קבועה להודעת הוואטסאפ של אותה קטגוריה.
//
// רשימת "ציוד מתכלים כללי" המלאה שייכת כרגע לגסטרו ופעולות בלבד.
// בשאר המחלקות הכפתור והקטגוריה נשארים, אך התוכן ריק עד שתתווסף
// רשימה ייעודית לכל מחלקה.
export function getShortageCategories(unitId) {
  return [
    {
      id: 'endoscopic',
      label: 'ציוד מתכלים כללי',
      waTitle: 'בקשה לרכש ציוד מתכלים כללי',
      note: ORDER_NOTE,
      items: unitId === 'gastro' ? GENERAL_CONSUMABLES : [],
    },
    {
      id: 'meds',
      label: 'הזמנת תרופות',
      waTitle: 'בקשה להזמנת תרופות',
      items: getMedList(unitId),
    },
  ]
}

// מפתח ייחודי לפריט (לשמירת סטטוס "חסר") – יציב בין סינון/חיפוש לתצוגה רגילה.
export function itemKey(catId, item) {
  return catId + '::' + (item.sku || item.name)
}

// בניית טקסט הודעת הוואטסאפ: כותרת קבועה, שורת דחיפות, ורשימה נקייה
// (שם + מק״ט בלבד, ללא המילה "חסר" וללא סוגריים). ללא כותרת תחתית.
export function buildWhatsAppText(category, items, urgency) {
  // כותרת ודחיפות מודגשות בוואטסאפ (תחביר *מודגש*)
  const lines = ['*' + category.waTitle + '*']
  if (urgency) lines.push('🔴 *דחיפות: ' + urgency + '*')
  lines.push('')
  items.forEach((it) => {
    lines.push('• ' + it.name + (it.sku ? ' ' + it.sku : '') + (it.qty ? '  כמות: ' + it.qty : ''))
  })
  return lines.join('\n')
}

// פתיחת וואטסאפ עם הטקסט המוכן (בורר צ׳אט/קבוצה במכשיר).
export function sendWhatsApp(category, items, urgency) {
  const url = 'https://wa.me/?text=' + encodeURIComponent(buildWhatsAppText(category, items, urgency))
  window.open(url, '_blank', 'noopener')
}
