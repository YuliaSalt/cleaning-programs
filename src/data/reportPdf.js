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

// שמירת ה-PDF להורדה במכשיר.
export async function savePdf(el, filename) {
  if (!el) throw new Error('no element')
  const html2pdf = await getHtml2pdf()
  return html2pdf().set(options(filename)).from(el).save()
}

// יצירת ה-PDF כ-Blob (לשיתוף / צירוף למייל).
export async function pdfBlob(el, filename) {
  if (!el) throw new Error('no element')
  const html2pdf = await getHtml2pdf()
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

// שליחת הדוח כ-PDF למייל. מחזיר: 'shared' | 'cancelled' | 'fallback'.
export async function emailPdf(el, filename, subject) {
  const blob = await pdfBlob(el, filename)
  const file = new File([blob], filename, { type: 'application/pdf' })
  const title = subject || filename

  // שיתוף מקורי עם קובץ מצורף (נתמך בעיקר בנייד/טאבלט)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text: title })
      return 'shared'
    } catch (err) {
      if (err && err.name === 'AbortError') return 'cancelled'
      // נפילה לשיטה החלופית
    }
  }

  // חלופה: הורדת ה-PDF + פתיחת תוכנת דואר לצירוף ידני של הקובץ שהורד.
  downloadBlob(blob, filename)
  const body = 'מצורף הדוח: ' + title + '\n\n(צרף/י למייל את קובץ ה-PDF שהורד כעת למכשיר.)'
  window.location.href =
    'mailto:?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(body)
  return 'fallback'
}
