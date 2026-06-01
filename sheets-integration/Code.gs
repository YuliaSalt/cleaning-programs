/**
 * HMC – אינטגרציית תוכניות ניקיון מבוססת Google Sheets
 * Web App (doGet) – קריאה בלבד. אינו כותב/מוחק/משנה דבר בגיליון.
 *
 * פריסה: Deploy → New deployment → Web app
 *   Execute as: Me
 *   Who has access: Anyone
 * העתק את כתובת ה-/exec אל הקבוע API_URL בקובץ index.html.
 */

/* ===================== קבועים נוחים לעריכה ===================== */
// שם הגיליון (הטאב) שממנו נקראים הנתונים. השאר '' לשימוש בגיליון הפעיל.
var SHEET_NAME = 'Sheet1';

// שם עמודת התאריך (בדיוק כפי שמופיע בשורה 1).
var DATE_COLUMN = 'תאריך';

// שמות עמודות לסינון (התאם אם שונה בגיליון). משמשים לפרמטרים shift / department.
var COL_SHIFT = 'משמרת';
var COL_DEPARTMENT = 'מחלקה';
/* ============================================================== */

// ימי השבוע בעברית, אינדקס 0 = ראשון
var HE_WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

// שם הטאב שבו נשמרים דוחות הביצוע (גיבוי ענן מהאפליקציה). נוצר אוטומטית אם חסר.
var REPORTS_SHEET = 'Reports';
var REPORTS_HEADERS = ['key', 'savedAt', 'unitId', 'tabId', 'by', 'payload'];

function doGet(e) {
  e = e || {};
  var params = e.parameter || {};
  try {
    // action=reports – קריאת כל דוחות הביצוע שגובו (לשחזור/מיזוג באפליקציה)
    if (params.action === 'reports') {
      return respond(readReports(), params.callback);
    }
    return respond(buildPayload(params), params.callback);
  } catch (err) {
    return respond(
      { ok: false, error: String(err && err.message ? err.message : err), count: 0, updatedAt: null, data: [] },
      params.callback
    );
  }
}

// כתיבה: שמירה/מחיקה של דוח ביצוע בודד (נקרא מהאפליקציה ב-POST).
function doPost(e) {
  e = e || {};
  try {
    var body = {};
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    var key = String(body.key || '').trim();
    if (!key) return respond({ ok: false, error: 'missing key' });

    if (body.action === 'delete') {
      deleteReport(key);
      return respond({ ok: true, action: 'delete', key: key });
    }
    saveReport(key, body.rec || {});
    return respond({ ok: true, action: 'save', key: key });
  } catch (err) {
    return respond({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

/* ===================== אחסון דוחות בטאב Reports ===================== */
function getReportsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(REPORTS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(REPORTS_SHEET);
    sh.getRange(1, 1, 1, REPORTS_HEADERS.length).setValues([REPORTS_HEADERS]);
  }
  return sh;
}

// מאתר את מספר השורה (1-based) של מפתח נתון, או -1 אם לא קיים.
function findReportRow(sh, key) {
  var last = sh.getLastRow();
  if (last < 2) return -1;
  var keys = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < keys.length; i++) {
    if (String(keys[i][0]) === key) return i + 2;
  }
  return -1;
}

function saveReport(key, rec) {
  var sh = getReportsSheet();
  var row = [
    key,
    rec.savedAt || '',
    keyField(key, 0),
    keyField(key, 2),
    rec.by || '',
    JSON.stringify(rec),
  ];
  var at = findReportRow(sh, key);
  if (at === -1) {
    sh.appendRow(row);
  } else {
    sh.getRange(at, 1, 1, row.length).setValues([row]);
  }
}

function deleteReport(key) {
  var sh = getReportsSheet();
  var at = findReportRow(sh, key);
  if (at !== -1) sh.deleteRow(at);
}

function readReports() {
  var sh = getReportsSheet();
  var last = sh.getLastRow();
  var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone() || 'Asia/Jerusalem';
  if (last < 2) return { ok: true, count: 0, updatedAt: nowIso(tz), data: [] };
  var values = sh.getRange(2, 1, last - 1, REPORTS_HEADERS.length).getValues();
  var data = [];
  for (var i = 0; i < values.length; i++) {
    var key = String(values[i][0] || '').trim();
    if (!key) continue;
    data.push({
      key: key,
      savedAt: values[i][1],
      unitId: values[i][2],
      tabId: values[i][3],
      by: values[i][4],
      payload: values[i][5], // JSON string – נפרק באפליקציה
    });
  }
  return { ok: true, count: data.length, updatedAt: nowIso(tz), data: data };
}

// חילוץ חלק ממפתח התוכנית: hmc:plan:{unitId}:{room}:{tabId}:{sectionId}:{period}
function keyField(key, idx) {
  var parts = String(key).replace(/^hmc:plan:/, '').split(':');
  return parts[idx] != null ? parts[idx] : '';
}

/* בניית התשובה מהגיליון */
function buildPayload(params) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tz = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone() || 'Asia/Jerusalem';

  var sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getActiveSheet();
  if (!sheet) sheet = ss.getActiveSheet();

  var values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) {
    return { ok: true, count: 0, updatedAt: nowIso(tz), tz: tz, data: [] };
  }

  // שמות עמודות נקראים דינמית משורה 1
  var headers = values[0].map(function (h) { return String(h).trim(); });
  var dateIdx = headers.indexOf(DATE_COLUMN);

  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var arr = values[r];
    if (isEmptyRow(arr)) continue;

    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var key = headers[c] || ('col' + (c + 1));
      obj[key] = normalizeCell(arr[c], tz);
    }

    // גזירת שדות תאריך בשרת לפי אזור הזמן של הגיליון
    var d = dateIdx >= 0 ? parseDate(arr[dateIdx], tz) : null;
    if (d) {
      obj._iso = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
      obj._year = Number(Utilities.formatDate(d, tz, 'yyyy'));
      obj._month = Number(Utilities.formatDate(d, tz, 'MM'));
      obj._day = Number(Utilities.formatDate(d, tz, 'dd'));
      var dow = Number(Utilities.formatDate(d, tz, 'u')); // 1=שני ... 7=ראשון
      obj._weekday = HE_WEEKDAYS[dow % 7]; // 7→0 ראשון, 1→שני ...
    } else {
      obj._iso = '';
      obj._year = null;
      obj._month = null;
      obj._day = null;
      obj._weekday = '';
    }

    rows.push(obj);
  }

  rows = applyFilters(rows, params);

  return {
    ok: true,
    count: rows.length,
    updatedAt: nowIso(tz),
    tz: tz,
    columns: headers,
    data: rows
  };
}

