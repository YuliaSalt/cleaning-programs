import { useMemo, useState } from 'react'
import { getCurrentShift } from '../data/departments.js'
import { getCleaningPlan, signoffKind, DISINFECTANT_GUIDE } from '../data/cleaningTemplates.js'
import { dateStr, periodKey, planKey } from '../data/progress.js'
import { storage } from '../data/storage.js'
import ScreenHeader from './ScreenHeader.jsx'
import ReportsArchive from './ReportsArchive.jsx'

/* כפתורי דריל-דאון (זכוכית, בלי אייקונים) */
function DrillGrid({ items }) {
  return (
    <div className="card-grid drill-grid">
      {items.map((it) => (
        <button key={it.key} className={'unit-card drill-card' + (it.cls ? ' ' + it.cls : '')} onClick={it.onClick}>
          <span className="uc-name">{it.label}</span>
          {it.meta && <span className="uc-meta">{it.meta}</span>}
        </button>
      ))}
    </div>
  )
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
  const [counts, setCounts] = useState(() => storage.getJSON(skey) || {})
  const save = (next) => {
    setCounts(next)
    storage.setJSON(skey, next)
  }
  const bump = (i, d) => {
    const n = Math.max(0, (counts[i] || 0) + d)
    save({ ...counts, [i]: n })
  }
  const total = section.items.reduce((s, _, i) => s + (counts[i] || 0), 0)

  return (
    <div className="glass plan-card section-card">
      <div className="sec-head">
        <span className="sec-tag quick">בין מטופלים</span>
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

  const [rec, setRec] = useState(() => storage.getJSON(skey))
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
    storage.setJSON(skey, r)
    setRec(r)
    setShowErr(false)
  }
  function handleUnlock() {
    storage.removeItem(skey)
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
          <button className="btn" onClick={handleSave}>שמירה ונעילה</button>
        ) : (
          <button className="btn ghost" onClick={handleUnlock}>פתיחה לעריכה</button>
        )}
      </div>
    </div>
  )
}

