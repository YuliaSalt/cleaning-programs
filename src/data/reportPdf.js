// יצירת PDF מתוך תצוגת דוח שמורה (אלמנט .report-print) ושמירה / שליחה במייל.
// בלי שרת: ה-PDF נוצר בדפדפן. שליחה במייל מנסה תחילה את שיתוף-הקובץ המקורי
// של המכשיר (Web Share – נפתח Gmail/דוא"ל עם הקובץ מצורף בטאבלט/נייד),
// ואם לא נתמך – מוריד את ה-PDF ופותח את תוכנת הדואר לצירוף ידני.

// טעינה עצלה של הספרייה הכבדה – נטענת רק כשמייצרים PDF בפועל (לא בטעינת האפליקציה).
let _html2pdf = null
async function getHtml2pdf() {
  if (!_html2pdf) {
    const mod = await import('html2pdf.js')
    _html2pdf = mod.default || mod
  }
  return _html2pdf
}

// שם קובץ חוקי (ללא תווים אסורים) עם סיומת .pdf
export function pdfFilename(name) {
  const clean = String(name || 'דוח').replace(/[\\/:*?"<>|\n\r\t]+/g, ' ').trim()
  return (clean || 'דוח') + '.pdf'
}

function options(filename) {
  return {
    margin: [10, 10, 12, 10],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] },
  }
}

// המתנה לטעינת תמונות בתוך האלמנט (לוגו) לפני הלכידה.
function waitForImages(el) {
  const imgs = [...el.querySelectorAll('img')].filter((i) => !i.complete)
  return Promise.all(imgs.map((i) => new Promise((res) => { i.onload = i.onerror = res })))
}

// הערה: אלמנט המקור חייב להיות במיקום רגיל (static) ובגודל מלא – html2pdf משכפל
// אותו, ומשכפול של אלמנט position:fixed/מחוץ-למסך מתקבל דף ריק. הסתרה ויזואלית
// נעשית ע"י עוטף .pdf-host (height:0; overflow:hidden) ולא ע"י מיקום.

// שמירת ה-PDF להורדה במכשיר.
export async function savePdf(el, filename) {
  if (!el) throw new Error('no element')
  const html2pdf = await getHtml2pdf()
  await waitForImages(el)
  return html2pdf().set(options(filename)).from(el).save()
}

// יצירת ה-PDF כ-Blob (לשיתוף / צירוף למייל).
export async function pdfBlob(el, filename) {
  if (!el) throw new Error('no element')
  const html2pdf = await getHtml2pdf()
  await waitForImages(el)
  return html2pdf().set(options(filename)).from(el).output('blob')
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

// פתיחת תוכנת דואר עם נושא/גוף מוכנים, מבלי לנווט את העמוד (לא מבטל הורדה פעילה).
function openMail(subject, body) {
  const a = document.createElement('a')
  a.href = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body)
  document.body.appendChild(a)
  a.click()
  a.remove()
}

// שליחת הדוח כ-PDF למייל. מחזיר: 'shared' | 'cancelled' | 'fallback'.
// בנייד/טאבלט – שיתוף מקורי עם הקובץ מצורף (Gmail/דוא"ל). במחשב – הורדת ה-PDF
// ופתיחת תוכנת הדואר לצירוף ידני (mailto אינו תומך בצירוף אוטומטי).
export async function emailPdf(el, filename, subject) {
  const blob = await pdfBlob(el, filename)
  const title = subject || filename

  // שיתוף מקורי עם קובץ מצורף (נתמך בעיקר בנייד/טאבלט)
  if (typeof File !== 'undefined' && navigator.canShare) {
    const file = new File([blob], filename, { type: 'application/pdf' })
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title, text: title })
        return 'shared'
      } catch (err) {
        if (err && err.name === 'AbortError') return 'cancelled'
        // כל כשל אחר – ממשיכים לחלופה (הורדה + מייל)
      }
    }
  }

  // חלופה: קודם מורידים את ה-PDF (await קצר כדי שההורדה תיזום), ואז פותחים דואר.
  downloadBlob(blob, filename)
  const body = 'מצורף דוח החסרים: ' + title + '\n\nקובץ ה-PDF ירד כעת למכשיר — יש לצרף אותו למייל לפני השליחה.'
  await new Promise((r) => setTimeout(r, 600))
  openMail(title, body)
  return 'fallback'
}
