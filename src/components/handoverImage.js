// יצירת תמונת וואטסאפ אחידה מטופס העברת המשמרת.
// רוחב קבוע 1080px, גובה דינמי, עברית RTL, רקע לבן נקי, קריא וברור.

import {
  GASTRO_REPORT_ITEMS,
  GASTRO_CHECK_BLOCKS,
  GEN_OCC_NAMES,
  GEN_OCC_NUMBERS,
  GEN_REPORT_ITEMS,
  GEN_CHECK_ITEMS,
  OR_SECTIONS,
  fullName,
} from '../data/handover.js'

const W = 1080
const PAD = 64

// טעינת לוגו HMC מראש לציור על גבי הדוח (יחס מקורי 2048x618)
const LOGO_W = 380
const LOGO_H = Math.round((LOGO_W * 618) / 2048)
const TOP_RESERVE = LOGO_H + 30
let logoImg = null
if (typeof Image !== 'undefined') {
  const _img = new Image()
  _img.onload = () => { logoImg = _img }
  _img.src = ((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/') + 'logo.png'
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// מפעל פרימיטיבי ציור משותף לשני סוגי הטפסים.
function makeBuilder() {
  const m = document.createElement('canvas').getContext('2d')
  const ops = []
  let y = PAD + TOP_RESERVE // שמירת מקום ללוגו בראש הדוח

  const setFont = (c, s, b) => { c.font = `${b ? 700 : 400} ${s}px Heebo, Arial, sans-serif` }
  const wrapLine = (str, s, b, maxW) => {
    setFont(m, s, b)
    const lines = []
    let cur = ''
    const fits = (txt) => m.measureText(txt).width <= maxW
    const pushWord = (w) => {
      if (fits(w)) {
        const t = cur ? cur + ' ' + w : w
        if (!fits(t) && cur) { lines.push(cur); cur = w } else cur = t
        return
      }
      if (cur) { lines.push(cur); cur = '' }
      let chunk = ''
      for (const ch of w) {
        if (!fits(chunk + ch) && chunk) { lines.push(chunk); chunk = ch } else chunk += ch
      }
      cur = chunk
    }
    for (const w of String(str).split(/\s+/).filter(Boolean)) pushWord(w)
    if (cur) lines.push(cur)
    return lines.length ? lines : ['']
  }
  const wrap = (str, s, b, maxW) => {
    const out = []
    for (const part of String(str || '').split('\n')) {
      out.push(...(part.trim() ? wrapLine(part, s, b, maxW) : ['']))
    }
    return out
  }
  const para = (str, { s = 38, b = false, color = '#1f2d36', align = 'right', indent = 0, gap = 0.34 } = {}) => {
    const maxW = W - PAD * 2 - indent
    for (const ln of wrap(str, s, b, maxW)) {
      y += s
      ops.push({ t: 'txt', str: ln, s, b, color, align, x: align === 'right' ? W - PAD - indent : align === 'center' ? W / 2 : PAD + indent, y })
      y += s * gap
    }
  }
  const statusRow = (label, status, color, b = false) => {
    const s = 38
    // התווית נשברת לשורות כדי לא לחרוג מהמסגרת; הסטטוס נשאר בצד שמאל בשורה הראשונה
    setFont(m, s, true)
    const reserve = m.measureText(String(status)).width + 36
    const lines = wrapLine(label, s, b, W - PAD * 2 - reserve)
    lines.forEach((ln, i) => {
      y += s
      ops.push({ t: 'txt', str: ln, s, b, color: '#1f2d36', align: 'right', x: W - PAD, y })
      if (i === 0) ops.push({ t: 'txt', str: status, s, b: true, color, align: 'left', x: PAD, y })
      if (i < lines.length - 1) y += s * 0.3
    })
    y += s * 0.4
  }
  const kv = (label, value, note) => {
    const s = 38
    y += s
    ops.push({ t: 'txt', str: label + ':', s, b: true, color: '#0a4d8c', align: 'right', x: W - PAD, y })
    ops.push({ t: 'txt', str: value && String(value).trim() ? String(value) : '—', s, b: false, color: '#1f2d36', align: 'left', x: PAD, y })
    y += s * 0.4
    if (note && note.trim()) para('הערה: ' + note.trim(), { s: 30, color: '#5b7493', indent: 30, gap: 0.3 })
  }
  const band = (title) => {
    y += 24
    const top = y
    const H = 80
    ops.push({ t: 'rect', x: PAD - 18, y: top, w: W - (PAD - 18) * 2, h: H, fill: '#dff1f9', r: 16 })
    ops.push({ t: 'txt', str: title, s: 42, b: true, color: '#0a4d8c', align: 'right', x: W - PAD, y: top + 56 })
    y = top + H + 18
  }
  const line = () => { y += 12; ops.push({ t: 'line', y }); y += 4 }
  const gap = (n) => { y += n }

  const finish = () => {
    gap(26)
    line()
    gap(8)
    para('הרצליה מדיקל סנטר', { s: 36, b: true, color: '#8194a0', align: 'center' })
    const H = Math.ceil(y + PAD)
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    ctx.direction = 'rtl'
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)
    // לוגו HMC ממורכז בראש הדוח
    if (logoImg) {
      try { ctx.drawImage(logoImg, (W - LOGO_W) / 2, PAD, LOGO_W, LOGO_H) } catch (e) { /* noop */ }
    }
    for (const op of ops) {
      if (op.t === 'rect') {
        roundRect(ctx, op.x, op.y, op.w, op.h, op.r)
        ctx.fillStyle = op.fill
        ctx.fill()
      } else if (op.t === 'line') {
        ctx.strokeStyle = '#dbeef6'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(PAD, op.y)
        ctx.lineTo(W - PAD, op.y)
        ctx.stroke()
      } else {
        setFont(ctx, op.s, op.b)
        ctx.fillStyle = op.color
        ctx.textAlign = op.align
        ctx.fillText(op.str, op.x, op.y)
      }
    }
    return canvas
  }

  return { para, statusRow, kv, band, line, gap, finish }
}

function header(b, title, record) {
  const time = record.savedAt
    ? new Date(record.savedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    : ''
  b.para(title, { s: 56, b: true, color: '#0a4d8c' })
  b.para(`${record.unitName || ''} · ${record.date}${time ? ' · ' + time : ''} · משמרת ${record.shift}`, { s: 36, color: '#5b7493' })
  if (record.nurse) b.para(`אחות מוסרת (חתימה): ${record.nurse}`, { s: 38, b: true, color: '#0a4d8c' })
  b.line()
}

// ===== טופס גסטרו =====
export function buildHandoverImage(record) {
  const b = makeBuilder()
  header(b, 'העברת משמרת גסטרו', record)

  b.band('דיווח ובקרה')
  for (const it of GASTRO_REPORT_ITEMS) {
    const r = (record.reports && record.reports[it.id]) || {}
    b.statusRow(it.label, r.has ? 'יש' : 'אין', r.has ? '#15a34a' : '#8194a0', true)
    if (r.has && r.text && r.text.trim()) b.para(r.text.trim(), { s: 34, color: '#33424d', indent: 30, gap: 0.32 })
    b.gap(6)
  }
  for (const blk of GASTRO_CHECK_BLOCKS) {
    b.band(blk.title)
    blk.items.forEach((label, i) => {
      const on = record.checks && record.checks[blk.id] && record.checks[blk.id][i]
      b.statusRow(label, on ? '✓ בוצע' : '— לא סומן', on ? '#15a34a' : '#a0adb8')
      b.gap(3)
    })
  }
  return b.finish()
}

// ===== טופס כללי (מחלקות / יחידות) =====
export function buildGeneralHandoverImage(record) {
  const b = makeBuilder()
  header(b, `העברת משמרת - ${record.unitName || ''}`, record)

  b.band('נתוני תפוסה וצוות')
  for (const it of GEN_OCC_NAMES) {
    b.kv(it.label, fullName(record[it.id]))
    b.gap(3)
  }
  for (const it of GEN_OCC_NUMBERS) {
    b.kv(it.label, (record.numbers && record.numbers[it.id]) || '')
    b.gap(3)
  }
  if (record.occNote && record.occNote.trim()) b.kv('הערות', record.occNote.trim())

  b.band('דיווח ובקרה קליני וניהולי')
  for (const it of GEN_REPORT_ITEMS) {
    const r = (record.reports && record.reports[it.id]) || {}
    b.statusRow(it.label, r.has ? 'יש' : 'אין', r.has ? '#15a34a' : '#8194a0', true)
    if (r.has && r.text && r.text.trim()) b.para(r.text.trim(), { s: 34, color: '#33424d', indent: 30, gap: 0.32 })
    b.gap(6)
  }

  b.band('משימות ובטיחות המחלקה')
  GEN_CHECK_ITEMS.forEach((label, i) => {
    const c = (record.checks && record.checks[i]) || {}
    b.statusRow(label, c.on ? '✓ בוצע' : '— לא סומן', c.on ? '#15a34a' : '#a0adb8')
    if (c.note && c.note.trim()) b.para('הערה: ' + c.note.trim(), { s: 30, color: '#5b7493', indent: 30, gap: 0.3 })
    b.gap(4)
  })

  return b.finish()
}

// ===== טופס חדרי ניתוח =====
export function buildORHandoverImage(record) {
  const b = makeBuilder()
  header(b, 'העברת משמרת – חדרי ניתוח', record)
  for (const s of OR_SECTIONS) {
    if (s.part) { b.band(s.part); continue }
    const st = (record.sections && record.sections[s.id]) || { flag: false }
    b.statusRow(s.label, st.flag ? s.bad : s.good, st.flag ? '#c0392b' : '#15a34a', true)
    if (st.flag) {
      if (s.multi) {
        ;(st.rows || []).forEach((row, idx) => {
          const parts = s.fields.map((f) => (row[f.id] && String(row[f.id]).trim() ? f.label + ': ' + row[f.id] : '')).filter(Boolean)
          if (parts.length) b.para(idx + 1 + '. ' + parts.join(' · '), { s: 34, color: '#33424d', indent: 26, gap: 0.32 })
        })
      } else {
        s.fields.forEach((f) => {
          const v = (st.fields || {})[f.id]
          if (v && String(v).trim()) b.para(f.label + ': ' + String(v).trim(), { s: 34, color: '#33424d', indent: 26, gap: 0.32 })
        })
      }
    }
    b.gap(6)
  }
  return b.finish()
}

// שיתוף התמונה לוואטסאפ (navigator.share) עם נפילה להורדה.
// נשלחת התמונה בלבד – ללא טקסט/רישום נלווה.
export async function shareHandoverImage(canvas) {
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png', 0.95))
  const file = new File([blob], 'handover.png', { type: 'image/png' })
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled'
    }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'handover.png'
  document.body.appendChild(a)
  a.click()
  a.remove()
  return 'downloaded'
}