/* סינון אופציונלי לפי פרמטרים ב-URL. ללא פרמטרים – מחזיר הכל. */
function applyFilters(rows, p) {
  function has(x) { return x !== undefined && x !== null && String(x).trim() !== ''; }
  var qLower = has(p.q) ? String(p.q).toLowerCase() : null;

  return rows.filter(function (row) {
    if (has(p.shift) && eqTrim(row[COL_SHIFT], p.shift) === false) return false;
    if (has(p.department) && eqTrim(row[COL_DEPARTMENT], p.department) === false) return false;
    if (has(p.weekday) && String(row._weekday || '') !== String(p.weekday).trim()) return false;
    if (has(p.month) && Number(row._month) !== Number(p.month)) return false;
    if (has(p.year) && Number(row._year) !== Number(p.year)) return false;
    if (has(p.from) && (!row._iso || row._iso < String(p.from).trim())) return false;
    if (has(p.to) && (!row._iso || row._iso > String(p.to).trim())) return false;
    if (qLower) {
      var hay = '';
      for (var k in row) {
        if (k.charAt(0) === '_') continue; // דלג על שדות נגזרים
        hay += ' ' + row[k];
      }
      if (hay.toLowerCase().indexOf(qLower) === -1) return false;
    }
    return true;
  });
}

/* ===================== עזרים ===================== */
function eqTrim(a, b) { return String(a == null ? '' : a).trim() === String(b == null ? '' : b).trim(); }

function isEmptyRow(arr) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] !== '' && arr[i] !== null && arr[i] !== undefined) return false;
  }
  return true;
}

function normalizeCell(val, tz) {
  if (val === null || val === undefined) return '';
  if (Object.prototype.toString.call(val) === '[object Date]') {
    return Utilities.formatDate(val, tz, 'yyyy-MM-dd');
  }
  return val;
}

function parseDate(val, tz) {
  if (val === null || val === undefined || val === '') return null;
  if (Object.prototype.toString.call(val) === '[object Date]') return val;

  var s = String(val).trim();
  if (!s) return null;

  // dd/MM/yyyy או dd-MM-yyyy או dd.MM.yyyy
  var m = s.match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})$/);
  if (m) {
    var dd = Number(m[1]), mm = Number(m[2]), yy = Number(m[3]);
    if (yy < 100) yy += 2000;
    return new Date(yy, mm - 1, dd);
  }
  var d = new Date(s); // ISO וכו'
  return isNaN(d.getTime()) ? null : d;
}

function nowIso(tz) {
  return Utilities.formatDate(new Date(), tz, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/* JSON רגיל, או JSONP אם נשלח callback (fallback ל-CORS) */
function respond(obj, callback) {
  var json = JSON.stringify(obj);
  if (callback) {
    return ContentService
      .createTextOutput(String(callback) + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
