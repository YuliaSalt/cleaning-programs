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

function doGet(e) {
  e = e || {};
  var params = e.parameter || {};
  try {
    return respond(buildPayload(params), params.callback);
  } catch (err) {
    return respond(
      { ok: false, error: String(err && err.message ? err.message : err), count: 0, updatedAt: null, data: [] },
      params.callback
    );
  }
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
