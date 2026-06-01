import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Home from './components/Home.jsx'
import CategoryView from './components/CategoryView.jsx'
import UnitBoard from './components/UnitBoard.jsx'
import CleaningPlan from './components/CleaningPlan.jsx'
import GeneralHandover from './components/GeneralHandover.jsx'
import GastroHandover from './components/GastroHandover.jsx'
import SpecialProcedures from './components/SpecialProcedures.jsx'
import Dashboard from './components/Dashboard.jsx'
import { findUnit, getCategory, findCategoryOfUnit } from './data/departments.js'
import { syncReports } from './data/cloudSync.js'

export default function App() {
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

  const unit = unitId ? findUnit(unitId) : null
  const category = categoryId ? getCategory(categoryId) : null

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
    const cat = findCategoryOfUnit(id)
    if (cat) setCategoryId(cat.id)
  }
  function goHome() {
    setCategoryId(null)
    setUnitId(null)
    setWindowId(null)
    setShowDashboard(false)
  }
  function backToCategory() {
    setUnitId(null)
    setWindowId(null)
  }
  function openWindow(id) {
    setWindowId(id)
  }
  function backToBoard() {
    setWindowId(null)
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <button className="app-logo-btn" onClick={goHome} aria-label="מסך ראשי">
          <img className="app-logo" src="/logo.png" alt="הרצליה מדיקל סנטר" />
        </button>
      </header>
      <div className="app-shell">
        <Sidebar
          activeUnitId={unitId}
          onSelectUnit={selectUnit}
          onGoHome={goHome}
          onOpenDashboard={openDashboard}
          dashboardActive={showDashboard}
        />
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
              onGoHome={goHome}
              onBack={backToCategory}
              categoryName={category ? category.name : null}
            />
          )}

          {!showDashboard && unit && windowId === 'cleaning' && (
            <CleaningPlan
              unit={unit}
              onBack={backToBoard}
              onBackToCategory={backToCategory}
              onGoHome={goHome}
              categoryName={category ? category.name : null}
            />
          )}

          {!showDashboard && unit && windowId === 'handover' && (
            unit.id === 'gastro' ? (
              <GastroHandover
                unit={unit}
                onBack={backToBoard}
                onBackToCategory={backToCategory}
                onGoHome={goHome}
                categoryName={category ? category.name : null}
              />
            ) : (
              <GeneralHandover
                unit={unit}
                onBack={backToBoard}
                onBackToCategory={backToCategory}
                onGoHome={goHome}
                categoryName={category ? category.name : null}
              />
            )
          )}

          {!showDashboard && unit && windowId === 'special' && (
            <SpecialProcedures
              unit={unit}
              onBack={backToBoard}
              onBackToCategory={backToCategory}
              onGoHome={goHome}
              categoryName={category ? category.name : null}
            />
          )}
        </main>
      </div>
    </div>
  )
}
