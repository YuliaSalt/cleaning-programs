import { useMemo, useState } from 'react'
import { getCurrentShift } from '../data/departments.js'
import { getCleaningPlan, signoffKind } from '../data/cleaningTemplates.js'
import Icon from './Icons.jsx'

/* ===== מפתחות ועזרי תאריך ===== */
function dateStr() {
  return new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
}
function isoWeek(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((t - yearStart) / 86400000 + 1) / 7)
  return t.getUTCFullYear() + '-W' + String(week).padStart(2, '0')
}
function monthStr(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
}
function periodKey(tabId, shift) {
  if (tabId === 'daily') return dateStr() + (shift ? ':' + shift : '')
  if (tabId === 'weekly') return isoWeek()
  if (tabId === 'monthly') return monthStr()
  return dateStr() // isolation – אירוע ליום
}

// שיטוח משימות הסקשן (תומך בקבוצות עם כותרות משנה) לאינדקס רץ אחיד
function flattenTasks(section) {
  if (section.items) return section.items.map((label) => ({ label }))
  const out = []
  ;(section.groups || []).forEach((g, gi) => {
    g.items.forEach((label, ii) =>
      out.push({ label, group: g.subtitle, firstInGroup: ii === 0, gi })
    )
  })
  return out
}

/* ===== סקשן "בין מטופלים" – מונה לחיצות, ללא חתימה ===== */
function QuickSection({ skey, section }) {
  const [counts, setCounts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(skey)) || {}
    } catch {
      return {}
    }
  })
  const save = (next) => {
    setCounts(next)
    localStorage.setItem(skey, JSON.stringify(next))
  }
  const bump = (i, d) => {
    const n = Math.max(0, (counts[i] || 0) + d)
    save({ ...counts, [i]: n })
  }
  const total = section.items.reduce((s, _, i) => s + (counts[i] || 0), 0)

  return (
    <div className="glass plan-card section-card">
      <div className="sec-head">
        <span className="sec-tag quick"><Icon name="flash" size={16} /> בין מטופלים</span>
        <h3>{section.title}</h3>
        <span className="pill">{total} לחיצות</span>
      </div>
      <p className="sec-note">צ׳ק ליסט מהיר ללא חתימה — לחיצה בכל ביצוע. המונה נשמר אוטומטית.</p>
      <div className="quick-list">
        {section.items.map((label, i) => (
          <div key={i} className="quick-item">
            <span className="qi-label">{label}</span>
            <span className="qi-counter">
              <button className="qi-btn" onClick={() => bump(i, -1)} aria-label="הפחת">−</button>
              <span className="qi-num">{counts[i] || 0}</span>
              <button className="qi-btn add" onClick={() => bump(i, 1)} aria-label="הוסף">+</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ===== סקשן "סגירה" – צ׳קליסט + חתימות חובה ונעילה ===== */
function SignedSection({ skey, section }) {
  const tasks = useMemo(() => flattenTasks(section), [section])
  const signoff = useMemo(
    () => section.signoff.map((label) => ({ label, type: signoffKind(label) })),
    [section]
  )

  const [rec, setRec] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(skey))
    } catch {
      return null
    }
  })
  const locked = !!rec
  const [checked, setChecked] = useState(() => (rec && rec.checked) || {})
  const [names, setNames] = useState(() => (rec && rec.names) || {})
  const [signs, setSigns] = useState(() => (rec && rec.signs) || {})
  const [showErr, setShowErr] = useState(false)

  const doneCount = tasks.filter((_, i) => checked[i]).length
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 100

  const nameIdx = signoff.map((s, i) => (s.type === 'name' ? i : -1)).filter((i) => i >= 0)
  const toggleIdx = signoff.map((s, i) => (s.type !== 'name' ? i : -1)).filter((i) => i >= 0)
  const namesOk = nameIdx.every((i) => (names[i] || '').trim())
  const signsOk = toggleIdx.every((i) => signs[i])
  const canSave = namesOk && signsOk

  function handleSave() {
    if (!canSave) {
      setShowErr(true)
      return
    }
    const r = {
      checked,
      names,
      signs,
      savedAt: new Date().toISOString(),
      by: nameIdx.map((i) => names[i]).filter(Boolean).join(' · '),
    }
    localStorage.setItem(skey, JSON.stringify(r))
    setRec(r)
    setShowErr(false)
  }
  function handleUnlock() {
    localStorage.removeItem(skey)
    setRec(null)
    setShowErr(false)
  }

  return (
    <div className={'glass plan-card section-card' + (locked ? ' is-locked' : '')}>
      <div className="sec-head">
        <span className="sec-tag signed">סגירה וחתימה</span>
        <h3>{section.title}</h3>
        {tasks.length > 0 && (
          <span className="pill">{doneCount}/{tasks.length}</span>
        )}
      </div>

      {locked && (
        <div className="lock-banner">
          <span className="lk-icon"><Icon name="lock" size={18} /></span>
          <span>
            נשמר ונעול לקריאה בלבד.
            {rec.by && <> בוצע ע״י <b>{rec.by}</b>.</>}
            {rec.savedAt && <> ({new Date(rec.savedAt).toLocaleString('he-IL')})</>}
          </span>
        </div>
      )}

      {tasks.length > 0 && (
        <>
          <div className="progress" style={{ marginTop: 14 }}>
            <span style={{ width: pct + '%' }} />
          </div>
          <div className="checklist">
            {tasks.map((t, i) => (
              <div key={i}>
                {t.firstInGroup && t.group && <div className="group-sub">{t.group}</div>}
                <div className={'check-item' + (checked[i] ? ' done' : '')}>
                  <input
                    type="checkbox"
                    id={skey + '-c' + i}
                    checked={!!checked[i]}
                    disabled={locked}
                    onChange={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                  />
                  <label htmlFor={skey + '-c' + i}>{t.label}</label>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* בלוק חתימות חובה */}
      <div className="signoff">
        {signoff.map((s, i) =>
          s.type === 'name' ? (
            <div className="field" key={i}>
              <label>{s.label} <span className="req">*</span></label>
              <input
                className={'input' + (showErr && !(names[i] || '').trim() ? ' invalid' : '')}
                type="text"
                placeholder="שם מלא"
                value={names[i] || ''}
                disabled={locked}
                onChange={(e) => setNames((n) => ({ ...n, [i]: e.target.value }))}
              />
            </div>
          ) : (
            <button
              key={i}
              type="button"
              className={
                'sign-toggle' +
                (signs[i] ? ' on' : '') +
                (showErr && !signs[i] ? ' invalid' : '') +
                (s.type === 'check' ? ' check' : '')
              }
              disabled={locked}
              onClick={() => setSigns((g) => ({ ...g, [i]: !g[i] }))}
            >
              <span className="st-box">{signs[i] ? '✓' : ''}</span>
              <span>{s.label}</span>
            </button>
          )
        )}
      </div>

      {showErr && !canSave && (
        <div className="err">חובה למלא את כל שמות המבצעים ולסמן את כל החתימות לפני שמירה ונעילה.</div>
      )}

      <div className="plan-foot">
        {!locked ? (
          <button className="btn" onClick={handleSave}>
            <Icon name="save" size={18} /> שמירה ונעילה
          </button>
        ) : (
          <button className="btn ghost" onClick={handleUnlock}>
            <Icon name="edit" size={18} /> פתיחה לעריכה
          </button>
        )}
      </div>
    </div>
  )
}

/* ===== המסך הראשי ===== */
export default function CleaningPlan({ unit, onBack }) {
  const plan = getCleaningPlan(unit.id)

  const shifts = (plan && plan.shifts) || []
  const initShift = () => {
    const s = getCurrentShift()
    return shifts.includes(s) ? s : shifts[shifts.length - 1]
  }

  const [tabId, setTabId] = useState(() => (plan ? plan.tabs[0].id : 'daily'))
  const [shift, setShift] = useState(initShift)
  const [room, setRoom] = useState(() => (plan && plan.rooms ? plan.rooms[0] : null))
  const [guideOpen, setGuideOpen] = useState(false)

  if (!plan) {
    return (
      <div className="plan-wrap">
        <button className="btn ghost" onClick={onBack}>חזרה</button>
        <p className="empty-hint" style={{ marginTop: 16 }}>
          לא נמצאה תוכנית ניקיון מוגדרת ליחידה זו.
        </p>
      </div>
    )
  }

  const tab = plan.tabs.find((t) => t.id === tabId) || plan.tabs[0]
  const period = periodKey(tab.id, shift)

  // סינון סקשנים: ביומי לפי משמרת; roomScoped משויך לחדר שנבחר
  const sections = tab.sections.filter((s) => {
    if (tab.id === 'daily' && s.shift && s.shift !== shift) return false
    return true
  })

  const baseKey = (s) =>
    `hmc:plan:${unit.id}:${s.roomScoped && room ? room : '-'}:${tab.id}:${s.id}:${period}`

  return (
    <div className="plan-wrap wide">
      <div className="topbar">
        <div>
          <div className="breadcrumb">
            <button className="link-btn" onClick={onBack}>← חזרה ללוח החלונות</button>
            {unit.groupName ? ' · ' + unit.groupName : ''} · <b>{unit.name}</b>
          </div>
          <h1 className="page-title">תוכניות ניקיון מחלקתי</h1>
        </div>
        <div className="shift-chip">
          <Icon name="clock" size={16} /> {dateStr()}
        </div>
      </div>

      {/* טאבים */}
      <div className="glass plan-card controls-card">
        <div className="tabs">
          {plan.tabs.map((t) => (
            <button
              key={t.id}
              className={'tab' + (tabId === t.id ? ' active' : '')}
              onClick={() => setTabId(t.id)}
            >
              {t.id === 'isolation' && <Icon name="shield" size={15} style={{ marginInlineEnd: 4 }} />}
              {t.label}
            </button>
          ))}
        </div>

        {/* בורר חדרים */}
        {plan.rooms && (
          <div className="selector-row">
            <span className="sel-label">חדר:</span>
            <div className="chips">
              {plan.rooms.map((r) => (
                <button
                  key={r}
                  className={'chip' + (room === r ? ' active' : '')}
                  onClick={() => setRoom(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* בורר משמרת – רק ביומי */}
        {tab.id === 'daily' && shifts.length > 0 && (
          <div className="selector-row">
            <span className="sel-label">משמרת:</span>
            <div className="chips">
              {shifts.map((s) => (
                <button
                  key={s}
                  className={'chip' + (shift === s ? ' active' : '')}
                  onClick={() => setShift(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <span className="sel-hint">נבחרה אוטומטית לפי השעה ({getCurrentShift()})</span>
          </div>
        )}

        {tab.note && <div className="tab-note">{tab.note}</div>}

        {/* הנחיות יחידה (נפתח) */}
        {plan.guidance && (
          <div className="guide">
            <button className="guide-toggle" onClick={() => setGuideOpen((o) => !o)}>
              <Icon name="shield" size={16} /> {plan.guidance.title}
              <span className="chev">{guideOpen ? '▲' : '▼'}</span>
            </button>
            {guideOpen && (
              <ul className="guide-list">
                {plan.guidance.items.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* סקשנים */}
      {sections.length === 0 ? (
        <p className="empty-hint">אין משימות להצגה למשמרת זו.</p>
      ) : (
        sections.map((s) =>
          s.kind === 'quick' ? (
            <QuickSection key={baseKey(s)} skey={baseKey(s)} section={s} />
          ) : (
            <SignedSection key={baseKey(s)} skey={baseKey(s)} section={s} />
          )
        )
      )}

      <div style={{ marginTop: 8 }}>
        <button className="btn ghost" onClick={onBack}>חזרה ללוח החלונות</button>
      </div>
    </div>
  )
}
