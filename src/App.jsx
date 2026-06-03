import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Home from './components/Home.jsx'
import CategoryView from './components/CategoryView.jsx'
import UnitBoard from './components/UnitBoard.jsx'
import CleaningPlan from './components/CleaningPlan.jsx'
import GeneralHandover from './components/GeneralHandover.jsx'
import GastroHandover from './components/GastroHandover.jsx'
import ORHandover from './components/ORHandover.jsx'
import SpecialProcedures from './components/SpecialProcedures.jsx'
import Dashboard from './components/Dashboard.jsx'
import BottomNav from './components/BottomNav.jsx'
import MedsControl from './components/MedsControl.jsx'
import { findUnit, getCategory, findCategoryOfUnit } from './data/departments.js'
import { syncReports } from './data/cloudSync.js'
import { recordVisit, getAutoRedirectUnit } from './data/routing.js'

// זיהוי מובייל לפי רוחב המסך – מאפשר פריסת מובייל ייעודית (ללא סרגל צד).
function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= breakpoint
  )
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [breakpoint])
  return isMobile
}

export default function App() {
  const isMobile = useIsMobile()
  // ניווט מבוסס מצב: דשבורד | קטגוריה | יחידה | חלון | בית
  const [categoryId, setCategoryId] = useState(null)
  const [unitId, setUnitId] = useState(null)
  const [windowId, setWindowId] = useState(null)
  const [showDashboard, setShowDashboard] = useState(false)

  // גיבוי ענן: בעליית האפליקציה מושכים דוחות מהגיליון וממזגים, ודוחפים תור ממתין.
  // משוחזר אוטומטית אם ה-localStorage התאפס. ללא הגדרת ענן – no-op שקט.
  useEffect(() => {
    syncReports().catch(() => {})
  }, [])

  // ניתוב חכם: בעליית האפליקציה, אם נכנסו לאותה מחלקה ברצף – מדלגים על מסך
  // הבחירה ועוברים ישר אליה. רץ פעם אחת בלבד; ניתן לחזור עם "חזרה"/"ראשי".
  useEffect(() => {
    const auto = getAutoRedirectUnit()
    if (auto && findUnit(auto)) selectUnit(auto)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const unit = unitId ? findUnit(unitId) : null
  const category = categoryId ? getCategory(categoryId) : null
  // יחידת אב (לדוגמה "התאוששות") כאשר היחידה הנוכחית היא תת-יחידה (חדר).
  const parentUnit = unit && unit.parentId ? findUnit(unit.parentId) : null
  // שם הרמה שמעל היחידה בפירורי הלחם: יחידת האב אם קיימת, אחרת הקטגוריה.
  const parentName = parentUnit ? parentUnit.name : category ? category.name : null

  function openDashboard() {
    setShowDashboard(true)
    setUnitId(null)
    setWindowId(null)
  }
  function openCategory(id) {
    setCategoryId(id)
    setUnitId(null)
    setWindowId(null)
    setShowDashboard(false)
  }
  function selectUnit(id) {
    setUnitId(id)
    setWindowId(null)
    setShowDashboard(false)
    // תת-יחידה (חדר) שייכת לקטגוריה של יחידת האב שלה.
    const u = findUnit(id)
    const lookupId = u && u.parentId ? u.parentId : id
    const cat = findCategoryOfUnit(lookupId)
    if (cat) setCategoryId(cat.id)
    recordVisit(id) // ניתוב חכם: ספירת רצף כניסות למחלקה
  }
  function goHome() {
    setCategoryId(null)
    setUnitId(null)
    setWindowId(null)
    setShowDashboard(false)
  }
  function backToCategory() {
    // מתת-יחידה (חדר) חוזרים למסך בחירת החדר של יחידת האב; אחרת לרשימת היחידות בקטגוריה.
    if (parentUnit) setUnitId(parentUnit.id)
    else setUnitId(null)
    setWindowId(null)
  }
  function openWindow(id) {
    setWindowId(id)
  }
  function backToBoard() {
    setWindowId(null)
  }
  // חזרה אחידה לרמה אחת מעלה – משמש את סרגל הניווט התחתון.
  function goBack() {
    if (showDashboard) return goHome()
    if (windowId) return setWindowId(null)
    if (unitId) return backToCategory()
    if (categoryId) return setCategoryId(null)
  }
  // האם יש לאן לחזור (משמש לכיבוי כפתור "חזרה" במסך הבית)
  const canBack = showDashboard || !!windowId || !!unitId || !!categoryId
  const atHome = !showDashboard && !categoryId && !unitId

  return (
    <div className="app-root">
      {/* לוגו בית החולים כסימן מים רקעי, חצי-שקוף */}
      <div className="app-watermark" aria-hidden="true">
        <img src={import.meta.env.BASE_URL + 'logo.png'} alt="" />
      </div>
      <div className="app-shell">
        {!isMobile && (
          <Sidebar
            activeUnitId={unitId}
            onSelectUnit={selectUnit}
            onGoHome={goHome}
            onOpenDashboard={openDashboard}
            dashboardActive={showDashboard}
          />
        )}
        <main className="main-area">
          {showDashboard && (
            <Dashboard onGoHome={goHome} onSelectUnit={selectUnit} />
          )}

          {!showDashboard && !unit && !category && (
            <Home onOpenCategory={openCategory} onOpenDashboard={openDashboard} />
          )}

          {!showDashboard && !unit && category && (
            <CategoryView
              categoryId={category.id}
              onSelectUnit={selectUnit}
              onGoHome={goHome}
            />
          )}

          {!showDashboard && unit && !windowId && (
            <UnitBoard
              unit={unit}
              onOpenWindow={openWindow}
              onSelectUnit={selectUnit}
              onGoHome={goHome}
              onBack={backToCategory}
              categoryName={parentName}
            />
          )}

          {!showDashboard && unit && windowId === 'cleaning' && (
            <CleaningPlan
              unit={unit}
              onBack={backToBoard}
              onBackToCategory={backToCategory}
              onGoHome={goHome}
              categoryName={parentName}
            />
          )}

          {!showDashboard && unit && windowId === 'handover' && (
            unit.id === 'gastro' ? (
              <GastroHandover
                unit={unit}
                onBack={backToBoard}
                onBackToCategory={backToCategory}
                onGoHome={goHome}
                categoryName={parentName}
              />
            ) : unit.id === 'or' ? (
              <ORHandover
                unit={unit}
                onBack={backToBoard}
                onBackToCategory={backToCategory}
                onGoHome={goHome}
                categoryName={parentName}
              />
            ) : (
              <GeneralHandover
                unit={unit}
                onBack={backToBoard}
                onBackToCategory={backToCategory}
                onGoHome={goHome}
                categoryName={parentName}
              />
            )
          )}

          {!showDashboard && unit && windowId === 'special' && (
            <SpecialProcedures
              unit={unit}
              onBack={backToBoard}
              onBackToCategory={backToCategory}
              onGoHome={goHome}
              categoryName={parentName}
            />
          )}

          {!showDashboard && unit && windowId === 'meds' && (
            <MedsControl
              unit={unit}
              onBack={backToBoard}
              onBackToCategory={backToCategory}
              onGoHome={goHome}
              categoryName={parentName}
            />
          )}
        </main>
      </div>

      {isMobile && (
        <BottomNav
          onHome={goHome}
          onDashboard={openDashboard}
          onBack={goBack}
          homeActive={atHome}
          dashActive={showDashboard}
          canBack={canBack}
        />
      )}
    </div>
  )
}