/* ===== המסך הראשי – דריל-דאון + דוחות ביצוע ===== */
export default function CleaningPlan({ unit, onBack, onGoHome, onBackToCategory, categoryName }) {
  const plan = getCleaningPlan(unit.id)

  const [showReports, setShowReports] = useState(false)
  const [freq, setFreq] = useState(null) // tabId נבחר
  const [shift, setShift] = useState(null) // משמרת (ביומי)
  const [stationId, setStationId] = useState(null) // תחנה (שבועי/חודשי)
  const [room, setRoom] = useState(() => (plan && plan.rooms ? plan.rooms[0] : null))
  const [guideOpen, setGuideOpen] = useState(false)

  if (!plan) {
    return (
      <div className="plan-wrap">
        <ScreenHeader title="תוכניות ניקיון מחלקתי" onBack={onBack} trail={[{ label: 'ראשי', onClick: onGoHome }, { label: unit.name, onClick: onBack }]} />
        <p className="empty-hint">לא נמצאה תוכנית ניקיון מוגדרת ליחידה זו.</p>
      </div>
    )
  }

  // ===== תצוגת דוחות ביצוע (בתוך תוכניות ניקיון) =====
  if (showReports) {
    return (
      <ReportsArchive
        unit={unit}
        onBack={onBack}
        onGoHome={onGoHome}
        onBackToCategory={onBackToCategory}
        categoryName={categoryName}
        onBackToPlan={() => setShowReports(false)}
      />
    )
  }

  const tab = freq ? plan.tabs.find((t) => t.id === freq) : null
  const shifts = plan.shifts || []

  // סקשנים מועמדים: ביומי לפי המשמרת שנבחרה, אחרת כל הסקשנים
  const candidates = !tab ? [] : tab.id === 'daily' ? tab.sections.filter((s) => !s.shift || s.shift === shift) : tab.sections
  // האם קיים שלב בחירת תחנה (ביומי – רק כשמוגדר stationDaily ויש יותר מסקשן אחד)
  const stationStep = !!tab && (tab.id === 'daily' ? plan.stationDaily && candidates.length > 1 : tab.sections.length > 1)

  let view = 'freq'
  if (tab) {
    if (tab.id === 'daily' && !shift) view = 'shift'
    else if (stationStep && !stationId) view = 'station'
    else view = 'leaf'
  }

  const leafSections = view === 'leaf' ? (stationStep ? candidates.filter((s) => s.id === stationId) : candidates) : []
  const stationSections = stationStep ? candidates : []

  const period = tab ? periodKey(tab.id, shift) : ''
  const baseKey = (s) => planKey(unit.id, s.roomScoped && room ? room : '-', tab.id, s.id, period)

  function back() {
    if (view === 'leaf') {
      if (stationStep) setStationId(null)
      else if (tab.id === 'daily') setShift(null)
      else setFreq(null)
    } else if (view === 'station') {
      if (tab.id === 'daily') setShift(null)
      else setFreq(null)
    } else if (view === 'shift') {
      setFreq(null)
    } else {
      onBack()
    }
  }

  const goRoot = () => { setFreq(null); setShift(null); setStationId(null) }
  const goTabStart = () => { setShift(null); setStationId(null) }
  const trail = [{ label: 'ראשי', onClick: onGoHome }]
  if (categoryName) trail.push({ label: categoryName, onClick: onBackToCategory })
  trail.push({ label: unit.name, onClick: onBack })
  trail.push({ label: 'תוכניות ניקיון', onClick: freq ? goRoot : undefined })
  if (tab) {
    const atTabStart =
      (tab.id === 'daily' && view === 'shift') ||
      (tab.id !== 'daily' && stationStep && view === 'station') ||
      (tab.id !== 'daily' && !stationStep && view === 'leaf')
    trail.push({ label: tab.label, onClick: atTabStart ? undefined : goTabStart })
    if (tab.id === 'daily' && shift) {
      const linkShift = view === 'leaf' && stationStep
      trail.push({ label: shift, onClick: linkShift ? () => setStationId(null) : undefined })
    }
    if (view === 'leaf' && stationStep && stationId) {
      const st = tab.sections.find((s) => s.id === stationId)
      trail.push({ label: st ? st.title : '' })
    }
  }

  const title =
    view === 'freq' ? 'תוכניות ניקיון מחלקתי' : tab.label + (tab.id === 'daily' && shift ? ' · ' + shift : '')

  return (
    <div className="plan-wrap wide">
      <ScreenHeader
        title={title}
        onBack={back}
        trail={trail}
        right={<div className="shift-chip"><span className="dot" /> {dateStr()}</div>}
      />

      {/* בורר חדרים – לאורך כל הדריל */}
      {plan.rooms && (
        <div className="glass plan-card controls-card" style={{ paddingBlock: 14 }}>
          <div className="selector-row" style={{ marginTop: 0 }}>
            <span className="sel-label">חדר:</span>
            <div className="chips">
              {plan.rooms.map((r) => (
                <button key={r} className={'chip' + (room === r ? ' active' : '')} onClick={() => setRoom(r)}>{r}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* שלב 1: בחירת תדירות + דוחות ביצוע */}
      {view === 'freq' && (
        <>
          {/* שימוש בחומרי חיטוי – בולט ופתוח, לפני כפתורי התדירות */}
          <div className="glass plan-card disinfect-card">
            <div className="disinfect-title">{DISINFECTANT_GUIDE.title}</div>
            <ul className="disinfect-list">
              {DISINFECTANT_GUIDE.items.map((g, i) => (<li key={i}>{g}</li>))}
            </ul>
          </div>

          {plan.guidance && (
            <div className="glass plan-card controls-card">
              <div className="guide" style={{ marginTop: 0 }}>
                <button className="guide-toggle" onClick={() => setGuideOpen((o) => !o)}>
                  {plan.guidance.title}
                  <span className="chev">{guideOpen ? '▲' : '▼'}</span>
                </button>
                {guideOpen && (
                  <ul className="guide-list">
                    {plan.guidance.items.map((g, i) => (<li key={i}>{g}</li>))}
                  </ul>
                )}
              </div>
            </div>
          )}
          <DrillGrid
            items={[
              ...plan.tabs.map((t) => ({
                key: t.id,
                label: t.label,
                meta: t.id === 'daily' ? plan.shifts.join(' · ') : t.sections.length + ' תחנות',
                onClick: () => { setFreq(t.id); setShift(null); setStationId(null) },
              })),
              {
                key: 'reports',
                label: 'דוחות ביצוע',
                meta: 'ארכיון · חיפוש · הדפסה',
                cls: 'reports-tile',
                onClick: () => setShowReports(true),
              },
            ]}
          />
        </>
      )}

      {/* שלב 2 (יומי): בחירת משמרת */}
      {view === 'shift' && (
        <DrillGrid
          items={shifts.map((s) => ({
            key: s,
            label: s,
            meta: s === getCurrentShift() ? 'משמרת נוכחית' : '',
            onClick: () => setShift(s),
          }))}
        />
      )}

      {/* שלב תחנות: שבועי/חודשי – ישירות; יומי – אחרי בחירת משמרת */}
      {view === 'station' && (
        <>
          {tab.note && <div className="tab-note" style={{ marginBottom: 16 }}>{tab.note}</div>}
          <DrillGrid items={stationSections.map((s) => ({ key: s.id, label: s.title, onClick: () => setStationId(s.id) }))} />
        </>
      )}

      {/* עלה: צ׳קליסט + חתימות */}
      {view === 'leaf' && (
        <>
          {tab.note && tab.id !== 'daily' && <div className="tab-note" style={{ marginBottom: 4 }}>{tab.note}</div>}
          {leafSections.length === 0 ? (
            <p className="empty-hint">אין משימות להצגה.</p>
          ) : (
            leafSections.map((s) =>
              s.kind === 'quick' ? (
                <QuickSection key={baseKey(s)} skey={baseKey(s)} section={s} />
              ) : (
                <SignedSection key={baseKey(s)} skey={baseKey(s)} section={s} />
              )
            )
          )}
          <div style={{ marginTop: 8 }}>
            <button className="btn ghost" onClick={back}>← חזרה</button>
          </div>
        </>
      )}
    </div>
  )
}
