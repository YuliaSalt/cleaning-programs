import { useMemo, useState } from 'react'
import ScreenHeader from './ScreenHeader.jsx'
import { getGastroShift } from '../data/departments.js'
import {
  GASTRO_REPORT_ITEMS,
  GASTRO_CHECK_BLOCKS,
  emptyHandover,
  saveHandover,
  listHandovers,
  HE_MONTHS,
} from '../data/handover.js'
import { buildHandoverImage, shareHandoverImage } from './handoverImage.js'

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.4.7 4.6 1.9 6.5L4 29l7-1.8c1.8 1 3.8 1.5 6 1.5 6.6 0 12-5.3 12-11.9C29 8.3 22.6 3 16 3zm0 21.7c-1.9 0-3.7-.5-5.2-1.4l-.4-.2-4.1 1.1 1.1-4-.3-.4c-1-1.6-1.5-3.5-1.5-5.5C5.6 9.2 10.2 4.7 16 4.7s10.4 4.5 10.4 10.2S21.8 24.7 16 24.7z" />
      <path d="M22 18.3c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4z" />
    </svg>
  )
}

const SHIFTS = ['בוקר', 'ערב']
const todayStr = () => new Date().toLocaleDateString('en-CA')

/* ===== טופס מילוי ===== */
function HandoverForm({ unit, onSent, onReset }) {
  const now = new Date()
  // משמרת נקבעת אוטומטית לפי השעה (06:30–15:00 בוקר, 15:00–23:00 ערב)
  const [shift, setShift] = useState(() => getGastroShift())
  const [reports, setReports] = useState(() => emptyHandover(unit.id, unit.name, shift).reports)
  const [checks, setChecks] = useState(() => emptyHandover(unit.id, unit.name, shift).checks)
  const [nurse, setNurse] = useState({ first: '', last: '' })
  const [err, setErr] = useState(false)
  const [busy, setBusy] = useState(false)

  const dateHe = now.toLocaleDateString('he-IL')
  const timeHe = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })

  const setHas = (id, has) =>
    setReports((r) => ({ ...r, [id]: { has, text: has ? r[id].text : '' } }))
  const setText = (id, text) => setReports((r) => ({ ...r, [id]: { ...r[id], text } }))
  const toggle = (blk, i) => setChecks((c) => ({ ...c, [blk]: { ...c[blk], [i]: !c[blk][i] } }))

  function reset() {
    const e = emptyHandover(unit.id, unit.name, shift)
    setReports(e.reports)
    setChecks(e.checks)
    setNurse({ first: '', last: '' })
    setErr(false)
    if (onReset) onReset()
  }

  async function send() {
    // חובה לרשום שם ושם משפחה של האחות המוסרת לפני שמירה ושליחה
    if (!nurse.first.trim() || !nurse.last.trim()) {
      setErr(true)
      return
    }
    setErr(false)
    setBusy(true)
    // תאריך, שעה ומשמרת נרשמים אוטומטית בעת השליחה
    const at = new Date()
    const record = {
      unitId: unit.id,
      unitName: unit.name,
      date: todayStr(),
      shift: getGastroShift(at),
      savedAt: at.toISOString(),
      nurse: (nurse.first.trim() + ' ' + nurse.last.trim()).trim(),
      reports,
      checks,
    }
    saveHandover(record)
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready
      const canvas = buildHandoverImage(record)
      await shareHandoverImage(canvas, 'העברת משמרת גסטרו · קבוצת אחריות משמרת')
    } catch (e) {
      /* גם אם השיתוף נכשל – הרישום כבר נשמר בארכיון */
    }
    setBusy(false)
    onSent()
  }

  return (
    <div className="glass plan-card ho-form">
      <div className="ho-title">העברת משמרת גסטרו</div>

      <div className="ho-subrow">
        <span className="ho-date">תאריך: {dateHe} · שעה: {timeHe}</span>
        <div className="chips-wrap">
          <div className="chips">
            {SHIFTS.map((s) => (
              <button key={s} className={'chip' + (shift === s ? ' active' : '')} onClick={() => setShift(s)}>
                {s}
              </button>
            ))}
          </div>
          <span className="ho-auto-hint">המשמרת נקבעה אוטומטית לפי השעה</span>
        </div>
      </div>

      {/* בלוק 1 – דיווח ובקרה */}
      <div className="ho-block">
        <div className="ho-block-title">דיווח ובקרה</div>
        {GASTRO_REPORT_ITEMS.map((it) => (
          <div className="yn-row" key={it.id}>
            <div className="yn-head">
              <span className="yn-label">{it.label}</span>
              <div className="yn-btns">
                <button className={'yn-btn yes' + (reports[it.id].has ? ' active' : '')} onClick={() => setHas(it.id, true)}>יש</button>
                <button className={'yn-btn no' + (!reports[it.id].has ? ' active' : '')} onClick={() => setHas(it.id, false)}>אין</button>
              </div>
            </div>
            <div className={'yn-detail' + (reports[it.id].has ? ' open' : '')}>
              <textarea
                className="input"
                rows={3}
                placeholder={it.placeholder}
                value={reports[it.id].text}
                onChange={(e) => setText(it.id, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* בלוקים 2-4 – צ׳קליסטים */}
      {GASTRO_CHECK_BLOCKS.map((blk) => (
        <div className="ho-block" key={blk.id}>
          <div className="ho-block-title">{blk.title}</div>
          {blk.items.map((label, i) => {
            const on = !!checks[blk.id][i]
            return (
              <button key={i} className={'ho-check' + (on ? ' on' : '')} onClick={() => toggle(blk.id, i)}>
                <span className="ho-circle">{on ? '✓' : ''}</span>
                <span className="ho-check-label">{label}</span>
              </button>
            )
          })}
        </div>
      ))}

      {/* חתימת אחות מוסרת – חובה */}
      <div className="ho-block">
        <div className="ho-block-title">חתימת אחות מוסרת</div>
        <div className="form-row">
          <div className="field">
            <label>שם פרטי <span className="req">*</span></label>
            <input
              className={'input' + (err && !nurse.first.trim() ? ' invalid' : '')}
              type="text"
              placeholder="שם פרטי"
              value={nurse.first}
              onChange={(e) => setNurse((n) => ({ ...n, first: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>שם משפחה <span className="req">*</span></label>
            <input
              className={'input' + (err && !nurse.last.trim() ? ' invalid' : '')}
              type="text"
              placeholder="שם משפחה"
              value={nurse.last}
              onChange={(e) => setNurse((n) => ({ ...n, last: e.target.value }))}
            />
          </div>
        </div>
        {err && <div className="err">חובה למלא שם ושם משפחה של האחות המוסרת לפני שמירה ושליחה.</div>}
      </div>

      <div className="ho-actions">
        <button className="wa-btn" onClick={send} disabled={busy}>
          <WhatsAppIcon /> {busy ? 'מכין תמונה...' : 'שלח לקבוצה'}
        </button>
        <button className="reset-btn" onClick={reset}>איפוס רשימה</button>
      </div>

      <div className="ho-footer">הרצליה מדיקל סנטר</div>
    </div>
  )
}

/* ===== תצוגת רישום שמור (קריאה בלבד) ===== */
function HandoverView({ record }) {
  async function reshare() {
    if (document.fonts && document.fonts.ready) await document.fonts.ready
    const canvas = buildHandoverImage(record)
    await shareHandoverImage(canvas, 'העברת משמרת גסטרו · קבוצת אחריות משמרת')
  }
  return (
    <div className="glass plan-card ho-form">
      <div className="ho-title">העברת משמרת גסטרו</div>
      <div className="ho-subrow">
        <span className="ho-date">
          תאריך: {record.date}
          {record.savedAt && <> · שעה: {new Date(record.savedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</>}
          {' '}· משמרת {record.shift}
        </span>
      </div>
      {record.nurse && <div className="ho-nurse">אחות מוסרת: <b>{record.nurse}</b></div>}

      <div className="ho-block">
        <div className="ho-block-title">דיווח ובקרה</div>
        {GASTRO_REPORT_ITEMS.map((it) => {
          const r = record.reports[it.id] || {}
          return (
            <div className="ho-view-row" key={it.id}>
              <span className="vr-label">{it.label}</span>
              <span className={'vr-status' + (r.has ? ' yes' : '')}>{r.has ? 'יש' : 'אין'}</span>
              {r.has && r.text && <p className="vr-text">{r.text}</p>}
            </div>
          )
        })}
      </div>

      {GASTRO_CHECK_BLOCKS.map((blk) => (
        <div className="ho-block" key={blk.id}>
          <div className="ho-block-title">{blk.title}</div>
          {blk.items.map((label, i) => {
            const on = record.checks[blk.id] && record.checks[blk.id][i]
            return (
              <div className="ho-view-row" key={i}>
                <span className="vr-label">{label}</span>
                <span className={'vr-status' + (on ? ' yes' : '')}>{on ? '✓ בוצע' : '— לא סומן'}</span>
              </div>
            )
          })}
        </div>
      ))}

      <div className="ho-actions">
        <button className="wa-btn" onClick={reshare}><WhatsAppIcon /> שלח שוב לקבוצה</button>
      </div>
      <div className="ho-footer">הרצליה מדיקל סנטר</div>
    </div>
  )
}

/* ===== מסך ראשי של קוביית העברת משמרת ===== */
export default function GastroHandover({ unit, onBack, onGoHome, onBackToCategory, categoryName }) {
  const [mode, setMode] = useState('list') // list | form | view
  const [openRec, setOpenRec] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const records = useMemo(() => listHandovers(unit.id), [unit.id, refresh])

  const baseTrail = [{ label: 'ראשי', onClick: onGoHome }]
  if (categoryName) baseTrail.push({ label: categoryName, onClick: onBackToCategory })
  baseTrail.push({ label: unit.name, onClick: onBack })

  const goList = () => { setMode('list'); setOpenRec(null) }

  if (mode === 'form') {
    return (
      <div>
        <ScreenHeader
          title="העברת משמרת גסטרו"
          onBack={goList}
          trail={[...baseTrail, { label: 'העברת משמרת', onClick: goList }, { label: 'רישום חדש' }]}
        />
        <HandoverForm unit={unit} onSent={() => { setRefresh((n) => n + 1); goList() }} />
      </div>
    )
  }

  if (mode === 'view' && openRec) {
    return (
      <div>
        <ScreenHeader
          title="העברת משמרת גסטרו"
          onBack={goList}
          trail={[...baseTrail, { label: 'העברת משמרת', onClick: goList }, { label: openRec.dateLabel }]}
        />
        <HandoverView record={openRec.record} />
      </div>
    )
  }

  // mode === 'list'
  const groups = []
  let y, mo, d
  for (const r of records) {
    if (r.year !== y) { y = r.year; mo = d = null; groups.push({ k: 'year', label: String(r.year) }) }
    if (r.month !== mo) { mo = r.month; d = null; groups.push({ k: 'month', label: HE_MONTHS[r.month] + ' ' + r.year }) }
    if (r.day !== d) { d = r.day; groups.push({ k: 'day', label: r.dateLabel }) }
    groups.push({ k: 'rec', r })
  }

  return (
    <div>
      <ScreenHeader
        title="העברת משמרת גסטרו"
        onBack={onBack}
        trail={[...baseTrail, { label: 'העברת משמרת' }]}
      />

      {records.length === 0 ? (
        <div className="glass plan-card" style={{ padding: 40, textAlign: 'center' }}>
          <p className="empty-hint" style={{ fontSize: 16 }}>אין עדיין רישומי העברת משמרת ביחידה זו.</p>
        </div>
      ) : (
        <div className="report-list">
          {groups.map((g, i) => {
            if (g.k === 'year') return <div key={i} className="grp-year">{g.label}</div>
            if (g.k === 'month') return <div key={i} className="grp-month">{g.label}</div>
            if (g.k === 'day') return <div key={i} className="grp-day">{g.label}</div>
            const r = g.r
            return (
              <button key={i} className="report-card" onClick={() => { setOpenRec(r); setMode('view') }}>
                <div className="rc-main">
                  <span className="rc-title">העברת משמרת · {r.record.shift}</span>
                  <span className="rc-sub">{r.timeLabel}</span>
                </div>
                <span className="rc-by">צפייה</span>
              </button>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        <button className="btn" onClick={() => setMode('form')}>+ העברת משמרת חדשה</button>
      </div>
    </div>
  )
}
